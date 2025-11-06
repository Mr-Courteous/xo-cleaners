import os
from typing import Dict, Any, Optional  # ✅ Added this line
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError # <-- FIX 1A: IMPORT IntegrityError
from psycopg2.errorcodes import UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION # Optional for better error handling

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


@router.post(
    "/new-organization",
    response_model=RegistrationSuccess,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new organization and its Store Owner"
)
async def register_organization_and_admin(
    data: OrganizationWithAdminCreate,
    db: Session = Depends(get_db)
):
    """
    Registers a new Organization and automatically creates:
    - The store owner
    - 500 racks
    - 2 default clothing types
    """
    owner_email = data.admin_email.strip().lower()

    # 1️⃣ Check if organization name already exists
    if get_organization_id(db, data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization name '{data.name}' already exists."
        )

    # 2️⃣ Check if owner email exists
    email_check = db.execute(
        text("SELECT id FROM organizations WHERE LOWER(owner_email) = :email"),
        {"email": owner_email}
    ).fetchone()
    if email_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Owner email '{data.admin_email}' already exists."
        )

    try:
        # 3️⃣ Hash password
        hashed_pw = hash_password(data.admin_password)

        # 4️⃣ Insert into organizations table
        org_insert_stmt = text("""
            INSERT INTO organizations (
                name,
                industry,
                owner_first_name,
                owner_last_name,
                owner_email,
                owner_password_hash,
                role
            )
            VALUES (
                :name,
                :industry,
                :owner_first_name,
                :owner_last_name,
                :owner_email,
                :owner_password_hash,
                'store_owner'
            )
            RETURNING id
        """)

        org_result = db.execute(org_insert_stmt, {
            "name": data.name,
            "industry": data.industry,
            "owner_first_name": data.admin_first_name,
            "owner_last_name": data.admin_last_name,
            "owner_email": owner_email,
            "owner_password_hash": hashed_pw,
        }).fetchone()

        organization_id = org_result[0]

        # ✅ 5️⃣ Create 500 racks for the new organization
        racks = [
            {
                "number": i + 1,
                "is_occupied": False,
                "organization_id": organization_id
            }
            for i in range(500)
        ]
        db.execute(
            text("""
                INSERT INTO racks (number, is_occupied, organization_id)
                VALUES (:number, :is_occupied, :organization_id)
            """),
            racks
        )

        # ✅ 6️⃣ Insert default clothing types (omit total_price)
        clothing_types = [
            {
                "name": "Shirt",
                "plant_price": 1000.0,
                "margin": 200.0,
                "image_url": "default_shirt.jpg",
                'total_price': 1200.0,  # <-- FIX: plant_price + margin
                "organization_id": organization_id
            },
            {
                "name": "Trousers",
                "plant_price": 1200.0,
                "margin": 300.0,
                "image_url": "default_trouser.jpg",
                "total_price": 1500.0, # <-- FIX: Trousers: 1200 + 300
                "organization_id": organization_id
            }
        ]

        db.execute(
            text("""
                INSERT INTO clothing_types
                (name, plant_price, margin, total_price, image_url, organization_id)
                VALUES (:name, :plant_price, :margin, :total_price, :image_url, :organization_id)
            """), # Note: The traceback suggests double percents (%%) were being used, but this is the correct single-percent style
            clothing_types
        )

        # ✅ 7️⃣ Commit all
        db.commit()

        return RegistrationSuccess(
            message=f"Organization '{data.name}' registered successfully with Store Owner '{data.admin_email}'.",
            organization_id=organization_id,
            user_id=None,
            role="STORE_OWNER"
        )

    except IntegrityError as e: # <-- FIX 2B: Change UniqueViolation to IntegrityError
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate data detected (possible rack number conflict, or a constraint violation)."
        )

    except Exception as e:
        db.rollback()
        print(f"Error during organization registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during registration."
        )

@router.post("/staff", response_model=RegistrationSuccess)
async def register_staff_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    token_org_id = payload.get("organization_id")
    requester_role = payload.get("role")

    if data.organization_id and data.organization_id != token_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot register staff for another organization."
        )

    org_id_for_db = token_org_id or data.organization_id
    if not org_id_for_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is missing from both token and body."
        )

    if requester_role not in ["store_admin", "STORE_OWNER", "org_owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Store Admin or Organization Owner can register staff."
        )

    try:
        hashed_pw = hash_password(data.password)

        insert_stmt = text("""
            INSERT INTO allUsers (organization_id, email, password_hash, first_name, last_name, role)
            VALUES (:org_id, :email, :password_hash, :first_name, :last_name, :role)
            RETURNING id
        """)

        result = db.execute(insert_stmt, {
            "org_id": org_id_for_db,
            "email": data.email,
            "password_hash": hashed_pw,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "role": data.role or "staff",
        }).fetchone()

        db.commit()

        return RegistrationSuccess(
            message="Staff user registered successfully.",
            user_id=str(result[0]), # <-- FIX: Cast the UUID object to a string
            organization_id=org_id_for_db,
            role=data.role or "staff"
        )

    except Exception as e:
        db.rollback()

        if "duplicate key value violates unique constraint" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{data.email}' already exists."
            )

        print("Error during staff registration:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while registering staff."
        )
        
        
