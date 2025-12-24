from datetime import timedelta
from typing import Dict, Any, List, Optional, Literal
from enum import Enum
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field

# Import your existing utilities
# 'get_current_user_payload' is the key here: it decodes the JWT and validates the signature.
from utils.common import (
    get_db, 
    get_current_user_payload, 
    create_access_token,
    hash_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(
    prefix="/platform-admin",
    tags=["Platform Admin"],
)

# --- DEPENDENCY: STRICT ADMIN CHECK ---
def verify_super_admin(payload: Dict[str, Any] = Depends(get_current_user_payload)):
    """
    1. Validates the Token (via get_current_user_payload).
    2. Checks if the role is explicitly a Platform Admin.
    """
    role = payload.get("role")
    # Verify the user is actually a platform admin
    if role not in ["platform_admin", "Platform Admin", "super_admin"]:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Platform Administrators only."
        )
    return payload

# --- PYDANTIC MODELS ---

class StoreCreateRequest(BaseModel):
    name: str
    owner_email: EmailStr
    owner_first_name: str
    owner_last_name: str
    owner_password: str
    address: str | None = None
    phone: str | None = None

class StoreStatusUpdate(BaseModel):
    is_active: bool

class StoreDetailsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

# --- NEW MODELS FOR USER MANAGEMENT ---

# 1. Define the Allowed Roles Enum (Excludes org_owner)
class AllowedUserRole(str, Enum):
    STORE_ADMIN = "store_admin"
    STORE_MANAGER = "store_manager"
    OPERATOR = "operator"
    CASHIER = "cashier"
    DRIVER = "driver"
    CUSTOMER = "customer"

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    # When creating, we might want to be flexible, or restrict here too. 
    # For now, I'll leave this as string to allow creating org_owners if needed, 
    # but usually org_owners are created via 'create_store'.
    role: str  
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    # STRICT VALIDATION: Only allows the roles defined in the Enum above
    role: Optional[AllowedUserRole] = None
    phone: Optional[str] = None
    password: Optional[str] = None 


# ================================
# 1. PLATFORM ANALYTICS
# ================================
@router.get("/analytics")
def get_platform_analytics(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Returns high-level stats for the admin dashboard.
    """
    stats = {
        "total_stores": db.execute(text("SELECT COUNT(*) FROM organizations")).scalar(),
        "active_stores": db.execute(text("SELECT COUNT(*) FROM organizations WHERE is_active = TRUE")).scalar(),
        "total_users": db.execute(text("SELECT COUNT(*) FROM allUsers")).scalar(),
        "total_tickets": db.execute(text("SELECT COUNT(*) FROM tickets")).scalar(),
        "total_revenue": db.execute(text("SELECT COALESCE(SUM(paid_amount), 0) FROM tickets")).scalar()
    }
    return stats

@router.get("/analytics/revenue-by-store")
def get_store_revenue_analytics(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Dedicated analytics route. 
    Calculates total revenue and ticket counts for every store.
    """
    query = text("""
        SELECT 
            o.id, 
            o.name, 
            o.phone, 
            o.address, 
            o.is_active,
            (SELECT email FROM allUsers WHERE organization_id = o.id AND role = 'org_owner' LIMIT 1) as owner_email,
            (SELECT COUNT(*) FROM tickets WHERE organization_id = o.id) as ticket_count,
            (SELECT COALESCE(SUM(paid_amount), 0) FROM tickets WHERE organization_id = o.id) as total_revenue
        FROM organizations o
        ORDER BY total_revenue DESC
    """)
    
    results = db.execute(query).fetchall()
    return [dict(row._mapping) for row in results]


# ================================
# 2. STORE MANAGEMENT (CRUD)
# ================================
@router.get("/stores")
def get_all_stores(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    List all stores including their Active status and Owner email.
    """
    query = text("""
        SELECT o.id, o.name, o.phone, o.address, o.created_at, o.is_active,
               (SELECT email FROM allUsers WHERE organization_id = o.id AND role = 'org_owner' LIMIT 1) as owner_email,
               (SELECT COUNT(*) FROM tickets WHERE organization_id = o.id) as ticket_count
        FROM organizations o
        ORDER BY o.created_at DESC
    """)
    stores = db.execute(query).fetchall()
    return [dict(row._mapping) for row in stores]

@router.post("/stores")
def create_store(
    data: StoreCreateRequest,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Create a new Store AND its Owner account in one transaction.
    """
    try:
        # 1. Create Organization
        org_id = db.execute(text("""
            INSERT INTO organizations (name, address, phone, is_active)
            VALUES (:name, :address, :phone, TRUE)
            RETURNING id
        """), {"name": data.name, "address": data.address, "phone": data.phone}).scalar()

        # 2. Create Owner User
        hashed_pw = hash_password(data.owner_password)
        db.execute(text("""
            INSERT INTO allUsers (organization_id, email, password_hash, first_name, last_name, role, joined_at)
            VALUES (:org_id, :email, :pw, :fname, :lname, 'org_owner', NOW())
        """), {
            "org_id": org_id, "email": data.owner_email, "pw": hashed_pw,
            "fname": data.owner_first_name, "lname": data.owner_last_name
        })

        db.commit()
        return {"message": "Store created successfully", "store_id": org_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/stores/{store_id}/status")
def activate_deactivate_store(
    store_id: int,
    data: StoreStatusUpdate,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Enable or Disable a store.
    """
    result = db.execute(text("UPDATE organizations SET is_active = :status WHERE id = :id"), 
               {"status": data.is_active, "id": store_id})
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Store not found")
        
    status_msg = "Activated" if data.is_active else "Deactivated"
    return {"message": f"Store {status_msg} successfully"}

@router.put("/stores/{store_id}")
def update_store_details(
    store_id: int,
    data: StoreDetailsUpdate,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Update basic details of an existing store (Name, Address, Phone).
    """
    store = db.execute(text("SELECT id FROM organizations WHERE id = :id"), {"id": store_id}).fetchone()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    updates = []
    params = {"id": store_id}

    if data.name:
        updates.append("name = :name")
        params["name"] = data.name
    
    if data.address:
        updates.append("address = :address")
        params["address"] = data.address
        
    if data.phone:
        updates.append("phone = :phone")
        params["phone"] = data.phone

    if not updates:
        raise HTTPException(status_code=400, detail="No changes provided")

    stmt = text(f"UPDATE organizations SET {', '.join(updates)} WHERE id = :id")
    db.execute(stmt, params)
    db.commit()

    return {"message": "Store details updated successfully"}

# ================================
# 3. IMPERSONATION (God Mode)
# ================================
@router.post("/impersonate/{store_id}")
def impersonate_store(
    store_id: int,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Generates a valid Login Token for the Store Owner.
    """
    owner = db.execute(text("""
        SELECT id, email, role, first_name, last_name 
        FROM allUsers 
        WHERE organization_id = :org_id AND role = 'org_owner' 
        LIMIT 1
    """), {"org_id": store_id}).fetchone()

    if not owner:
        raise HTTPException(status_code=404, detail="Store owner not found")

    org_name = db.execute(text("SELECT name FROM organizations WHERE id=:id"), {"id": store_id}).scalar()

    token_data = {
        "sub": owner.email,
        "sub_id": str(owner.id),
        "role": owner.role,
        "organization_id": store_id,
        "organization_name": org_name,
        "impersonator": admin.get("sub")
    }
    
    access_token = create_access_token(data=token_data, expires_delta=timedelta(minutes=60))

    return {
        "message": f"Impersonating {org_name}",
        "access_token": access_token,
        "redirect_role": owner.role
    }

# ================================
# 4. MONTHLY FINANCIAL ANALYTICS
# ================================
@router.get("/stores/{store_id}/analytics/monthly")
def get_store_monthly_financials(
    store_id: int,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    query = text("""
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as ticket_count,
            COALESCE(SUM(paid_amount), 0) as monthly_revenue
        FROM tickets
        WHERE organization_id = :org_id
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
    """)
    
    results = db.execute(query, {"org_id": store_id}).fetchall()
    
    formatted_data = [
        {
            "month": row.month,
            "tickets": row.ticket_count,
            "revenue": float(row.monthly_revenue)
        } 
        for row in results
    ]

    return formatted_data

# ================================
# 5. USER MANAGEMENT (Per Store & Global)
# ================================

@router.get("/users")
def get_all_platform_users(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Get a list of ALL users across the platform with their organization names.
    """
    query = text("""
        SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.role, 
            u.phone, 
            u.joined_at, 
            u.is_deactivated,
            u.organization_id,
            o.name as organization_name
        FROM allUsers u
        LEFT JOIN organizations o ON u.organization_id = o.id
        ORDER BY u.joined_at DESC
    """)
    users = db.execute(query).fetchall()
    return [dict(row._mapping) for row in users]

@router.get("/stores/{store_id}/users")
def get_store_users(
    store_id: int,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Get a list of ALL users (Workers & Customers) belonging to a specific store.
    """
    query = text("""
        SELECT id, first_name, last_name, email, role, phone, joined_at, is_deactivated 
        FROM allUsers 
        WHERE organization_id = :org_id
        ORDER BY role ASC, first_name ASC
    """)
    users = db.execute(query, {"org_id": store_id}).fetchall()
    return [dict(row._mapping) for row in users]


@router.post("/stores/{store_id}/users")
def create_store_user(
    store_id: int,
    data: UserCreate,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Create a new Worker or Customer for a specific store.
    """
    exists = db.execute(text("SELECT 1 FROM allUsers WHERE email = :email"), {"email": data.email}).fetchone()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered.")

    try:
        hashed_pw = hash_password(data.password)

        stmt = text("""
            INSERT INTO allUsers (
                organization_id, email, password_hash, first_name, last_name, role, phone, joined_at, is_deactivated
            )
            VALUES (
                :org_id, :email, :pw, :fname, :lname, :role, :phone, NOW(), FALSE
            )
            RETURNING id
        """)
        
        user_id = db.execute(stmt, {
            "org_id": store_id,
            "email": data.email,
            "pw": hashed_pw,
            "fname": data.first_name,
            "lname": data.last_name,
            "role": data.role.lower(), 
            "phone": data.phone
        }).scalar()

        db.commit()
        return {"message": f"User created successfully.", "user_id": user_id, "role": data.role}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}")
def update_user_details(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Update a user's profile.
    NOTE: 'role' is strictly validated by the AllowedUserRole Enum in UserUpdate model.
    """
    updates = []
    params = {"id": user_id}

    if data.first_name:
        updates.append("first_name = :fname")
        params["fname"] = data.first_name
    
    if data.last_name:
        updates.append("last_name = :lname")
        params["lname"] = data.last_name
        
    if data.email:
        exists = db.execute(text("SELECT 1 FROM allUsers WHERE email = :email AND id != :id"), {"email": data.email, "id": user_id}).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Email already in use.")
        updates.append("email = :email")
        params["email"] = data.email

    # Role update logic
    if data.role:
        # Pydantic already validates the Enum, so we can trust it's in the allowed list.
        # However, as a failsafe, we ensure we are not updating an Org Owner's role accidentally
        # if the logic was purely dynamic.
        updates.append("role = :role")
        params["role"] = data.role.value # Get string value from Enum

    if data.phone:
        updates.append("phone = :phone")
        params["phone"] = data.phone
        
    if data.password:
        updates.append("password_hash = :pw")
        params["pw"] = hash_password(data.password)

    if not updates:
        raise HTTPException(status_code=400, detail="No changes provided")

    stmt = text(f"UPDATE allUsers SET {', '.join(updates)} WHERE id = :id")
    result = db.execute(stmt, params)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Deactivate (Soft Delete) a user.
    """
    stmt = text("UPDATE allUsers SET is_deactivated = TRUE WHERE id = :id")
    result = db.execute(stmt, {"id": user_id})
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deactivated successfully"}




from sqlalchemy.exc import IntegrityError # Make sure to import this

@router.delete("/customers/{customer_id}/permanent", summary="PERMANENTLY Delete a Customer")
def delete_customer_permanently(
    customer_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    WARNING: This removes the user from the database entirely.
    This will FAIL if the customer has existing tickets (Foreign Key Violation).
    """
    try:
        # 1. Authorization
        org_id = payload.get("organization_id")
        user_role = payload.get("role")
        
        allowed_roles = ["org_owner", "store_admin", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Only Admins can permanently delete customers."
            )

        # 2. Verify existence
        check_query = text("SELECT id FROM allUsers WHERE id = :cid AND organization_id = :oid")
        user = db.execute(check_query, {"cid": customer_id, "oid": org_id}).fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Customer not found in your organization.")

        # 3. Attempt Hard Delete
        delete_query = text("DELETE FROM allUsers WHERE id = :cid AND organization_id = :oid")
        db.execute(delete_query, {"cid": customer_id, "oid": org_id})
        db.commit()

        return {"message": "Customer permanently deleted."}

    except IntegrityError:
        db.rollback()
        # This error happens if the customer has Tickets/Transactions linked to them
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete this customer because they have Ticket history. Please use 'Deactivate' instead."
        )
    except Exception as e:
        db.rollback()
        print(f"Error deleting customer: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete customer.")