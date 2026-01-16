import os
from typing import Dict, Any, Optional  # ✅ Added this line
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from psycopg2.errorcodes import UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION # Optional for better error handling
from datetime import timedelta, datetime, timezone
from typing import List
from models import AuditLog  # <--- ✅ ADD THIS LINE


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



class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str = Field(..., description="Role must be one of the allowed staff roles")

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    
class OrganizationSettingsResponse(BaseModel):
    # ... existing fields ...
    receipt_header: Optional[str] = None
    receipt_footer: Optional[str] = None
    
    # ✅ Starch Pricing Fields
    starch_price_light: float = 0.0
    starch_price_medium: float = 0.0
    starch_price_heavy: float = 0.0
    starch_price_extra_heavy: float = 0.0
    
    
class WorkerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None  # ✅ Added Email
    phone: Optional[str] = None
    role: Optional[str] = None
    is_deactivated: Optional[bool] = None
    
class AuditLogResponse(BaseModel):
    id: int
    actor_name: Optional[str]
    actor_role: Optional[str]
    action: str
    ticket_id: Optional[int]
    customer_id: Optional[int]
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True # Allows reading from SQLAlchemy model
        
        
router = APIRouter()

@router.get("/workers")
async def get_all_workers(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves all workers for the organization.
    Includes 'is_deactivated' status so the UI can grey them out.
    Excludes users with the role 'customer'.
    """
    org_id = payload.get("organization_id")
    role = payload.get("role")

    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )

    # Allow access only to Org Owners and Platform Admins
    if role not in ["org_owner", "store_admin", "STORE_OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view workers."
        )

    try:
        # ✅ MODIFIED: Added check to exclude 'customer' role
        query = text("""
            SELECT 
                id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                role, 
                organization_id, 
                joined_at,
                is_deactivated 
            FROM allUsers
            WHERE organization_id = :org_id
            AND role != 'customer'
        """)
        
        results = db.execute(query, {"org_id": org_id}).fetchall()

        # Convert to list of dicts
        workers = [dict(row._mapping) for row in results]
        return workers

    except Exception as e:
        print("Error fetching workers:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workers."
        )


@router.put("/workers/{worker_id}")
async def update_worker(
    worker_id: str,
    worker_data: WorkerUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Updates details of a specific worker.
    - RESTRICTION: Only 'org_owner' can change the 'role' of a worker.
    - RESTRICTION: Cannot update users with the role 'customer'.
    """
    org_id = payload.get("organization_id")
    current_user_role = payload.get("role") # Renamed for clarity

    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID missing.")

    # 1. General Access: Org Owners and Store Admins can enter this route
    if current_user_role not in ["org_owner", "store_admin", "STORE_OWNER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    # ✅ NEW SECURITY CHECK: Prevent Role Escalation
    # If the user is trying to change the 'role' field...
    if worker_data.role is not None:
        # ...we strictly ensure the requester is the 'org_owner'
        if current_user_role not in ["org_owner", "STORE_OWNER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Organization Owners are allowed to change worker roles."
            )

    try:
        # 2. Verify target worker exists, belongs to Org, and is NOT a customer
        check_query = text("""
            SELECT id FROM allUsers 
            WHERE id = :worker_id 
            AND organization_id = :org_id
            AND role != 'customer'
        """)
        
        target_worker = db.execute(check_query, {
            "worker_id": worker_id, 
            "org_id": org_id
        }).fetchone()

        if not target_worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found or cannot be edited."
            )

        # 3. Dynamic SQL Construction
        update_data = worker_data.dict(exclude_unset=True)

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        set_clause = ", ".join([f"{key} = :{key}" for key in update_data.keys()])
        
        params = update_data.copy()
        params["worker_id"] = worker_id

        update_stmt = text(f"""
            UPDATE allUsers
            SET {set_clause}
            WHERE id = :worker_id
        """)

        db.execute(update_stmt, params)
        db.commit()

        return {
            "message": "Worker updated successfully", 
            "updated_fields": list(update_data.keys())
        }

    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email address is already in use by another user."
            )
        else:
            raise HTTPException(status_code=400, detail="Database integrity error.")

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Error updating worker:", e)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update worker."
        )

@router.get("/organizations/all")
async def get_all_organizations(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns a list of all registered organizations with key details.
    Access restricted to platform_admins.
    """
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can view all organizations."
        )

    try:
        query = text("""
            SELECT id, name, industry, created_at
            FROM organizations
            ORDER BY id DESC
        """)
        results = db.execute(query).fetchall()

        return {
            "total_organizations": len(results),
            "organizations": [
                {
                    "id": row.id,
                    "name": row.name,
                    "industry": row.industry,
                    "created_at": str(row.created_at)
                }
                for row in results
            ]
        }
    except Exception as e:
        print("Error fetching organizations:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch organizations."
        )


# =========================
# Route: Get all users
# =========================
@router.get("/all-users")
async def get_all_users(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns a list of all users in the system with their key details and UUIDs.
    Accessible only to platform_admins.
    """
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can view all users."
        )

    try:
        query = text("""
            SELECT id, uuid, first_name, last_name, email, role, organization_id, created_at
            FROM allUsers
            ORDER BY id DESC
        """)
        users = db.execute(query).fetchall()

        return {
            "total_users": len(users),
            "users": [
                {
                    "id": u.id,
                    "uuid": str(u.uuid),
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "email": u.email,
                    "role": u.role,
                    "organization_id": u.organization_id,
                    "created_at": str(u.created_at)
                }
                for u in users
            ]
        }
    except Exception as e:
        print("Error fetching users:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch all users."
        )



# =========================
# PUT: Update organization
# =========================
@router.put("/organizations/{org_id}")
async def update_organization(
    org_id: int,
    data: Dict[str, Any],  # expects {"name": ..., "industry": ...}
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can update organizations."
        )

    try:
        update_stmt = text("""
            UPDATE organizations
            SET name = :name,
                industry = :industry
            WHERE id = :org_id
        """)
        db.execute(update_stmt, {
            "name": data.get("name"),
            "industry": data.get("industry"),
            "org_id": org_id
        })
        db.commit()
        return {"message": f"Organization {org_id} updated successfully."}
    except Exception as e:
        db.rollback()
        print("Error updating organization:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization."
        )

# =========================
# DELETE: Organization
# =========================
@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can delete organizations."
        )

    try:
        delete_stmt = text("DELETE FROM organizations WHERE id = :org_id")
        db.execute(delete_stmt, {"org_id": org_id})
        db.commit()
        return {"message": f"Organization {org_id} deleted successfully."}
    except Exception as e:
        db.rollback()
        print("Error deleting organization:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete organization."
        )

# =========================
# PUT: Update User
# =========================
@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    requester_role = payload.get("role")
    
    # Permission Check
    if requester_role not in ["org_owner", "store_admin", "store_owner"]:
        raise HTTPException(status_code=403, detail="Only Admins/Owners can update users.")

    data = user_data.dict(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    try:
        # Build dynamic SQL
        set_clauses = [f"{key} = :{key}" for key in data.keys()]
        query_str = f"UPDATE allUsers SET {', '.join(set_clauses)} WHERE id = :user_id"

        update_stmt = text(query_str)
        # Add user_id to the parameters
        data["user_id"] = user_id

        result = db.execute(update_stmt, data)
        db.commit()
        
        if result.rowcount == 0:
             raise HTTPException(status_code=404, detail="User not found.")

        return {"message": f"User {user_id} updated successfully."}
    except Exception as e:
        db.rollback()
        print("Error updating user:", e)
        raise HTTPException(status_code=500, detail="Failed to update user.")

# =========================
# DELETE: Soft Delete (Deactivate)
# =========================
@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    ✅ MODIFIED: Instead of deleting the row, we set is_deactivated = TRUE.
    Also allows Org Owners to perform this action (previously restricted to Platform Admin).
    """
    requester_role = payload.get("role")
    org_id = payload.get("organization_id")

    # 1. Allow Org Owners AND Platform Admins to deactivate
    if requester_role not in ["org_owner", "store_admin", "STORE_OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to deactivate users."
        )

    try:
        # 2. Perform Soft Delete (Update)
        # We also check organization_id to ensure Owners don't deactivate users from other orgs
        if requester_role == PLATFORM_ADMIN_ROLE:
            # Platform admin can deactivate anyone
            stmt = text("UPDATE allUsers SET is_deactivated = TRUE WHERE id = :user_id")
            params = {"user_id": user_id}
        else:
            # Org Owners can only deactivate their own staff
            stmt = text("""
                UPDATE allUsers 
                SET is_deactivated = TRUE 
                WHERE id = :user_id AND organization_id = :org_id
            """)
            params = {"user_id": user_id, "org_id": org_id}

        result = db.execute(stmt, params)
        db.commit()

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found or does not belong to your organization.")

        return {"message": f"User {user_id} has been deactivated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("Error deactivating user:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user."
        )

# =========================
# PATCH: Reactivate User (New)
# =========================
@router.patch("/users/{user_id}/reactivate")
async def reactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    ✅ NEW: Allows reactivating a previously deactivated user.
    """
    requester_role = payload.get("role")
    org_id = payload.get("organization_id")

    if requester_role not in ["org_owner", "store_admin", "STORE_OWNER"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    try:
        if requester_role == PLATFORM_ADMIN_ROLE:
            stmt = text("UPDATE allUsers SET is_deactivated = FALSE WHERE id = :user_id")
            params = {"user_id": user_id}
        else:
            stmt = text("""
                UPDATE allUsers 
                SET is_deactivated = FALSE 
                WHERE id = :user_id AND organization_id = :org_id
            """)
            params = {"user_id": user_id, "org_id": org_id}

        result = db.execute(stmt, params)
        db.commit()

        if result.rowcount == 0:
             raise HTTPException(status_code=404, detail="User not found.")

        return {"message": f"User {user_id} has been reactivated."}

    except Exception as e:
        db.rollback()
        print("Error reactivating user:", e)
        raise HTTPException(status_code=500, detail="Failed to reactivate user.")
    
    
@router.get("/settings", response_model=OrganizationSettingsResponse)
def get_organization_settings(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    
    query = text("""
        SELECT 
            receipt_header, receipt_footer,
            COALESCE(starch_price_light, 0.00) as starch_price_light,
            COALESCE(starch_price_medium, 0.00) as starch_price_medium,
            COALESCE(starch_price_heavy, 0.00) as starch_price_heavy,
            COALESCE(starch_price_extra_heavy, 0.00) as starch_price_extra_heavy
        FROM organization_settings 
        WHERE organization_id = :org_id
    """)
    
    settings = db.execute(query, {"org_id": org_id}).fetchone()
    
    # Return defaults if settings haven't been created yet
    if not settings:
        return {
            "starch_price_light": 0.0,
            "starch_price_medium": 0.0,
            "starch_price_heavy": 0.0,
            "starch_price_extra_heavy": 0.0
        }
        
    return dict(settings._mapping)



@router.get("/audit-logs", response_model=List[AuditLogResponse], summary="Get Audit Logs for Organization")
def get_organization_audit_logs(
    limit: int = Query(50, ge=1, le=500, description="Max logs to return"),
    skip: int = Query(0, ge=0, description="Number of logs to skip (pagination)"),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    # 1. Security Context
    organization_id = payload.get("organization_id")
    user_role = payload.get("role")

    # 2. Authorization
    allowed_roles = ["org_owner", "STORE_OWNER", "store_admin", "store_manager"]
    if user_role not in allowed_roles:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Insufficient permissions to view audit logs."
        )

    if not organization_id:
        raise HTTPException(status_code=401, detail="Organization ID missing from token.")

    # 3. Query the Database
    # We fetch the raw objects first
    logs = db.query(AuditLog)\
        .filter(AuditLog.organization_id == organization_id)\
        .order_by(AuditLog.created_at.desc())\
        .limit(limit)\
        .offset(skip)\
        .all()

    # 4. FIX THE DATA TYPES
    # This loop ensures that even if 'details' is a string in the DB, 
    # it is returned as a Dict to satisfy the Pydantic model.
    processed_logs = []
    for log in logs:
        # Create a dictionary version of the log
        log_dict = {
            "id": log.id,
            "organization_id": log.organization_id,
            "actor_id": log.actor_id,
            "actor_name": log.actor_name,
            "actor_role": log.actor_role,
            "action": log.action,
            "created_at": log.created_at,
            "ticket_id": log.ticket_id,
            "customer_id": log.customer_id
        }

        # Check if details is a string (legacy data) or actual JSON/Dict
        if isinstance(log.details, str):
            log_dict["details"] = {"message": log.details}
        elif log.details is None:
            log_dict["details"] = {}
        else:
            log_dict["details"] = log.details

        processed_logs.append(log_dict)

    return processed_logs