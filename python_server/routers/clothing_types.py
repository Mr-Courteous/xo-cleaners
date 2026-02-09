import os
from typing import Dict, Any, Optional, List
from collections import OrderedDict
from pydantic import BaseModel
from fastapi import (
    APIRouter, 
    HTTPException, 
    Depends, 
    status, 
    Form, 
    UploadFile, 
    File
)
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta, datetime, timezone

# -----------------------------------------------------------------
# 🎯 FIXED: Importing REAL dependencies from your utils.common
# -----------------------------------------------------------------
from utils.common import (
    get_db, 
    get_current_user_payload, 
    ALL_STAFF_ROLES, 
    ORG_OWNER_ROLE
)

# -----------------------------------------------------------------
# 📦 Vercel Blob Storage Integration
# -----------------------------------------------------------------
from utils.vercel_blob import (
    upload_to_vercel_blob,
    delete_from_vercel_blob,
    replace_vercel_blob
)




router = APIRouter(
    prefix="/api/clothing-types",
    tags=["Clothing Types (Organization-Specific)"]
)

class ClothingTypeResponse(BaseModel):
    """Pydantic model for returning clothing type data"""
    id: int
    name: str
    plant_price: float
    margin: float
    total_price: float
    image_url: Optional[str] = None
    organization_id: int
    created_at: datetime
    pieces: int
    category: Optional[str] = None  # <-- ADDED
    

# -----------------------------------------------------------------
# 📦 NOTE: File upload now uses Vercel Blob Storage
# The upload_to_vercel_blob function is imported from utils.vercel_blob
# -----------------------------------------------------------------


@router.get("", response_model=Dict[str, List[ClothingTypeResponse]], summary="Get all clothing types for *your* organization")
async def get_clothing_types_for_organization(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieve all clothing types associated with the logged-in user's organization,
    grouped by category and sorted alphabetically.
    """
    # This will now use your REAL payload
    if not payload:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    org_id = payload.get("organization_id")
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )
    

    try:
        print(f"[INFO] Fetching clothing types for org_id: {org_id}")
        
        # --- MODIFIED: Fetch with category included and sorted by category ---
        stmt = text("""
            SELECT id, name, plant_price, margin, total_price, image_url, organization_id, created_at, pieces, category
            FROM clothing_types
            WHERE organization_id = :org_id
            ORDER BY category ASC, name ASC
        """)
        results = db.execute(stmt, {"org_id": org_id}).fetchall()
        
        # Group results by category
        grouped_clothing_types: Dict[str, List[ClothingTypeResponse]] = {}
        
        for row in results:
            category = row.category or "Uncategorized"
            if category not in grouped_clothing_types:
                grouped_clothing_types[category] = []
            
            clothing_response = ClothingTypeResponse(
                id=row.id,
                name=row.name,
                plant_price=row.plant_price,
                margin=row.margin,
                total_price=row.total_price,
                image_url=row.image_url,
                organization_id=row.organization_id,
                created_at=row.created_at,
                pieces=row.pieces,
                category=row.category
            )
            grouped_clothing_types[category].append(clothing_response)
        
        # --- ENSURE DICTIONARY ORDER IS SORTED BY CATEGORY NAME ---
        # Create a new ordered dict with sorted keys
        sorted_grouped = OrderedDict(sorted(grouped_clothing_types.items()))
        
        return dict(sorted_grouped)
    
    
    except Exception as e:
        print(f"[ERROR] Failed to get clothing types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving data: {e}"
        )
        
        

@router.post("", response_model=ClothingTypeResponse, summary="Create a new clothing type for *your* organization")
async def create_clothing_type(
    name: str = Form(...),
    plant_price: float = Form(...),
    margin: float = Form(...),
    pieces: int = Form(1),
    category: str = Form("Uncategorized"),
    image_file: UploadFile = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Create a new clothing type with an image upload.
    This is restricted to organization staff/owners.
    """
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    org_id = payload.get("organization_id")
    role = payload.get("role")

    # 1. Authorization Check (using REAL role constants)
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{user_role}' is not authorized."
            )

    try:
        # 2. Handle image (File upload takes priority over manual URL)
        final_image_url = image_url
        if image_file:
            final_image_url = await upload_to_vercel_blob(image_file, folder="clothing_images")

        # 3. Insert record (NO total_price here - database does it)
        # --- MODIFIED: Added 'category' and 'pieces' column ---
        stmt = text("""
            INSERT INTO clothing_types (name, plant_price, margin, image_url, organization_id, pieces, category)
            VALUES (:name, :plant_price, :margin, :image_url, :org_id, :pieces, :category)
            RETURNING id, created_at, total_price
        """)
        
        # --- MODIFIED: Added 'pieces' and 'category' parameters ---
        result = db.execute(
            stmt,
            {
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": final_image_url,
                "org_id": org_id,
                "pieces": pieces,
                "category": category, # <-- ADDED
            }
        )
        db.commit()
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create clothing type after insertion.")

        # --- MODIFIED: Added 'pieces' and 'category' to response ---
        return ClothingTypeResponse(
            id=row.id,
            name=name,
            plant_price=plant_price,
            margin=margin,
            total_price=row.total_price,
            created_at=row.created_at,
            image_url=final_image_url,
            organization_id=org_id,
            pieces=pieces,
            category=category # <-- ADDED
        )

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to add clothing type: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving clothing type: {e}",
        )
        
        
        
@router.put("/{id}", response_model=ClothingTypeResponse, summary="Update a clothing type in *your* organization")
async def update_clothing_type(
    id: int,
    name: str = Form(...),
    plant_price: float = Form(...),
    margin: float = Form(...),
    pieces: int = Form(...),
    category: str = Form(...), # <-- ADDED
    image_file: UploadFile = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Update an existing clothing type (optionally replacing the image).
    Restricted to organization staff/owners.
    """
    if not payload:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    org_id = payload.get("organization_id")
    role = payload.get("role")

    # 1. Authorization Check
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )
    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
        
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{role}' is not authorized."
        )
    try:
        # 2. Get existing item
        row = db.execute(
            text("SELECT image_url FROM clothing_types WHERE id = :id AND organization_id = :org_id"),
            {"id": id, "org_id": org_id}
        ).fetchone()
        
        if not row:
             raise HTTPException(
                status_code=404, 
                detail="Clothing type not found in your organization"
            )

        old_image_url = row.image_url
        new_image_url = old_image_url  # Default to old one

        # 3. Handle new image upload (optional)
        if image_file:
            # Upload new image to Vercel Blob and delete old one
            new_image_url = await replace_vercel_blob(
                old_url=old_image_url,
                new_file=image_file,
                folder="clothing_images"
            )
        elif image_url is not None:
             # Manual URL provided and no file uploaded
             new_image_url = image_url


        # 5. Update record
        # --- MODIFIED: Added 'category' and 'pieces' to SET clause ---
        stmt = text("""
            UPDATE clothing_types
            SET name = :name,
                plant_price = :plant_price,
                margin = :margin,
                image_url = :image_url,
                pieces = :pieces,
                category = :category
            WHERE id = :id AND organization_id = :org_id
            RETURNING created_at, total_price
        """)
        
        # --- MODIFIED: Added 'category' and 'pieces' to parameters ---
        result = db.execute(
            stmt,
            {
                "id": id,
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": new_image_url,
                "org_id": org_id,
                "pieces": pieces,
                "category": category # <-- ADDED
            }
        )
        db.commit()
        updated_row = result.fetchone()

        if not updated_row:
             raise HTTPException(status_code=404, detail="Failed to update clothing type after commit.")

        # --- MODIFIED: Added 'pieces' and 'category' to response ---
        return ClothingTypeResponse(
            id=id,
            name=name,
            plant_price=plant_price,
            margin=margin,
            total_price=updated_row.total_price,
            created_at=updated_row.created_at,
            image_url=new_image_url,
            organization_id=org_id,
            pieces=pieces,
            category=category # <-- ADDED
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update clothing type: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating clothing type: {e}")
    
        
    
@router.delete("/{id}", summary="Delete a clothing type from *your* organization")
async def delete_clothing_type(
    id: int, 
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Deletes a clothing type and its image.
    Restricted to organization staff/owners.
    """
    if not payload:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
        
    org_id = payload.get("organization_id")
    role = payload.get("role")

    # 1. Authorization Check
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )
    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
        
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{role}' is not authorized."
        )

    try:
        # 2. Check if clothing type exists
        row = db.execute(
            text("SELECT image_url FROM clothing_types WHERE id = :id AND organization_id = :org_id"),
            {"id": id, "org_id": org_id}
        ).fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Clothing type not found")

        image_url = row.image_url

        # 3. Check for references
        in_use = db.execute(
            text("""
                SELECT COUNT(*) FROM ticket_items 
                WHERE clothing_type_id = :id AND organization_id = :org_id
            """),
            {"id": id, "org_id": org_id}
        ).scalar()

        if in_use > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete: this clothing type is used in existing tickets."
            )

        # 4. Delete record
        db.execute(
            text("DELETE FROM clothing_types WHERE id = :id AND organization_id = :org_id"), 
            {"id": id, "org_id": org_id}
        )
        db.commit()

        # 5. Delete image from Vercel Blob Storage
        if image_url:
            await delete_from_vercel_blob(image_url)

        return {"success": True, "message": "Clothing type and image deleted successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to delete clothing type: {e}")
        raise HTTPException(status_code=500, detail=str(e))