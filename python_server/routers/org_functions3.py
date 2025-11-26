import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
import decimal # ADDED: Import for handling DECIMAL types
from datetime import timedelta, datetime, timezone
from dateutil.relativedelta import relativedelta




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
    TicketValidationResponse,
    CustomerResponse
)


# --- HELPER: Loyalty Tenure Calculation ---
def calculate_tenure(joined_at: datetime) -> str:
    if not joined_at:
        return "Prospect"
    
    # Handle timezone awareness
    if joined_at.tzinfo is None:
        joined_at = joined_at.replace(tzinfo=timezone.utc)
        
    now = datetime.now(timezone.utc)
    diff = relativedelta(now, joined_at)
    
    parts = []
    if diff.years > 0:
        parts.append(f"{diff.years} Year{'s' if diff.years > 1 else ''}")
    if diff.months > 0:
        parts.append(f"{diff.months} Month{'s' if diff.months > 1 else ''}")
        
    if diff.years == 0 and diff.months == 0:
        days = diff.days
        if days == 0:
            return "Joined Today"
        parts.append(f"{days} Day{'s' if days > 1 else ''}")
        
    return ", ".join(parts[:2])


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
#                 t.pickup_date,
#                 t.special_instructions, -- <-- ADDED THIS
#                 u.first_name, u.last_name, u.email, u.phone
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
#                 ti.plant_price, ti.margin, ti.starch_level, ti.crease,
#                 ct.name AS clothing_name,
#                 ct.image_url AS clothing_image_url,
#                 COALESCE(ct.pieces, 1) AS pieces
#             FROM ticket_items ti
#             JOIN clothing_types ct ON ti.clothing_type_id = ct.id
#             WHERE ti.ticket_id = :ticket_id  -- <-- FIXED
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



@router.get("/tickets/{ticket_id}", response_model=TicketResponse, summary="Get full details for a single ticket")
async def get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID missing.")

    try:
        # 1. Main Ticket Info
        ticket_stmt = text("""
            SELECT 
                t.id, t.ticket_number, t.customer_id, t.total_amount, 
                t.paid_amount, t.status, t.rack_number, t.created_at, 
                t.pickup_date, t.special_instructions,
                u.first_name, u.last_name, u.email, u.phone
            FROM tickets t
            JOIN allUsers u ON t.customer_id = u.id
            WHERE t.id = :ticket_id AND t.organization_id = :org_id
        """)
        ticket = db.execute(ticket_stmt, {"ticket_id": ticket_id, "org_id": org_id}).fetchone()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found.")

        # 2. Get Items (Added item_instructions)
        items_stmt = text("""
            SELECT 
                ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
                ti.item_total, ti.plant_price, ti.margin, ti.starch_level, ti.crease,
                ti.alterations, ti.item_instructions,  -- <--- ADDED
                ct.name AS clothing_name,
                ct.image_url AS clothing_image_url,
                COALESCE(ct.pieces, 1) AS pieces
            FROM ticket_items ti
            JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE ti.ticket_id = :ticket_id
        """)
        
        items_results = db.execute(items_stmt, {"ticket_id": ticket_id}).fetchall()

        items_list = [
            TicketItemResponse(
                id=item_row.id,
                ticket_id=item_row.ticket_id,
                clothing_type_id=item_row.clothing_type_id,
                quantity=item_row.quantity,
                starch_level=item_row.starch_level,
                crease=item_row.crease,
                alterations=item_row.alterations,
                item_instructions=item_row.item_instructions, # <--- MAPPED
                item_total=item_row.item_total,
                plant_price=item_row.plant_price,
                margin=item_row.margin,
                additional_charge=0.0,
                clothing_name=item_row.clothing_name,
                clothing_image_url=item_row.clothing_image_url,
                pieces=item_row.pieces
            ) for item_row in items_results
        ]

        return TicketResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            customer_id=ticket.customer_id,
            customer_name=f"{ticket.first_name} {ticket.last_name or ''}".strip(),
            customer_phone=ticket.email,
            total_amount=ticket.total_amount,
            paid_amount=ticket.paid_amount,
            status=ticket.status,
            rack_number=ticket.rack_number,
            pickup_date=ticket.pickup_date,
            created_at=ticket.created_at,
            special_instructions=ticket.special_instructions,
            items=items_list,
            organization_id=org_id 
        )

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving ticket.")

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
    
    
# ==========================================
# GET: All Customers (Secured)
# ==========================================
@router.get("/customers", response_model=List[CustomerResponse], summary="Get all customers for organization")
def get_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves customers. 
    SECURITY: Restricted to Staff/Admins. Customers cannot view the full list.
    """
    org_id = payload.get("organization_id")
    user_role = payload.get("role")
    
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID missing.")

    # 1. SECURITY: Role-Based Access Control
    # Allowed roles based on your other files (org_functions2.py, etc.)
    allowed_roles = ["cashier", "manager", "staff", "store_admin", "org_owner", "STORE_OWNER"]
    
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view the customer list."
        )

    # 2. Query Logic
    query_str = """
        SELECT id, first_name, last_name, email, phone, address, role, organization_id, joined_at 
        FROM allUsers 
        WHERE organization_id = :org_id AND role = 'customer'
    """
    
    params = {"org_id": org_id}

    if search:
        search_term = f"%{search}%"
        query_str += """
            AND (
                LOWER(first_name) LIKE LOWER(:search) OR 
                LOWER(last_name) LIKE LOWER(:search) OR 
                LOWER(email) LIKE LOWER(:search) OR 
                phone LIKE :search
            )
        """
        params["search"] = search_term
        
    query_str += " ORDER BY first_name ASC"

    try:
        results = db.execute(text(query_str), params).fetchall()
        
        response = []
        for row in results:
            response.append(CustomerResponse(
                id=row.id,
                first_name=row.first_name,
                last_name=row.last_name,
                email=row.email,
                phone=row.phone or "",
                address=row.address,
                role=row.role,
                organization_id=row.organization_id,
                joined_at=row.joined_at, 
                tenure=calculate_tenure(row.joined_at) # <--- Tenure Calculation
            ))
            
        return response

    except Exception as e:
        print(f"Error fetching customers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch customers.")


# ==========================================
# GET: Single Customer Details (Secured)
# ==========================================
@router.get("/customers/{customer_id}", response_model=CustomerResponse, summary="Get single customer details")
def get_customer_details(
    customer_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Get customer details.
    SECURITY: Staff can view anyone. Customers can ONLY view themselves.
    """
    org_id = payload.get("organization_id")
    user_role = payload.get("role")
    user_email = payload.get("sub") # Assuming 'sub' contains the email
    
    # 1. SECURITY: Check if user is authorized to view this specific ID
    staff_roles = ["cashier", "manager", "staff", "store_admin", "org_owner", "STORE_OWNER"]
    
    if user_role not in staff_roles:
        # If not staff, they MUST be the customer requesting their own profile.
        # We need to verify their ID matches the requested customer_id.
        
        # Look up the ID of the requester using their email from the token
        requester_stmt = text("SELECT id FROM allUsers WHERE email = :email AND organization_id = :org_id")
        requester = db.execute(requester_stmt, {"email": user_email, "org_id": org_id}).fetchone()
        
        if not requester or requester.id != customer_id:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own profile."
            )

    # 2. Fetch Customer Data
    query = text("""
        SELECT id, first_name, last_name, email, phone, address, role, organization_id, joined_at
        FROM allUsers
        WHERE id = :id AND organization_id = :org_id AND role = 'customer'
    """)
    
    try:
        row = db.execute(query, {"id": customer_id, "org_id": org_id}).fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Customer not found.")

        return CustomerResponse(
            id=row.id,
            first_name=row.first_name,
            last_name=row.last_name,
            email=row.email,
            phone=row.phone or "",
            address=row.address,
            role=row.role,
            organization_id=row.organization_id,
            joined_at=row.joined_at,
            tenure=calculate_tenure(row.joined_at) # <--- Tenure Calculation
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer {customer_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch customer details.")

    
    
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