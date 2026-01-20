import decimal
from typing import Optional, List, Dict, Any
# Make sure Query is imported
from fastapi import APIRouter, HTTPException, Depends, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, ConfigDict
from datetime import timedelta, datetime, timezone, date

# Make sure all your Pydantic models are imported
from utils.common import (
    get_db, 
    get_current_user_payload,
    TicketSummaryResponse,
    TicketResponse,
    TicketItemResponse,
    create_audit_log,
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





# @router.put(
#     "/tickets/{ticket_id}/rack", 
#     summary="Assign an available rack to a ticket"
# )
# async def assign_rack_to_ticket(
#     ticket_id: int,
#     req: RackAssignmentRequest,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload)
# ):
#     """
#     Assigns an available rack to a ticket. This is a special transaction that:
#     1. Checks if the rack is available in the user's org.
#     2. Updates the ticket with the rack number AND sets status to 'ready_for_pickup'.
#     3. Marks the rack as occupied and links it to the ticket.
#     """
#     try:
#         # 1. Get organization_id AND role from the trusted token
#         organization_id = payload.get("organization_id")
#         user_role = payload.get("role")

#         # 2. Role-based authorization check (all staff can do this)
#         allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
#         if user_role not in allowed_roles:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You do not have permission to assign racks."
#             )
#         if not organization_id:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token: Organization ID missing."
#             )

#         # 3. Check if the rack is available IN THIS ORG
#         rack_query = text("""
#             SELECT id FROM racks 
#             WHERE number = :rack_number 
#             AND organization_id = :org_id 
#             AND is_occupied = false
#         """)
#         available_rack = db.execute(rack_query, {
#             "rack_number": req.rack_number,
#             "org_id": organization_id
#         }).fetchone()

#         if not available_rack:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail=f"Rack #{req.rack_number} is not available or does not exist in your organization."
#             )

#         # 4. Update the ticket, ensuring it's in the same org
#         # --- THIS IS THE MODIFIED PART ---
#         ticket_update_sql = text("""
#             UPDATE tickets 
#             SET 
#                 rack_number = :rack_number, 
#                 status = 'ready_for_pickup'  -- <-- ADDED THIS LINE
#             WHERE id = :ticket_id AND organization_id = :org_id
#             RETURNING id
#         """)
#         # ---------------------------------
        
#         ticket_result = db.execute(ticket_update_sql, {
#             "rack_number": req.rack_number,
#             "ticket_id": ticket_id,
#             "org_id": organization_id
#         }).fetchone()

#         if not ticket_result:
#             db.rollback()
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Ticket not found in your organization."
#             )

#         # 5. Update the rack to mark it as occupied
#         rack_update_sql = text("""
#             UPDATE racks 
#             SET is_occupied = true, ticket_id = :ticket_id 
#             WHERE number = :rack_number AND organization_id = :org_id
#         """)
#         db.execute(rack_update_sql, {
#             "ticket_id": ticket_id,
#             "rack_number": req.rack_number,
#             "org_id": organization_id
#         })

#         # 6. Commit the transaction
#         db.commit()
#         return {"success": True, "message": f"Ticket {ticket_id} assigned to rack {req.rack_number} and marked as ready."}

#     except HTTPException:
#         db.rollback()
#         raise
#     except Exception as e:
#         db.rollback()
#         print(f"Error during rack assignment: {e}")
#         raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# --- ADDED NEW PICKUP ROUTE ---

@router.put(
    "/tickets/{ticket_id}/rack", 
    summary="Assign an available rack to a ticket"
)
async def assign_rack_to_ticket(
    ticket_id: int,
    req: RackAssignmentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),

):
    """
    Assigns an available rack to a ticket. This is a special transaction that:
    1. Checks if the rack is available in the user's org.
    2. If the ticket already has a rack, frees up the old rack.
    3. Updates the ticket with the new rack number AND sets status to 'ready_for_pickup'.
    4. Marks the new rack as occupied and links it to the ticket.
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

        # 3. Get the ticket's current rack (if any) and status
        ticket_query = text("""
            SELECT rack_number, status FROM tickets 
            WHERE id = :ticket_id AND organization_id = :org_id
        """)
        ticket_result = db.execute(ticket_query, {
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        old_rack_number = ticket_result.rack_number
        ticket_status = ticket_result.status
        
        # Allow re-racking only if status is 'ready_for_pickup' or if it's a first-time racking
        # Block re-racking if status is 'picked_up'
        if ticket_status == 'picked_up':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot re-rack ticket. This ticket has already been picked up."
            )
        
        is_rerack = old_rack_number is not None

        # 4. Check if the new rack is available IN THIS ORG
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

        # 5. If re-racking, free up the old rack first
        if is_rerack:
            rack_free_query = text("""
                UPDATE racks
                SET 
                    is_occupied = false,
                    ticket_id = NULL
                WHERE
                    number = :rack_number AND organization_id = :org_id
            """)
            db.execute(rack_free_query, {
                "rack_number": old_rack_number,
                "org_id": organization_id
            })

        # 6. Update the ticket with the new rack
        ticket_update_sql = text("""
            UPDATE tickets 
            SET 
                rack_number = :rack_number, 
                status = 'ready_for_pickup'
            WHERE id = :ticket_id AND organization_id = :org_id
            RETURNING id
        """)
        
        ticket_update_result = db.execute(ticket_update_sql, {
            "rack_number": req.rack_number,
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not ticket_update_result:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        # 7. Update the new rack to mark it as occupied
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

        # 8. Commit the transaction
        db.commit()
        
        # 9. Audit Log (Running in background)
        background_tasks.add_task(
            create_audit_log,
            org_id=payload.get("organization_id"),
            actor_id=payload.get("id") or payload.get("user_id") or 0,
            actor_name=payload.get("sub", "Unknown"),
            actor_role=payload.get("role", "Unknown"),
            action="Rack a ticket",
            ticket_id=ticket_id,
            details={
                "ticket_id": ticket_id,
                "new_rack": req.rack_number,
                "old_rack": old_rack_number,
                "is_rerack": is_rerack
            }
        )

        # 10. Return response with re-rack flag
        if is_rerack:
            message = f"Ticket {ticket_id} re-racked from rack {old_rack_number} to rack {req.rack_number}."
        else:
            message = f"Ticket {ticket_id} assigned to rack {req.rack_number} and marked as ready."
        
        return {
            "success": True,
            "message": message,
            "is_rerack": is_rerack,
            "old_rack": old_rack_number,
            "new_rack": req.rack_number
        }
    
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Processes a ticket pickup or partial payment.
    Interprets req.amount_paid as the AMOUNT BEING PAID NOW (Increment), not the total.
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

        # 3. CALCULATE FINANCIALS
        items_query = text("""
            SELECT ti.item_total
            FROM ticket_items ti
            WHERE ti.ticket_id = :ticket_id
        """)
        items_rows = db.execute(items_query, {"ticket_id": ticket_id}).fetchall()
        
        subtotal = decimal.Decimal('0')
        for r in items_rows:
            subtotal += decimal.Decimal(str(r.item_total or 0))

        env_charge = subtotal * decimal.Decimal('0.047')
        tax = subtotal * decimal.Decimal('0.0825')
        final_total = subtotal + env_charge + tax
        
        # Existing paid amount from DB
        current_paid = decimal.Decimal(str(ticket.paid_amount or 0))
        
        # Determine if currently fully paid (before this new transaction)
        is_currently_fully_paid = current_paid >= (final_total - decimal.Decimal('0.01'))

        # 4. Check ticket status
        # Only block if it's picked up AND fully paid.
        if ticket.status == 'picked_up' and is_currently_fully_paid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This ticket has already been picked up and fully paid."
            )
        
        valid_statuses = ['ready', 'ready_for_pickup', 'picked_up']
        if ticket.status not in valid_statuses:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ticket status is '{ticket.status}'. It is not ready for pickup/payment."
            )

        # =======================================================================
        # 5. PROCESS NEW PAYMENT INPUT (FIXED HERE)
        # =======================================================================
        amount_paying_now = decimal.Decimal(str(req.amount_paid))

        if amount_paying_now < decimal.Decimal('0'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount cannot be negative."
            )

        # Calculate the NEW TOTAL by adding current history + what they are paying now
        new_total_paid = current_paid + amount_paying_now

        # Cap at the final total to avoid over-crediting
        # (e.g. if they owe $10 but try to pay $200, we max it at the total price)
        if new_total_paid > final_total:
            new_total_paid = final_total

        # Re-calculate 'paid_now' based on the capped amount 
        # (This handles the case where they tried to overpay)
        paid_now = new_total_paid - current_paid

        # Determine if the ticket is now fully paid
        is_fully_paid = new_total_paid >= (final_total - decimal.Decimal('0.01'))

        # 6. DETERMINE NEW STATUS
        if is_fully_paid:
            new_status = "picked_up"
            pickup_date_value = datetime.now()
        else:
            # If not fully paid, keep existing status (unless it was already picked_up)
            new_status = ticket.status 
            pickup_date_value = None 

        # 7. UPDATE TICKET
        update_query = text("""
            UPDATE tickets
            SET 
                status = :status,
                paid_amount = :paid_amount,
                pickup_date = COALESCE(:pickup_date, pickup_date)
            WHERE 
                id = :ticket_id AND organization_id = :org_id
        """)
        
        db.execute(update_query, {
            "status": new_status,
            "paid_amount": float(new_total_paid),
            "pickup_date": pickup_date_value,
            "ticket_id": ticket_id,
            "org_id": organization_id
        })
        
        # 8. Free up the rack ONLY if fully paid
        if is_fully_paid and ticket.rack_number:
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

        # 9. Commit
        db.commit()
        
        # 10. Audit Log
        background_tasks.add_task(
            create_audit_log,
            org_id=payload.get("organization_id"),
            actor_id=payload.get("id") or payload.get("user_id") or 0,
            actor_name=payload.get("sub", "Unknown"),
            actor_role=payload.get("role", "Unknown"),
            action="PICKUP_PAYMENT", 
            ticket_id=ticket_id,
            details={
                "ticket_id": ticket_id, 
                "previous_paid": float(current_paid),
                "paid_now": float(paid_now),
                "new_total_paid": float(new_total_paid),
                "fully_paid": is_fully_paid
            }
        )

        # ===========================================================================
        # RECEIPT GENERATION
        # ===========================================================================
        org_name_query = text("SELECT name FROM organizations WHERE id = :org_id")
        org_name_row = db.execute(org_name_query, {"org_id": organization_id}).fetchone()
        org_name_val = org_name_row.name if org_name_row else "Your Cleaners"

        settings_query = text("""
            SELECT receipt_header, receipt_footer 
            FROM organization_settings 
            WHERE organization_id = :org_id
        """)
        settings_row = db.execute(settings_query, {"org_id": organization_id}).fetchone()
        receipt_header_val = settings_row.receipt_header if settings_row and settings_row.receipt_header else "Thank you!"
        receipt_footer_val = settings_row.receipt_footer if settings_row and settings_row.receipt_footer else "Have a great day!"
        
        greeting_html = receipt_header_val.replace('\n', '<br>')
        footer_html = receipt_footer_val.replace('\n', '<br>')

        # Fetch Items details
        items_detail_query = text("""
            SELECT 
                ti.quantity, ti.item_total, ti.starch_level, ti.crease, 
                ti.alterations, ti.item_instructions, ti.additional_charge,
                ct.name as clothing_name
            FROM ticket_items ti
            JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE ti.ticket_id = :ticket_id
        """)
        items_result = db.execute(items_detail_query, {"ticket_id": ticket_id}).fetchall()

        items_html = ""
        for item in items_result:
            details = []
            if item.starch_level and item.starch_level not in ['none', 'no_starch']:
                details.append(f"Starch: {item.starch_level}")
            if item.crease:
                details.append("Crease")
            if item.alterations:
                details.append(f'<span style="font-weight:900; color:#000;">Alt: {item.alterations}</span>')
            if item.additional_charge and item.additional_charge > 0:
                 details.append(f'<span style="font-weight:900; color:#000;">Add\'l: ${float(item.additional_charge):.2f}</span>')
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

        balance_after = final_total - new_total_paid

        receipt_title = "PICKUP RECEIPT" if is_fully_paid else "PARTIAL PAYMENT RECEIPT"

        receipt_html = f"""
            <div style="font-family: monospace; font-size: 10pt; width: 300px; margin: 0 auto; color: #000;">
                <div style="text-align:center; margin-bottom: 4px;">
                    <div style="font-size:14pt; font-weight:900; font-family: Arial, sans-serif;">{org_name_val}</div>
                </div>
                <div style="text-align:center; font-size:9pt; font-weight:normal; margin-bottom: 8px;">
                    {greeting_html}
                </div>

                <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px;">
                    <h4 style="margin: 0; font-size: 12pt; font-weight: bold;">{receipt_title}</h4>
                    <p style="margin: 2px 0;">Ticket #: <strong>{ticket.ticket_number}</strong></p>
                    <p style="margin: 2px 0; font-size: 9pt;">{datetime.now().strftime("%Y-%m-%d %I:%M %p")}</p>
                </div>

                <p style="margin-top: 8px;">Customer: {ticket.first_name} {ticket.last_name}</p>
                
                <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #000;" />
                <div style="margin-bottom: 10px;">{items_html}</div>
                <hr style="margin: 8px 0; border: 0; border-top: 1px dashed #000;" />

                <div style="font-weight: 600;">
                    <div style="display:flex; justify-content:space-between;"> 
                        <span>Subtotal:</span> <span>${float(subtotal):.2f}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;"> 
                        <span>Env (4.7%):</span> <span>${float(env_charge):.2f}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;"> 
                        <span>Tax (8.25%):</span> <span>${float(tax):.2f}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:6px; font-weight:900;"> 
                        <span>TOTAL:</span> <span>${float(final_total):.2f}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:6px;"> 
                        <span>Previously Paid:</span> <span>${float(current_paid):.2f}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;"> 
                        <span>Paid Now:</span> <span>${float(paid_now):.2f}</span>
                    </div>
                </div>

                {"<div style=\"padding: 5px; margin-top: 10px; text-align: center;\"><p style=\"margin: 0; font-size: 12pt; font-weight: 900;\">PAID IN FULL</p></div>" if is_fully_paid else f"<div style=\"display:flex;justify-content:space-between;margin-top:8px;font-weight:900;font-size:12pt;background:#eee;padding:4px;\"><div>BALANCE DUE:</div><div>${float(balance_after):.2f}</div></div>"}
                
                <hr style="margin: 15px 0 8px 0; border: 0; border-top: 1px dashed #000;" />
                <div style="text-align: center; font-size: 9pt;">{footer_html}</div>
            </div>
        """

        success_msg = f"Ticket {ticket.ticket_number} marked as picked up." if is_fully_paid else f"Payment of ${float(paid_now):.2f} recorded. Balance: ${float(balance_after):.2f}"

        return TicketPickupResponse(
            success=True,
            message=success_msg,
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