import os
import hashlib
import binascii
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

import jwt
from jwt import PyJWTError
from enum import Enum
# ADDED: FastAPI Security imports
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
# ADDED: SQLAlchemy imports
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, date
import decimal



# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
# Kept engine and SessionLocal definition here for central DB management
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- JWT Configuration ---
# NOTE: In a production app, SECRET_KEY should be read from a secure environment variable.
SECRET_KEY = "supersecretkey123" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Dependency to get token from header, points to the login route
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# --- User Role Definitions ---
class ALL_STAFF_ROLES(str, Enum):
    ORG_OWNER = "org_owner"
    STORE_MANAGER = "store_manager"
    DRIVER = "driver"
    ASSISTANT = "assistant"
    CASHIER = "cashier"
    CUSTOMER = "customer"
    


PLATFORM_ADMIN_ROLE = "admin"
ORG_OWNER_ROLE = ALL_STAFF_ROLES.ORG_OWNER

# --- Password Hashing ---

def hash_password(password: str, iterations: int = 100000) -> str:
    """Hashes a password using PBKDF2 (recommended standard)."""
    # Generate a random 32-byte salt
    salt = os.urandom(32)
    # Perform iterations of SHA-256
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt, 
        iterations
    )
    # Format: iterations:salt(hex):key(hex)
    return f'{iterations}:{binascii.hexlify(salt).decode("ascii")}:{binascii.hexlify(key).decode("ascii")}'


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against a stored hash."""
    try:
        # Extract components from the stored hash
        iterations, salt, key = hashed_password.split(':')
        
        # Re-hash the provided password with the stored salt
        new_key = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            binascii.unhexlify(salt), 
            int(iterations)
        )
        # Compare the new hash with the stored key
        return binascii.hexlify(new_key).decode('ascii') == key
    except Exception:
        # Handle malformed hash strings gracefully as a failure
        return False

# --- JWT Token Management ---

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a JWT Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    # Add standard JWT claims
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes a JWT Access Token and verifies its signature and expiry."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except PyJWTError as e:
        # Handle all JWT related errors (expired, invalid signature, etc.)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Catch unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token processing error.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# NEW DEPENDENCY
def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    FastAPI dependency to decode and validate the token.
    Returns the decoded payload (dict) on success.
    """
    return decode_access_token(token)

def get_role_type(role: str):
    """Simple helper to return role type. Can be expanded for hierarchy logic."""
    return role

# --- DB Dependency ---

def get_db():
    """Provides a database session for a request (FastAPI Dependency)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()






class StarchLevel(str, Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"


class TicketItemCreate(BaseModel):
    clothing_type_id: int
    quantity: int
    starch_level: StarchLevel = StarchLevel.none
    crease: bool = False
    additional_charge: Optional[float] = 0.0
    alterations: Optional[str] = None  # <--- ADD THIS
    item_instructions: Optional[str] = None  # <--- ADD THIS
    instruction_charge: Optional[float] = 0.0 # New field for Instruction Charge
    clothing_type_id: Optional[int] = None # ✅ Made Optional
    custom_name: Optional[str] = None      # ✅ New Field
    unit_price: Optional[float] = None     # ✅ New Field (for custom price)
    starch_charge: float = 0.0  # ✅ Receive Calculated Charge


    
    
class TicketItemResponse(BaseModel):
    """Schema for individual items inside a ticket response."""
    id: int
    ticket_id: int
    
    # ✅ FIX 1: Changed to Optional[int] because Custom Items will be None
    clothing_type_id: Optional[int] = None
    
    # ✅ FIX 2: Added to support Ad-hoc item names
    custom_name: Optional[str] = None 

    clothing_name: str
    quantity: int
    
    # ✅ FIX: Changed to Optional[Any] to allow boolean 'False' or strings
    starch_level: Optional[Any] = None 
    crease: Optional[Any] = None 
    
    alterations: Optional[str] = None
    item_instructions: Optional[str] = None
    
    # ✅ Added for new logic
    alteration_behavior: Optional[str] = "none" 
    
    item_total: float
    plant_price: float
    margin: float
    additional_charge: float = 0.0
    pieces: int = 1
    
    instruction_charge: float = 0.0  # Instruction Charge
    starch_charge: float = 0.0 # ✅ Return it
    
    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    customer_id: int
    items: List[TicketItemCreate]
    rack_number: Optional[str] = None
    special_instructions: Optional[str] = None
    paid_amount: float = 0.0
    pickup_date: Optional[datetime] = None

# =======================
# TICKET RESPONSE (Updated)
# =======================
class TicketResponse(BaseModel):
    """Full ticket data returned after creation."""
    id: int
    ticket_number: str
    customer_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    total_amount: float
    paid_amount: float
    status: str
    rack_number: Optional[str] = None
    special_instructions: Optional[str] = None
    
    
    is_void: bool = False      # Default to False
    is_refunded: bool = False  # Default to False
    
    # ✅ Added as per your request (Note: These are usually item-level, but included here as Optional)
    alterations: Optional[str] = None 
    item_instructions: Optional[str] = None 
    
    
    
    # ✅ Added for Branding/Receipts
    receipt_header: Optional[str] = None 
    receipt_footer: Optional[str] = None 
    
    organization_name: Optional[str] = None


    # Fix for pickup_date
    pickup_date: Optional[datetime] = None
    created_at: datetime
    organization_id: int
    
    # List of items
    items: List[TicketItemResponse]

    class Config:
        from_attributes = True

        

class StarchLevel(str, Enum):
    none = "none"
    low = "low"
    medium = "medium"
    high = "high"


class TicketItemCreate(BaseModel):
    clothing_type_id: int
    quantity: int
    starch_level: StarchLevel = StarchLevel.none
    crease: bool = False
    additional_charge: Optional[float] = 0.0
    alterations: Optional[str] = None  # <--- ADD THIS
    item_instructions: Optional[str] = None  # <--- ADD THIS
    instruction_charge: Optional[float] = 0.0 # New field for Instruction Charge
    starch_charge: float = 0.0  # ✅ Receive Calculated Charge
    
    
    
    
class TicketSummaryResponse(BaseModel):
    """High-level ticket data, returned in a list."""
    id: int
    ticket_number: str
    customer_id: int
    customer_name: str
    customer_phone: Optional[str]
    total_amount: float
    paid_amount: float
    status: str
    rack_number: Optional[str]
    special_instructions: Optional[str]
    pickup_date: Optional[datetime]
    created_at: datetime
    organization_id: int

    class Config:
        orm_mode = True
        
        
        
        
class RackAssignmentRequest(BaseModel):
    """
    Specific model for the rack assignment UI.
    Matches the body: JSON.stringify({ rack_number: parseInt(assignRackNumber) })
    """
    rack_number: int

class GeneralTicketUpdateRequest(BaseModel):
    """
    Model for general-purpose ticket updates (e.g., status, pickup date).
    All fields are optional.
    """
    ticket_number: Optional[str] = None
    pickup_date: Optional[datetime] = None
    status: Optional[str] = None
    special_instructions: Optional[str] = None
    paid_amount: Optional[float] = None
    # Note: rack_number is handled by the dedicated route below
    
    
    
class TicketValidationResponse(BaseModel):
    """
    Returns the ID and customer name for a valid ticket number.
    Matches the 'ValidatedTicket' interface in your frontend.
    """
    ticket_id: int
    ticket_number: str
    customer_name: str



class TicketPickupRequest(BaseModel):
    """The payload sent from the frontend when completing a pickup."""
    amount_paid: float

class TicketPickupResponse(BaseModel):
    """The response sent back after a successful pickup."""
    success: bool
    message: str
    ticket_id: int
    new_status: str
    new_total_paid: float 
    receipt_html: Optional[str] = None
    
    
class CustomerResponse(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    phone: str
    address: Optional[str] = None
    role: str
    organization_id: int
    joined_at: Optional[datetime] = None
    

    is_deactivated: bool = False
    last_visit_date: Optional[datetime] = None
    
    tenure: Optional[str] = "Prospect"
    
class CustomerUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None