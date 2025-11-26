import decimal
from typing import Optional, List, Dict, Any
# Make sure Query is imported
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# Make sure all your Pydantic models are imported
from utils.common import (
    get_db, 
    get_current_user_payload,
    TicketSummaryResponse,
    TicketResponse,
    TicketItemResponse,
    TicketValidationResponse  # --- ADDED THIS IMPORT ---
)

# --- Pydantic Model for the Request ---
class RackAssignmentRequest(BaseModel):
    rack_number: int

# --- NEW Pydantic Models for Pickup ---
# (Adding these from your previous file)
class TicketPickupRequest(BaseModel):
    """The payload sent from the frontend when completing a pickup."""
    amount_paid: float

class TicketPickupResponse(BaseModel):
    """The response sent back after a successful pickup."""
    success: bool
    message: str
    ticket_id: int
    new_status: str
    new_total_paid: float
    receipt_html: Optional[str] = None
    
    # Fix for the 'orm_mode' warning in your logs
    model_config = ConfigDict(from_attributes=True)

# This should be the same router as in your org_functions.py
router = APIRouter(
    prefix="/api/organizations", 
    tags=["Organization Resources"]
)


# --- ROUTE 1: The "literal" path must come FIRST ---
@router.get(
    "/single-ticket/search", 
    response_model=List[TicketSummaryResponse], 
    summary="Search for tickets"
)
async def search_tickets(
    query: str = Query(..., description="Search by ticket number, customer name, or phone/email"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Searches for tickets within the user's organization that are NOT yet picked up.
    It matches against ticket number, customer first name, last name, or email.
    """
    try:
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # Authorization Check
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to search tickets."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        search_term = f"%{query.lower()}%"
        
        sql_query = text("""
            SELECT 
                t.id, t.ticket_number, t.customer_id, 
                u.first_name, u.last_name, u.email,
                t.total_amount, t.paid_amount, t.status, t.rack_number, 
                t.special_instructions, t.pickup_date, t.created_at, t.organization_id
            FROM tickets AS t
            JOIN allUsers AS u ON t.customer_id = u.id
            WHERE 
                t.organization_id = :org_id
                AND t.status != 'picked_up'
                AND (
                    LOWER(t.ticket_number) LIKE :search_term
                    OR LOWER(u.first_name) LIKE :search_term
                    OR LOWER(u.last_name) LIKE :search_term
                    OR LOWER(u.email) LIKE :search_term
                )
            ORDER BY t.created_at DESC
            LIMIT 20
        """)
        
        params = {"org_id": organization_id, "search_term": search_term}
        tickets_result = db.execute(sql_query, params).fetchall()

        if not tickets_result:
            return []

        response_list = []
        for row in tickets_result:
            response_list.append(
                TicketSummaryResponse(
                    id=row.id,
                    ticket_number=row.ticket_number,
                    customer_id=row.customer_id,
                    customer_name=f"{row.first_name} {row.last_name}",
                    customer_phone=row.email,
                    total_amount=float(row.total_amount),
                    paid_amount=float(row.paid_amount),
                    status=row.status,
                    rack_number=str(row.rack_number) if row.rack_number is not None else None,
                    special_instructions=row.special_instructions,
                    pickup_date=row.pickup_date,
                    created_at=row.created_at,
                    organization_id=row.organization_id
                )
            )
        return response_list

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching tickets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while searching for tickets."
        )


# --- ROUTE 2: The "parameter" path must come SECOND ---
# In org_functions2.py

# @router.get("/tickets/{ticket_id}", response_model=TicketResponse, summary="Get full details for a single ticket")
# async def get_ticket_details(
#     ticket_id: int,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload)
# ):
#     """
#     Retrieve all details for a specific ticket, including customer info,
#     all items, and payment status, restricted by organization.
    
#     --- UPDATED TO MATCH create_ticket RESPONSE STRUCTURE ---
#     """
#     org_id = payload.get("organization_id")
#     if not org_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Organization ID missing from token."
#         )

#     try:
#         # 1. Get main ticket info and join with customer info
#         # --- UPDATED: Added 't.special_instructions' ---
#         ticket_stmt = text("""
#             SELECT 
#                 t.id, t.ticket_number, t.customer_id, t.total_amount, 
#                 t.paid_amount, t.status, t.rack_number, t.created_at, 
#                 t.created_by_user_id, t.pickup_date,
#                 t.special_instructions, -- <-- ADDED THIS
#                 u.first_name, u.last_name, u.email, u.phone_number
#             FROM tickets t
#             JOIN allUsers u ON t.customer_id = u.id
#             WHERE t.id = :ticket_id AND t.organization_id = :org_id
#         """)
#         ticket = db.execute(ticket_stmt, {"ticket_id": ticket_id, "org_id": org_id}).fetchone()

#         if not ticket:
#             raise HTTPException(status_code=404, detail="Ticket not found in this organization")

#         # 2. Get all items for the ticket
#         # --- UPDATED: Added all fields to match create_ticket item response ---
#         items_stmt = text("""
#             SELECT 
#                 ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
#                 ti.item_total,
#                 ti.plant_price, ti.margin, ti.starch_level, ti.crease, -- <-- ADDED THESE
#                 ct.name AS clothing_name,
#                 ct.image_url AS clothing_image_url,
#                 COALESCE(ti.pieces, ct.pieces) AS pieces
#             FROM ticket_items ti
#             JOIN clothing_types ct ON ti.clothing_type_id = ct.id
#             WHERE ti.ticket_id = :ticket_id
#               AND ct.organization_id = :org_id
#         """)
        
#         items_results = db.execute(items_stmt, {"ticket_id": ticket_id, "org_id": org_id}).fetchall()
#         # --- UPDATED: Building the item list to match create_ticket ---
#         items_list = [
#             TicketItemResponse(
#                 id=item_row.id,
#                 ticket_id=item_row.ticket_id,
#                 clothing_type_id=item_row.clothing_type_id,
#                 quantity=item_row.quantity,
#                 starch_level=item_row.starch_level,      # <-- ADDED
#                 crease=item_row.crease,                # <-- ADDED
#                 item_total=item_row.item_total,
#                 plant_price=item_row.plant_price,        # <-- ADDED
#                 margin=item_row.margin,                # <-- ADDED
#                 additional_charge=0.0,                 # <-- ADDED (for consistency)
#                 clothing_name=item_row.clothing_name,
#                 clothing_image_url=item_row.clothing_image_url,
#                 pieces=item_row.pieces
#                 # unit_price=item_row.unit_price,  <-- REMOVED (not in create_ticket)
#             ) for item_row in items_results
#         ]

#         # 3. Construct the final response to match create_ticket
        
#         # --- ADDED: Create the nested customer fields ---
#         customer_name = f"{ticket.first_name} {ticket.last_name or ''}".strip()
#         customer_phone = ticket.email  # Matches create_ticket logic

#         return TicketResponse(
#             id=ticket.id,
#             ticket_number=ticket.ticket_number,
#             customer_id=ticket.customer_id,
            
#             # --- ADDED THESE FIELDS ---
#             customer_name=customer_name,
#             customer_phone=customer_phone,
            
#             total_amount=ticket.total_amount,
#             paid_amount=ticket.paid_amount,
#             status=ticket.status,
#             rack_number=ticket.rack_number,
            
#             # --- ADDED THIS FIELD ---
#             special_instructions=ticket.special_instructions,
            
#             pickup_date=ticket.pickup_date,
#             created_at=ticket.created_at,
#             items=items_list,
            
#             # --- ADDED THIS FIELD ---
#             organization_id=org_id 
            
#             # --- REMOVED (not in create_ticket response) ---
#             # created_by_user_id=ticket.created_by_user_id,
#             # first_name=ticket.first_name,
#             # last_name=ticket.last_name,
#             # email=ticket.email,
#             # phone_number=ticket.phone_number,
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"[ERROR] Getting ticket {ticket_id}: {e}")
#         raise HTTPException(status_code=500, detail=f"Error retrieving ticket: {e}")
        
    # --- NEW ROUTE 3: Ticket number validation ---
@router.get(
    "/tickets/validate/{ticket_number}", 
    response_model=TicketValidationResponse,
    summary="Validate a ticket number and get its ID"
)
async def validate_ticket_number(
    ticket_number: str,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Checks if a ticket number exists in the user's organization and returns
    its numeric ID and customer name for UI validation.
    """
    try:
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 1. Authorization Check (matches your other routes)
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to validate tickets."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 2. Query to find the ticket ID by its number, joining to get customer name
        query = text("""
            SELECT 
                t.id, 
                t.ticket_number, 
                u.first_name, 
                u.last_name
            FROM tickets AS t
            JOIN allUsers AS u ON t.customer_id = u.id
            WHERE t.ticket_number = :ticket_number 
            AND t.organization_id = :org_id
        """)
        
        result = db.execute(query, {
            "ticket_number": ticket_number,
            "org_id": organization_id
        }).fetchone()

        # 3. Handle not found
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ticket number '{ticket_number}' not found in your organization."
            )

        # 4. Return the successful response
        return TicketValidationResponse(
            ticket_id=result.id,
            ticket_number=result.ticket_number,
            customer_name=f"{result.first_name} {result.last_name}"
        )

    except HTTPException:
        # Re-raise exceptions you've already handled
        raise
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Error during ticket validation: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")





@router.put(
    "/tickets/{ticket_id}/rack", 
    summary="Assign an available rack to a ticket"
)
async def assign_rack_to_ticket(
    ticket_id: int,
    req: RackAssignmentRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Assigns an available rack to a ticket. This is a special transaction that:
    1. Checks if the rack is available in the user's org.
    2. Updates the ticket with the rack number AND sets status to 'ready_for_pickup'.
    3. Marks the rack as occupied and links it to the ticket.
    """
    try:
        # 1. Get organization_id AND role from the trusted token
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 2. Role-based authorization check (all staff can do this)
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign racks."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 3. Check if the rack is available IN THIS ORG
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rack #{req.rack_number} is not available or does not exist in your organization."
            )

        # 4. Update the ticket, ensuring it's in the same org
        # --- THIS IS THE MODIFIED PART ---
        ticket_update_sql = text("""
            UPDATE tickets 
            SET 
                rack_number = :rack_number, 
                status = 'ready_for_pickup'  -- <-- ADDED THIS LINE
            WHERE id = :ticket_id AND organization_id = :org_id
            RETURNING id
        """)
        # ---------------------------------
        
        ticket_result = db.execute(ticket_update_sql, {
            "rack_number": req.rack_number,
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket_result:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        # 5. Update the rack to mark it as occupied
        rack_update_sql = text("""
            UPDATE racks 
            SET is_occupied = true, ticket_id = :ticket_id 
            WHERE number = :rack_number AND organization_id = :org_id
        """)
        db.execute(rack_update_sql, {
            "ticket_id": ticket_id,
            "rack_number": req.rack_number,
            "org_id": organization_id
        })

        # 6. Commit the transaction
        db.commit()
        return {"success": True, "message": f"Ticket {ticket_id} assigned to rack {req.rack_number} and marked as ready."}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during rack assignment: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# --- ADDED NEW PICKUP ROUTE ---

@router.put(
    "/tickets/{ticket_id}/rack", 
    summary="Assign an available rack to a ticket"
)
async def assign_rack_to_ticket(
    ticket_id: int,
    req: RackAssignmentRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Assigns an available rack to a ticket. This is a special transaction that:
    1. Checks if the rack is available in the user's org.
    2. Updates the ticket with the rack number AND sets status to 'ready_for_pickup'.
    3. Marks the rack as occupied and links it to the ticket.
    """
    try:
        # 1. Get organization_id AND role from the trusted token
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 2. Role-based authorization check (all staff can do this)
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign racks."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 3. Check if the rack is available IN THIS ORG
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rack #{req.rack_number} is not available or does not exist in your organization."
            )

        # 4. Update the ticket, ensuring it's in the same org
        # --- THIS IS THE MODIFIED PART ---
        ticket_update_sql = text("""
            UPDATE tickets 
            SET 
                rack_number = :rack_number, 
                status = 'ready_for_pickup'  -- <-- ADDED THIS LINE
            WHERE id = :ticket_id AND organization_id = :org_id
            RETURNING id
        """)
        # ---------------------------------
        
        ticket_result = db.execute(ticket_update_sql, {
            "rack_number": req.rack_number,
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket_result:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        # 5. Update the rack to mark it as occupied
        rack_update_sql = text("""
            UPDATE racks 
            SET is_occupied = true, ticket_id = :ticket_id 
            WHERE number = :rack_number AND organization_id = :org_id
        """)
        db.execute(rack_update_sql, {
            "ticket_id": ticket_id,
            "rack_number": req.rack_number,
            "org_id": organization_id
        })

        # 6. Commit the transaction
        db.commit()
        # --- UPDATED SUCCESS MESSAGE ---
        return {"success": True, "message": f"Ticket {ticket_id} assigned to rack {req.rack_number} and marked as ready."}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during rack assignment: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# --- ADDED NEW PICKUP ROUTE (NOW WITH RACK UPDATE) ---

@router.put(
    "/tickets/{ticket_id}/pickup", 
    response_model=TicketPickupResponse,
    summary="Process a ticket pickup and payment"
)
async def process_ticket_pickup(
    ticket_id: int,
    req: TicketPickupRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Processes a ticket pickup. It updates the ticket status to 'picked_up',
    adds the final payment, and frees up the associated rack.
    Includes item details and alterations in the generated receipt.
    """
    try:
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 1. Authorization Check
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to process pickups."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 2. Get the current ticket details
        ticket_query = text("""
            SELECT 
                t.total_amount, t.paid_amount, t.status, t.ticket_number, t.rack_number,
                u.first_name, u.last_name
            FROM tickets t
            JOIN allUsers u ON t.customer_id = u.id
            WHERE t.id = :ticket_id AND t.organization_id = :org_id
        """)
        ticket = db.execute(ticket_query, {
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        # 3. Check ticket status
        if ticket.status == 'picked_up':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This ticket has already been picked up."
            )
        
        if ticket.status not in ['ready', 'ready_for_pickup']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ticket status is '{ticket.status}'. It is not ready for pickup."
            )

        # 4. Payment Validation
        current_total = decimal.Decimal(ticket.total_amount)
        current_paid = decimal.Decimal(ticket.paid_amount)
        amount_paying = decimal.Decimal(str(req.amount_paid))
        
        outstanding_balance = current_total - current_paid
        
        if amount_paying < (outstanding_balance - decimal.Decimal('0.01')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ${amount_paying} is less than the outstanding balance of ${outstanding_balance}."
            )

        new_total_paid = current_paid + amount_paying
        new_status = "picked_up"

        # 5. Update the ticket
        update_query = text("""
            UPDATE tickets
            SET 
                status = :status,
                paid_amount = :paid_amount,
                pickup_date = :pickup_date 
            WHERE 
                id = :ticket_id AND organization_id = :org_id
        """)
        
        db.execute(update_query, {
            "status": new_status,
            "paid_amount": new_total_paid,
            "pickup_date": datetime.now(),
            "ticket_id": ticket_id,
            "org_id": organization_id
        })
        
        # 6. Free up the rack if one was assigned
        if ticket.rack_number:
            rack_free_query = text("""
                UPDATE racks
                SET 
                    is_occupied = false,
                    ticket_id = NULL
                WHERE
                    number = :rack_number AND organization_id = :org_id
            """)
            db.execute(rack_free_query, {
                "rack_number": ticket.rack_number,
                "org_id": organization_id
            })

        # 7. Commit the transaction
        db.commit()

        # --- NEW SECTION: Fetch Items for Receipt ---
        items_query = text("""
            SELECT 
                ti.quantity, ti.item_total, ti.starch_level, ti.crease, ti.alterations, ti.item_instructions,
                ct.name as clothing_name
            FROM ticket_items ti
            JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE ti.ticket_id = :ticket_id
        """)
        items_result = db.execute(items_query, {"ticket_id": ticket_id}).fetchall()

        # Build Items HTML string
        items_html = ""
        for item in items_result:
            details = []
            if item.starch_level and item.starch_level not in ['none', 'no_starch']:
                details.append(f"Starch: {item.starch_level}")
            if item.crease:
                details.append("Crease")
            
            # BOLD ALTERATIONS
            if item.alterations:
                details.append(f'<span style="font-weight:900; color:#000;">Alt: {item.alterations}</span>')
            
            # Instructions (Italic/Different style)
            if item.item_instructions:
                details.append(f'<span style="font-style:italic; color:#444;">Note: {item.item_instructions}</span>')
            
            details_html = ""
            if details:
                details_html = f'<div style="font-size:8pt;color:#666;margin-left:8px;font-style:italic;">+ {", ".join(details)}</div>'

            items_html += f"""
            <div style="margin:4px 0;">
                <div style="display:flex;justify-content:space-between;font-size:10pt;font-weight:600;">
                    <div style="flex:1;">{item.clothing_name}</div>
                    <div style="margin-left:8px;">x{item.quantity}</div>
                    <div style="width:56px;text-align:right;">${float(item.item_total):.2f}</div>
                </div>
                {details_html}
            </div>
            """
        # ---------------------------------------------
        
        # 8. Generate a receipt
        receipt_html = f"""
            <div style="font-family: monospace; font-size: 10pt; width: 300px; margin: 0 auto; color: #000;">
                <h4 style="text-align: center; font-size: 12pt; font-weight: bold; margin: 5px 0;">Pick Up Receipt</h4>
                <p>Ticket #: <strong>{ticket.ticket_number}</strong></p>
                <p>Customer: {ticket.first_name} {ticket.last_name}</p>
                <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #000;" />
                
                <div style="margin-bottom: 10px;">
                    {items_html}
                </div>
                <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #000;" />

                <p>Total Amount: ${current_total:.2f}</p>
                <p>Previously Paid: ${current_paid:.2f}</p>
                <p>Amount Paid Now: ${amount_paying:.2f}</p>
                <p><strong>Total Paid: ${new_total_paid:.2f}</strong></p>
                <p><strong>Balance Due: $0.00</strong></p>
                <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #000;" />
                <p>Date: {datetime.now().strftime("%Y-%m-%d %I:%M %p")}</p>
                <p style="text-align: center; margin-top: 10px;">Thank you!</p>
            </div>
        """

        return TicketPickupResponse(
            success=True,
            message=f"Ticket {ticket.ticket_number} marked as picked up.",
            ticket_id=ticket_id,
            new_status=new_status,
            new_total_paid=float(new_total_paid),
            receipt_html=receipt_html
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during ticket pickup: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
