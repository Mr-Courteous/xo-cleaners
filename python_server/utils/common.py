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

from pydantic import BaseModel, Field
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



# ==================================
# TICKET MODELS (REPLACE ALL TICKET MODELS WITH THIS)
# ==================================

# class TicketItemCreate(BaseModel):
#     """Data needed to create a single item on a ticket."""
#     clothing_type_id: int
#     quantity: int
#     starch_level: Optional[str] = "None"
#     crease: Optional[bool] = False
#     additional_charge: Optional[float] = 0.0



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


    
    
class TicketItemResponse(BaseModel):
    """Data returned for a single item on a ticket."""
    id: int
    ticket_id: int
    clothing_type_id: int
    clothing_name: str
    quantity: int
    starch_level: Optional[str]
    crease: Optional[bool]
    item_total: float
    plant_price: float
    margin: float
    additional_charge: float
    pieces: Optional[int] = None  # <-- THIS IS THE FIX
    alterations: Optional[str] = None
    item_instructions: Optional[str] = None  # <--- ADD THIS
    class Config:
        orm_mode = True

class TicketCreate(BaseModel):
    customer_id: int
    items: List[TicketItemCreate]
    rack_number: Optional[str] = None
    special_instructions: Optional[str] = None
    paid_amount: float = 0.0
    pickup_date: Optional[datetime] = None

class TicketResponse(BaseModel):
    """Full ticket data returned after creation."""
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
    alterations: Optional[str] = None # <--- ADD THIS
    item_instructions: Optional[str] = None  # <--- ADD THIS
    
    # 👇 THIS IS THE FIX
    pickup_date: Optional[datetime]
    created_at: datetime
    organization_id: int
    
    # The list of items correctly goes here
    items: List[TicketItemResponse] 

    class Config:
        orm_mode = True
        

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
    
    