from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.common import get_db, get_current_user_payload

# =======================
# Role Definitions
# =======================
# We define these here to ensure they exist without relying on utils.common
ORG_OWNER_ROLE = "org_owner"
STORE_ADMIN_ROLE = "store_admin"
STORE_OWNER_ROLE = "STORE_OWNER"  # Case-sensitive check depending on how you stored it

# Allowed roles for changing settings
ALLOWED_ADMIN_ROLES = [ORG_OWNER_ROLE, STORE_ADMIN_ROLE, STORE_OWNER_ROLE]

router = APIRouter(prefix="/api/settings", tags=["Organization Settings"])

# =======================
# Pydantic Models
# =======================

class BrandingUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_url: Optional[str] = None
    receipt_header: Optional[str] = None
    receipt_footer: Optional[str] = None

class BranchCreate(BaseModel):
    name: str
    address: str
    phone: str
    timezone: str = "UTC"
    location_type: str  # 'Plant' or 'Drop-off'
    is_plant: bool = False

class TagConfigUpdate(BaseModel):
    tag_type: str
    start_sequence: int
    printer_name: Optional[str] = None

class PaymentMethodUpdate(BaseModel):
    branch_id: int
    methods: Dict[str, bool]

# =======================
# Helper: Permission Check
# =======================
def check_admin_permissions(role: str):
    """
    Ensures the user has one of the allowed admin roles.
    """
    if role not in ALLOWED_ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Insufficient permissions. Only Owners and Store Admins can perform this action."
        )

# =======================
# 1. Branding Endpoints
# =======================

@router.get("/branding")
async def get_branding(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    
    query = text("SELECT * FROM organization_settings WHERE organization_id = :org_id")
    result = db.execute(query, {"org_id": org_id}).fetchone()
    
    if not result:
        return {} 
    return dict(result._mapping)

@router.put("/branding")
async def update_branding(
    settings: BrandingUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    
    check_admin_permissions(role)

    # Upsert Logic
    query = text("""
        INSERT INTO organization_settings (organization_id, primary_color, secondary_color, logo_url, receipt_header, receipt_footer, updated_at)
        VALUES (:org_id, :p_color, :s_color, :logo, :header, :footer, NOW())
        ON CONFLICT (organization_id) DO UPDATE SET
            primary_color = COALESCE(EXCLUDED.primary_color, organization_settings.primary_color),
            secondary_color = COALESCE(EXCLUDED.secondary_color, organization_settings.secondary_color),
            logo_url = COALESCE(EXCLUDED.logo_url, organization_settings.logo_url),
            receipt_header = COALESCE(EXCLUDED.receipt_header, organization_settings.receipt_header),
            receipt_footer = COALESCE(EXCLUDED.receipt_footer, organization_settings.receipt_footer),
            updated_at = NOW()
        RETURNING *;
    """)
    
    result = db.execute(query, {
        "org_id": org_id,
        "p_color": settings.primary_color,
        "s_color": settings.secondary_color,
        "logo": settings.logo_url,
        "header": settings.receipt_header,
        "footer": settings.receipt_footer
    }).fetchone()
    
    db.commit()
    return dict(result._mapping)

# =======================
# 2. Branch Management
# =======================

@router.get("/branches")
async def get_branches(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    query = text("SELECT * FROM branches WHERE organization_id = :org_id AND is_active = TRUE")
    results = db.execute(query, {"org_id": org_id}).fetchall()
    return [dict(row._mapping) for row in results]

@router.post("/branches")
async def create_branch(
    branch: BranchCreate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")

    check_admin_permissions(role)

    query = text("""
        INSERT INTO branches (organization_id, name, address, phone, timezone, location_type, is_plant)
        VALUES (:org_id, :name, :address, :phone, :timezone, :type, :is_plant)
        RETURNING id, name
    """)
    
    try:
        result = db.execute(query, {
            "org_id": org_id,
            "name": branch.name,
            "address": branch.address,
            "phone": branch.phone,
            "timezone": branch.timezone,
            "type": branch.location_type,
            "is_plant": branch.is_plant
        }).fetchone()
        db.commit()
        return {"message": "Branch created successfully", "branch": dict(result._mapping)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# =======================
# 3. Payment Configuration
# =======================

@router.put("/payments/config")
async def update_payment_methods(
    config: PaymentMethodUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    
    check_admin_permissions(role)
    
    # Security Check: Verify branch ownership
    check_branch = db.execute(text("SELECT id FROM branches WHERE id=:bid AND organization_id=:oid"), 
                              {"bid": config.branch_id, "oid": org_id}).fetchone()
    if not check_branch:
        raise HTTPException(status_code=404, detail="Branch not found or does not belong to your organization.")

    try:
        for method, enabled in config.methods.items():
            query = text("""
                INSERT INTO branch_payment_methods (branch_id, payment_method, is_enabled)
                VALUES (:bid, :method, :enabled)
                ON CONFLICT (branch_id, payment_method) 
                DO UPDATE SET is_enabled = :enabled
            """)
            db.execute(query, {"bid": config.branch_id, "method": method, "enabled": enabled})
        
        db.commit()
        return {"message": "Payment methods updated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# =======================
# 4. Tag Configuration
# =======================

@router.put("/tags/config")
async def update_tag_config(
    config: TagConfigUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    
    check_admin_permissions(role)

    query = text("""
        INSERT INTO tag_configurations (organization_id, tag_type, start_sequence, printer_name)
        VALUES (:org_id, :type, :start, :printer)
        ON CONFLICT (organization_id) DO UPDATE SET
            tag_type = EXCLUDED.tag_type,
            start_sequence = EXCLUDED.start_sequence,
            printer_name = EXCLUDED.printer_name
    """)
    
    try:
        db.execute(query, {
            "org_id": org_id, 
            "type": config.tag_type, 
            "start": config.start_sequence, 
            "printer": config.printer_name
        })
        db.commit()
        return {"message": "Tag configuration updated."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))