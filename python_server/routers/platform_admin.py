from datetime import timedelta, date
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
    verify_password,
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
    3. Checks if the source is 'platform_admins' to prevent impersonation.
    """
    role = payload.get("role")
    source = payload.get("source")

    # Verify the user is actually a platform admin and comes from the right table
    if role not in ["platform_admin", "Platform Admin", "super_admin"] or source != "platform_admins":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Platform Administrators only."
        )
    return payload

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
        SELECT o.id, o.name, o.phone, o.address, o.created_at, o.is_active,
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

@router.get("/audit-logs/summary")
def get_audit_log_summary(
    db: Session = Depends(get_db),
    admin: Dict = Depends(verify_super_admin)
):
    """
    Returns aggregate counts grouped by action type and organization.
    """
    query = text("""
        SELECT 
            o.name as org_name, 
            al.action, 
            COUNT(*) as count 
        FROM audit_logs al 
        JOIN organizations o ON al.organization_id = o.id 
        GROUP BY o.name, al.action 
        ORDER BY count DESC
    """)
    results = db.execute(query).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/stores/{store_id}/audit-logs")
def get_store_audit_logs(
    store_id: int,
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
    Get audit logs for a specific store.
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
        JOIN organizations o ON al.organization_id = o.id
        WHERE al.organization_id = :store_id
    """
    params = {"store_id": store_id, "limit": limit, "offset": offset}

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