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