import os
from typing import Dict, Any, Optional  # ✅ Added this line
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
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
    
router = APIRouter()

@router.get("/workers")
async def get_all_workers(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves all workers for the organization.
    Includes 'is_deactivated' status so the UI can grey them out.
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
        # ✅ MODIFIED: Added 'is_deactivated' to the SELECT statement
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