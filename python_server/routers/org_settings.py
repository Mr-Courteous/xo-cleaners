from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from utils.common import get_db, get_current_user_payload, hash_password

# =======================
# Role Definitions
# =======================
ORG_OWNER_ROLE = "org_owner"
STORE_ADMIN_ROLE = "store_admin"
STORE_OWNER_ROLE = "STORE_OWNER"
CASHIER = "cashier"

# Allowed roles for changing settings
ALLOWED_ADMIN_ROLES = [ORG_OWNER_ROLE, STORE_ADMIN_ROLE, STORE_OWNER_ROLE, CASHIER]

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
    sequence_strategy: Optional[str] = "daily"  # "daily" or "continuous"
    current_sequence: Optional[int] = 1
    last_sequence_date: Optional[date] = None

class BranchCreate(BaseModel):
    name: str
    address: str
    phone: str
    timezone: str = "UTC"
    location_type: str
    is_plant: bool = False

class TagConfigUpdate(BaseModel):
    tag_type: str
    start_sequence: int
    printer_name: Optional[str] = None

class PaymentMethodUpdate(BaseModel):
    branch_id: int
    methods: Dict[str, bool]

class StarchPriceUpdate(BaseModel):
    starch_price_light: Optional[float] = None
    starch_price_medium: Optional[float] = None
    starch_price_heavy: Optional[float] = None
    starch_price_extra_heavy: Optional[float] = None

class SizePriceUpdate(BaseModel):
    size_price_s: Optional[float] = None
    size_price_m: Optional[float] = None
    size_price_l: Optional[float] = None
    size_price_xl: Optional[float] = None
    size_price_xxl: Optional[float] = None

class OrganizationProfileUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    owner_first_name: Optional[str] = None
    owner_last_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_password: Optional[str] = None  # Plain-text; will be hashed before saving

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
# 1. Branding / General Settings
# =======================

# ✅ CHANGED: Route is now "/" so frontend calls to /api/settings work
@router.get("/")
async def get_organization_settings(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    
    # This returns all settings, including starch prices
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

    # Updated Query to include sequence logic
    query = text("""
        INSERT INTO organization_settings (
            organization_id, primary_color, secondary_color, logo_url, 
            receipt_header, receipt_footer, sequence_strategy, current_sequence, last_sequence_date, updated_at
        )
        VALUES (:org_id, :p_color, :s_color, :logo, :header, :footer, :strategy, :seq, :last_date, NOW())
        ON CONFLICT (organization_id) DO UPDATE SET
            primary_color = COALESCE(EXCLUDED.primary_color, organization_settings.primary_color),
            secondary_color = COALESCE(EXCLUDED.secondary_color, organization_settings.secondary_color),
            logo_url = COALESCE(EXCLUDED.logo_url, organization_settings.logo_url),
            receipt_header = COALESCE(EXCLUDED.receipt_header, organization_settings.receipt_header),
            receipt_footer = COALESCE(EXCLUDED.receipt_footer, organization_settings.receipt_footer),
            sequence_strategy = COALESCE(EXCLUDED.sequence_strategy, organization_settings.sequence_strategy),
            current_sequence = COALESCE(EXCLUDED.current_sequence, organization_settings.current_sequence),
            last_sequence_date = COALESCE(EXCLUDED.last_sequence_date, organization_settings.last_sequence_date),
            updated_at = NOW()
        RETURNING *;
    """)
    
    result = db.execute(query, {
        "org_id": org_id,
        "p_color": settings.primary_color,
        "s_color": settings.secondary_color,
        "logo": settings.logo_url,
        "header": settings.receipt_header,
        "footer": settings.receipt_footer,
        "strategy": settings.sequence_strategy,
        "seq": settings.current_sequence,
        "last_date": settings.last_sequence_date
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

# =======================
# 5. Starch Pricing
# =======================

@router.put("/starch-prices")
async def update_starch_prices(
    data: StarchPriceUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    
    # ✅ CHANGED: Use the standard permission helper
    check_admin_permissions(role)

    # Dynamic query to update only provided fields
    update_fields = {}
    if data.starch_price_light is not None:
        update_fields["light"] = data.starch_price_light
    if data.starch_price_medium is not None:
        update_fields["medium"] = data.starch_price_medium
    if data.starch_price_heavy is not None:
        update_fields["heavy"] = data.starch_price_heavy
    if data.starch_price_extra_heavy is not None:
        update_fields["extra"] = data.starch_price_extra_heavy

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_clauses = []
    params = {"org_id": org_id}
    
    if "light" in update_fields:
        set_clauses.append("starch_price_light = :light")
        params["light"] = update_fields["light"]
        
    if "medium" in update_fields:
        set_clauses.append("starch_price_medium = :medium")
        params["medium"] = update_fields["medium"]
        
    if "heavy" in update_fields:
        set_clauses.append("starch_price_heavy = :heavy")
        params["heavy"] = update_fields["heavy"]
        
    if "extra" in update_fields:
        set_clauses.append("starch_price_extra_heavy = :extra")
        params["extra"] = update_fields["extra"]

    # Always update the 'updated_at' timestamp
    set_clauses.append("updated_at = NOW()")

    stmt = text(f"""
        UPDATE organization_settings
        SET {", ".join(set_clauses)}
        WHERE organization_id = :org_id
    """)

    try:
        db.execute(stmt, params)
        db.commit()
        
        return {"message": "Starch prices updated successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error updating starch prices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update starch prices."
        )
        
 # =======================
# 6. Clothing Size Pricing
# =======================

@router.put("/size-prices")
async def update_size_prices(
    data: SizePriceUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    
    # Check Admin Permissions
    check_admin_permissions(role)

    # Dynamic query to update only provided fields
    update_fields = {}
    if data.size_price_s is not None:
        update_fields["s"] = data.size_price_s
    if data.size_price_m is not None:
        update_fields["m"] = data.size_price_m
    if data.size_price_l is not None:
        update_fields["l"] = data.size_price_l
    if data.size_price_xl is not None:
        update_fields["xl"] = data.size_price_xl
    if data.size_price_xxl is not None:
        update_fields["xxl"] = data.size_price_xxl

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_clauses = []
    params = {"org_id": org_id}
    
    # Build SQL dynamically based on what was sent
    if "s" in update_fields:
        set_clauses.append("size_price_s = :s")
        params["s"] = update_fields["s"]
        
    if "m" in update_fields:
        set_clauses.append("size_price_m = :m")
        params["m"] = update_fields["m"]
        
    if "l" in update_fields:
        set_clauses.append("size_price_l = :l")
        params["l"] = update_fields["l"]
        
    if "xl" in update_fields:
        set_clauses.append("size_price_xl = :xl")
        params["xl"] = update_fields["xl"]
        
    if "xxl" in update_fields:
        set_clauses.append("size_price_xxl = :xxl")
        params["xxl"] = update_fields["xxl"]

    # Always update the 'updated_at' timestamp
    set_clauses.append("updated_at = NOW()")

    stmt = text(f"""
        UPDATE organization_settings
        SET {", ".join(set_clauses)}
        WHERE organization_id = :org_id
    """)

    try:
        db.execute(stmt, params)
        db.commit()
        
        return {"message": "Clothing size prices updated successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error updating size prices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update clothing size prices."
        )

# =======================
# 7. Organization Profile
# =======================

@router.put("/organization/profile")
async def update_organization_profile(
    data: OrganizationProfileUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    Allows org owners to edit their organization's core profile:
    name, address, phone, owner_first_name, owner_last_name,
    owner_email, and owner_password.
    Restricted to org_owner and STORE_OWNER roles.
    """
    org_id = payload.get("organization_id")
    role = payload.get("role")

    # Only org owners may edit the organization profile
    if role not in [ORG_OWNER_ROLE, STORE_OWNER_ROLE]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Organization Owners can edit the organization profile."
        )

    # Build dynamic SET clause — only update fields that were actually sent
    set_clauses = []
    params: dict = {"org_id": org_id}

    if data.name is not None:
        set_clauses.append("name = :name")
        params["name"] = data.name.strip()

    if data.address is not None:
        set_clauses.append("address = :address")
        params["address"] = data.address.strip()

    if data.phone is not None:
        set_clauses.append("phone = :phone")
        params["phone"] = data.phone.strip()

    if data.owner_first_name is not None:
        set_clauses.append("owner_first_name = :owner_first_name")
        params["owner_first_name"] = data.owner_first_name.strip()

    if data.owner_last_name is not None:
        set_clauses.append("owner_last_name = :owner_last_name")
        params["owner_last_name"] = data.owner_last_name.strip()

    if data.owner_email is not None:
        set_clauses.append("owner_email = :owner_email")
        params["owner_email"] = data.owner_email.strip().lower()

    if data.owner_password is not None:
        set_clauses.append("owner_password_hash = :owner_password_hash")
        params["owner_password_hash"] = hash_password(data.owner_password)

    if not set_clauses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update."
        )

    set_clauses.append("updated_at = NOW()")

    stmt = text(f"""
        UPDATE organizations
        SET {', '.join(set_clauses)}
        WHERE id = :org_id
        RETURNING id, name, address, phone,
                  owner_first_name, owner_last_name, owner_email,
                  updated_at
    """)

    try:
        result = db.execute(stmt, params).fetchone()
        db.commit()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found."
            )

        return {
            "message": "Organization profile updated successfully.",
            "organization": dict(result._mapping)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating organization profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization profile."
        )

# =======================
# 8. Organization Address
# =======================

@router.get("/organization/address")
async def get_organization_address(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns the address of the current user's organization.
    Used to stamp the store's address on tickets.
    """
    org_id = payload.get("organization_id")

    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID missing from token."
        )

    result = db.execute(
        text("SELECT address FROM organizations WHERE id = :org_id"),
        {"org_id": org_id}
    ).fetchone()

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )

    return {"address": result.address}
