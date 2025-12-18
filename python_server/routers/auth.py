import os
from datetime import timedelta, datetime, timezone
from typing import Optional, Dict, Any, Union
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr


# Import shared utilities and constants
# Assuming these utils exist in a 'utils' directory
from utils.common import (
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    hash_password,
    get_role_type,
    ALL_STAFF_ROLES,
    PLATFORM_ADMIN_ROLE,
    ORG_OWNER_ROLE,
    get_db,
)

# =======================
# ROUTER SETUP
# =======================
router = APIRouter(
    prefix="/token",
    tags=["Authentication"],
)

# =======================
# REQUEST & RESPONSE SCHEMAS
# =======================

class LoginRequest(BaseModel):
    """For JSON-based login (workers-login endpoint)"""
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    """
    For /store-login endpoint.
    Returns the token AND the basic org details for visualization.
    """
    access_token: str
    token_type: str = "bearer"
    user_role: str
    organization_id: Optional[int]
    organization_name: str

class LoginUser(BaseModel):
    """Detailed user object returned in the /workers-login response."""
    id: str # <-- FIX: Change from int to str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    organization_id: Optional[int]

class LoginResponse(BaseModel):
    """
    For /workers-login endpoint.
    Returns the token AND the full user/org details for visualization.
    """
    access_token: str
    token_type: str = "bearer"
    user: LoginUser
    organization_name: str
    message: Optional[str] = None

class PlatformAdminLoginRequest(BaseModel):
    """For JSON-based login (admin-login endpoint)"""
    email: EmailStr
    password: str

class PlatformAdminLoginResponse(BaseModel):
    """
    For /admin-login endpoint.
    Returns the token AND the admin details for visualization.
    """
    access_token: str
    token_type: str = "bearer"
    admin_role: str
    email: str
    full_name: Optional[str]
    # **THIS FIELD WAS ADDED TO MATCH THE RESPONSE**
    organization_id: Optional[int] = None


# =======================
# HELPERS
# =======================

def get_organization_name(db: Session, organization_id: Optional[int]) -> Optional[str]:
    """
    Retrieves the organization name for a given ID.
    Returns "Platform Admin" if organization_id is None (for Admin role).
    """
    if organization_id is None:
        # This case might apply to customers or platform-level users
        # For a platform admin, we'll handle it in their specific route.
        return "N/A" 

    org_stmt = text("SELECT name FROM organizations WHERE id = :org_id")
    result = db.execute(org_stmt, {"org_id": organization_id}).fetchone()
    return result[0] if result else None

# =======================
# ROUTES
# =======================

@router.post("/store-login", summary="Login organization/store owner", response_model=TokenResponse)
async def login_organization_owner(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Handles store owner login.
    Returns a JWT token (with all data encoded) AND
    a JSON object with org info for immediate visualization.
    """
    email = form_data.username.strip().lower()

    # 1. UPDATE: Added 'is_active' to the SELECT statement
    query = text("""
        SELECT id, name, owner_email, owner_password_hash, role, is_active
        FROM organizations
        WHERE LOWER(owner_email) = :email
        LIMIT 1
    """)
    org_result = db.execute(query, {"email": email}).fetchone()

    if not org_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    org = dict(org_result._mapping)

    if not verify_password(form_data.password, org["owner_password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. NEW CHECK: Check if the store is active
    # We do this AFTER verifying the password to ensure only the actual owner
    # sees the specific "Deactivated" message (security best practice).
    if not org["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your store has been deactivated. Please contact platform administration."
        )

    # 3. ENCODE data inside the token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    user_role = org.get("role", "STORE_OWNER").upper()
    
    token_data = {
        "sub": org["owner_email"],
        "organization_id": org["id"],
        "organization_name": org["name"],
        "role": user_role,
    }
    
    access_token = create_access_token(
        data=token_data,
        expires_delta=access_token_expires,
    )

    # 4. RETURN data
    return TokenResponse(
        access_token=access_token,
        user_role=user_role,
        organization_id=org["id"],
        organization_name=org["name"],
    )

# =======================
# 1. WORKER / STAFF LOGIN (org_owner, staff)
# =======================
@router.post("/workers-login", response_model=LoginResponse)
async def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate Staff & Owners.
    BLOCKS Customers from using this route.
    """

    # Normalize incoming email to lowercase for consistent lookup
    email = data.email.strip().lower()

    # 1️⃣ Look up user by email
    user_stmt = text("""
        SELECT id, organization_id, email, password_hash, first_name, last_name, role, address, is_deactivated
        FROM allUsers
        WHERE LOWER(email) = :email
    """)
    user_row = db.execute(user_stmt, {"email": email}).fetchone()

    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Map all fields from the query
    user_map = dict(user_row._mapping)
    user_id = user_map.get("id")
    organization_id = user_map.get("organization_id")
    email = user_map.get("email")
    password_hash = user_map.get("password_hash")
    first_name = user_map.get("first_name")
    last_name = user_map.get("last_name")
    role = user_map.get("role")
    address = user_map.get("address")
    is_deactivated = user_map.get("is_deactivated")

    # 2️⃣ Check for Deactivation
    if is_deactivated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your administrator."
        )

    # 3️⃣ Verify password
    if not verify_password(data.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # --- 🛑 SECURITY CHECK: BLOCK CUSTOMERS ---
    if role == 'customer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are a Customer. Please use the Customer Login page."
        )
    # ------------------------------------------

    # 4️⃣ Check for valid staff roles
    valid_roles = ["org_owner", "store_manager", "store_admin", "cashier", "driver", "assistant"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unrecognized role '{role}' or not authorized for staff portal."
        )

    # 5️⃣ Get organization name (FIXED SQL)
    organization_name = "Organization"
    if organization_id:
        # We query for 'name', not 'organization_name'
        org_query = text("SELECT name FROM organizations WHERE id = :id")
        org_res = db.execute(org_query, {"id": organization_id}).fetchone()
        if org_res:
            organization_name = org_res.name

    # 6️⃣ ENCODE data inside the token
    token_data = {
        "sub": str(user_id), 
        "email": email,
        "role": role,
        "organization_id": organization_id,
        "organization_name": organization_name,
        "first_name": first_name,
        "last_name": last_name,
        "address": address, 
    }
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    # 7️⃣ Prepare user data for the response
    user_data = LoginUser(
        id=str(user_id), 
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
        organization_id=organization_id,
    )

    # 8️⃣ RETURN Response
    return LoginResponse(
        access_token=access_token,
        user=user_data,
        organization_name=organization_name,
        message=f"Login successful as {role} for organization '{organization_name}'."
    )


# =======================
# 2. CUSTOMER SPECIFIC LOGIN
# =======================
@router.post("/customer/login", response_model=TokenResponse)
def customer_login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Dedicated login route for End Users (Customers).
    BLOCKS Staff/Workers from using this route.
    """
    # 1. Find user by email (Case insensitive)
    query = text("SELECT * FROM allUsers WHERE LOWER(email) = LOWER(:email)")
    user = db.execute(query, {"email": login_data.email}).fetchone()
    
    # 2. Verify User Exists & Password
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # 3. STRICT ROLE CHECK: Only customers allowed here
    user_role = str(user.role).lower() if user.role else 'customer'
    
    # --- 🛑 SECURITY CHECK: BLOCK STAFF ---
    if user_role != 'customer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This login is for customers only. Staff please use the staff portal."
        )
    # --------------------------------------

    # 4. Fetch Real Organization Name (FIXED SQL)
    organization_name = "Your Cleaners" 
    
    if user.organization_id:
        # Changed 'organization_name' to 'name' based on typical schema
        org_query = text("SELECT name FROM organizations WHERE id = :id")
        org_result = db.execute(org_query, {"id": user.organization_id}).fetchone()
        if org_result:
            organization_name = org_result.name

    # 5. Create Token with Customer-Specific Payload
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_payload = {
        "sub": user.email,
        "sub_id": str(user.id),       
        "role": "customer",           
        "organization_id": user.organization_id, 
        "type": "customer_access"     
    }
    
    access_token = create_access_token(
        data=token_payload, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": "customer",
        "organization_id": user.organization_id,
        "organization_name": organization_name
    }

@router.post("/admin-login", response_model=PlatformAdminLoginResponse)
async def platform_admin_login(
    data: PlatformAdminLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login route for platform admins.
    Returns a JWT token (with all data encoded) AND
    a JSON object with admin info for immediate visualization.
    """
    # Normalize incoming email for login
    admin_email = data.email.strip().lower()

    # 1️⃣ Fetch platform admin (case-insensitive match)
    stmt = text("""
        SELECT id, full_name, email, password_hash, role
        FROM platform_admins
        WHERE LOWER(email) = :email
    """)
    admin_row = db.execute(stmt, {"email": admin_email}).fetchone()

    if not admin_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    admin = dict(admin_row._mapping)

    # 2️⃣ Verify password
    if not verify_password(data.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 3️⃣ ENCODE data inside the token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": admin["email"],
        "role": admin["role"],
        "admin_id": str(admin["id"]), # <-- FIX: Convert UUID to string here
        "organization_id": None, # Explicitly set for admins
        "organization_name": "Platform Admin",
    }
    access_token = create_access_token(data=token_data, expires_delta=access_token_expires)

    # 4️⃣ RETURN data in the "non-coded" JSON response
    return PlatformAdminLoginResponse(
        access_token=access_token,
        admin_role=admin["role"],
        email=admin["email"],
        full_name=admin["full_name"],
        organization_id=None
    )
    
    
