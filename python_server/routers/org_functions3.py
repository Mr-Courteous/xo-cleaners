import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
import decimal # ADDED: Import for handling DECIMAL types
from datetime import datetime, timedelta




from utils.common import (
    hash_password,
    get_role_type,
    ALL_STAFF_ROLES,
    PLATFORM_ADMIN_ROLE,
    ORG_OWNER_ROLE,
    get_db,
    get_current_user_payload, 
    hash_password,
    TicketCreate,
    TicketResponse, 
    TicketItemResponse,
    TicketSummaryResponse,
    RackAssignmentRequest,
    GeneralTicketUpdateRequest,
    TicketValidationResponse
)


class NewCustomerRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    address: Optional[str] = None
    password: str


class EditedItem(BaseModel):
    """Defines the data for a single item being edited."""
    item_id: int = Field(..., description="The 'ticket_items.id' of the item to update")
    quantity: int
    item_total: decimal.Decimal = Field(..., description="The new total price for this item (price * quantity)")

class TicketEditRequest(BaseModel):
    """The request body from the frontend, containing a list of edited items."""
    items: List[EditedItem]
    
    

router = APIRouter(prefix="/api/organizations", tags=["Organization Resources"])

@router.get("/tickets/{ticket_id}", response_model=TicketResponse, summary="Get full details for a single ticket")
async def get_ticket_details(
    ticket_id: int, 
    db: Session = Depends(get_db), 
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves the complete details for a single ticket, including customer
    information and all associated line items.
    """
    
    # 1. (SECURITY) Get the organization ID
    organization_id = payload.get("organization_id")
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Organization ID missing."
        )

    # 2. Query for the main ticket details
    ticket_query = text("""
        SELECT
            t.id, t.ticket_number, t.customer_id, t.total_amount, t.paid_amount,
            t.status, t.rack_number, t.special_instructions, t.pickup_date, 
            t.created_at, t.organization_id,
            u.first_name, u.last_name, u.phone AS customer_phone
        FROM tickets AS t
        JOIN allusers AS u ON t.customer_id = u.id
        WHERE t.id = :ticket_id AND t.organization_id = :org_id
    """)
    
    ticket_result = db.execute(
        ticket_query, 
        {"ticket_id": ticket_id, "org_id": organization_id}
    ).fetchone()

    if not ticket_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found in your organization."
        )

    # 3. Query for all items associated with this ticket
    items_query = text("""
        SELECT
            ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity,
            ti.starch_level, ti.crease, ti.item_total,
            ti.plant_price, ti.margin,
            ct.name AS clothing_name
        FROM ticket_items AS ti
        JOIN clothing_types AS ct ON ti.clothing_type_id = ct.id
        WHERE ti.ticket_id = :ticket_id
    """)
    
    items_result = db.execute(items_query, {"ticket_id": ticket_id}).fetchall()

    # 4. Format the items into the Pydantic model
    ticket_items = [
        TicketItemResponse(
            id=item.id,
            ticket_id=item.ticket_id,
            clothing_type_id=item.clothing_type_id,
            clothing_name=item.clothing_name,
            quantity=item.quantity,
            starch_level=item.starch_level,
            crease=item.crease,
            item_total=item.item_total,
            plant_price=item.plant_price,
            margin=item.margin,
            additional_charge=0 
        ) for item in items_result
    ]

    # 5. Combine all info into the final TicketResponse
    # --- CHANGED: Convert rack_number to str() to match Pydantic model ---
    return TicketResponse(
        id=ticket_result.id,
        ticket_number=ticket_result.ticket_number,
        customer_id=ticket_result.customer_id,
        customer_name=f"{ticket_result.first_name} {ticket_result.last_name}",
        customer_phone=ticket_result.customer_phone,
        total_amount=ticket_result.total_amount,
        paid_amount=ticket_result.paid_amount,
        status=ticket_result.status,
        rack_number=str(ticket_result.rack_number) if ticket_result.rack_number is not None else None,
        special_instructions=ticket_result.special_instructions,
        pickup_date=ticket_result.pickup_date,
        created_at=ticket_result.created_at,
        organization_id=ticket_result.organization_id,
        items=ticket_items
    )
# --- END OF get_ticket_details FUNCTION ---


# --- ADD THIS FUNCTION *AFTER* THE ONE ABOVE ---

@router.get("/find-tickets", response_model=List[TicketResponse], summary="Search for tickets by number, name, or phone")
async def find_tickets(
    query: str = Query(..., min_length=2, description="Search term for ticket #, customer name, or phone"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Searches for tickets within the user's organization based on a query string.
    Matches against ticket number, customer full name, and customer phone number.
    """
    
    organization_id = payload.get("organization_id")
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Organization ID missing."
        )
    
    search_pattern = f"%{query}%"
    
    # Use 'allusers' (lowercase) and SELECT DISTINCT 't.id, t.created_at'
    find_ids_query = text("""
        SELECT DISTINCT t.id, t.created_at
        FROM tickets AS t
        JOIN allusers AS u ON t.customer_id = u.id
        WHERE 
            t.organization_id = :org_id
            AND (
                t.ticket_number ILIKE :pattern
                OR (u.first_name || ' ' || u.last_name) ILIKE :pattern
                OR u.phone ILIKE :pattern
            )
        ORDER BY t.created_at DESC
        LIMIT 50;
    """)
    
    try:
        result = db.execute(find_ids_query, {
            "org_id": organization_id,
            "pattern": search_pattern
        })
        
        ticket_ids = [row[0] for row in result.fetchall()] 

        if not ticket_ids:
            return []
            
        tickets_list = []
        for ticket_id in ticket_ids:
            # This line will now work, because get_ticket_details is defined above
            ticket_details = await get_ticket_details(ticket_id=ticket_id, db=db, payload=payload)
            tickets_list.append(ticket_details)
            
        return tickets_list

    except Exception as e:
        print(f"Error during ticket search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while searching for tickets."
        )
        
        
        
@router.get("/customers/search", summary="Search for customers by name, phone, or email")
async def search_customers(
    query: str = Query(..., min_length=2, description="Search term for customer name, phone, or email"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Searches for users with the 'customer' role within the user's organization.
    Implements security checks for role and organization.
    """
    
    # --- CHANGED: Allowed roles list is now defined *inside* the route ---
    CUSTOMER_SEARCH_ALLOWED_ROLES = ["platform_admin", "store_owner", "cashier"]

    # 1. (SECURITY) Get user's role and organization ID from their token
    user_role = payload.get("role")
    organization_id = payload.get("organization_id")

    # 2. (AUTHORIZATION) Check if the user's role is allowed to perform this search
    if user_role not in CUSTOMER_SEARCH_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to search for customers."
        )

    # 3. (SECURITY) Enforce organization boundaries
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: Organization ID is required for this operation."
        )

    # 4. Prepare the search query
    search_pattern = f"%{query}%"

    # This query searches 'allusers' as requested, filters by 'customer' role,
    # and securely scopes the search to the user's organization.
    # It also adds a subquery to find the customer's last visit (most recent ticket).
    query_sql = text("""
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.phone,
            u.email,
            u.address,
            u.created_at,
            (SELECT MAX(t.created_at) FROM tickets AS t WHERE t.customer_id = u.id) AS last_visit_date
        FROM allusers AS u
        WHERE
            u.organization_id = :org_id
            AND u.role = 'customer'
            AND (
                (u.first_name || ' ' || u.last_name) ILIKE :pattern
                OR u.phone ILIKE :pattern
                OR u.email ILIKE :pattern
            )
        ORDER BY u.first_name
        LIMIT 50;
    """)

    # 5. Execute the query
    try:
        result = db.execute(query_sql, {
            "org_id": organization_id,
            "pattern": search_pattern
        })
        
        customers = []
        for row in result:
            customers.append({
                "id": row.id,
                "name": f"{row.first_name or ''} {row.last_name or ''}".strip(), 
                "phone": row.phone,
                "email": row.email,
                "address": row.address,
                "last_visit_date": row.last_visit_date,
                "created_at": row.created_at
            })
            
        return customers
        
    except Exception as e:
        print(f"Error during customer search: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while searching for customers: {e}")
    
    
    
@router.put(
    "/tickets/{ticket_id}/edit", 
    response_model=TicketResponse, 
    summary="Update items on an existing ticket"
)
async def edit_ticket_items(
    ticket_id: int,
    data: TicketEditRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Updates the quantity and price for items on a ticket.
    This will:
    1. Update each item in the 'ticket_items' table.
    2. Recalculate the new 'total_amount' for the main ticket.
    3. Update the 'tickets' table with the new total.
    4. Return the fully updated ticket.
    """
    
    # 1. (SECURITY) Get user's role and organization ID from their token
    EDIT_TICKET_ALLOWED_ROLES = ["cashier", "store_owner", "store_admin"]
    organization_id = payload.get("organization_id")
    user_role = payload.get("role")

    # 2. (AUTHORIZATION) Check if the user's role is allowed
    if user_role not in EDIT_TICKET_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit tickets."
        )
    
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Organization ID missing."
        )

    # 3. (LOGIC) Start database transaction
    try:
        new_total_amount = decimal.Decimal('0.00')
        
        # 3a. Check if the main ticket exists and belongs to the org
        ticket_check_query = text("SELECT id FROM tickets WHERE id = :ticket_id AND organization_id = :org_id")
        ticket_exists = db.execute(
            ticket_check_query, 
            {"ticket_id": ticket_id, "org_id": organization_id}
        ).fetchone()
        
        if not ticket_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found in your organization.")

        # 3b. Loop and update each item, ensuring it belongs to the org
        update_item_query = text("""
            UPDATE ticket_items
            SET 
                quantity = :quantity, 
                item_total = :item_total
            WHERE 
                id = :item_id 
                AND ticket_id = :ticket_id 
                AND organization_id = :org_id
        """)
        
        for item in data.items:
            # We enforce security by including ticket_id and org_id in the WHERE clause
            # If an item doesn't match, it simply won't be updated.
            db.execute(update_item_query, {
                "quantity": item.quantity,
                "item_total": item.item_total,
                "item_id": item.item_id,
                "ticket_id": ticket_id,
                "org_id": organization_id
            })
            # Add this item's new total to our running grand total
            new_total_amount += item.item_total

        # 3c. Now, update the main ticket's total_amount
        update_ticket_query = text("""
            UPDATE tickets
            SET total_amount = :total_amount
            WHERE id = :ticket_id AND organization_id = :org_id
        """)
        
        db.execute(update_ticket_query, {
            "total_amount": new_total_amount,
            "ticket_id": ticket_id,
            "org_id": organization_id
        })
        
        # 3d. If all succeeded, commit the changes
        db.commit()
        
        # 4. (RETURN) Fetch and return the full, updated ticket
        # This re-uses your existing function and ensures the frontend gets
        # the latest data (including the new total_amount).
        return await get_ticket_details(ticket_id=ticket_id, db=db, payload=payload)

    except Exception as e:
        # If any step failed, roll back the entire transaction
        db.rollback()
        print(f"Error editing ticket {ticket_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"An error occurred while editing the ticket: {str(e)}"
        )