import os
from typing import Dict, Any, Optional  # ✅ Added this line
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError # <-- FIX 1A: IMPORT IntegrityError
from psycopg2.errorcodes import UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION # Optional for better error handling
from datetime import timedelta, datetime, timezone

# Import shared utilities and constants from your utility file
from utils.common import (
    hash_password,
    get_role_type,
    ALL_STAFF_ROLES,
    PLATFORM_ADMIN_ROLE,
    ORG_OWNER_ROLE,
    get_db,
    get_current_user_payload, 
    hash_password
)

# =======================
# ROUTER SETUP
# =======================
router = APIRouter(
    prefix="/register",
    tags=["Registration"],
)

# =======================
# PYDANTIC SCHEMAS
# =======================

# Schema for a new staff user in an existing organization
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    role: ALL_STAFF_ROLES
    organization_id: int = Field(..., description="Required for all staff users.")
    phone: Optional[str] = None  # <-- ADDED FIELD

# Base schema for an organization
class OrganizationBase(BaseModel):
    name: str = Field(min_length=3)
    industry: str = Field("Dry Cleaning", max_length=100)


class OrganizationWithAdminCreate(BaseModel):
    name: str
    industry: str
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str

class RegistrationSuccess(BaseModel):
    message: str
    organization_id: int
    user_id: str | None = None # <-- FIX: Changed int to str
    role: str

# =======================
# UTILITIES
# =======================

def get_organization_id(db: Session, name: str) -> Optional[int]:
    """Retrieves an organization's ID by name."""
    org_query = text("SELECT id FROM organizations WHERE name = :name")
    org_result = db.execute(org_query, {"name": name}).fetchone()
    return org_result[0] if org_result else None

# =======================
# ROUTES
# =======================


# @router.post(
#     "/new-organization",
#     response_model=RegistrationSuccess,
#     status_code=status.HTTP_201_CREATED,
#     summary="Register a new organization and its Store Owner"
# )
# async def register_organization_and_admin(
#     data: OrganizationWithAdminCreate,
#     db: Session = Depends(get_db)
# ):
#     """
#     Registers a new Organization and automatically creates:
#     - The store owner
#     - 500 racks
#     - 2 default clothing types
#     """
#     owner_email = data.admin_email.strip().lower()

#     # 1️⃣ Check if organization name already exists
#     if get_organization_id(db, data.name):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Organization name '{data.name}' already exists."
#         )

#     # 2️⃣ Check if owner email exists
#     email_check = db.execute(
#         text("SELECT id FROM organizations WHERE LOWER(owner_email) = :email"),
#         {"email": owner_email}
#     ).fetchone()
#     if email_check:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Owner email '{data.admin_email}' already exists."
#         )

#     try:
#         # 3️⃣ Hash password
#         hashed_pw = hash_password(data.admin_password)

#         # 4️⃣ Insert into organizations table
#         org_insert_stmt = text("""
#             INSERT INTO organizations (
#                 name,
#                 industry,
#                 owner_first_name,
#                 owner_last_name,
#                 owner_email,
#                 owner_password_hash,
#                 role
#             )
#             VALUES (
#                 :name,
#                 :industry,
#                 :owner_first_name,
#                 :owner_last_name,
#                 :owner_email,
#                 :owner_password_hash,
#                 'store_owner'
#             )
#             RETURNING id
#         """)

#         org_result = db.execute(org_insert_stmt, {
#             "name": data.name,
#             "industry": data.industry,
#             "owner_first_name": data.admin_first_name,
#             "owner_last_name": data.admin_last_name,
#             "owner_email": owner_email,
#             "owner_password_hash": hashed_pw,
#         }).fetchone()

#         organization_id = org_result[0]

#         # ✅ 5️⃣ Create 500 racks for the new organization
#         racks = [
#             {
#                 "number": i + 1,
#                 "is_occupied": False,
#                 "organization_id": organization_id
#             }
#             for i in range(500)
#         ]
#         db.execute(
#             text("""
#                 INSERT INTO racks (number, is_occupied, organization_id)
#                 VALUES (:number, :is_occupied, :organization_id)
#             """),
#             racks
#         )

#         # ✅ 6️⃣ Insert default clothing types (omit total_price)
#         # --- FIX: Removed 'total_price' from the dictionaries ---
#         clothing_types = [
#             {
#                 "name": "Shirt",
#                 "plant_price": 1000.0,
#                 "margin": 200.0,
#                 "image_url": "default_shirt.jpg",
#                 "organization_id": organization_id
#             },
#             {
#                 "name": "Trousers",
#                 "plant_price": 1200.0,
#                 "margin": 300.0,
#                 "image_url": "default_trouser.jpg",
#                 "organization_id": organization_id
#             }
#         ]

#         # --- FIX: Removed 'total_price' from the SQL statement ---
#         db.execute(
#             text("""
#                 INSERT INTO clothing_types
#                 (name, plant_price, margin, image_url, organization_id)
#                 VALUES (:name, :plant_price, :margin, :image_url, :organization_id)
#             """),
#             clothing_types
#         )

#         # ✅ 7️⃣ Commit all
#         db.commit()

#         return RegistrationSuccess(
#             message=f"Organization '{data.name}' registered successfully with Store Owner '{data.admin_email}'.",
#             organization_id=organization_id,
#             user_id=None,
#             role="STORE_OWNER"
#         )

#     except IntegrityError as e:
#         db.rollback()
#         # Note: This will catch the GeneratedAlways error, but the detail
#         # might be misleading. The generic exception below is likely what
#         # caught your original error.
#         print(f"IntegrityError during organization registration: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Duplicate data detected or constraint violation."
#         )

#     except Exception as e:
#         db.rollback()
#         print(f"Error during organization registration: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="An unexpected error occurred during registration."
#         )
        
class OrganizationWithAdminCreate(BaseModel):
    name: str
    industry: str
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str
    
    # ⬇️ ADD THESE TWO FIELDS ⬇️
    org_type: str  # e.g., "full_store", "smart_locker", etc.
    parent_org_id: Optional[int] = None  # Crucial for branch support
    

def setup_default_settings_and_clothing(db: Session, organization_id: int):
    """
    Furnishes a new organization with 500 racks, 
    default clothing items, and branding settings.
    """
    # ✅ 1. Create 500 racks
    racks = [
        {"number": i + 1, "is_occupied": False, "organization_id": organization_id}
        for i in range(500)
    ]
    db.execute(
        text("""
            INSERT INTO racks (number, is_occupied, organization_id)
            VALUES (:number, :is_occupied, :organization_id)
        """),
        racks
    )

    # ✅ 2. Insert default clothing types (Shirt & Trousers)
    clothing_types = [
        {
            "name": "Shirt",
            "plant_price": 1000.0,
            "margin": 200.0,
            "image_url": "/static/images/shirt.jpg", 
            "organization_id": organization_id
        },
        {
            "name": "Trousers",
            "plant_price": 1200.0,
            "margin": 300.0,
            "image_url": "/static/images/trousers.jpg",
            "organization_id": organization_id
        }
    ]
    db.execute(
        text("""
            INSERT INTO clothing_types
            (name, plant_price, margin, image_url, organization_id)
            VALUES (:name, :plant_price, :margin, :image_url, :organization_id)
        """),
        clothing_types
    )

    # ✅ 3. Insert Default Branding & Starch Prices
    db.execute(text("""
        INSERT INTO organization_settings (
            organization_id, primary_color, secondary_color,
            receipt_header, receipt_footer,
            starch_price_light, starch_price_medium,
            starch_price_heavy, starch_price_extra_heavy,
            updated_at
        )
        VALUES (
            :org_id, '#000000', '#FFFFFF',
            'Welcome to our Store', 'Thank you for visiting!',
            100.00, 200.00, 300.00, 400.00,
            NOW()
        )
    """), {"org_id": organization_id})
    
@router.post("/new-organization", response_model=RegistrationSuccess, status_code=status.HTTP_201_CREATED)
async def register_organization(
    data: OrganizationWithAdminCreate,
    request: Request, # Add this to manually check headers
    db: Session = Depends(get_db)
):
    owner_email = data.admin_email.strip().lower()

    # --- 1. SMART AUTH CHECK ---
    effective_parent_id = None
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        try:
            # Manually trigger your token payload logic
            token = auth_header.split(" ")[1]
            current_user = get_current_user_payload(token) # Your existing decoder
            
            # If successful, this is a BRANCH
            effective_parent_id = current_user.get("organization_id")
            print(f"Creating branch for parent: {effective_parent_id}")
        except Exception:
            # If token is invalid or expired, we treat it as a public registration
            effective_parent_id = None

    # --- 2. VALIDATION ---
    existing_org = db.execute(
        text("SELECT id FROM organizations WHERE owner_email = :email"),
        {"email": owner_email}
    ).fetchone()
    
    if existing_org:
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        # --- 3. DATABASE INSERT ---
        org_insert_stmt = text("""
            INSERT INTO organizations (
                name, industry, owner_first_name, owner_last_name, 
                owner_email, owner_password_hash, role,
                org_type, parent_org_id
            )
            VALUES (
                :name, :industry, :owner_first_name, :owner_last_name, 
                :owner_email, :owner_password_hash, 'store_owner',
                :org_type, :parent_org_id
            )
            RETURNING id
        """)

        org_result = db.execute(org_insert_stmt, {
            "name": data.name,
            "industry": data.industry,
            "owner_first_name": data.admin_first_name,
            "owner_last_name": data.admin_last_name,
            "owner_email": owner_email,
            "owner_password_hash": hash_password(data.admin_password),
            "org_type": data.org_type,
            "parent_org_id": effective_parent_id
        }).fetchone()

        new_org_id = org_result[0]

        # 4. Setup Default Settings and Clothing
        setup_default_settings_and_clothing(db, new_org_id)

        db.commit()

        return RegistrationSuccess(
            message="Registered successfully.",
            organization_id=new_org_id,
            role="STORE_OWNER"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    
# In organizations.py

# 1. Define a Schema that matches your Frontend form EXACTLY
class WorkerCreateSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str
    phone: Optional[str] = None
    # Notice: NO organization_id here, because Frontend doesn't send it.

# 2. Define the Response Model
class WorkerRegistrationResponse(BaseModel):
    message: str
    user_id: str
    organization_id: int
    role: str

# 3. The Route (Updated to use WorkerCreateSchema)
@router.post("/staff", response_model=WorkerRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def create_worker(
    data: WorkerCreateSchema,  # <--- CHANGED from UserCreate to WorkerCreateSchema
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Registers a new worker (Cashier, Store Admin, etc.)
    Route matches Frontend: POST /workers
    """
    token_org_id = payload.get("organization_id")
    requester_role = payload.get("role")

    # --- Security Checks ---
    if not token_org_id:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token: Organization ID is missing."
        )

    # Only Owners and Admins can add workers
    if requester_role not in ["store_admin", "STORE_OWNER", "org_owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to register staff."
        )

    # --- Check if user already exists ---
    email_clean = data.email.strip().lower()
    existing = db.execute(
        text("SELECT id FROM allUsers WHERE email = :email"), 
        {"email": email_clean}
    ).fetchone()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email_clean}' already exists."
        )

    try:
        # --- Hash Password ---
        hashed_pw = hash_password(data.password)

        # --- Insert New Worker ---
        insert_stmt = text("""
            INSERT INTO allUsers (
                organization_id, email, password_hash, 
                first_name, last_name, role, phone, 
                joined_at, is_deactivated
            )
            VALUES (
                :org_id, :email, :password_hash, 
                :first_name, :last_name, :role, :phone, 
                :joined_at, FALSE
            )
            RETURNING id
        """)

        result = db.execute(insert_stmt, {
            "org_id": token_org_id,
            "email": email_clean,
            "password_hash": hashed_pw,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "role": data.role,
            "phone": data.phone.strip() if data.phone else None,
            "joined_at": datetime.now(timezone.utc) # Sets active start date
        }).fetchone()

        db.commit()

        # --- Return Success Response ---
        return WorkerRegistrationResponse(
            message=f"Worker {data.first_name} registered successfully.",
            user_id=str(result[0]),
            organization_id=token_org_id,
            role=data.role
        )

    except Exception as e:
        db.rollback()
        print("Error creating worker:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create worker."
        )