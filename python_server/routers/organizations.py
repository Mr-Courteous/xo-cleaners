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

router = APIRouter()

@router.get("/workers")
async def get_all_workers(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    ✅ Retrieve all workers that belong to the same organization as the logged-in user.
    ✅ Uses only the `allUsers` table.
    """
    org_id = payload.get("organization_id")
    role = payload.get("role")

    # Validate organization_id
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing in token."
        )

    # Restrict access to specific roles
    if role not in ["org_owner", "store_admin", "STORE_OWNER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view organization workers."
        )

    try:
        # ✅ Query only from allUsers
        workers_stmt = text("""
            SELECT id, first_name, last_name, email, role
            FROM allUsers
            WHERE organization_id = :org_id
            ORDER BY id DESC
        """)

        workers = db.execute(workers_stmt, {"org_id": org_id}).fetchall()

        # ✅ Return clean data (no organization info)
        return {
            "organization_id": org_id,
            "total_workers": len(workers),
            "workers": [
                {
                    "id": w.id,
                    "first_name": w.first_name,
                    "last_name": w.last_name,
                    "email": w.email,
                    "role": w.role,
                }
                for w in workers
            ]
        }

    except Exception as e:
        print("Error fetching workers:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch workers for this organization."
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
# PUT: Update user
# =========================
@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: Dict[str, Any],  # expects {"first_name": ..., "last_name": ..., "email": ..., "role": ...}
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can update users."
        )

    try:
        update_stmt = text("""
            UPDATE allUsers
            SET first_name = :first_name,
                last_name = :last_name,
                email = :email,
                role = :role
            WHERE id = :user_id
        """)
        db.execute(update_stmt, {
            "first_name": data.get("first_name"),
            "last_name": data.get("last_name"),
            "email": data.get("email"),
            "role": data.get("role"),
            "user_id": user_id
        })
        db.commit()
        return {"message": f"User {user_id} updated successfully."}
    except Exception as e:
        db.rollback()
        print("Error updating user:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user."
        )

# =========================
# DELETE: User
# =========================
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    if payload.get("role") != "platform_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Platform Admins can delete users."
        )

    try:
        delete_stmt = text("DELETE FROM allUsers WHERE id = :user_id")
        db.execute(delete_stmt, {"user_id": user_id})
        db.commit()
        return {"message": f"User {user_id} deleted successfully."}
    except Exception as e:
        db.rollback()
        print("Error deleting user:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user."
        )