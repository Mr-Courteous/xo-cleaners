from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import date, datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from utils.common import get_db, get_current_user_payload, create_audit_log, decode_access_token


# --- IMPORTS FROM YOUR UTILS ---
from utils.common import (
    get_db, 
    get_current_user_payload,
    RackAssignmentRequest
)


import traceback
import logging
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

logger = logging.getLogger("uvicorn.error")


# 1. Define the Router
router = APIRouter(
    prefix="/api/organizations", 
    tags=["Organization Resources"]
)

@router.get("/my-branches", summary="Get all branches for the logged-in organization")
async def get_my_branches(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves all sub-organizations (branches) linked to the 
    authenticated organization via the parent_org_id.
    """
    try:
        # 1. Extract the organization_id from the trusted token
        parent_id = payload.get("organization_id")

        if not parent_id:
            raise HTTPException(status_code=400, detail="Invalid token: Organization ID missing.")

        # 2. Query for all organizations that have this ID as their parent
        query = text("""
            SELECT id, name, org_type, owner_email, industry, created_at
            FROM organizations 
            WHERE parent_org_id = :parent_id
            ORDER BY name ASC
        """)
        
        result = db.execute(query, {"parent_id": parent_id}).fetchall()

        # 3. Format the result into a list of dictionaries
        branches = [
            {
                "id": row.id,
                "name": row.name,
                "org_type": row.org_type,
                "owner_email": row.owner_email,
                "industry": row.industry,
                "created_at": row.created_at.isoformat() if row.created_at else None
            }
            for row in result
        ]

        return branches

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch branches: {str(e)}")
    
 
    

class BatchTransferRequest(BaseModel):
    ticket_ids: List[int]
    plant_connection_code: str

@router.post("/tickets/batch-transfer")
async def batch_transfer_tickets(
    data: Dict[str, Any], 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    origin_id = payload.get("organization_id")
    # Handle different possible key names in your JWT payload
    user_id = payload.get("user_id") or payload.get("id") or 0
    user_name = payload.get("sub") or payload.get("username") or "Unknown"
    user_role = payload.get("role") or "Unknown"
    
    # Log raw payload for debugging
    try:
        print(f"BATCH TRANSFER raw payload: {data}")
    except Exception:
        pass

    # Validate and coerce payload to avoid Pydantic 422 errors from frontend shape issues
    ticket_ids = data.get("ticket_ids") or data.get("ticketIds")
    plant_code = data.get("plant_connection_code") or data.get("plantConnectionCode")

    if not ticket_ids:
        raise HTTPException(status_code=400, detail="ticket_ids is required and must be a list of IDs")
    if not isinstance(ticket_ids, list):
        # try to coerce from comma-separated string
        if isinstance(ticket_ids, str):
            ticket_ids = [int(x) for x in ticket_ids.split(',') if x.strip()]
        else:
            raise HTTPException(status_code=400, detail="ticket_ids must be a list of integers")

    # ensure ints
    try:
        ticket_ids = [int(x) for x in ticket_ids]
    except Exception:
        raise HTTPException(status_code=400, detail="ticket_ids must contain integer values")

    if not plant_code or not isinstance(plant_code, str):
        raise HTTPException(status_code=400, detail="plant_connection_code is required")

    plant = db.execute(
        text("SELECT id, name FROM organizations WHERE connection_code = :code"), 
        {"code": plant_code.upper().strip()}
    ).fetchone()
    
    if not plant: 
        raise HTTPException(status_code=404, detail="Plant code not found.")

    if plant.id == origin_id:
        raise HTTPException(status_code=400, detail="Cannot transfer tickets to your own organization.")

    try:
        # Resolve origin org name for nicer notifications
        origin_org = db.execute(text("SELECT name FROM organizations WHERE id = :id"), {"id": origin_id}).fetchone()
        origin_name = origin_org.name if origin_org else None
        # 2. Update Tickets
        # Mark tickets as TRANSFER REQUESTED (the plant must accept)
        query = text("""
            UPDATE tickets SET 
                transferred_to_org_id = :target_id,
                transfer_status = 'requested',
                status = 'transfer_requested',
                updated_at = NOW()
            WHERE id = ANY(:ticket_ids) AND organization_id = :origin_id
            RETURNING id, ticket_number
        """)
        
        result = db.execute(query, {
            "target_id": plant.id, 
            "ticket_ids": ticket_ids, 
            "origin_id": origin_id
        }).fetchall()
        
        if not result:
            raise HTTPException(status_code=404, detail="No matching tickets found to update.")

        # 3. Create Audit Trail for each ticket
        # Using background_tasks to prevent the UI from lagging
        for row in result:
            # Log on ORIGIN org that a transfer REQUEST was sent
            background_tasks.add_task(
                create_audit_log,
                org_id=origin_id,
                actor_id=user_id,
                actor_name=user_name,
                actor_role=user_role,
                action="TRANSFER_REQUEST_SENT",
                ticket_id=row.id,
                details={
                    "event": "request_sent",
                    "ticket_number": row.ticket_number,
                    "destination_id": plant.id,
                    "destination_name": plant.name
                }
            )

            # Notify the destination org (plant) that a transfer request is pending
            background_tasks.add_task(
                create_audit_log,
                org_id=plant.id,
                actor_id=user_id,
                actor_name=user_name,
                actor_role=user_role,
                action="TRANSFER_REQUEST_RECEIVED",
                ticket_id=row.id,
                details={
                    "event": "request_incoming",
                    "ticket_number": row.ticket_number,
                    "origin_id": origin_id,
                    "origin_name": origin_name
                }
            )

        db.commit()
        # Fetch full ticket details for the updated tickets so frontend
        # can display them exactly as the backend stores/sends them.
        updated_ids = [r.id for r in result]

        details_query = text("""
            SELECT 
                t.id, 
                t.ticket_number, 
                t.status as production_status,
                t.transfer_status,
                t.updated_at as last_move_at,
                (
                    SELECT al.created_at FROM audit_logs al
                    WHERE al.ticket_id = t.id AND al.action = 'TRANSFER_REQUEST_SENT' AND al.organization_id = t.organization_id
                    ORDER BY al.created_at ASC LIMIT 1
                ) as sent_at,
                (
                    SELECT al.created_at FROM audit_logs al
                    WHERE al.ticket_id = t.id AND al.action IN ('TRANSFER_RECEIVED_BY_PLANT','PLANT_INVENTORY_IN') AND al.organization_id = t.organization_id
                    ORDER BY al.created_at ASC LIMIT 1
                ) as accepted_at,
                u.first_name || ' ' || u.last_name as customer_name,
                o_orig.name as from_branch,
                o_dest.name as to_plant,
                t.organization_id as owner_id
            FROM tickets t
            LEFT JOIN allUsers u ON t.customer_id = u.id
            LEFT JOIN organizations o_orig ON t.organization_id = o_orig.id
            LEFT JOIN organizations o_dest ON t.transferred_to_org_id = o_dest.id
            WHERE t.id = ANY(:ids)
            ORDER BY t.updated_at DESC
        """)

        rows = db.execute(details_query, {"ids": updated_ids}).fetchall()
        tickets = []
        for r in rows:
            m = dict(r._mapping)
            for k in ("sent_at", "accepted_at", "last_move_at", "created_at"):
                if k in m and m[k] is not None:
                    try:
                        dt = m[k]
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        m[k] = dt.isoformat()
                    except Exception:
                        pass
            tickets.append(m)

        return {
            "success": True,
            "updated_count": len(result),
            "destination": plant.name,
            "message": f"Successfully dispatched {len(result)} tickets to {plant.name}.",
            "tickets": tickets
        }

    except Exception as e:
        db.rollback()
        print(f"Transfer Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process batch transfer.")


# --- Models ---
class PlantReceiveRequest(BaseModel):
    ticket_ids: List[int]
# 1. GET INCOMING TRANSFERS
@router.get("/incoming", summary="List tickets sent from branches to this plant")
async def get_incoming_to_plant(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    plant_id = payload.get("organization_id")
    
    # Query fetches full details including the branch name and customer full name
    query = text("""
        SELECT 
            t.id, 
            t.ticket_number, 
            t.status as ticket_status, 
            t.transfer_status, 
            (
                SELECT al.created_at FROM audit_logs al
                WHERE al.ticket_id = t.id AND al.action = 'TRANSFER_REQUEST_SENT' AND al.organization_id = t.organization_id
                ORDER BY al.created_at ASC LIMIT 1
            ) as sent_at,
            t.created_at,
            u.first_name || ' ' || u.last_name as customer_name,
            o.name as origin_branch_name,
            (SELECT COUNT(*) FROM ticket_items WHERE ticket_id = t.id) as item_count
        FROM tickets t
        JOIN allUsers u ON t.customer_id = u.id
        JOIN organizations o ON t.organization_id = o.id
        WHERE t.transferred_to_org_id = :plant_id 
        AND t.transfer_status IN ('requested','in_transit')
        ORDER BY t.updated_at ASC
    """)
    
    result = db.execute(query, {"plant_id": plant_id}).fetchall()
    tickets = []
    for r in result:
        m = dict(r._mapping)
        for k in ("sent_at", "accepted_at", "created_at"):
            if k in m and m[k] is not None:
                try:
                    dt = m[k]
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    m[k] = dt.isoformat()
                except Exception:
                    pass
        tickets.append(m)
    return {"incoming_tickets": tickets}

#
@router.post("/batch-receive")
async def plant_batch_receive(
    data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    plant_id = payload.get("organization_id")
    user_id = payload.get("user_id") or payload.get("id")
    user_name = payload.get("sub", "Plant Staff")
    user_role = payload.get("role", "plant_operator")

    # Coerce ticket_ids from list or string to list of ints
    ticket_ids = data.get("ticket_ids") or []
    if isinstance(ticket_ids, str):
        ticket_ids = [int(x) for x in ticket_ids.split(',') if x.strip()]
    else:
        try:
            ticket_ids = [int(x) for x in ticket_ids]
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="ticket_ids must be a list of integers")

    # We use 'at_plant' as a clearer tracking status
    query = text("""
        UPDATE tickets 
        SET 
            transfer_status = 'at_plant',
            status = 'processing', 
            updated_at = NOW()
        WHERE id = ANY(:ticket_ids) 
        AND transferred_to_org_id = :plant_id
        RETURNING id, ticket_number, organization_id
    """)

    result = db.execute(query, {
        "ticket_ids": ticket_ids,
        "plant_id": plant_id
    }).fetchall()

    if not result:
        raise HTTPException(status_code=404, detail="No matching tickets found to receive.")

    for row in result:
        # 1. Log for the BRANCH (The owner)
        # Allows the branch to see: "My ticket reached the plant"
        background_tasks.add_task(
            create_audit_log,
            org_id=row.organization_id,  
            actor_id=user_id,
            actor_name=user_name,
            actor_role=user_role,
            action="TRANSFER_RECEIVED_BY_PLANT",
            ticket_id=row.id,
            details={
                "event": "received_by_plant",
                "ticket_number": row.ticket_number,
                "plant_id": plant_id,
                "plant_name": None
            }
        )

        # 2. Log for the PLANT (The receiver)
        # Allows the plant to see: "We took possession of this ticket"
        background_tasks.add_task(
            create_audit_log,
            org_id=plant_id,  
            actor_id=user_id,
            actor_name=user_name,
            actor_role=user_role,
            action="PLANT_INVENTORY_IN",
            ticket_id=row.id,
            details={
                "event": "plant_inventory_in",
                "ticket_number": row.ticket_number,
                "origin_branch_id": row.organization_id
            }
        )

    db.commit()
    return {
        "success": True, 
        "message": f"Successfully checked {len(result)} tickets into plant inventory.",
        "tracking_status": "at_plant"
    }
    
    
 # --- 3. UNFILTERED GET ROUTE ---
@router.get("/plant/inventory", summary="Get all tickets transferred to this plant")
async def get_plant_inventory(db: Session = Depends(get_db), payload: Dict[str, Any] = Depends(get_current_user_payload)):
    plant_id = payload.get("organization_id")
    
    # Removed status limitations to show everything
    query = text("""
        SELECT 
            t.id, 
            t.ticket_number, 
            t.status, 
            t.transfer_status, 
            t.transfer_rack_number as rack_number,
            u.first_name || ' ' || u.last_name as customer_name,
            o.name as origin_branch,
            t.created_at,
            (
                SELECT al.created_at FROM audit_logs al
                WHERE al.ticket_id = t.id AND al.action = 'TRANSFER_REQUEST_SENT' AND al.organization_id = t.organization_id
                ORDER BY al.created_at ASC LIMIT 1
            ) as sent_at,
            (
                SELECT al.created_at FROM audit_logs al
                WHERE al.ticket_id = t.id AND al.action IN ('TRANSFER_RECEIVED_BY_PLANT','PLANT_INVENTORY_IN') AND al.organization_id = t.transferred_to_org_id
                ORDER BY al.created_at ASC LIMIT 1
            ) as accepted_at
        FROM tickets t
        JOIN allUsers u ON t.customer_id = u.id
        JOIN organizations o ON t.organization_id = o.id
        WHERE t.transferred_to_org_id = :plant_id 
        ORDER BY t.updated_at DESC
    """)
    
    result = db.execute(query, {"plant_id": plant_id}).fetchall()
    tickets = []
    for r in result:
        m = dict(r._mapping)
        # Convert datetime objects to ISO strings for frontend compatibility
        for k in ("sent_at", "accepted_at", "created_at"):
            if k in m and m[k] is not None:
                m[k] = m[k].isoformat()
        tickets.append(m)
        
    return {"tickets": tickets}


class TicketTransferTrackerResponse(BaseModel):
    id: int
    ticket_number: str
    transfer_status: Optional[str] = "pending"
    transferred_to_org_id: Optional[int] = None
    # Marked as Optional so it doesn't fail if the JOIN finds nothing
    transferred_to_org_name: Optional[str] = None 
    customer_id: int
    customer_name: str
    created_at: datetime
    transferred_at: Optional[datetime] = None 
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        
        
        
@router.get("/tickets-transfer-tracker", 
            summary="List all tickets with creation and transfer timing",
            response_model=Dict[str, List[TicketTransferTrackerResponse]])
async def get_transfer_tracker(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    try:
        org_id = payload.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=401, detail="Organization ID missing")

        # SQL Logic:
        # 1. We show 'Internal' if transfer_status is null.
        # 2. transferred_at is only shown if the ticket has a destination (not null).
        # 3. accepted_at is completely removed.
        query = text("""
            SELECT 
                t.id, 
                t.ticket_number, 
                COALESCE(t.transfer_status, 'Internal') as transfer_status,
                t.transferred_to_org_id,
                o_dest.name as transferred_to_org_name, 
                t.customer_id,
                COALESCE(u.first_name || ' ' || u.last_name, 'Walk-in') as customer_name,
                t.created_at,
                CASE 
                    WHEN t.transferred_to_org_id IS NOT NULL THEN t.updated_at 
                    ELSE NULL 
                END as transferred_at
            FROM tickets t
            LEFT JOIN organizations o_dest ON t.transferred_to_org_id = o_dest.id
            LEFT JOIN allUsers u ON t.customer_id = u.id
            WHERE t.organization_id = :org_id
            ORDER BY t.created_at DESC
        """)

        rows = db.execute(query, {"org_id": org_id}).fetchall()
        tickets = [TicketTransferTrackerResponse.from_orm(r) for r in rows]
        
        return {"tickets": tickets}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching tracker data")
    
@router.put(
    "/tickets/{ticket_id}/rack-a-transfered-ticket", 
    summary="Assign a local transfer rack to a received ticket"
)
async def assign_transfer_rack_to_ticket(
    ticket_id: int,
    req: RackAssignmentRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    try:
        organization_id = payload.get("organization_id")
        if not organization_id:
            raise HTTPException(status_code=401, detail="Missing Organization ID")

        # 1. Verify the Rack exists in the Branch's own organization
        rack_query = text("""
            SELECT id FROM racks 
            WHERE number = :rack_number 
            AND organization_id = :org_id 
            AND is_occupied = false
        """)
        available_rack = db.execute(rack_query, {
            "rack_number": req.rack_number,
            "org_id": organization_id
        }).fetchone()

        if not available_rack:
            return {"success": False, "detail": f"Rack {req.rack_number} is occupied or not found at this branch."}

        # 2. Update Ticket
        # FIXED COLUMN NAME: transferred_to_org_id (as per your DB hint)
        ticket_update_sql = text("""
            UPDATE tickets 
            SET 
                transfer_rack_number = :rack_number, 
                transfer_status = 'ready_at_branch',
                status = 'ready'
            WHERE id = :ticket_id AND transferred_to_org_id = :org_id
            RETURNING id, ticket_number, customer_id
        """)
        
        ticket_result = db.execute(ticket_update_sql, {
            "rack_number": req.rack_number,
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket_result:
            raise HTTPException(
                status_code=404, 
                detail=f"Ticket {ticket_id} was not transferred to this branch (Branch ID: {organization_id})."
            )

        # 3. Mark the branch's local Rack as occupied
        db.execute(text("""
            UPDATE racks SET is_occupied = true, ticket_id = :ticket_id 
            WHERE number = :rack_number AND organization_id = :org_id
        """), {
            "ticket_id": ticket_id,
            "rack_number": req.rack_number,
            "org_id": organization_id
        })

        db.commit()

        # Audit Log
        background_tasks.add_task(
            create_audit_log,
            org_id=organization_id,
            actor_id=payload.get("id") or payload.get("user_id") or 0,
            actor_name=payload.get("sub", "Unknown"),
            actor_role=payload.get("role", "Unknown"),
            action="TRANSFER_TICKET_RACKED",
            ticket_id=ticket_id,
            details={"rack_number": req.rack_number, "ticket_number": ticket_result.ticket_number}
        )

        return {"success": True, "message": f"Ticket #{ticket_result.ticket_number} successfully racked at {req.rack_number}."}

    except Exception as e:
        db.rollback()
        import traceback
        logger.error(f"Racking Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")



@router.put("/tickets/{ticket_id}/transfer-pickup", summary="Release transferred ticket to customer")
async def release_transfer_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        org_id = payload.get("organization_id")
        user_id = payload.get("user_id") or payload.get("id") or 0
        user_name = payload.get("sub", "Plant Staff")
        
        # Update ticket status to completed
        update_query = text("""
            UPDATE tickets SET 
                transfer_status = 'completed',
                updated_at = NOW()
            WHERE id = :ticket_id AND transferred_to_org_id = :org_id
            RETURNING id, ticket_number, organization_id
        """)
        
        result = db.execute(update_query, {
            "ticket_id": ticket_id,
            "org_id": org_id
        }).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Audit log
        background_tasks.add_task(
            create_audit_log,
            org_id=org_id,
            actor_id=user_id,
            actor_name=user_name,
            actor_role=payload.get("role", "plant_staff"),
            action="TRANSFER_COMPLETED",
            ticket_id=result.id,
            details={
                "event": "transfer_completed",
                "ticket_number": result.ticket_number,
                "released_to_customer": True
            }
        )
        
        db.commit()
        return {"success": True, "message": "Ticket released to customer successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to release ticket: {str(e)}")