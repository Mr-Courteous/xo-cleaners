import os
import aiofiles  # Required for async file operations
from typing import Dict, Any, Optional, List
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
import uuid  # For unique filenames

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
# ❌ REMOVED all the mock functions (mock get_db, mock get_current_user_payload, etc.)
# -----------------------------------------------------------------


# Define a path to save images
STATIC_DIR = "static/clothing_images"
os.makedirs(STATIC_DIR, exist_ok=True)



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
    created_at: Any # Using 'Any' for datetime

# Helper function to save files (as seen in your original code)
async def save_uploaded_file(image_file: UploadFile) -> str:
    """Saves uploaded file to a static directory and returns the URL path."""
    try:
        # Create a unique filename
        file_ext = os.path.splitext(image_file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(STATIC_DIR, unique_filename)
        
        # Asynchronously write the file
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await image_file.read(1024):
                await out_file.write(content)
        
        # Return the URL path, not the file system path
        image_url = f"/{STATIC_DIR}/{unique_filename}"
        return image_url
    except Exception as e:
        print(f"[ERROR] Could not save file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving image file: {e}"
        )


@router.get("", response_model=List[ClothingTypeResponse], summary="Get all clothing types for *your* organization")
async def get_clothing_types_for_organization(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Retrieve all clothing types associated with the logged-in user's organization.
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
        stmt = text("""
            SELECT id, name, plant_price, margin, total_price, image_url, organization_id, created_at
            FROM clothing_types
            WHERE organization_id = :org_id
            ORDER BY name
        """)
        results = db.execute(stmt, {"org_id": org_id}).fetchall()
        
        # Map results to Pydantic model
        return [
            ClothingTypeResponse(
                id=row.id,
                name=row.name,
                plant_price=row.plant_price,
                margin=row.margin,
                total_price=row.total_price,
                image_url=row.image_url,
                organization_id=row.organization_id,
                created_at=row.created_at
            ) for row in results
        ]
    
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
    image_file: UploadFile = File(...),
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
    if role != ORG_OWNER_ROLE and role not in ALL_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create clothing types."
        )

    try:
        # 2. Save uploaded image
        image_url = await save_uploaded_file(image_file)

        # 3. Insert record
        stmt = text("""
            INSERT INTO clothing_types (name, plant_price, margin, image_url, organization_id)
            VALUES (:name, :plant_price, :margin, :image_url, :org_id)
            RETURNING id, created_at, total_price
        """)
        
        result = db.execute(
            stmt,
            {
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": image_url,
                "org_id": org_id,
            }
        )
        db.commit()
        row = result.fetchone()
        
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create clothing type after insertion.")

        return ClothingTypeResponse(
            id=row.id,
            name=name,
            plant_price=plant_price,
            margin=margin,
            total_price=row.total_price,
            created_at=row.created_at,
            image_url=image_url,
            organization_id=org_id
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
    image_file: UploadFile = File(None),
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
    if role != ORG_OWNER_ROLE and role not in ALL_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update clothing types."
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
            new_image_url = await save_uploaded_file(image_file)
            
            # 4. Remove old image
            if old_image_url:
                try:
                    old_image_path = old_image_url.lstrip("/")
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                except Exception as img_err:
                    print(f"[WARN] Failed to delete old image file {old_image_url}: {img_err}")


        # 5. Update record
        stmt = text("""
            UPDATE clothing_types
            SET name = :name,
                plant_price = :plant_price,
                margin = :margin,
                image_url = :image_url
            WHERE id = :id AND organization_id = :org_id
            RETURNING created_at, total_price
        """)
        result = db.execute(
            stmt,
            {
                "id": id,
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": new_image_url,
                "org_id": org_id
            }
        )
        db.commit()
        updated_row = result.fetchone()

        if not updated_row:
             raise HTTPException(status_code=404, detail="Failed to update clothing type after commit.")

        return ClothingTypeResponse(
            id=id,
            name=name,
            plant_price=plant_price,
            margin=margin,
            total_price=updated_row.total_price,
            created_at=updated_row.created_at,
            image_url=new_image_url,
            organization_id=org_id
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
    if role != ORG_OWNER_ROLE and role not in ALL_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete clothing types."
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

        # 5. Delete image file
        if image_url:
            try:
                image_path = image_url.lstrip("/")
                if os.path.exists(image_path):
                    os.remove(image_path)
                    print(f"[INFO] Deleted image file: {image_path}")
            except Exception as img_err:
                print(f"[WARN] Failed to delete image file for clothing type {id}: {img_err}")

        return {"success": True, "message": "Clothing type and image deleted successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to delete clothing type: {e}")
        raise HTTPException(status_code=500, detail=str(e))