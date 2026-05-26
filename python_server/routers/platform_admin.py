from datetime import timedelta, date
from typing import Dict, Any, List, Optional, Literal
from enum import Enum
from fastapi import APIRouter, HTTPException, Depends, status, Query, BackgroundTasks, Request, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field

# Import your existing utilities
from utils.common import (
    get_db, 
    get_current_user_payload, 
    create_access_token,
    hash_password,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    TicketCreate,
    RackAssignmentRequest,
    TicketPickupRequest,
    CustomerUpdate,
    AlterationTypeCreate
)

from .org_functions import (
    get_racks_for_organization, 
    get_alteration_types, 
    create_alteration_type, 
    update_alteration_type, 
    delete_alteration_type,
    register_customer,
    get_tickets_for_organization,
    create_ticket,
    validate_ticket_number as validate_ticket_org
)
from .clothing_types import get_clothing_types_for_organization
from .org_functions2 import (
    search_tickets, 
    validate_ticket_number, 
    assign_rack_to_ticket, 
    process_ticket_pickup
)
from .org_functions3 import (
    get_customers, 
    get_customer_details, 
    update_customer, 
    search_customers,
    get_ticket_details, 
    find_tickets, 
    edit_ticket_items, 
    full_edit_ticket
)
from .org_functions4 import (
    toggle_void_ticket, 
    toggle_refund_ticket,
    get_dashboard_analytics, 
    get_chart_analytics, 
    get_analytics_stats, 
    get_analytics_ledger,
    get_customer_financials
)
from .org_functions5 import (
    get_customer_checkout_profile,
    get_dropoff_transactions, 
    get_rack_assignments,
    get_pickup_transactions, 
    get_clothing_transactions, 
    get_customer_transactions
)
from .org_functions6 import (
    get_my_branches, 
    batch_transfer_tickets,
    get_incoming_transfers, 
    batch_receive_tickets,
    get_plant_inventory, 
    get_transfer_tracker
)
from .org_settings import (
    get_organization_settings as get_org_settings, 
    update_branding, 
    get_branches,
    create_branch, 
    update_payment_methods as update_payment_config, 
    update_starch_prices,
    update_size_prices, 
    update_organization_profile as update_org_profile, 
    get_organization_address as get_org_address
)
# We might need to import some models from routers if not in common
# But let's try to keep it clean.

router = APIRouter(
    prefix="/platform-admin",
    tags=["Platform Admin"],
)

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

def resolve_org_id(
    target_org_id: int = Query(..., description="Target store org ID"),
    admin: Dict = Depends(verify_super_admin)
) -> Dict:
    modified = dict(admin)
    modified["organization_id"] = target_org_id
    modified["role"] = "org_owner"          # keep this so org handlers pass role checks
    modified["_platform_admin_proxy"] = True # bypass marker
    return modified

# --- PYDANTIC MODELS ---

class PlatformAdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

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
# 0. AUTHENTICATION
# ================================

@router.post("/auth/login")
def platform_admin_login(
    data: PlatformAdminLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Dedicated login for Platform Admins.
    Queries the 'platform_admins' table.
    """
    # 1. Fetch admin
    admin = db.execute(
        text("SELECT id, email, password_hash, role, is_super_admin FROM platform_admins WHERE email = :email"),
        {"email": data.email}
    ).fetchone()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # 2. Verify password
    if not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # 3. Update last_login
    db.execute(
        text("UPDATE platform_admins SET last_login = NOW() WHERE id = :id"),
        {"id": admin.id}
    )
    db.commit()

    # 4. Create Token
    token_data = {
        "sub": admin.email,
        "sub_id": admin.id,
        "role": admin.role,
        "is_super_admin": admin.is_super_admin,
        "source": "platform_admins"
    }
    
    access_token = create_access_token(
        data=token_data, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": admin.role
    }


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
        "inactive_stores": db.execute(text("SELECT COUNT(*) FROM organizations WHERE is_active = FALSE")).scalar(),
        "total_users": db.execute(text("SELECT COUNT(*) FROM allUsers")).scalar(),
        "total_customers": db.execute(text("SELECT COUNT(*) FROM allUsers WHERE role = 'customer'")).scalar(),
        "total_staff": db.execute(text("SELECT COUNT(*) FROM allUsers WHERE role != 'customer'")).scalar(),
        "total_tickets": db.execute(text("SELECT COUNT(*) FROM tickets")).scalar(),
        "total_revenue": db.execute(text("SELECT COALESCE(SUM(paid_amount), 0) FROM tickets")).scalar(),
        "tickets_this_month": db.execute(text("SELECT COUNT(*) FROM tickets WHERE created_at >= date_trunc('month', NOW())")).scalar(),
        "revenue_this_month": db.execute(text("SELECT COALESCE(SUM(paid_amount), 0) FROM tickets WHERE created_at >= date_trunc('month', NOW())")).scalar()
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

@router.get("/analytics/trends/monthly")
def get_platform_monthly_trends(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Returns last 12 months of platform-wide data (new stores, users, tickets, revenue).
    """
    query = text("""
        WITH months AS (
            SELECT TO_CHAR(generate_series(
                date_trunc('month', NOW()) - interval '11 months', 
                date_trunc('month', NOW()), 
                '1 month'
            ), 'YYYY-MM') AS month
        ),
        store_stats AS (
            SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as new_stores
            FROM organizations
            WHERE created_at >= date_trunc('month', NOW()) - interval '11 months'
            GROUP BY 1
        ),
        user_stats AS (
            SELECT TO_CHAR(joined_at, 'YYYY-MM') as month, COUNT(*) as new_users
            FROM allUsers
            WHERE joined_at >= date_trunc('month', NOW()) - interval '11 months'
            GROUP BY 1
        ),
        ticket_stats AS (
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month, 
                COUNT(*) as ticket_count,
                COALESCE(SUM(paid_amount), 0) as revenue
            FROM tickets
            WHERE created_at >= date_trunc('month', NOW()) - interval '11 months'
            GROUP BY 1
        )
        SELECT 
            m.month,
            COALESCE(s.new_stores, 0) as new_stores,
            COALESCE(u.new_users, 0) as new_users,
            COALESCE(t.ticket_count, 0) as ticket_count,
            COALESCE(t.revenue, 0) as revenue
        FROM months m
        LEFT JOIN store_stats s ON m.month = s.month
        LEFT JOIN user_stats u ON m.month = u.month
        LEFT JOIN ticket_stats t ON m.month = t.month
        ORDER BY m.month ASC
    """)
    
    results = db.execute(query).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/analytics/trends/stores")
def get_store_performance_trends(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Returns 30-day activity trends for every store.
    """
    query = text("""
        SELECT 
            o.name,
            o.is_active,
            (SELECT COUNT(*) FROM tickets t WHERE t.organization_id = o.id AND t.created_at >= NOW() - interval '30 days') as ticket_count_last_30_days,
            (SELECT COALESCE(SUM(paid_amount), 0) FROM tickets t WHERE t.organization_id = o.id AND t.created_at >= NOW() - interval '30 days') as revenue_last_30_days
        FROM organizations o
        ORDER BY ticket_count_last_30_days DESC
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
        SELECT o.id, o.name, o.phone, o.address, o.org_type, o.created_at, o.is_active,
               (SELECT email FROM allUsers WHERE organization_id = o.id AND role = 'org_owner' LIMIT 1) as owner_email,
               (SELECT COUNT(*) FROM tickets WHERE organization_id = o.id) as ticket_count,
               (SELECT COALESCE(SUM(paid_amount), 0) FROM tickets WHERE organization_id = o.id) as total_revenue
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

@router.delete("/stores/{store_id}")
def delete_store(
    store_id: int,
    force: bool = False,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Delete a store. 
    If force=False, checks for ticket history first.
    If force=True, deletes all associated data including users, tickets, and logs.
    """
    try:
        # 1. Verify existence
        store = db.execute(text("SELECT id FROM organizations WHERE id = :id"), {"id": store_id}).fetchone()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

        # 2. Check for ticket history if not forcing
        if not force:
            has_tickets = db.execute(
                text("SELECT 1 FROM tickets WHERE organization_id = :id LIMIT 1"), 
                {"id": store_id}
            ).fetchone()
            
            if has_tickets:
                raise HTTPException(
                    status_code=400, 
                    detail="Store has ticket history. Use force=true to delete or deactivate instead."
                )

        # 3. Perform Deletion
        params = {"id": store_id}
        
        # Cascaded delete in order to respect FK constraints
        # 3.1 Logs
        db.execute(text("DELETE FROM audit_logs WHERE organization_id = :id"), params)
        # 3.2 Racks
        db.execute(text("DELETE FROM racks WHERE organization_id = :id"), params)
        # 3.3 Clothing Types
        db.execute(text("DELETE FROM clothing_types WHERE organization_id = :id"), params)
        # 3.4 Ticket Items (must be before tickets)
        db.execute(text("""
            DELETE FROM ticket_items 
            WHERE ticket_id IN (SELECT id FROM tickets WHERE organization_id = :id)
        """), params)
        # 3.5 Tickets
        db.execute(text("DELETE FROM tickets WHERE organization_id = :id"), params)
        # 3.6 Settings
        db.execute(text("DELETE FROM organization_settings WHERE organization_id = :id"), params)
        # 3.7 Users
        db.execute(text("DELETE FROM allusers WHERE organization_id = :id"), params)
        # 3.8 Finally, the Organization itself
        db.execute(text("DELETE FROM organizations WHERE id = :id"), params)

        db.commit()
        return {"message": "Store and all associated data deleted", "store_id": store_id}

    except HTTPException:
        # Re-raise HTTP exceptions (like 404 or 400 from check)
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete store: {str(e)}")

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


# ================================
# 6. AUDIT LOG MANAGEMENT
# ================================

@router.get("/audit-logs")
def get_all_audit_logs(
    org_id: Optional[int] = None,
    action: Optional[str] = None,
    actor_role: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Returns all audit logs across all organizations.
    """
    query_str = """
        SELECT 
            al.id, 
            al.organization_id, 
            o.name as organization_name, 
            al.actor_id, 
            al.actor_name, 
            al.actor_role, 
            al.action, 
            al.details, 
            al.created_at, 
            al.ticket_id, 
            al.customer_id
        FROM audit_logs al
        LEFT JOIN organizations o ON al.organization_id = o.id
        WHERE 1=1
    """
    params = {"limit": limit, "offset": offset}

    if org_id:
        query_str += " AND al.organization_id = :org_id"
        params["org_id"] = org_id
    if action:
        query_str += " AND al.action = :action"
        params["action"] = action
    if actor_role:
        query_str += " AND al.actor_role = :actor_role"
        params["actor_role"] = actor_role
    if date_from:
        query_str += " AND al.created_at >= :date_from"
        params["date_from"] = date_from
    if date_to:
        query_str += " AND al.created_at <= :date_to"
        params["date_to"] = date_to

    query_str += " ORDER BY al.created_at DESC LIMIT :limit OFFSET :offset"
    
    logs = db.execute(text(query_str), params).fetchall()
    return [dict(row._mapping) for row in logs]



@router.get("/proxy/racks", tags=["Platform Admin — Store Proxy"])
async def proxy_get_racks(
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    query = text("""
        SELECT r.id, r.organization_id, r.number, r.is_occupied, 
               r.ticket_id, r.updated_at
        FROM racks r
        WHERE r.organization_id = :org_id
        ORDER BY r.number ASC
    """)
    rows = db.execute(query, {"org_id": target_org_id}).fetchall()
    return {"racks": [dict(r._mapping) for r in rows]}

# -- CLOTHING TYPES --

@router.get("/proxy/clothing-types", tags=["Platform Admin — Store Proxy"])
async def proxy_get_clothing_types(
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    query = text("""
        SELECT id, name, plant_price, margin, total_price, 
               image_url, organization_id, created_at, pieces, category
        FROM clothing_types
        WHERE organization_id = :org_id
        ORDER BY category ASC, name ASC
    """)
    rows = db.execute(query, {"org_id": target_org_id}).fetchall()
    from collections import OrderedDict
    grouped = {}
    for r in rows:
        cat = r.category or "Uncategorized"
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(dict(r._mapping))
    return dict(OrderedDict(sorted(grouped.items())))

# -- ALTERATION TYPES --

@router.get("/proxy/alteration-types", tags=["Platform Admin — Store Proxy"])
async def proxy_get_alteration_types(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_alteration_types(db=db, payload=payload)

@router.post("/proxy/alteration-types", tags=["Platform Admin — Store Proxy"])
async def proxy_create_alteration_type(data: AlterationTypeCreate, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await create_alteration_type(data=data, db=db, payload=payload)

@router.patch("/proxy/alteration-types/{alt_id}", tags=["Platform Admin — Store Proxy"])
async def proxy_update_alteration_type(alt_id: int, data: AlterationTypeCreate, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await update_alteration_type(alt_id=alt_id, data=data, db=db, payload=payload)

@router.delete("/proxy/alteration-types/{alt_id}", tags=["Platform Admin — Store Proxy"])
async def proxy_delete_alteration_type(alt_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await delete_alteration_type(alt_id=alt_id, db=db, payload=payload)

# -- CUSTOMERS --

@router.get("/proxy/customers", tags=["Platform Admin — Store Proxy"])
async def proxy_get_customers(
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    query = text("""
        SELECT id, first_name, last_name, email, phone, 
               joined_at, is_deactivated, address
        FROM allusers
        WHERE organization_id = :org_id AND role = 'customer'
          AND is_deactivated = FALSE
        ORDER BY first_name ASC
    """)
    rows = db.execute(query, {"org_id": target_org_id}).fetchall()
    return [dict(r._mapping) for r in rows]

@router.get("/proxy/customers/search", tags=["Platform Admin — Store Proxy"])
def proxy_search_customers(
    q: str = Query(default="", min_length=2, description="Search term (name, phone, or email)"),
    db: Session = Depends(get_db),
    payload: Dict = Depends(resolve_org_id)
):
    """
    Search customers by name, phone, or email within the target organization.
    Returns first_name and last_name as separate fields for frontend display.
    """
    org_id = payload.get("organization_id")
    pattern = f"%{q}%"

    rows = db.execute(text("""
        SELECT id, first_name, last_name, phone, email, address, joined_at, is_deactivated
        FROM allusers
        WHERE organization_id = :org_id
          AND role = 'customer'
          AND is_deactivated = FALSE
          AND (
              (first_name || ' ' || COALESCE(last_name, '')) ILIKE :pattern
              OR phone ILIKE :pattern
              OR email ILIKE :pattern
          )
        ORDER BY first_name ASC
        LIMIT 50
    """), {"org_id": org_id, "pattern": pattern}).fetchall()

    return [
        {
            "id": r.id,
            "first_name": r.first_name or "",
            "last_name": r.last_name or "",
            "phone": r.phone,
            "email": r.email,
            "address": r.address,
            "joined_at": r.joined_at,
            "is_deactivated": r.is_deactivated,
        }
        for r in rows
    ]

@router.get("/proxy/customers/{customer_id}", tags=["Platform Admin — Store Proxy"])
def proxy_get_customer_details(customer_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return get_customer_details(customer_id=customer_id, db=db, payload=payload)

@router.post("/proxy/customers", tags=["Platform Admin — Store Proxy"])
async def proxy_create_customer(
    data: dict,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin),
    target_org_id: int = Query(...)
):
    from utils.common import hash_password
    import secrets
    email = data.get("email")
    if email:
        exists = db.execute(text("SELECT 1 FROM allusers WHERE email = :email AND organization_id = :org_id"),
            {"email": email, "org_id": target_org_id}).fetchone()
        if exists:
            raise HTTPException(status_code=400, detail="Customer already exists.")
    user_id = db.execute(text("""
        INSERT INTO allusers (organization_id, first_name, last_name, email, phone, 
                              address, role, password_hash, joined_at, is_deactivated)
        VALUES (:org_id, :fname, :lname, :email, :phone, :address, 
                'customer', :pw, NOW(), FALSE)
        RETURNING id
    """), {
        "org_id": target_org_id, "fname": data.get("first_name"), 
        "lname": data.get("last_name"), "email": data.get("email"),
        "phone": data.get("phone", ""), "address": data.get("address", ""),
        "pw": hash_password(secrets.token_hex(16))
    }).scalar()
    db.commit()
    return {"message": "Customer created.", "customer_id": user_id}

# --- ADD CUSTOMER REGISTRATION PROXY ---
@router.post("/proxy/customers/register", tags=["Platform Admin — Store Proxy"])
async def proxy_register_customer(
    data: Request, 
    db: Session = Depends(get_db), 
    payload: dict = Depends(resolve_org_id)
):
    """
    Proxies customer registration to the targeted organization context.
    Parses the raw request body into a NewCustomerRequest before delegating.
    """
    from .org_functions import register_customer, NewCustomerRequest
    body = await data.json()
    customer_data = NewCustomerRequest(**body)
    return await register_customer(data=customer_data, db=db, payload=payload)

@router.put("/proxy/customers/{customer_id}", tags=["Platform Admin — Store Proxy"])
def proxy_update_customer(customer_id: int, data: CustomerUpdate, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return update_customer(customer_id=customer_id, data=data, db=db, payload=payload)

# -- TICKETS --

@router.get("/proxy/tickets", tags=["Platform Admin — Store Proxy"])
async def proxy_get_tickets(
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    query = text("""
        SELECT t.id, t.ticket_number, t.customer_id, t.status, 
               t.total_amount, t.paid_amount, t.rack_number,
               t.special_instructions, t.pickup_date, t.created_at,
               t.is_void, t.is_refunded,
               CONCAT(u.first_name, ' ', u.last_name) as customer_name,
               u.phone as customer_phone
        FROM tickets t
        LEFT JOIN allusers u ON t.customer_id = u.id
        WHERE t.organization_id = :org_id
        ORDER BY t.created_at DESC
        LIMIT 200
    """)
    rows = db.execute(query, {"org_id": target_org_id}).fetchall()
    return [dict(r._mapping) for r in rows]

# --- UPDATE OR REPLACE TICKET CREATION PROXY ---
@router.post("/proxy/tickets", tags=["Platform Admin — Store Proxy"])
async def proxy_create_ticket(
    data: Request, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    payload: dict = Depends(resolve_org_id)
):
    """
    Proxies ticket creation to the targeted organization context.
    """
    from .org_functions import create_ticket
    from utils.common import TicketCreate
    import inspect
    
    # 1. Capture the raw dictionary payload directly from the front-end
    body_json = await data.json()
    
    # 2. Extract or remove fields that might trigger errors in structural code dependencies
    # Remove 'rack_number' if your create_ticket doesn't want it in the pydantic model context
    rack_number = body_json.pop("rack_number", None)
    
    # 3. Create the Pydantic validator representation using the cleaned up dictionary map
    ticket_data = TicketCreate(**body_json)
    
    # 4. Invoke create_ticket dynamically to match whatever signature parameters the backend function expects (e.g. ticket_data/ticket_req, background_tasks, sync/async coroutines)
    sig = inspect.signature(create_ticket)
    kwargs = {"db": db, "payload": payload}
    
    ticket_param = "ticket_data"
    for name in sig.parameters:
        if name in ("ticket_req", "ticket_data", "ticket"):
            ticket_param = name
            break
    kwargs[ticket_param] = ticket_data
    
    if "background_tasks" in sig.parameters:
        kwargs["background_tasks"] = background_tasks
        
    if inspect.iscoroutinefunction(create_ticket):
        return await create_ticket(**kwargs)
    else:
        return create_ticket(**kwargs)

@router.get("/proxy/tickets/search", tags=["Platform Admin — Store Proxy"])
async def proxy_search_tickets(q: str = "", db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await search_tickets(q=q, db=db, payload=payload)

@router.get("/proxy/tickets/validate/{ticket_number}", tags=["Platform Admin — Store Proxy"])
async def proxy_validate_ticket(
    ticket_number: str,
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    row = db.execute(text("""
        SELECT t.id as ticket_id, t.ticket_number,
               CONCAT(u.first_name, ' ', u.last_name) as customer_name,
               t.total_amount, t.paid_amount,
               (t.total_amount - t.paid_amount) as balance_due
        FROM tickets t
        LEFT JOIN allusers u ON t.customer_id = u.id
        WHERE t.ticket_number = :tn AND t.organization_id = :org_id
    """), {"tn": ticket_number, "org_id": target_org_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return dict(row._mapping)

@router.get("/proxy/tickets/{ticket_id}", tags=["Platform Admin — Store Proxy"])
async def proxy_get_ticket_detail(
    ticket_id: int,
    target_org_id: int = Query(...),
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    ticket = db.execute(text("""
        SELECT t.*, CONCAT(u.first_name, ' ', u.last_name) as customer_name,
               u.phone as customer_phone
        FROM tickets t
        LEFT JOIN allusers u ON t.customer_id = u.id
        WHERE t.id = :tid AND t.organization_id = :org_id
    """), {"tid": ticket_id, "org_id": target_org_id}).fetchone()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    items = db.execute(text("""
        SELECT ti.*, ct.name as clothing_name
        FROM ticket_items ti
        LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
        WHERE ti.ticket_id = :tid
    """), {"tid": ticket_id}).fetchall()
    result = dict(ticket._mapping)
    result["items"] = [dict(i._mapping) for i in items]
    return result

@router.put("/proxy/tickets/{ticket_id}/rack", tags=["Platform Admin — Store Proxy"])
async def proxy_assign_rack(
    ticket_id: int,
    data: RackAssignmentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    payload: Dict = Depends(resolve_org_id)
):
    return await assign_rack_to_ticket(
        ticket_id=ticket_id,
        req=data,
        background_tasks=background_tasks,
        db=db,
        payload=payload
    )

@router.put("/proxy/tickets/{ticket_id}/pickup", tags=["Platform Admin — Store Proxy"])
async def proxy_pickup(
    ticket_id: int,
    data: TicketPickupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin),
    target_org_id: int = Query(...),
):
    """
    Platform-admin pickup proxy.
    - Accepts payment regardless of current ticket status.
    - Sets status to 'picked_up' when fully paid.
    - Clears the rack (is_occupied=false, ticket_id=NULL) on full pickup.
    """
    import decimal
    from datetime import datetime

    # 1. Fetch ticket
    ticket = db.execute(text("""
        SELECT t.id, t.total_amount, t.paid_amount, t.status, t.rack_number,
               CONCAT(u.first_name, ' ', u.last_name) as customer_name
        FROM tickets t
        LEFT JOIN allusers u ON t.customer_id = u.id
        WHERE t.id = :tid AND t.organization_id = :org_id
    """), {"tid": ticket_id, "org_id": target_org_id}).fetchone()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    if ticket.status == "picked_up":
        raise HTTPException(
            status_code=400,
            detail="This ticket has already been picked up."
        )

    # 2. Calculate financials using stored total_amount
    final_total = decimal.Decimal(str(ticket.total_amount or 0))
    # Note: ticket.total_amount already includes env charge and tax as stored in the DB.
    # We still retrieve subtotal for possible future extensions but do not use it for payment comparison.
    items = db.execute(text("""
        SELECT COALESCE(SUM(item_total), 0) as subtotal
        FROM ticket_items WHERE ticket_id = :tid
    """), {"tid": ticket_id}).fetchone()
    subtotal = decimal.Decimal(str(items.subtotal or 0))

    current_paid = decimal.Decimal(str(ticket.paid_amount or 0))
    amount_paying_now = decimal.Decimal(str(data.amount_paid))

    if amount_paying_now < decimal.Decimal("0"):
        raise HTTPException(status_code=400, detail="Payment amount cannot be negative.")

    new_total_paid = min(current_paid + amount_paying_now, final_total)
    is_fully_paid = new_total_paid >= (final_total - decimal.Decimal("0.01"))

    new_status = "picked_up" if is_fully_paid else ticket.status
    pickup_date_value = datetime.now() if is_fully_paid else None

    # 3. Update ticket
    db.execute(text("""
        UPDATE tickets
        SET status = :status,
            paid_amount = :paid_amount,
            pickup_date = COALESCE(:pickup_date, pickup_date)
        WHERE id = :tid AND organization_id = :org_id
    """), {
        "status": new_status,
        "paid_amount": float(new_total_paid),
        "pickup_date": pickup_date_value,
        "tid": ticket_id,
        "org_id": target_org_id
    })

    # 4. Free rack if fully paid
    if is_fully_paid and ticket.rack_number:
        db.execute(text("""
            UPDATE racks
            SET is_occupied = false, ticket_id = NULL
            WHERE number = :rack_number AND organization_id = :org_id
        """), {"rack_number": ticket.rack_number, "org_id": target_org_id})

    db.commit()

    return {
        "success": True,
        "ticket_id": ticket_id,
        "new_status": new_status,
        "new_total_paid": float(new_total_paid),
        "rack_cleared": is_fully_paid and ticket.rack_number is not None,
        "message": (
            f"Ticket picked up successfully. Rack #{ticket.rack_number} freed."
            if is_fully_paid and ticket.rack_number
            else "Pickup processed." if is_fully_paid
            else f"Partial payment recorded. Balance remaining: ${float(final_total - new_total_paid):.2f}"
        )
    }

@router.patch("/proxy/tickets/{ticket_id}/void", tags=["Platform Admin — Store Proxy"])
async def proxy_void_ticket(ticket_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await toggle_void_ticket(ticket_id=ticket_id, db=db, payload=payload)

@router.patch("/proxy/tickets/{ticket_id}/refund", tags=["Platform Admin — Store Proxy"])
async def proxy_refund_ticket(ticket_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await toggle_refund_ticket(ticket_id=ticket_id, db=db, payload=payload)

@router.put("/proxy/tickets/{ticket_id}/items", tags=["Platform Admin — Store Proxy"])
async def proxy_edit_ticket_items(ticket_id: int, data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await edit_ticket_items(ticket_id=ticket_id, request=data, db=db, payload=payload)

# -- ANALYTICS --

@router.get("/proxy/analytics/dashboard", tags=["Platform Admin — Store Proxy"])
async def proxy_analytics_dashboard(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_dashboard_analytics(db=db, payload=payload)

@router.get("/proxy/analytics/charts", tags=["Platform Admin — Store Proxy"])
async def proxy_analytics_charts(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_chart_analytics(db=db, payload=payload)

@router.get("/proxy/analytics/stats", tags=["Platform Admin — Store Proxy"])
async def proxy_analytics_stats(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_analytics_stats(db=db, payload=payload)

@router.get("/proxy/analytics/ledger", tags=["Platform Admin — Store Proxy"])
async def proxy_analytics_ledger(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_analytics_ledger(db=db, payload=payload)

# -- CUSTOMER FINANCIALS --

@router.get("/proxy/customers/{customer_id}/financials", tags=["Platform Admin — Store Proxy"])
async def proxy_customer_financials(customer_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_customer_financials(customer_id=customer_id, db=db, payload=payload)

@router.get("/proxy/customers/{customer_id}/checkout-profile", tags=["Platform Admin — Store Proxy"])
def proxy_checkout_profile(customer_id: int, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return get_customer_checkout_profile(customer_id=customer_id, db=db, payload=payload)

# -- TRANSACTION HISTORY --

@router.get("/proxy/analytics/transactions/dropoffs", tags=["Platform Admin — Store Proxy"])
async def proxy_tx_dropoffs(limit: int = 100, offset: int = 0, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_dropoff_transactions(limit=limit, offset=offset, db=db, payload=payload)

@router.get("/proxy/analytics/transactions/pickups", tags=["Platform Admin — Store Proxy"])
async def proxy_tx_pickups(limit: int = 100, offset: int = 0, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_pickup_transactions(limit=limit, offset=offset, db=db, payload=payload)

@router.get("/proxy/analytics/transactions/rack-assignments", tags=["Platform Admin — Store Proxy"])
async def proxy_tx_racks(limit: int = 100, offset: int = 0, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_rack_assignments(limit=limit, offset=offset, db=db, payload=payload)

@router.get("/proxy/analytics/transactions/clothing", tags=["Platform Admin — Store Proxy"])
async def proxy_tx_clothing(limit: int = 100, offset: int = 0, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_clothing_transactions(limit=limit, offset=offset, db=db, payload=payload)

@router.get("/proxy/analytics/transactions/customers", tags=["Platform Admin — Store Proxy"])
async def proxy_tx_customers(limit: int = 100, offset: int = 0, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_customer_transactions(limit=limit, offset=offset, db=db, payload=payload)

# -- TRANSFERS --

@router.get("/proxy/my-branches", tags=["Platform Admin — Store Proxy"])
def proxy_my_branches(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return get_my_branches(db=db, payload=payload)

@router.post("/proxy/tickets/batch-transfer", tags=["Platform Admin — Store Proxy"])
async def proxy_batch_transfer(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await batch_transfer_tickets(request=data, db=db, payload=payload)

@router.get("/proxy/incoming", tags=["Platform Admin — Store Proxy"])
async def proxy_incoming_transfers(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_incoming_transfers(db=db, payload=payload)

@router.post("/proxy/batch-receive", tags=["Platform Admin — Store Proxy"])
async def proxy_batch_receive(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await batch_receive_tickets(request=data, db=db, payload=payload)

@router.get("/proxy/plant/inventory", tags=["Platform Admin — Store Proxy"])
async def proxy_plant_inventory(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_plant_inventory(db=db, payload=payload)

@router.get("/proxy/tickets-transfer-tracker", tags=["Platform Admin — Store Proxy"])
async def proxy_transfer_tracker(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_transfer_tracker(db=db, payload=payload)

# -- ORG SETTINGS --

@router.get("/proxy/settings", tags=["Platform Admin — Store Proxy"])
async def proxy_get_settings(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_org_settings(db=db, payload=payload)

@router.put("/proxy/settings/branding", tags=["Platform Admin — Store Proxy"])
async def proxy_update_branding(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await update_branding(request=data, db=db, payload=payload)

@router.get("/proxy/settings/branches", tags=["Platform Admin — Store Proxy"])
def proxy_get_branches(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return get_branches(db=db, payload=payload)

@router.post("/proxy/settings/branches", tags=["Platform Admin — Store Proxy"])
async def proxy_create_branch(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await create_branch(request=data, db=db, payload=payload)

@router.put("/proxy/settings/starch-prices", tags=["Platform Admin — Store Proxy"])
async def proxy_starch_prices(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await update_starch_prices(request=data, db=db, payload=payload)

@router.put("/proxy/settings/size-prices", tags=["Platform Admin — Store Proxy"])
async def proxy_size_prices(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await update_size_prices(request=data, db=db, payload=payload)

@router.put("/proxy/settings/organization/profile", tags=["Platform Admin — Store Proxy"])
async def proxy_org_profile(data: Request, db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await update_org_profile(request=data, db=db, payload=payload)

@router.get("/proxy/settings/organization/address", tags=["Platform Admin — Store Proxy"])
async def proxy_org_address(db=Depends(get_db), payload=Depends(resolve_org_id)):
    return await get_org_address(db=db, payload=payload)
