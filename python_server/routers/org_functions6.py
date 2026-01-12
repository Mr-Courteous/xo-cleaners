from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

# --- IMPORTS FROM YOUR UTILS ---
from utils.common import (
    get_db, 
    get_current_user_payload
)


# 1. Define the Router
router = APIRouter(
    prefix="/api/organizations", 
    tags=["Organization Resources"]
)

@router.get("/my-branches", summary="Get all branches for the logged-in organization")
async def get_my_branches(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieves all sub-organizations (branches) linked to the 
    authenticated organization via the parent_org_id.
    """
    try:
        # 1. Extract the organization_id from the trusted token
        parent_id = payload.get("organization_id")

        if not parent_id:
            raise HTTPException(status_code=400, detail="Invalid token: Organization ID missing.")

        # 2. Query for all organizations that have this ID as their parent
        query = text("""
            SELECT id, name, org_type, owner_email, industry, created_at
            FROM organizations 
            WHERE parent_org_id = :parent_id
            ORDER BY name ASC
        """)
        
        result = db.execute(query, {"parent_id": parent_id}).fetchall()

        # 3. Format the result into a list of dictionaries
        branches = [
            {
                "id": row.id,
                "name": row.name,
                "org_type": row.org_type,
                "owner_email": row.owner_email,
                "industry": row.industry,
                "created_at": row.created_at.isoformat() if row.created_at else None
            }
            for row in result
        ]

        return branches

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch branches: {str(e)}")