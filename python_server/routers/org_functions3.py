import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
import decimal # ADDED: Import for handling DECIMAL types
from datetime import timedelta, datetime, timezone, date
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
    CustomerResponse,
    CustomerUpdate
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


# -------------------------------------------------------
# Full Ticket Edit — mirrors TicketCreate item structure
# -------------------------------------------------------
class FullEditItem(BaseModel):
    clothing_type_id: Optional[int] = None
    custom_name: Optional[str] = None
    quantity: int = 1
    unit_price: Optional[float] = 0.0          # plant_price
    margin: Optional[float] = 0.0
    starch_level: Optional[str] = "none"
    starch_charge: Optional[float] = 0.0
    clothing_size: Optional[str] = "standard"
    size_charge: Optional[float] = 0.0
    crease: Optional[bool] = False
    alterations: Optional[str] = None
    item_instructions: Optional[str] = None
    additional_charge: Optional[float] = 0.0
    instruction_charge: Optional[float] = 0.0
    alteration_behavior: Optional[str] = "none"
    item_total: Optional[float] = 0.0          # frontend pre-calculated total

class FullTicketEditRequest(BaseModel):
    customer_id: Optional[int] = None          # allow re-assigning customer
    special_instructions: Optional[str] = None
    pickup_date: Optional[datetime] = None
    paid_amount: Optional[float] = None
    items: List[FullEditItem]


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



# @router.get("/tickets/{ticket_id}", response_model=TicketResponse, summary="Get full details for a single ticket")
# async def get_ticket_details(
#     ticket_id: int,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload)
# ):
#     org_id = payload.get("organization_id")
#     if not org_id:
#         raise HTTPException(status_code=400, detail="Organization ID missing.")

#     try:
#         # 1. Main Ticket Info
#         ticket_stmt = text("""
#             SELECT 
#                 t.id, t.ticket_number, t.customer_id, t.total_amount, 
#                 t.paid_amount, t.status, t.rack_number, t.created_at, 
#                 t.pickup_date, t.special_instructions,
#                 u.first_name, u.last_name, u.email, u.phone
#             FROM tickets t
#             JOIN allUsers u ON t.customer_id = u.id
#             WHERE t.id = :ticket_id AND t.organization_id = :org_id
#         """)
#         ticket = db.execute(ticket_stmt, {"ticket_id": ticket_id, "org_id": org_id}).fetchone()

#         if not ticket:
#             raise HTTPException(status_code=404, detail="Ticket not found.")

#         # 2. Get Items
#         items_stmt = text("""
#             SELECT 
#                 ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
#                 ti.item_total, ti.plant_price, ti.margin, ti.starch_level, ti.crease,
#                 ti.alterations, ti.item_instructions, ti.additional_charge, ti.alteration_behavior, 
#                 ct.name AS clothing_name,
#                 ct.image_url AS clothing_image_url,
#                 COALESCE(ct.pieces, 1) AS pieces
#             FROM ticket_items ti
#             JOIN clothing_types ct ON ti.clothing_type_id = ct.id
#             WHERE ti.ticket_id = :ticket_id
#         """)
        
#         items_results = db.execute(items_stmt, {"ticket_id": ticket_id}).fetchall()

#         items_list = [
#             TicketItemResponse(
#                 id=item_row.id,
#                 ticket_id=item_row.ticket_id,
#                 clothing_type_id=item_row.clothing_type_id,
#                 quantity=item_row.quantity,
#                 starch_level=item_row.starch_level,
#                 crease=item_row.crease,
#                 alterations=item_row.alterations,
#                 item_instructions=item_row.item_instructions,
#                 alteration_behavior=item_row.alteration_behavior, # <--- MAPPED
#                 item_total=item_row.item_total,
#                 plant_price=item_row.plant_price,
#                 margin=item_row.margin,
#                 additional_charge=item_row.additional_charge or 0.0,
#                 clothing_name=item_row.clothing_name,
#                 pieces=item_row.pieces
#             ) for item_row in items_results
#         ]

#         # ===========================================================================
#         # 3. FETCH ORGANIZATION NAME & BRANDING (Header/Footer)
#         # ===========================================================================
        
#         # A. Fetch Org Name
#         org_name_query = text("SELECT name FROM organizations WHERE id = :org_id")
#         org_name_row = db.execute(org_name_query, {"org_id": org_id}).fetchone()
#         org_name_val = org_name_row.name if org_name_row else "Your Cleaners"

#         # B. Fetch Settings (Header/Footer)
#         settings_query = text("""
#             SELECT receipt_header, receipt_footer 
#             FROM organization_settings 
#             WHERE organization_id = :org_id
#         """)
#         settings_row = db.execute(settings_query, {"org_id": org_id}).fetchone()
        
#         receipt_header_val = settings_row.receipt_header if settings_row else None
#         receipt_footer_val = settings_row.receipt_footer if settings_row else None
#         # ===========================================================================

#         return TicketResponse(
#             id=ticket.id,
#             ticket_number=ticket.ticket_number,
#             customer_id=ticket.customer_id,
#             customer_name=f"{ticket.first_name} {ticket.last_name or ''}".strip(),
#             customer_phone=ticket.email,
#             total_amount=ticket.total_amount,
#             paid_amount=ticket.paid_amount,
#             status=ticket.status,
#             rack_number=ticket.rack_number,
#             pickup_date=ticket.pickup_date,
#             created_at=ticket.created_at,
#             special_instructions=ticket.special_instructions,
#             items=items_list,
#             organization_id=org_id,
            
#             # ✅ Return Org Name & Branding
#             organization_name=org_name_val,
#             receipt_header=receipt_header_val,
#             receipt_footer=receipt_footer_val
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error: {e}")
#         raise HTTPException(status_code=500, detail="Error retrieving ticket.")
    

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

        # --- TIMEZONE FIX START (SAFE VERSION) ---
        
        # 1. Fix Created At
        c_at = ticket.created_at
        if c_at and isinstance(c_at, datetime) and c_at.tzinfo is None:
            c_at = c_at.replace(tzinfo=timezone.utc)

        # 2. Fix Pickup Date (Handles both Date and DateTime)
        p_date = ticket.pickup_date
        if p_date:
            if isinstance(p_date, datetime):
                # If it's a full DateTime
                if p_date.tzinfo is None:
                    p_date = p_date.replace(tzinfo=timezone.utc)
            elif isinstance(p_date, date):
                # If it's just a Date, convert to Midnight UTC
                p_date = datetime.combine(p_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        # --- TIMEZONE FIX END ---

        # 2. Get Items
        items_stmt = text("""
            SELECT 
                ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
                ti.item_total, ti.plant_price, ti.margin, 
                ti.starch_level, ti.starch_charge, 
                
                ti.clothing_size, ti.size_charge, 
                
                ti.crease, ti.alterations, ti.item_instructions, 
                ti.additional_charge, ti.instruction_charge,
                ti.alteration_behavior, 
                ti.custom_name,
                ti.alteration_id, ti.alteration_name, ti.alteration_price,
                
                ct.name AS clothing_name,
                ct.image_url AS clothing_image_url,
                COALESCE(ct.pieces, 1) AS pieces
            FROM ticket_items ti
            LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id 
            WHERE ti.ticket_id = :ticket_id
        """)
        
        items_results = db.execute(items_stmt, {"ticket_id": ticket_id}).fetchall()

        items_list = []
        for item_row in items_results:
            final_name = item_row.clothing_name 
            if not final_name:
                final_name = item_row.custom_name or "Custom Item"

            items_list.append(
                TicketItemResponse(
                    id=item_row.id,
                    ticket_id=item_row.ticket_id,
                    clothing_type_id=item_row.clothing_type_id,
                    quantity=item_row.quantity,
                    starch_level=item_row.starch_level,
                    starch_charge=float(item_row.starch_charge or 0.0),
                    clothing_size=item_row.clothing_size,
                    size_charge=float(item_row.size_charge or 0.0),
                    crease=item_row.crease,
                    alterations=item_row.alterations,
                    item_instructions=item_row.item_instructions,
                    alteration_behavior=item_row.alteration_behavior,
                    item_total=float(item_row.item_total),
                    plant_price=float(item_row.plant_price),
                    margin=float(item_row.margin),
                    additional_charge=float(item_row.additional_charge or 0.0),
                    instruction_charge=float(item_row.instruction_charge or 0.0),
                    clothing_name=final_name,
                    pieces=item_row.pieces,
                    alteration_id=item_row.alteration_id,
                    alteration_name=item_row.alteration_name,
                    alteration_price=float(item_row.alteration_price or 0.0),
                )
            )

        # 3. Branding
        org_name_query = text("SELECT name FROM organizations WHERE id = :org_id")
        org_name_row = db.execute(org_name_query, {"org_id": org_id}).fetchone()
        org_name_val = org_name_row.name if org_name_row else "Your Cleaners"

        settings_query = text("SELECT receipt_header, receipt_footer FROM organization_settings WHERE organization_id = :org_id")
        settings_row = db.execute(settings_query, {"org_id": org_id}).fetchone()
        receipt_header_val = settings_row.receipt_header if settings_row else None
        receipt_footer_val = settings_row.receipt_footer if settings_row else None 

        return TicketResponse(
            id=ticket.id,
            ticket_number=ticket.ticket_number,
            customer_id=ticket.customer_id,
            customer_name=f"{ticket.first_name} {ticket.last_name or ''}".strip(),
            customer_phone=ticket.email,
            total_amount=float(ticket.total_amount),
            paid_amount=float(ticket.paid_amount),
            status=ticket.status,
            rack_number=ticket.rack_number,
            special_instructions=ticket.special_instructions,
            
            # ✅ Return Safe Dates
            pickup_date=p_date,
            created_at=c_at,
            
            items=items_list,
            organization_id=org_id,
            organization_name=org_name_val,
            receipt_header=receipt_header_val,
            receipt_footer=receipt_footer_val
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving ticket.")
    
    
# --- ADD THIS FUNCTION *AFTER* THE ONE ABOVE ---

@router.get("/find-tickets", response_model=List[TicketResponse], summary="Search for tickets by number, name, or phone")
async def find_tickets(
    query: str = Query(..., min_length=2, description="Search term for ticket #, customer name, or phone"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Searches for tickets within the user's organization.
    UPDATED: Returns 'is_void' and 'is_refunded' so the UI allows toggling them correctly.
    """
    
    organization_id = payload.get("organization_id")
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Organization ID missing."
        )
    
    search_pattern = f"%{query}%"
    
    try:
        # ---------------------------------------------------------
        # STEP 1: FETCH TICKETS (Includes is_void AND is_refunded)
        # ---------------------------------------------------------
        sql_tickets = text("""
            SELECT 
                t.id, 
                t.ticket_number, 
                t.status, 
                t.is_void,        -- ✅ REQUIRED for Void toggle
                t.is_refunded,    -- ✅ REQUIRED for Refund toggle
                t.created_at,
                t.total_amount,
                t.paid_amount,
                t.rack_number,
                t.special_instructions,
                t.pickup_date,
                t.organization_id,
                t.customer_id,
                u.first_name, 
                u.last_name, 
                u.phone,
                u.email
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
        
        ticket_rows = db.execute(sql_tickets, {
            "org_id": organization_id, 
            "pattern": search_pattern
        }).fetchall()

        if not ticket_rows:
            return []

        # ---------------------------------------------------------
        # STEP 2: FETCH ITEMS 
        # ---------------------------------------------------------
        ticket_ids = tuple([row.id for row in ticket_rows])
        items_map = {}
        
        if ticket_ids:
            sql_items = text("""
                SELECT 
                    ti.id,
                    ti.ticket_id,
                    ti.clothing_type_id,
                    ti.quantity,
                    ti.starch_level,
                    ti.crease,
                    ct.name as clothing_name 
                FROM ticket_items ti
                LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id IN :ticket_ids
            """)
            
            item_rows = db.execute(sql_items, {"ticket_ids": ticket_ids}).fetchall()
            
            for item in item_rows:
                tid = item.ticket_id
                if tid not in items_map:
                    items_map[tid] = []
                
                items_map[tid].append({
                    "id": item.id,
                    "ticket_id": item.ticket_id,
                    "clothing_type_id": item.clothing_type_id,
                    "quantity": item.quantity,
                    "starch_level": item.starch_level,
                    "crease": item.crease,
                    "clothing_name": item.clothing_name or "Unknown Item",
                    "price": 0.0,
                    "item_total": 0.0,
                    "plant_price": 0.0, 
                    "margin": 0.0
                })

        # ---------------------------------------------------------
        # STEP 3: BUILD RESPONSE
        # ---------------------------------------------------------
        results = []
        for row in ticket_rows:
            full_name = f"{row.first_name or ''} {row.last_name or ''}".strip()
            total = float(row.total_amount) if row.total_amount is not None else 0.0
            paid = float(row.paid_amount) if row.paid_amount is not None else 0.0

            results.append({
                "id": row.id,
                "ticket_number": row.ticket_number,
                "status": row.status,
                "is_void": row.is_void,          # ✅ MAPPED
                "is_refunded": row.is_refunded,  # ✅ MAPPED
                "created_at": row.created_at,
                "total_amount": total,
                "paid_amount": paid,
                "rack_number": row.rack_number,
                "special_instructions": row.special_instructions,
                "pickup_date": row.pickup_date,
                "organization_id": row.organization_id,
                "customer_id": row.customer_id,
                "customer_name": full_name, 
                "customer_phone": row.phone,
                "customer": {
                    "first_name": row.first_name,
                    "last_name": row.last_name,
                    "phone": row.phone,
                    "email": row.email
                },
                "items": items_map.get(row.id, [])
            })
                
        return results

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
    Returns address and deactivated status as requested.
    """
    
    # Allowed roles defined inside the route
    CUSTOMER_SEARCH_ALLOWED_ROLES = ["platform_admin", "store_owner", "cashier", "store_admin", "org_owner"]

    # 1. (SECURITY) Get user's role and organization ID
    user_role = payload.get("role")
    organization_id = payload.get("organization_id")

    # 2. (AUTHORIZATION) Check permissions
    if user_role not in CUSTOMER_SEARCH_ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to search for customers."
        )

    # 3. (SECURITY) Enforce organization boundaries
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: Organization ID is required."
        )

    # 4. Prepare the search query
    search_pattern = f"%{query}%"

    # Updated Query: Includes address, joined_at, and is_deactivated
    query_sql = text("""
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.phone,
            u.email,
            u.address,
            u.joined_at,       -- Updated column name based on your schema
            u.is_deactivated,  -- ✅ Added is_deactivated
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

    # 5. Execute and map results
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
                "address": row.address,              # ✅ Already present
                "is_deactivated": row.is_deactivated,# ✅ Added
                "joined_at": row.joined_at,          # ✅ Matches schema
                "last_visit_date": row.last_visit_date
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
        
@router.put("/customers/{customer_id}", response_model=CustomerResponse, summary="Update an existing customer")
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Updates an existing customer's details.
    Only allows updates if the customer belongs to the logged-in user's organization.
    """
    
    # 1. Get secure info from token
    organization_id = payload.get("organization_id")
    user_role = payload.get("role")

    # 2. Authorization Check
    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update customers."
        )

    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Organization ID missing."
        )

    # 3. Check if customer exists in this organization
    # We explicitly check 'role' to ensure we aren't accidentally editing an admin/staff member
    check_query = text("""
        SELECT id FROM allUsers 
        WHERE id = :id AND organization_id = :org_id AND role = 'customer'
    """)
    customer = db.execute(check_query, {"id": customer_id, "org_id": organization_id}).fetchone()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found in your organization."
        )

    try:
        # 4. Perform the Update
        # We sanitize the phone number here as well to be safe
        clean_phone = ''.join(filter(str.isdigit, data.phone))

        update_query = text("""
            UPDATE allUsers
            SET 
                first_name = :first_name,
                last_name = :last_name,
                email = :email,
                phone = :phone,
                address = :address
            WHERE id = :id AND organization_id = :org_id
            RETURNING id, first_name, last_name, email, phone, address, role, organization_id, joined_at
        """)

        updated_customer = db.execute(update_query, {
            "first_name": data.first_name,
            "last_name": data.last_name,
            "email": data.email.lower(),
            "phone": clean_phone,
            "address": data.address,
            "id": customer_id,
            "org_id": organization_id
        }).fetchone()

        db.commit()

        return dict(updated_customer._mapping)

    except IntegrityError as e:
        db.rollback()
        # Handle duplicate email or phone errors
        if "unique" in str(e).lower() and "email" in str(e).lower():
            raise HTTPException(status_code=409, detail="This email is already in use by another customer.")
        if "unique" in str(e).lower() and "phone" in str(e).lower():
            raise HTTPException(status_code=409, detail="This phone number is already in use.")
        raise HTTPException(status_code=500, detail="Database error during update.")
        
    except Exception as e:
        db.rollback()
        print(f"Error updating customer: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


# ============================================================
# FULL TICKET EDIT — replaces items & updates ticket header
# ============================================================

@router.put(
    "/tickets/{ticket_id}/full-edit",
    response_model=TicketResponse,
    summary="Fully replace items and update ticket details"
)
async def full_edit_ticket(
    ticket_id: int,
    data: FullTicketEditRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Allows a full re-edit of a ticket — identical to how a ticket is created:
    - Can change any item (starch, size, crease, alterations, custom items)
    - Can change customer, special instructions, pickup date, paid amount
    - Deletes old ticket_items and re-inserts the new set
    - Recalculates and saves the new total_amount
    - Returns the fully updated TicketResponse
    """
    ALLOWED_ROLES = ["cashier", "store_owner", "store_admin", "org_owner", "STORE_OWNER"]
    organization_id = payload.get("organization_id")
    user_role = payload.get("role")

    if user_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="You do not have permission to edit tickets.")

    if not organization_id:
        raise HTTPException(status_code=401, detail="Invalid token: Organization ID missing.")

    try:
        # 1. Verify ticket exists and belongs to this org
        ticket_row = db.execute(
            text("SELECT id, customer_id, paid_amount, pickup_date, special_instructions FROM tickets WHERE id = :tid AND organization_id = :oid"),
            {"tid": ticket_id, "oid": organization_id}
        ).fetchone()

        if not ticket_row:
            raise HTTPException(status_code=404, detail="Ticket not found in your organization.")

        # 2. Determine final field values (fall back to existing if not sent)
        final_customer_id  = data.customer_id        if data.customer_id        is not None else ticket_row.customer_id
        final_special_inst = data.special_instructions if data.special_instructions is not None else ticket_row.special_instructions
        final_paid         = decimal.Decimal(str(data.paid_amount)) if data.paid_amount is not None else decimal.Decimal(str(ticket_row.paid_amount or 0))

        # Pickup date: normalise to UTC-aware if provided
        if data.pickup_date is not None:
            final_pickup = data.pickup_date
            if final_pickup.tzinfo is None:
                final_pickup = final_pickup.replace(tzinfo=timezone.utc)
        else:
            final_pickup = ticket_row.pickup_date

        # 3. Pre-fetch clothing-type prices for standard items
        type_ids = [i.clothing_type_id for i in data.items if i.clothing_type_id is not None]
        type_prices: dict = {}
        if type_ids:
            rows = db.execute(
                text("SELECT id, name, plant_price, margin, total_price, pieces FROM clothing_types WHERE id IN :ids AND organization_id = :oid"),
                {"ids": tuple(type_ids), "oid": organization_id}
            ).fetchall()
            type_prices = {
                r.id: {
                    "name": r.name,
                    "plant_price": decimal.Decimal(str(r.plant_price)),
                    "margin":      decimal.Decimal(str(r.margin)),
                    "total_price": decimal.Decimal(str(r.total_price)),
                    "pieces":      r.pieces
                } for r in rows
            }

        # 4. Build new items list and recalculate total
        new_total      = decimal.Decimal("0.00")
        items_to_insert = []

        for item in data.items:
            qty = decimal.Decimal(str(item.quantity))

            if item.clothing_type_id is None:
                # Custom item — trust frontend prices
                plant_price = decimal.Decimal(str(item.unit_price or 0))
                margin      = decimal.Decimal(str(item.margin or 0))
                base_price  = plant_price + margin
                name        = item.custom_name or "Custom Item"
                pieces      = 1
            else:
                prices     = type_prices.get(item.clothing_type_id)
                if not prices:
                    raise HTTPException(status_code=400, detail=f"Clothing type {item.clothing_type_id} not found.")
                plant_price = prices["plant_price"]
                margin      = prices["margin"]
                base_price  = prices["total_price"]
                name        = prices["name"]
                pieces      = prices["pieces"]

            alt_charge   = decimal.Decimal(str(item.additional_charge or 0))
            inst_charge  = decimal.Decimal(str(item.instruction_charge or 0))
            starch_charge= decimal.Decimal(str(item.starch_charge or 0))
            size_charge  = decimal.Decimal(str(item.size_charge or 0))
            extras       = alt_charge + inst_charge + starch_charge + size_charge

            behavior = (item.alteration_behavior or "none").strip()
            if behavior == "alteration_only":
                item_total = extras
            else:
                item_total = (base_price * qty) + extras

            new_total += item_total

            items_to_insert.append({
                "ticket_id":          ticket_id,
                "clothing_type_id":   item.clothing_type_id,
                "custom_name":        name if item.clothing_type_id is None else None,
                "quantity":           item.quantity,
                "starch_level":       item.starch_level or "none",
                "starch_charge":      float(starch_charge),
                "clothing_size":      item.clothing_size or "standard",
                "size_charge":        float(size_charge),
                "crease":             item.crease or False,
                "alterations":        item.alterations,
                "item_instructions":  item.item_instructions,
                "additional_charge":  float(alt_charge),
                "instruction_charge": float(inst_charge),
                "alteration_behavior":behavior,
                "plant_price":        float(plant_price),
                "margin":             float(margin),
                "item_total":         float(item_total),
                "organization_id":    organization_id,
            })

        # 5. Delete old items
        db.execute(
            text("DELETE FROM ticket_items WHERE ticket_id = :tid AND organization_id = :oid"),
            {"tid": ticket_id, "oid": organization_id}
        )

        # 6. Insert new items
        db.execute(
            text("""
                INSERT INTO ticket_items (
                    ticket_id, clothing_type_id, custom_name, quantity,
                    starch_level, starch_charge,
                    clothing_size, size_charge,
                    crease, alterations, item_instructions,
                    additional_charge, instruction_charge,
                    alteration_behavior,
                    plant_price, margin, item_total,
                    organization_id
                ) VALUES (
                    :ticket_id, :clothing_type_id, :custom_name, :quantity,
                    :starch_level, :starch_charge,
                    :clothing_size, :size_charge,
                    :crease, :alterations, :item_instructions,
                    :additional_charge, :instruction_charge,
                    :alteration_behavior,
                    :plant_price, :margin, :item_total,
                    :organization_id
                )
            """),
            items_to_insert
        )

        # 7. Update the master ticket row
        db.execute(
            text("""
                UPDATE tickets SET
                    customer_id          = :customer_id,
                    total_amount         = :total_amount,
                    paid_amount          = :paid_amount,
                    special_instructions = :special_instructions,
                    pickup_date          = :pickup_date,
                    updated_at           = NOW()
                WHERE id = :ticket_id AND organization_id = :org_id
            """),
            {
                "customer_id":          final_customer_id,
                "total_amount":         new_total,
                "paid_amount":          final_paid,
                "special_instructions": final_special_inst,
                "pickup_date":          final_pickup,
                "ticket_id":            ticket_id,
                "org_id":               organization_id,
            }
        )

        db.commit()

        # 8. Return the full ticket response (reuses existing GET handler)
        return await get_ticket_details(ticket_id=ticket_id, db=db, payload=payload)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in full_edit_ticket {ticket_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update ticket: {str(e)}")
