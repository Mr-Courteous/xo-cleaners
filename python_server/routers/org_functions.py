import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
import decimal # ADDED: Import for handling DECIMAL types
from datetime import timedelta, datetime, timezone
from sqlalchemy.exc import IntegrityError
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



# --- HELPER FUNCTION: Calculate Loyalty Tenure ---
def calculate_tenure(joined_at: datetime) -> str:
    """
    Returns a human-readable string like '1 Year, 2 Months' 
    based on the time difference between now and joined_at.
    Returns 'Prospect' if joined_at is None.
    """
    if not joined_at:
        return "Prospect"
    
    # Ensure joined_at is timezone-aware for comparison (assuming UTC)
    if joined_at.tzinfo is None:
        joined_at = joined_at.replace(tzinfo=timezone.utc)
        
    now = datetime.now(timezone.utc)
    diff = relativedelta(now, joined_at)
    
    parts = []
    if diff.years > 0:
        parts.append(f"{diff.years} Year{'s' if diff.years > 1 else ''}")
    if diff.months > 0:
        parts.append(f"{diff.months} Month{'s' if diff.months > 1 else ''}")
        
    # If less than a month, show days
    if diff.years == 0 and diff.months == 0:
        days = diff.days
        if days == 0:
            return "Joined Today"
        parts.append(f"{days} Day{'s' if days > 1 else ''}")
        
    return ", ".join(parts[:2]) # Return max 2 units (e.g. "1 Year, 2 Months")


 
class NewCustomerRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    address: Optional[str] = None
    password: str

router = APIRouter(prefix="/api/organizations", tags=["Organization Resources"])


@router.get("/racks", summary="Get all racks for *your* organization")
async def get_racks_for_organization(
    db: Session = Depends(get_db),
    # 1. Get the secure payload from the user's token
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns all racks belonging to the logged-in staff member's organization (using raw SQL).
    """
    try:
        # 2. Get organization_id AND role from the trusted token
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 3. ADDED: Role-based authorization check
        # (Based on your other routes, customers should not access this)
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        query = text("""
            SELECT id, number, is_occupied, ticket_id, updated_at, organization_id
            FROM racks
            WHERE organization_id = :organization_id
            ORDER BY number ASC
        """)
        
        # 4. Use the secure organization_id from the token
        racks = db.execute(query, {"organization_id": organization_id}).fetchall()

        if not racks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No racks found for your organization"
            )

        # Convert SQLAlchemy Row objects to dictionaries
        racks_list = [dict(row._mapping) for row in racks]

        return {
            "organization_id": organization_id,
            "total_racks": len(racks_list),
            "racks": racks_list
        }

    except HTTPException:
        # Re-raise HTTPExceptions directly
        raise
    except Exception as e:
        print(f"Error fetching racks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving racks for organization."
        )
        

from fastapi import APIRouter, HTTPException, Depends, status, Request # <--- 1. Import Request
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.common import get_db, get_current_user_payload

# ... existing router definition ...

@router.get("/clothing-types", summary="Get all clothing types for *your* organization")
async def get_clothing_types_for_organization(
    request: Request,  # <--- 2. Add Request parameter here
    db: Session = Depends(get_db), 
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns clothing types with FULL image URLs (http://localhost:8001/...)
    while maintaining the dictionary response format.
    """
    try:
        # --- Auth Checks ---
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")

        if not organization_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # --- Fetch Data ---
        query = text("""
            SELECT id, name, plant_price, margin, total_price, image_url, organization_id, created_at, pieces
            FROM clothing_types
            WHERE organization_id = :organization_id
            ORDER BY name ASC
        """)
        results = db.execute(query, {"organization_id": organization_id}).fetchall()

        if not results:
             return {"organization_id": organization_id, "count": 0, "clothing_types": []}

        # --- 3. URL Construction Logic ---
        # Get base URL (e.g. "http://localhost:8001") and strip trailing slash
        base_url = str(request.base_url).rstrip("/")

        # Clean list comprehension to map rows and fix URLs
        clothing_list = [
            {
                **dict(row._mapping),
                # Logic: If image exists & isn't already http, prepend base_url + /
                "image_url": (
                    f"{base_url}/{row.image_url.lstrip('/')}" 
                    if row.image_url and not row.image_url.startswith("http") 
                    else row.image_url
                )
            }
            for row in results
        ]

        return {
            "organization_id": organization_id,
            "count": len(clothing_list),
            "clothing_types": clothing_list
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching clothing types: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        

@router.get("/customers", response_model=List[CustomerResponse], summary="Get all customers for organization")
def get_customers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves all customers for the logged-in user's organization.
    Includes 'joined_at' date and calculated 'tenure'.
    """
    org_id = payload.get("organization_id")
    
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID missing.")

    # Base query
    query_str = """
        SELECT id, first_name, last_name, email, phone, address, role, organization_id, joined_at 
        FROM allUsers 
        WHERE organization_id = :org_id AND role = 'customer'
    """
    
    params = {"org_id": org_id}

    # Add search filter if provided
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
            # --- CALCULATE TENURE HERE ---
            tenure_str = calculate_tenure(row.joined_at)
            
            response.append(CustomerResponse(
                id=row.id,
                first_name=row.first_name,
                last_name=row.last_name,
                email=row.email,
                phone=row.phone or "",
                address=row.address,
                role=row.role,
                organization_id=row.organization_id,
                
                # --- NEW FIELDS MAPPED ---
                joined_at=row.joined_at, 
                tenure=tenure_str
            ))
            
        return response

    except Exception as e:
        print(f"Error fetching customers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch customers.")
        
        
# ✅ CHANGED to @router.post to match the frontend
@router.post("/register-customer", summary="Create a new customer for the organization")
async def register_customer(
    data: NewCustomerRequest, # ✅ This is the request body
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload) # ✅ This is the token data
):
    """
    Creates a new customer within the logged-in user's organization.
    """
    
    # 1. SECURELY get info from the logged-in user's TOKEN
    admin_role = payload.get("role")
    organization_id = payload.get("organization_id")

    # 2. Authorization: Check if the logged-in user has permission
    # (e.g., a customer can't create another customer)
    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
    if admin_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create a new customer."
        )

    # 3. SECURELY assign the new user to the token's organization
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user token: Missing organization ID."
        )

    # 4. Hash the password and set the new user's role
    hashed_password = hash_password(data.password)
    new_customer_role = "customer" # We securely set the role on the backend

    try:
        # 5. Create the new user in the database
        insert_stmt = text("""
            INSERT INTO allUsers 
                (email, first_name, last_name, address, password_hash, role, organization_id)
            VALUES 
                (:email, :first_name, :last_name, :address, :password_hash, :role, :org_id)
            RETURNING id, email, first_name, last_name, role, organization_id, address
        """)
        
        new_user = db.execute(insert_stmt, {
            "email": data.email.lower(),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "address": data.address,
            "password_hash": hashed_password,
            "role": new_customer_role,
            "org_id": organization_id # ✅ We use the secure organization_id from the token
        }).fetchone()
        
        db.commit()

        # Return the newly created customer
        return dict(new_user._mapping)

    except Exception as e:
        db.rollback()
        if "unique constraint" in str(e).lower():
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A user with the email {data.email} already exists."
            )
        print("Error creating customer:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create new customer."
        )
        
        
        
# TICKET ROUTES



# @router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
# def create_ticket(
#     ticket_data: TicketCreate,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload) 
# ):
# # --- END OF FIX ---
#     """Creates a new ticket, saving all item details and financial data."""
    
#     try:
#         # 3. GET SECURE DATA FROM TOKEN:
#         organization_id = payload.get("organization_id")
#         user_email = payload.get("sub")
        
#         if not organization_id:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token: Organization ID missing."
#             )
            
#         print(f"User {user_email} (Org: {organization_id}) is creating a new ticket.")
        
#         # 1. Check customer existence (NOW FILTERED BY ORG)
#         customer_query = text("""
#             SELECT id, first_name, last_name, email  
#             FROM allUsers 
#             WHERE id = :id AND organization_id = :org_id AND role = 'customer'
#         """)
#         customer = db.execute(customer_query, {
#             "id": ticket_data.customer_id, 
#             "org_id": organization_id
#         }).fetchone()
        
#         if not customer:
#             raise HTTPException(status_code=404, detail=f"Customer not found in your organization.")

#         # 2. Fetch prices (NOW FILTERED BY ORG)
#         total_amount = decimal.Decimal('0.00')
#         ticket_items_to_insert = []
#         type_ids = [item.clothing_type_id for item in ticket_data.items]
        
#         if not type_ids:
#                 raise HTTPException(status_code=400, detail="No items provided for the ticket.")
        
#         types_query = text("""
#             SELECT id, name, plant_price, margin, total_price, pieces 
#             FROM clothing_types 
#             WHERE id IN :ids AND organization_id = :org_id
#         """)
#         types_result = db.execute(types_query, {
#             "ids": tuple(type_ids),
#             "org_id": organization_id
#         }).fetchall()

#         type_prices = {
#             row[0]: {
#                 "name": row[1], 
#                 "plant_price": decimal.Decimal(str(row[2])),
#                 "margin": decimal.Decimal(str(row[3])),
#                 "total_price": decimal.Decimal(str(row[4])),
#                 "pieces": row[5]  # <-- ADD THIS LINE
#             } for row in types_result
#         }
        
#         # 3. Calculate total_amount and prepare items
#         for item_create in ticket_data.items:
#             prices = type_prices.get(item_create.clothing_type_id)
            
#             if prices is None:
#                 raise HTTPException(
#                     status_code=400, 
#                     detail=f"Invalid item: Clothing type ID {item_create.clothing_type_id} not found in your organization."
#                 )

#             item_total_price = prices["total_price"] * item_create.quantity
#             total_amount += item_total_price

#             ticket_items_to_insert.append({
#                 "clothing_type_id": item_create.clothing_type_id,
#                 "quantity": item_create.quantity,
#                 "starch_level": item_create.starch_level,
#                 "crease": item_create.crease,
#                 "plant_price": prices["plant_price"],
#                 "margin": prices["margin"],
#                 "item_total": item_total_price,
#                 "organization_id": organization_id
#             })

#         # 4. DYNAMIC TICKET NUMBER (WITH 'FOR UPDATE' LOCK)
#         date_prefix = datetime.now().strftime("%y%m%d")
        
#         # Safely compute next ticket sequence for the day.
#         # Use a retry loop to handle race conditions where another process inserts
#         # the same ticket_number between selecting the latest and inserting.
#         def _fetch_latest_sequence():
#             # NOTE: ticket_number has a global UNIQUE constraint, so we must
#             # check across the whole table (not just this org) to avoid
#             # generating a value that already exists for another org.
#             latest_ticket_query = text("""
#                 SELECT ticket_number FROM tickets
#                 WHERE ticket_number LIKE :prefix_like
#                 ORDER BY ticket_number DESC
#                 LIMIT 1
#             """)
#             row = db.execute(latest_ticket_query, {
#                 "prefix_like": f"{date_prefix}-%",
#             }).fetchone()
#             if not row:
#                 return 0
#             try:
#                 return int(row[0].split('-')[-1])
#             except Exception:
#                 return 0

#         # Prepare some ticket fields used during insert
#         rack_number_val = ticket_data.rack_number
#         instructions_val = ticket_data.special_instructions
#         paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount))
#         pickup_date_val = ticket_data.pickup_date

#         max_retries = 20
#         attempt = 0
#         new_sequence = None
#         ticket_number = None
#         ticket_result = None  # initialize to avoid UnboundLocalError if loop never assigns
#         while attempt < max_retries:
#             attempt += 1
#             last_seq = _fetch_latest_sequence()
#             print(f"[tickets] attempt={attempt} organization={organization_id} last_seq={last_seq}")
#             new_sequence = last_seq + 1
#             ticket_number = f"{date_prefix}-{new_sequence:03d}"

#             # Try inserting; if unique constraint fails, retry with next sequence
#             try:
#                 print(f"[tickets] trying insert ticket_number={ticket_number} (attempt {attempt})")
#                 ticket_insert_query = text("""
#                     INSERT INTO tickets (
#                         ticket_number, customer_id, total_amount, rack_number, 
#                         special_instructions, paid_amount, pickup_date, 
#                         organization_id
#                     )
#                     VALUES (
#                         :ticket_number, :customer_id, :total_amount, :rack_number, 
#                         :special_instructions, :paid_amount, :pickup_date, 
#                         :org_id
#                     )
#                     RETURNING id, created_at, status
#                 """)

#                 ticket_result = db.execute(ticket_insert_query, {
#                     "ticket_number": ticket_number,
#                     "customer_id": ticket_data.customer_id,
#                     "total_amount": total_amount,
#                     "rack_number": rack_number_val,
#                     "special_instructions": instructions_val,
#                     "paid_amount": paid_amount_val,
#                     "pickup_date": pickup_date_val,
#                     "org_id": organization_id
#                 }).fetchone()

#                 # If insert succeeded, break out of retry loop
#                 if ticket_result is not None:
#                     break

#             except IntegrityError as ie:
#                 # Duplicate ticket_number or other integrity issue; retry sequence
#                 db.rollback()
#                 print(f"[tickets] IntegrityError on attempt={attempt} ticket_number={ticket_number}: {ie}")
#                 # If it's specifically a unique violation on ticket_number, retry
#                 # Otherwise re-raise so we don't mask other integrity problems
#                 lower = str(ie).lower()
#                 if 'unique' in lower and ('ticket_number' in lower or 'tickets_ticket_number' in lower):
#                     # continue to next attempt
#                     continue
#                 else:
#                     print(f"[tickets] Non-ticket-number IntegrityError, re-raising: {ie}")
#                     raise
#             except Exception as e:
#                 # Any unexpected exception during insert should be logged and raised
#                 db.rollback()
#                 print(f"[tickets] Unexpected error during insert attempt={attempt} ticket_number={ticket_number}: {e}")
#                 raise

#         # If after retries we still don't have a ticket_result, error out
#         if ticket_result is None:
#             db.rollback()
#             raise HTTPException(status_code=500, detail="Failed to generate a unique ticket number after multiple attempts.")
        
#         rack_number_val = ticket_data.rack_number
#         instructions_val = ticket_data.special_instructions
#         paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount))
#         pickup_date_val = ticket_data.pickup_date

#         ticket_id = ticket_result[0]
#         created_at = ticket_result[1]
#         status_val = ticket_result[2]

#         # 6. Insert Ticket Items (Batch insertion)
#         item_rows = []
#         for item in ticket_items_to_insert:
#             item["ticket_id"] = ticket_id
#             if "organization_id" not in item:
#                 item["organization_id"] = organization_id
#             item_rows.append(item)

#         item_insert_query = text("""
#             INSERT INTO ticket_items (
#                 ticket_id, clothing_type_id, quantity, starch_level, crease, plant_price, margin, item_total, organization_id
#             )
#             VALUES (
#                 :ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, :plant_price, :margin, :item_total, :organization_id
#             )
#             RETURNING id
#         """)
#         db.execute(item_insert_query, item_rows)
        
#         # 7. Commit transaction
#         db.commit()

#         # 8. Build the complete response object
#         response_items = []
#         for i, item in enumerate(ticket_items_to_insert, 1):
#             clothing_type_id = item['clothing_type_id']
#             clothing_name = type_prices[clothing_type_id]['name']

#             response_items.append(
#                 TicketItemResponse(
#                     id=i, 
#                     ticket_id=ticket_id,
#                     clothing_type_id=clothing_type_id,
#                     clothing_name=clothing_name,
#                     quantity=item['quantity'],
#                     starch_level=item['starch_level'],
#                     crease=item['crease'],
#                     item_total=float(item['item_total']),
#                     plant_price=float(item['plant_price']),
#                     margin=float(item['margin']),
#                     additional_charge=0.0,
#                     pieces=type_prices[clothing_type_id]['pieces']  # <-- ADD THIS LINE
#                 )
#             )

#         customer_name = f"{customer.first_name} {customer.last_name}"

#         return TicketResponse(
#             id=ticket_id,
#             ticket_number=ticket_number,
#             customer_id=ticket_data.customer_id,
#             customer_name=customer_name,
#             customer_phone=customer.email, 
#             total_amount=float(total_amount),
#             paid_amount=float(paid_amount_val), 
#             status=status_val,
#             rack_number=rack_number_val,
#             special_instructions=instructions_val,
#             pickup_date=pickup_date_val,
#             created_at=created_at,
#             items=response_items,
#             organization_id=organization_id 
#         )

#     except HTTPException:
#         db.rollback()
#         raise
#     except Exception as e:
#         db.rollback()
#         print(f"Error during ticket creation: {e}")
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during ticket processing.")




# @router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
# def create_ticket(
#     ticket_data: TicketCreate,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload) 
# ):
#     """Creates a new ticket, saving all item details (including alterations) and financial data."""
    
#     try:
#         # 3. GET SECURE DATA FROM TOKEN:
#         organization_id = payload.get("organization_id")
#         user_email = payload.get("sub")
        
#         if not organization_id:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token: Organization ID missing."
#             )
            
#         print(f"User {user_email} (Org: {organization_id}) is creating a new ticket.")
        
#         # 1. Check customer existence (NOW FILTERED BY ORG)
#         customer_query = text("""
#             SELECT id, first_name, last_name, email  
#             FROM allUsers 
#             WHERE id = :id AND organization_id = :org_id AND role = 'customer'
#         """)
#         customer = db.execute(customer_query, {
#             "id": ticket_data.customer_id, 
#             "org_id": organization_id
#         }).fetchone()
        
#         if not customer:
#             raise HTTPException(status_code=404, detail=f"Customer not found in your organization.")

#         # 2. Fetch prices (NOW FILTERED BY ORG)
#         total_amount = decimal.Decimal('0.00')
#         ticket_items_to_insert = []
#         type_ids = [item.clothing_type_id for item in ticket_data.items]
        
#         if not type_ids:
#                 raise HTTPException(status_code=400, detail="No items provided for the ticket.")
        
#         types_query = text("""
#             SELECT id, name, plant_price, margin, total_price, pieces 
#             FROM clothing_types 
#             WHERE id IN :ids AND organization_id = :org_id
#         """)
#         types_result = db.execute(types_query, {
#             "ids": tuple(type_ids),
#             "org_id": organization_id
#         }).fetchall()

#         type_prices = {
#             row[0]: {
#                 "name": row[1], 
#                 "plant_price": decimal.Decimal(str(row[2])),
#                 "margin": decimal.Decimal(str(row[3])),
#                 "total_price": decimal.Decimal(str(row[4])),
#                 "pieces": row[5]
#             } for row in types_result
#         }
        
#         # 3. Calculate total_amount and prepare items
#         for item_create in ticket_data.items:
#             prices = type_prices.get(item_create.clothing_type_id)
            
#             if prices is None:
#                 raise HTTPException(
#                     status_code=400, 
#                     detail=f"Invalid item: Clothing type ID {item_create.clothing_type_id} not found in your organization."
#                 )

#             item_total_price = prices["total_price"] * item_create.quantity
#             total_amount += item_total_price

#             # Prepare the item dictionary for batch insert
#             ticket_items_to_insert.append({
#                 "clothing_type_id": item_create.clothing_type_id,
#                 "quantity": item_create.quantity,
#                 "starch_level": item_create.starch_level,
#                 "crease": item_create.crease,
#                 "alterations": item_create.alterations, # <--- CHANGED: Added Alterations field
#                 "item_instructions": item_create.item_instructions, # <--- MAP THIS
#                 "plant_price": prices["plant_price"],
#                 "margin": prices["margin"],
#                 "item_total": item_total_price,
#                 "organization_id": organization_id
#             })

#         # 4. DYNAMIC TICKET NUMBER (WITH 'FOR UPDATE' LOCK)
#         date_prefix = datetime.now().strftime("%y%m%d")
        
#         def _fetch_latest_sequence():
#             latest_ticket_query = text("""
#                 SELECT ticket_number FROM tickets
#                 WHERE ticket_number LIKE :prefix_like
#                 ORDER BY ticket_number DESC
#                 LIMIT 1
#             """)
#             row = db.execute(latest_ticket_query, {
#                 "prefix_like": f"{date_prefix}-%",
#             }).fetchone()
#             if not row:
#                 return 0
#             try:
#                 return int(row[0].split('-')[-1])
#             except Exception:
#                 return 0

#         rack_number_val = ticket_data.rack_number
#         instructions_val = ticket_data.special_instructions
#         paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount))
#         pickup_date_val = ticket_data.pickup_date

#         max_retries = 20
#         attempt = 0
#         ticket_result = None
        
#         while attempt < max_retries:
#             attempt += 1
#             last_seq = _fetch_latest_sequence()
#             new_sequence = last_seq + 1
#             ticket_number = f"{date_prefix}-{new_sequence:03d}"

#             try:
#                 ticket_insert_query = text("""
#                     INSERT INTO tickets (
#                         ticket_number, customer_id, total_amount, rack_number, 
#                         special_instructions, paid_amount, pickup_date, 
#                         organization_id
#                     )
#                     VALUES (
#                         :ticket_number, :customer_id, :total_amount, :rack_number, 
#                         :special_instructions, :paid_amount, :pickup_date, 
#                         :org_id
#                     )
#                     RETURNING id, created_at, status
#                 """)

#                 ticket_result = db.execute(ticket_insert_query, {
#                     "ticket_number": ticket_number,
#                     "customer_id": ticket_data.customer_id,
#                     "total_amount": total_amount,
#                     "rack_number": rack_number_val,
#                     "special_instructions": instructions_val,
#                     "paid_amount": paid_amount_val,
#                     "pickup_date": pickup_date_val,
#                     "org_id": organization_id
#                 }).fetchone()

#                 if ticket_result is not None:
#                     break

#             except IntegrityError as ie:
#                 db.rollback()
#                 lower = str(ie).lower()
#                 if 'unique' in lower and ('ticket_number' in lower or 'tickets_ticket_number' in lower):
#                     continue
#                 else:
#                     raise
#             except Exception:
#                 db.rollback()
#                 raise

#         if ticket_result is None:
#             db.rollback()
#             raise HTTPException(status_code=500, detail="Failed to generate a unique ticket number.")
        
#         ticket_id = ticket_result[0]
#         created_at = ticket_result[1]
#         status_val = ticket_result[2]

#         # 6. Insert Ticket Items (Batch insertion)
#         item_rows = []
#         for item in ticket_items_to_insert:
#             item["ticket_id"] = ticket_id
#             if "organization_id" not in item:
#                 item["organization_id"] = organization_id
#             item_rows.append(item)

#         # <--- CHANGED: SQL Query now includes alterations
#         item_insert_query = text("""
#             INSERT INTO ticket_items (
#                 ticket_id, clothing_type_id, quantity, starch_level, crease, alterations, item_instructions, plant_price, margin, item_total, organization_id
#             )
#             VALUES (
#                 :ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, :alterations, :item_instructions, :plant_price, :margin, :item_total, :organization_id
#             )
#             RETURNING id
#         """)
#         db.execute(item_insert_query, item_rows)
        
#         # 7. Commit transaction
#         db.commit()

#         # 8. Build the complete response object
#         response_items = []
#         for i, item in enumerate(ticket_items_to_insert, 1):
#             clothing_type_id = item['clothing_type_id']
#             clothing_name = type_prices[clothing_type_id]['name']

#             response_items.append(
#                 TicketItemResponse(
#                     id=i, 
#                     ticket_id=ticket_id,
#                     clothing_type_id=clothing_type_id,
#                     clothing_name=clothing_name,
#                     quantity=item['quantity'],
#                     starch_level=item['starch_level'],
#                     crease=item['crease'],
#                     alterations=item['alterations'], # <--- CHANGED: Return alterations in response
#                     item_instructions=item['item_instructions'], # <--- RETURN IT
#                     item_total=float(item['item_total']),
#                     plant_price=float(item['plant_price']),
#                     margin=float(item['margin']),
#                     additional_charge=0.0,
#                     pieces=type_prices[clothing_type_id]['pieces']
#                 )
#             )

#         customer_name = f"{customer.first_name} {customer.last_name}"

#         return TicketResponse(
#             id=ticket_id,
#             ticket_number=ticket_number,
#             customer_id=ticket_data.customer_id,
#             customer_name=customer_name,
#             customer_phone=customer.email, 
#             total_amount=float(total_amount),
#             paid_amount=float(paid_amount_val), 
#             status=status_val,
#             rack_number=rack_number_val,
#             special_instructions=instructions_val,
#             pickup_date=pickup_date_val,
#             created_at=created_at,
#             items=response_items,
#             organization_id=organization_id 
#         )

#     except HTTPException:
#         db.rollback()
#         raise
#     except Exception as e:
#         db.rollback()
#         print(f"Error during ticket creation: {e}")
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during ticket processing.")

@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload) 
):
    """Creates a new ticket, saving all item details and activating loyalty if needed."""
    
    try:
        # 3. GET SECURE DATA FROM TOKEN:
        organization_id = payload.get("organization_id")
        user_email = payload.get("sub")
        
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )
            
        print(f"User {user_email} (Org: {organization_id}) is creating a new ticket.")
        
        # 1. Check customer existence AND fetch joined_at status
        customer_query = text("""
            SELECT id, first_name, last_name, email, joined_at  -- <--- UPDATED: Added joined_at
            FROM allUsers 
            WHERE id = :id AND organization_id = :org_id AND role = 'customer'
        """)
        customer = db.execute(customer_query, {
            "id": ticket_data.customer_id, 
            "org_id": organization_id
        }).fetchone()
        
        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer not found in your organization.")

        # --- LOYALTY TRIGGER: Activate Customer on First Ticket ---
        if customer.joined_at is None:
            # They are currently a "Prospect". This ticket makes them a "Member".
            activate_query = text("UPDATE allUsers SET joined_at = :now WHERE id = :id")
            db.execute(activate_query, {
                "now": datetime.now(timezone.utc), # <--- Sets the "Member Since" date
                "id": ticket_data.customer_id
            })
            # This update will be committed automatically at the end of this function (db.commit)
        # ----------------------------------------------------------

        # 2. Fetch prices (NOW FILTERED BY ORG)
        total_amount = decimal.Decimal('0.00')
        ticket_items_to_insert = []
        type_ids = [item.clothing_type_id for item in ticket_data.items]
        
        if not type_ids:
                raise HTTPException(status_code=400, detail="No items provided for the ticket.")
        
        types_query = text("""
            SELECT id, name, plant_price, margin, total_price, pieces 
            FROM clothing_types 
            WHERE id IN :ids AND organization_id = :org_id
        """)
        types_result = db.execute(types_query, {
            "ids": tuple(type_ids),
            "org_id": organization_id
        }).fetchall()

        type_prices = {
            row[0]: {
                "name": row[1], 
                "plant_price": decimal.Decimal(str(row[2])),
                "margin": decimal.Decimal(str(row[3])),
                "total_price": decimal.Decimal(str(row[4])),
                "pieces": row[5]
            } for row in types_result
        }
        
        # 3. Calculate total_amount and prepare items
        for item_create in ticket_data.items:
            prices = type_prices.get(item_create.clothing_type_id)
            
            if prices is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid item: Clothing type ID {item_create.clothing_type_id} not found in your organization."
                )

            # --- CALCULATE ITEM PRICE BASED ON ALTERATION BEHAVIOR ---
            # (Assuming you implemented the alteration logic discussed previously)
            base_wash_price = prices["total_price"]
            quantity = decimal.Decimal(str(item_create.quantity))
            extra_charge = decimal.Decimal(str(item_create.additional_charge or 0.0))
            
            # Logic: If 'alteration_only', price is just the extra charge. Otherwise base + extra.
            behavior = getattr(item_create, 'alteration_behavior', 'none') # Safe getter
            
            if behavior == 'alteration_only':
                item_total_price = extra_charge
            elif behavior == 'wash_and_alteration':
                item_total_price = (base_wash_price * quantity) + extra_charge
            else:
                item_total_price = (base_wash_price * quantity) + extra_charge
            
            total_amount += item_total_price

            # Prepare the item dictionary for batch insert
            ticket_items_to_insert.append({
                "clothing_type_id": item_create.clothing_type_id,
                "quantity": item_create.quantity,
                "starch_level": item_create.starch_level,
                "crease": item_create.crease,
                "alterations": item_create.alterations,
                "item_instructions": item_create.item_instructions,
                
                # Ensure we save the behavior
                "alteration_behavior": behavior, 
                "additional_charge": float(extra_charge), # Make sure to save the price!

                "plant_price": prices["plant_price"],
                "margin": prices["margin"],
                "item_total": item_total_price,
                "organization_id": organization_id
            })

        # 4. DYNAMIC TICKET NUMBER
        date_prefix = datetime.now().strftime("%y%m%d")
        
        def _fetch_latest_sequence():
            latest_ticket_query = text("""
                SELECT ticket_number FROM tickets
                WHERE ticket_number LIKE :prefix_like
                ORDER BY ticket_number DESC
                LIMIT 1
            """)
            row = db.execute(latest_ticket_query, {
                "prefix_like": f"{date_prefix}-%",
            }).fetchone()
            if not row:
                return 0
            try:
                return int(row[0].split('-')[-1])
            except Exception:
                return 0

        rack_number_val = ticket_data.rack_number
        instructions_val = ticket_data.special_instructions
        paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount))
        pickup_date_val = ticket_data.pickup_date

        max_retries = 20
        attempt = 0
        ticket_result = None
        
        while attempt < max_retries:
            attempt += 1
            last_seq = _fetch_latest_sequence()
            new_sequence = last_seq + 1
            ticket_number = f"{date_prefix}-{new_sequence:03d}"

            try:
                ticket_insert_query = text("""
                    INSERT INTO tickets (
                        ticket_number, customer_id, total_amount, rack_number, 
                        special_instructions, paid_amount, pickup_date, 
                        organization_id
                    )
                    VALUES (
                        :ticket_number, :customer_id, :total_amount, :rack_number, 
                        :special_instructions, :paid_amount, :pickup_date, 
                        :org_id
                    )
                    RETURNING id, created_at, status
                """)

                ticket_result = db.execute(ticket_insert_query, {
                    "ticket_number": ticket_number,
                    "customer_id": ticket_data.customer_id,
                    "total_amount": total_amount,
                    "rack_number": rack_number_val,
                    "special_instructions": instructions_val,
                    "paid_amount": paid_amount_val,
                    "pickup_date": pickup_date_val,
                    "org_id": organization_id
                }).fetchone()

                if ticket_result is not None:
                    break

            except IntegrityError as ie:
                db.rollback()
                lower = str(ie).lower()
                if 'unique' in lower and ('ticket_number' in lower or 'tickets_ticket_number' in lower):
                    continue
                else:
                    raise
            except Exception:
                db.rollback()
                raise

        if ticket_result is None:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to generate a unique ticket number.")
        
        ticket_id = ticket_result[0]
        created_at = ticket_result[1]
        status_val = ticket_result[2]

        # 6. Insert Ticket Items (Batch insertion)
        item_rows = []
        for item in ticket_items_to_insert:
            item["ticket_id"] = ticket_id
            if "organization_id" not in item:
                item["organization_id"] = organization_id
            item_rows.append(item)

        item_insert_query = text("""
            INSERT INTO ticket_items (
                ticket_id, clothing_type_id, quantity, starch_level, crease, 
                alterations, item_instructions, alteration_behavior, additional_charge, -- <--- Columns
                plant_price, margin, item_total, organization_id
            )
            VALUES (
                :ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, 
                :alterations, :item_instructions, :alteration_behavior, :additional_charge, -- <--- Values
                :plant_price, :margin, :item_total, :organization_id
            )
            RETURNING id
        """)
        db.execute(item_insert_query, item_rows)
        
        # 7. Commit transaction (This saves the ticket AND the new joined_at date if triggered)
        db.commit()

        # 8. Build the complete response object
        response_items = []
        for i, item in enumerate(ticket_items_to_insert, 1):
            clothing_type_id = item['clothing_type_id']
            clothing_name = type_prices[clothing_type_id]['name']

            response_items.append(
                TicketItemResponse(
                    id=i, 
                    ticket_id=ticket_id,
                    clothing_type_id=clothing_type_id,
                    clothing_name=clothing_name,
                    quantity=item['quantity'],
                    starch_level=item['starch_level'],
                    crease=item['crease'],
                    alterations=item['alterations'],
                    item_instructions=item['item_instructions'],
                    alteration_behavior=item['alteration_behavior'], # <--- Returned
                    item_total=float(item['item_total']),
                    plant_price=float(item['plant_price']),
                    margin=float(item['margin']),
                    additional_charge=item['additional_charge'],
                    pieces=type_prices[clothing_type_id]['pieces']
                )
            )

        customer_name = f"{customer.first_name} {customer.last_name}"

        return TicketResponse(
            id=ticket_id,
            ticket_number=ticket_number,
            customer_id=ticket_data.customer_id,
            customer_name=customer_name,
            customer_phone=customer.email, 
            total_amount=float(total_amount),
            paid_amount=float(paid_amount_val), 
            status=status_val,
            rack_number=rack_number_val,
            special_instructions=instructions_val,
            pickup_date=pickup_date_val,
            created_at=created_at,
            items=response_items,
            organization_id=organization_id 
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during ticket creation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during ticket processing.")



@router.get("/tickets", response_model=List[TicketSummaryResponse], summary="Get all tickets for *your* organization")
async def get_tickets_for_organization(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns a list of all tickets for the logged-in staff member's organization.
    This route returns ticket summaries; for full item details, use the /tickets/{ticket_id} endpoint.
    """
    try:
        # 1. Get organization_id AND role from the trusted token
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 2. Role-based authorization check
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )

        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 3. Query for tickets, joining with allUsers to get customer name
        query = text("""
            SELECT 
                t.id, 
                t.ticket_number, 
                t.customer_id, 
                u.first_name, 
                u.last_name, 
                u.email, -- Using as customer_phone
                t.total_amount, 
                t.paid_amount, 
                t.status, 
                t.rack_number, 
                t.special_instructions, 
                t.pickup_date, 
                t.created_at, 
                t.organization_id
            FROM tickets AS t
            JOIN allUsers AS u ON t.customer_id = u.id
            WHERE t.organization_id = :org_id
            ORDER BY t.created_at DESC
        """)
        
        tickets_result = db.execute(query, {"org_id": organization_id}).fetchall()

        if not tickets_result:
            return [] # Return an empty list, not a 404

        # 4. Format the response
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
                    
                    # --- THIS IS THE FIX ---
                    # Convert the int to a string, or keep it None if it's null
                    rack_number=str(row.rack_number) if row.rack_number is not None else None,
                    
                    special_instructions=row.special_instructions,
                    pickup_date=row.pickup_date,
                    created_at=row.created_at,
                    organization_id=row.organization_id
                )
            )

        return response_list

    except HTTPException:
        # Re-raise HTTPExceptions directly
        raise
    except Exception as e:
        print(f"Error fetching tickets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving tickets for organization."
        )        
        
# @router.get(
#     "/tickets/{ticket_id}", 
#     response_model=TicketResponse, 
#     summary="Get full details for a single ticket"
# )
# async def get_ticket_by_id(
#     ticket_id: int,
#     db: Session = Depends(get_db),
#     payload: Dict[str, Any] = Depends(get_current_user_payload)
# ):
#     """
#     Returns the complete details for a single ticket, including all items,
#     if it belongs to the logged-in user's organization.
#     """
#     try:
#         organization_id = payload.get("organization_id")
#         user_role = payload.get("role")

#         # Authorization check
#         allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
#         if user_role not in allowed_roles:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You do not have permission to access this resource."
#             )
#         if not organization_id:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid token: Organization ID missing."
#             )

#         # Query for the main ticket
#         ticket_query = text("""
#             SELECT 
#                 t.id, t.ticket_number, t.customer_id, t.total_amount, 
#                 t.paid_amount, t.status, t.rack_number, t.special_instructions, 
#                 t.pickup_date, t.created_at, t.organization_id,
#                 u.first_name, u.last_name, u.email AS customer_phone
#             FROM tickets AS t
#             JOIN allUsers AS u ON t.customer_id = u.id
#             WHERE t.id = :ticket_id AND t.organization_id = :org_id
#         """)
#         ticket_result = db.execute(ticket_query, {
#             "ticket_id": ticket_id,
#             "org_id": organization_id
#         }).fetchone()

#         if not ticket_result:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Ticket not found in your organization."
#             )

#         # Query for the ticket items
#         items_query = text("""
#             SELECT 
#                 ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
#                 ti.starch_level, ti.crease, ti.item_total, 
#                 ti.plant_price, ti.margin,
#                 ct.name AS clothing_name
#             FROM ticket_items AS ti
#             JOIN clothing_types AS ct ON ti.clothing_type_id = ct.id
#             WHERE ti.ticket_id = :ticket_id
#             AND ti.organization_id = :org_id 
#             AND ct.organization_id = :org_id
#         """)
#         items_result = db.execute(items_query, {
#             "ticket_id": ticket_id,
#             "org_id": organization_id
#         }).fetchall()

#         # Build the response items
#         response_items = []
#         for item in items_result:
#             response_items.append(
#                 TicketItemResponse(
#                     id=item.id,
#                     ticket_id=item.ticket_id,
#                     clothing_type_id=item.clothing_type_id,
#                     clothing_name=item.clothing_name,
#                     quantity=item.quantity,
#                     starch_level=item.starch_level,
#                     crease=item.crease,
#                     item_total=float(item.item_total),
#                     plant_price=float(item.plant_price),
#                     margin=float(item.margin),
#                     additional_charge=0.0
#                 )
#             )

#         # Build the final TicketResponse
#         return TicketResponse(
#             id=ticket_result.id,
#             ticket_number=ticket_result.ticket_number,
#             customer_id=ticket_result.customer_id,
#             customer_name=f"{ticket_result.first_name} {ticket_result.last_name}",
#             customer_phone=ticket_result.customer_phone,
#             total_amount=float(ticket_result.total_amount),
#             paid_amount=float(ticket_result.paid_amount),
#             status=ticket_result.status,
            
#             # --- THIS IS THE FIX ---
#             # Convert the int to a string, or keep it None if it's null
#             rack_number=str(ticket_result.rack_number) if ticket_result.rack_number is not None else None,
            
#             special_instructions=ticket_result.special_instructions,
#             pickup_date=ticket_result.pickup_date,
#             created_at=ticket_result.created_at,
#             items=response_items,
#             organization_id=ticket_result.organization_id
#         )

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error fetching ticket: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Error retrieving ticket details."
#         )

        
        

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
    Assigns an available rack to a ticket. 
    Includes checks to prevent double-assignment of tickets or racks.
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

        # --- CHECK 1: Validate Ticket Existence & Status ---
        # We check if the ticket already has a rack_number to prevent double-assignment.
        ticket_check_sql = text("""
            SELECT id, rack_number 
            FROM tickets 
            WHERE id = :ticket_id AND organization_id = :org_id
        """)
        existing_ticket = db.execute(ticket_check_sql, {
            "ticket_id": ticket_id,
            "org_id": organization_id
        }).fetchone()

        if not existing_ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )

        # If ticket already has a rack, STOP.
        if existing_ticket.rack_number is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ticket {ticket_id} is ALREADY assigned to Rack #{existing_ticket.rack_number}. Please clear the current rack assignment first."
            )

        # --- CHECK 2: Check Rack Availability with LOCK ---
        # We use 'FOR UPDATE' to lock this row. This prevents a race condition 
        # where two users try to claim the exact same rack at the same millisecond.
        rack_query = text("""
            SELECT id FROM racks 
            WHERE number = :rack_number 
            AND organization_id = :org_id 
            AND is_occupied = false
            FOR UPDATE 
        """)
        available_rack = db.execute(rack_query, {
            "rack_number": req.rack_number,
            "org_id": organization_id
        }).fetchone()

        if not available_rack:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Rack #{req.rack_number} is already occupied or does not exist."
            )

        # 4. Update the ticket
        ticket_update_sql = text("""
            UPDATE tickets 
            SET 
                rack_number = :rack_number, 
                status = 'ready_for_pickup'
            WHERE id = :ticket_id AND organization_id = :org_id
            RETURNING id
        """)
        
        db.execute(ticket_update_sql, {
            "rack_number": req.rack_number,
            "ticket_id": ticket_id,
            "org_id": organization_id
        })

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
        return {"success": True, "message": f"Ticket {ticket_id} assigned to rack {req.rack_number}."}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during rack assignment: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")    
    
@router.put(
    "/tickets/{ticket_id}", 
    response_model=TicketResponse, 
    summary="Update a ticket's general details"
)
async def update_ticket(
    ticket_id: int,
    req: GeneralTicketUpdateRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Updates general ticket details (like status, pickup date, etc.)
    for a ticket within the user's organization.
    """
    try:
        # 1. Get organization_id AND role from the trusted token
        organization_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 2. Role-based authorization check (more restrictive)
        # Only admins or owners should modify ticket details
        allowed_roles = ["store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify ticket details."
            )
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )

        # 3. Build the dynamic update query
        updates = []
        params = {'ticket_id': ticket_id, 'org_id': organization_id}
        
        # Use .model_dump() instead of .dict() for Pydantic v2
        update_data = req.model_dump(exclude_unset=True) 

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        for key, value in update_data.items():
            if key == 'paid_amount':
                value = decimal.Decimal(str(value)) # Handle decimal
            
            updates.append(f"{key} = :{key}")
            params[key] = value

        # 4. Construct and execute the SECURE update query
        update_sql_str = f"UPDATE tickets SET {', '.join(updates)} WHERE id = :ticket_id AND organization_id = :org_id RETURNING id"
        update_sql = text(update_sql_str)
        
        result = db.execute(update_sql, params).fetchone()

        if not result:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found in your organization."
            )
        
        db.commit()

        # 5. After committing, re-fetch the full ticket data to return it
        # (This logic is copied from your 'get_ticket_by_id' route)
        
        ticket_query = text("""
            SELECT 
                t.id, t.ticket_number, t.customer_id, t.total_amount, 
                t.paid_amount, t.status, t.rack_number, t.special_instructions, 
                t.pickup_date, t.created_at, t.organization_id,
                u.first_name, u.last_name, u.email AS customer_phone
            FROM tickets AS t
            JOIN allUsers AS u ON t.customer_id = u.id
            WHERE t.id = :ticket_id AND t.organization_id = :org_id
        """)
        ticket_result = db.execute(ticket_query, {"ticket_id": ticket_id, "org_id": organization_id}).fetchone()

        items_query = text("""
            SELECT 
                ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
                ti.starch_level, ti.crease, ti.item_total, 
                ti.plant_price, ti.margin,
                ct.name AS clothing_name
            FROM ticket_items AS ti
            JOIN clothing_types AS ct ON ti.clothing_type_id = ct.id
            WHERE ti.ticket_id = :ticket_id AND ti.organization_id = :org_id
        """)
        items_result = db.execute(items_query, {"ticket_id": ticket_id, "org_id": organization_id}).fetchall()

        response_items = [
            TicketItemResponse(
                id=item.id,
                ticket_id=item.ticket_id,
                clothing_type_id=item.clothing_type_id,
                clothing_name=item.clothing_name,
                quantity=item.quantity,
                starch_level=item.starch_level,
                crease=item.crease,
                item_total=float(item.item_total),
                plant_price=float(item.plant_price),
                margin=float(item.margin),
                additional_charge=0.0
            ) for item in items_result
        ]

        return TicketResponse(
            id=ticket_result.id,
            ticket_number=ticket_result.ticket_number,
            customer_id=ticket_result.customer_id,
            customer_name=f"{ticket_result.first_name} {ticket_result.last_name}",
            customer_phone=ticket_result.customer_phone,
            total_amount=float(ticket_result.total_amount),
            paid_amount=float(ticket_result.paid_amount),
            status=ticket_result.status,
            rack_number=ticket_result.rack_number,
            special_instructions=ticket_result.special_instructions,
            pickup_date=ticket_result.pickup_date,
            created_at=ticket_result.created_at,
            items=response_items,
            organization_id=ticket_result.organization_id
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during ticket update: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


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
