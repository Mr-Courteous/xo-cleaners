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
    TicketItemResponse
)


class NewCustomerRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    address: Optional[str] = None
    password: str

router = APIRouter(prefix="/api/organizations", tags=["Organization Resources"])


@router.get("/{organization_id}/racks", summary="Get all racks for an organization")
def get_racks_for_organization(organization_id: int, db: Session = Depends(get_db)):
    """
    Returns all racks belonging to a specific organization (using raw SQL).
    """
    try:
        query = text("""
            SELECT id, number, is_occupied, ticket_id, updated_at, organization_id
            FROM racks
            WHERE organization_id = :organization_id
            ORDER BY number ASC
        """)
        racks = db.execute(query, {"organization_id": organization_id}).fetchall()

        if not racks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No racks found for organization ID {organization_id}"
            )

        # Convert SQLAlchemy Row objects to dictionaries
        racks_list = [dict(row._mapping) for row in racks]

        return {
            "organization_id": organization_id,
            "total_racks": len(racks_list),
            "racks": racks_list
        }

    except Exception as e:
        print(f"Error fetching racks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving racks for organization."
        )


@router.get("/{organization_id}/clothing-types", summary="Get all clothing types for an organization")
def get_clothing_types_for_organization(organization_id: int, db: Session = Depends(get_db)):
    """
    Returns all clothing types belonging to a specific organization (using raw SQL).
    """
    try:
        query = text("""
            SELECT id, name, plant_price, margin, total_price, image_url, organization_id, created_at
            FROM clothing_types
            WHERE organization_id = :organization_id
            ORDER BY name ASC
        """)
        clothing_types = db.execute(query, {"organization_id": organization_id}).fetchall()

        if not clothing_types:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No clothing types found for organization ID {organization_id}"
            )

        clothing_list = [dict(row._mapping) for row in clothing_types]

        return {
            "organization_id": organization_id,
            "count": len(clothing_list),
            "clothing_types": clothing_list
        }

    except Exception as e:
        print(f"Error fetching clothing types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving clothing types for organization."
        )


@router.get("/customers", response_model=List[Dict[str, Any]])
async def get_customers_by_organization(
    search: Optional[str] = Query(None, description="Search customers by first or last name"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Get all customers for the logged-in staff member's organization.
    Access is restricted to staff roles (cashier, admin, owner).
    """
    try:
        # 1. Get user's role and their org_id from the TRUSTED token payload
        user_role = payload.get("role")
        organization_id = payload.get("organization_id") # <-- From the token

        # 2. Authorization: Check if user is allowed to view customers
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view customers."
            )

        # 3. Validation: Check if the staff member's token has an organization
        if not organization_id:
            raise HTTPException(
                status_code=400,
                detail="Organization ID missing from token payload."
            )

        # 4. Base query for customers only
        base_query = """
            SELECT id, first_name, last_name, email, role, address
            FROM allUsers
            WHERE organization_id = :org_id
              AND role = 'customer'
        """

        # 5. Use the secure organization_id from the token
        params = {"org_id": organization_id}

        # 6. Add search filtering if provided
        if search:
            base_query += " AND (LOWER(first_name) LIKE :search OR LOWER(last_name) LIKE :search)"
            params["search"] = f"%{search.lower()}%"

        # 7. Order results
        base_query += " ORDER BY first_name ASC, last_name ASC"

        result = db.execute(text(base_query), params).mappings().all()

        return [dict(row) for row in result]

    except Exception as e:
        # Don't print the error if it's an HTTPException we raised
        if not isinstance(e, HTTPException):
            print("Error fetching customers:", e)
        
        # Re-raise the exception (either ours or the new 500)
        if isinstance(e, HTTPException):
            raise e
        else:
            raise HTTPException(
                status_code=500,
                detail="An error occurred while fetching customers."
            )
        
        
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


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
async def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    # 2. ALIGNED SECURITY: Get the full payload dictionary
    payload: Dict[str, Any] = Depends(get_current_user_payload) 
):
    """Creates a new ticket, saving all item details and financial data."""
    
    try:
        # 3. GET SECURE DATA FROM TOKEN:
        organization_id = payload.get("organization_id")
        user_email = payload.get("sub") # or .get("email"), based on your token
        
        if not organization_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Organization ID missing."
            )
            
        print(f"User {user_email} (Org: {organization_id}) is creating a new ticket.")
        
        # 1. Check customer existence (NOW FILTERED BY ORG)
        # Using allUsers table as 'customers'
        customer_query = text("""
            SELECT id, first_name, last_name, email 
            FROM allUsers 
            WHERE id = :id AND organization_id = :org_id AND role = 'customer'
        """)
        customer = db.execute(customer_query, {
            "id": ticket_data.customer_id, 
            "org_id": organization_id
        }).fetchone()
        
        if not customer:
            raise HTTPException(status_code=404, detail=f"Customer not found in your organization.")

        total_amount = decimal.Decimal('0.00')
        ticket_items_to_insert = []
        type_ids = [item.clothing_type_id for item in ticket_data.items]
        
        if not type_ids:
             raise HTTPException(status_code=400, detail="No items provided for the ticket.")
        
        # 2. Fetch prices (NOW FILTERED BY ORG)
        types_query = text("""
            SELECT id, name, plant_price, margin, total_price 
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
                "total_price": decimal.Decimal(str(row[4]))
            } for row in types_result
        }
        
        # 3. Calculate total_amount and prepare items
        for item_create in ticket_data.items:
            prices = type_prices.get(item_create.clothing_type_id)
            
            # Check if clothing type was fetched (i.e., belongs to the org)
            if prices is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid item: Clothing type ID {item_create.clothing_type_id} not found in your organization."
                )

            item_total_price = prices["total_price"] * item_create.quantity
            total_amount += item_total_price

            ticket_items_to_insert.append({
                "clothing_type_id": item_create.clothing_type_id,
                "quantity": item_create.quantity,
                "starch_level": item_create.starch_level,
                "crease": item_create.crease,
                "plant_price": prices["plant_price"],
                "margin": prices["margin"],
                "item_total": item_total_price,
                "organization_id": organization_id
            })

        # 4. DYNAMIC TICKET NUMBER (NOW FILTERED BY ORG)
        date_prefix = datetime.now().strftime("%y%m%d")
        
        latest_ticket_query = text("""
            SELECT ticket_number FROM tickets 
            WHERE ticket_number LIKE :prefix || '-%'
            AND organization_id = :org_id  -- <-- ADDED ORG FILTER
            ORDER BY ticket_number DESC 
            LIMIT 1
        """)
        latest_ticket_result = db.execute(latest_ticket_query, {
            "prefix": date_prefix,
            "org_id": organization_id # <-- ADDED ORG PARAM
        }).fetchone()
        
        new_sequence = 1
        if latest_ticket_result:
            latest_number_str = latest_ticket_result[0].split('-')[-1]
            try:
                new_sequence = int(latest_number_str) + 1
            except ValueError:
                new_sequence = 1 # Fallback

        ticket_number = f"{date_prefix}-{new_sequence:03d}" 
        
        rack_number_val = ticket_data.rack_number
        instructions_val = ticket_data.special_instructions
        paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount))
        pickup_date_val = ticket_data.pickup_date

        # 5. Insert Ticket (NOW WITH organization_id)
        ticket_insert_query = text("""
            INSERT INTO tickets (
                ticket_number, customer_id, total_amount, rack_number, 
                special_instructions, paid_amount, pickup_date, 
                organization_id -- <-- ADDED COLUMN
            )
            VALUES (
                :ticket_number, :customer_id, :total_amount, :rack_number, 
                :special_instructions, :paid_amount, :pickup_date, 
                :org_id -- <-- ADDED PARAM
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
            "org_id": organization_id # <-- ADDED VALUE
        }).fetchone()

        if ticket_result is None:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database failed to insert ticket.")

        ticket_id = ticket_result[0]
        created_at = ticket_result[1]
        status_val = ticket_result[2] 
        print("RAW BODY:", ticket_data)


        # 6. Insert Ticket Items (Batch insertion)
        item_rows = []
        for item in ticket_items_to_insert:
            item["ticket_id"] = ticket_id
            # ensure each ticket_item carries the org id for later filtering
            if "organization_id" not in item:
                item["organization_id"] = organization_id
            item_rows.append(item)

        item_insert_query = text("""
            INSERT INTO ticket_items (
                ticket_id, clothing_type_id, quantity, starch_level, crease, plant_price, margin, item_total, organization_id
            )
            VALUES (
                :ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, :plant_price, :margin, :item_total, :organization_id
            )
            RETURNING id
        """)
        db.execute(item_insert_query, item_rows)
        
        # 7. Commit transaction
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
                    item_total=float(item['item_total']),
                    plant_price=float(item['plant_price']),
                    margin=float(item['margin']),
                    additional_charge=0.0
                )
            )

        customer_name = f"{customer.first_name} {customer.last_name}"
        print("✅ FINAL Ticket Data:", ticket_data.dict())

        
        return TicketResponse(
            id=ticket_id,
            ticket_number=ticket_number,
            customer_id=ticket_data.customer_id,
            customer_name=customer_name, # <-- Updated
            customer_phone=customer.email, # <-- Using email as phone, update if you have phone
            total_amount=float(total_amount),
            paid_amount=float(paid_amount_val), 
            status=status_val,
            rack_number=rack_number_val,
            special_instructions=instructions_val,
            pickup_date=pickup_date_val,
            created_at=created_at,
            items=response_items,
            organization_id=organization_id # <-- Added to response
        )
        print("RAW BODY:", ticket_data)


    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during ticket creation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during ticket processing.")