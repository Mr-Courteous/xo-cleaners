# FastAPI & dependencies
# from fastapi import FastAPI, HTTPException, Depends, APIRouter, Request, 
from fastapi import FastAPI, HTTPException, Depends, APIRouter, Request, status, UploadFile, File, Form # <-- ADD UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles # <-- ADD StaticFiles


# SQLAlchemy
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session, sessionmaker

# Pydantic
from pydantic import BaseModel, Field

# Utils & typing
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any
import os
import uuid 
import json

# =====================
# LOAD ENVIRONMENT VARIABLES
# =====================
from dotenv import load_dotenv
load_dotenv()  # This loads the .env file

import decimal # ADDED: Import for handling DECIMAL types

import jwt  # PyJWT
from jwt import PyJWTError
import hashlib
import binascii

# Uvicorn (only for running locally)
import uvicorn

import aiofiles # <-- You will need to install this library: pip install aiofiles
import decimal

# ======================
# CONFIG 
# ======================

# JWT Config
SECRET_KEY = "supersecretkey123"   # change to a secure secret!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# =====================
# FILE UPLOAD CONFIG
# =====================
IMAGE_DIR = "static/clothing_images" # Directory to save images
# Create the directory if it doesn't exist
os.makedirs(IMAGE_DIR, exist_ok=True)




search_router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


# ======================
# INIT APP
# ======================
app = FastAPI(title="CleanPress API")

search_router = APIRouter(prefix="/api")
tickets_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ======================
# DB Dependency
# ======================
# Dependency to get a new DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# ======================
# JWT HELPERS
# ======================

# 2. Token Decoding Utility
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # ... (no change needed here)
    pass


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes the JWT token and returns the payload."""
    try:
        # Note: jwt.decode automatically checks expiration (exp) and signature
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("!!! JWT ERROR: Token signature has expired.") # <--- ADDED DEBUG
        return None
    except PyJWTError as e:
        print(f"!!! JWT DECODE ERROR: {e}") # <--- ADDED DEBUG
        return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to authenticate user via JWT token and retrieve details.
    """
    # 🎯 ADDED DEBUG: Check the token received by the backend
    if token:
        print(f"!!! JWT Received: {token[:10]}...{token[-5:]}")
    else:
        # This branch indicates the OAuth2PasswordBearer failed to find the header
        print("!!! JWT Received: EMPTY/MISSING TOKEN") 
    
    payload = decode_access_token(token)
    
    if payload is None:
        # This is where the 401 is raised when token is invalid or expired
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials (Token invalid or expired)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 🎯 SECURITY CHECK: Ensure the 'sub' and 'role' are present in the payload
    username: str = payload.get("sub")
    role: str = payload.get("role")

    if username is None or role is None:
        raise HTTPException(status_code=401, detail="Token missing username or role payload")

    # In a real app, you would fetch full user data here. 
    # For now, just return the payload details.
    return {"username": username, "role": role}

# 4. Dependency: Require Admin (THE MISSING FUNCTION)
def require_admin(current_user: dict = Depends(get_current_user)):
    """Checks if the current user has the 'admin' role."""
    if current_user['role'] != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires administrator privileges.",
        )
    return current_user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # ✅ PyJWT encode

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # ✅ PyJWT decode
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


# =====================
# UTILITIES
# =====================

UPLOAD_FOLDER = "static/clothing_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Ensure this directory exists

async def save_uploaded_file(uploaded_file: UploadFile, folder: str = "clothing_images") -> str:
    """
    Save an uploaded file (image) to the /static/{folder} directory.
    Returns the relative URL path (e.g., /static/clothing_images/abc.jpg).
    """
    try:
        os.makedirs(f"static/{folder}", exist_ok=True)
        filename = f"{uuid.uuid4()}{os.path.splitext(uploaded_file.filename)[1]}"
        filepath = os.path.join("static", folder, filename)

        with open(filepath, "wb") as buffer:
            content = await uploaded_file.read()
            buffer.write(content)

        # Return the relative URL path for frontend access
        return f"/static/{folder}/{filename}"
    except Exception as e:
        print(f"[ERROR] Failed to save uploaded file: {e}")
        raise
        
    
    
# Model for the incoming payment data
class PickupRequest(BaseModel):
    amount_paid: float = 0.0 # Must be float to handle currency

# Placeholder for your CurrentUser model (assuming roles are used for auth)
class CurrentUser(BaseModel):
    id: int
    role: str

# Placeholders for your dependencies
def get_db() -> Session:
    # This dependency is usually defined to yield a database session
    # For example: db = SessionLocal(); try: yield db; finally: db.close()
    pass # Placeholder

def get_current_active_user() -> CurrentUser:
    # This dependency handles JWT decoding and user authentication
    # For example: user = db.query(User).filter(...).first(); return CurrentUser(...)
    return CurrentUser(id=1, role='admin') # Placeholder returning admin by default
    
    
# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Pydantic models for request/
# response from


class LoginRequest(BaseModel):
    username: str
    password: str
    
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class ClothingTypeBase(BaseModel):
    name: str
    plant_price: float
    margin: float

# 🎯 Updated Pydantic model for the GET/POST response
class ClothingTypeResponse(ClothingTypeBase):
    id: int
    total_price: float
    created_at: datetime
    # CRITICAL: Re-add image_url for responses, as it's stored in the DB
    image_url: Optional[str] = None
    
    
class TicketItem(BaseModel):
    clothing_type_id: int
    quantity: int
    starch_level: str = "no_starch"
    crease: str = "no_crease"
    plant_price: float
    margin: float
    item_total: float

# Updated main model for the request body
class TicketItemCreate(BaseModel):
    clothing_type_id: int
    quantity: int
    starch_level: str
    crease: str

# 2. Pydantic Model for the main request body
class TicketCreate(BaseModel):
    customer_id: int
    # Use float for paid_amount input, it will be converted to Decimal in the route function
    paid_amount: float = 0.0  
    special_instructions: Optional[str] = None
    # Use datetime for pickup_date
    pickup_date: Optional[datetime] = None 
    rack_number: Optional[str] = None
    
    # CRITICAL FIX: The list of items must use the lean input model
    items: List[TicketItemCreate] 

class TicketStatusUpdate(BaseModel):
    status: str

# 🎯 FIX: Define the missing Pydantic model
class TicketVoid(BaseModel):
    is_void: bool = Field(..., description="Flag to set the ticket as voided.")
    
class TicketRefund(BaseModel):
    is_refunded: bool = Field(..., description="Flag to set the ticket as refunded.")
    
class RackAssignment(BaseModel):
    rack_number: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

# --- NEW SCHEMAS FOR COST/MARGIN EDITING ---
class TicketItemEdit(BaseModel):
    """Schema for updating a single item's cost and margin."""
    id: int = Field(..., description="ID of the specific ticket_items row to update.")
    plant_price: float = Field(..., ge=0, description="New plant cost (float).")
    margin: float = Field(..., ge=0, description="New margin (float).")

class TicketItemsUpdateRequest(BaseModel):
    """Payload schema for the PUT endpoint to update multiple items."""
    items: List[TicketItemEdit] = Field(..., description="List of ticket items with updated costs/margins.")
    
    
class TicketItemResponse(BaseModel):
    id: int
    ticket_id: int
    clothing_type_id: int
    clothing_name: str  # Added by server lookup
    quantity: int
    starch_level: str
    crease: str
    item_total: float  # Calculated by server
    plant_price: float # Looked up by server
    margin: float      # Looked up by server
    additional_charge: float
    

# Pydantic Model for the main response body
class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    customer_id: int
    customer_name: str
    customer_phone: str
    total_amount: float
    paid_amount: float
    status: str
    rack_number: Optional[str]
    special_instructions: Optional[str]
    pickup_date: Optional[date]
    created_at: date
    # The list of items must use the rich response model
    items: List[TicketItemResponse]     
    is_void: bool
    
    
class PickupRequest(BaseModel):
    """Schema for the pickup request, including the balance paid now."""
    amount_paid: float = Field(..., ge=0, description="Amount paid by the customer now to complete the pickup.")
    # Use ge=0 to allow 0 if the balance was already settled
# --------------------------------------------

# ============
# Password helpers
# ============
def hash_password(password: str) -> str:
    """Hash password using sha256 for simplicity (replace with bcrypt in prod)."""
    if password is None:
        return ""
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), b'salt1234', 100000)
    return binascii.hexlify(dk).decode('ascii')

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


# Run simple migration if users table is missing or not
def run_migrations():
    try:
        with engine.begin() as conn:
            # Execute migration files in migrations/ folder in alphabetical order
            migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
            if os.path.isdir(migrations_dir):
                for fname in sorted(os.listdir(migrations_dir)):
                    if fname.endswith('.sql'):
                        path = os.path.join(migrations_dir, fname)
                        with open(path, 'r') as f:
                            sql = f.read()
                            conn.execute(text(sql))
    except Exception as e:
        print(f"Migration error: {e}")


def ensure_users_table():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if 'users' not in tables:
            # If migrations didn't create the users table for some reason, try to create it from the migration file
            migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
            path = os.path.join(migrations_dir, '001_create_users_table.sql')
            if os.path.isfile(path):
                with engine.begin() as conn:
                    with open(path, 'r') as f:
                        sql = f.read()
                        conn.execute(text(sql))
                        print('Applied users table migration fallback')
            else:
                print('Users migration file not found; cannot create users table automatically')
    except Exception as e:
        print(f"Error ensuring users table: {e}")


@app.on_event('startup')
def startup_tasks():
    # Ensure migrations are applied and seed initial admin user if missing
    run_migrations()
    ensure_users_table()
    # Seed admin user if not present
    try:
        db = SessionLocal()
        res = db.execute(text("SELECT id FROM users WHERE username = :u"), {"u": ADMIN_USERNAME}).fetchone()
        if not res:
            print('Seeding admin user')
            pw_hash = hash_password(ADMIN_PASSWORD)
            # 🎯 Updated email to the user's requested hardcoded value
            default_email = "admin@email.com"
            db.execute(
                text("INSERT INTO users (username, password_hash, role, email) VALUES (:u, :p, 'admin', :e)"), 
                {"u": ADMIN_USERNAME, "p": pw_hash, "e": default_email}
            )
            db.commit()
            print(f"Admin user '{ADMIN_USERNAME}' seeded with email '{default_email}'.")
    except Exception as e:
        print(f"Admin seed error: {e}")
        

def generate_ticket_number(db: Session) -> str:
    """
    Generate a sequential ticket number in the format '01-XXXXXX'
    Starting from 01-000101 and incrementing
    """
    # Get the highest ticket number from the database
    result = db.execute(
        text("""
            SELECT ticket_number 
            FROM tickets 
            WHERE ticket_number LIKE '01-%'
            ORDER BY CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER) DESC 
            LIMIT 1
        """)
    ).fetchone()
    
    if result and result[0]:
        try:
            # Extract the number part and increment
            last_number = int(result[0].split('-')[1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            # If there's any error parsing the number, start fresh
            next_number = 101
    else:
        # Start from 101 if no existing tickets
        next_number = 101
    
    # Format: 01-XXXXXX where X is a digit, padded with zeros
    return f"01-{str(next_number).zfill(6)}"

@app.post("/api/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
async def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Creates a new ticket, saving all item details and financial data."""
    print(f"User {current_user} is creating a new ticket.")
    
    try:
        # 1. Check customer existence
        customer = db.execute(text("SELECT id, name, phone FROM customers WHERE id = :id"), 
                              {"id": ticket_data.customer_id}).fetchone()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        total_amount = decimal.Decimal('0.00')
        ticket_items_to_insert = []
        type_ids = [item.clothing_type_id for item in ticket_data.items]
        
        # 2. Fetch prices, margin, and name for all clothing types
        types_result = db.execute(text("SELECT id, name, plant_price, margin, total_price FROM clothing_types WHERE id IN :ids"), 
                                  {"ids": tuple(type_ids)}).fetchall()

        type_prices = {
            row[0]: {
                "name": row[1], 
                "plant_price": decimal.Decimal(str(row[2])),
                "margin": decimal.Decimal(str(row[3])),
                "total_price": decimal.Decimal(str(row[4]))
            } for row in types_result
        }
        
        # 3. Calculate total_amount and prepare items for batch insert
        for item_create in ticket_data.items:
            prices = type_prices.get(item_create.clothing_type_id)
            
            # Check for missing clothing type price data (prevents NoneType error)
            if prices is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid item: Clothing type ID {item_create.clothing_type_id} not found in price list."
                )

            item_total_price = prices["total_price"] * item_create.quantity
            total_amount += item_total_price

            ticket_items_to_insert.append({
                "clothing_type_id": item_create.clothing_type_id,
                "quantity": item_create.quantity,
                "starch_level": item_create.starch_level,
                "crease": item_create.crease,
                "plant_price": prices["plant_price"],
                "margin": prices["margin"],
                "item_total": item_total_price
            })

        # --- CRITICAL FIX: DYNAMIC TICKET NUMBER GENERATION ---
        date_prefix = datetime.now().strftime("%y%m%d")
        
        # Query the database for the highest existing ticket number for today
        latest_ticket_query = text("""
            SELECT ticket_number FROM tickets 
            WHERE ticket_number LIKE :prefix || '-%'
            ORDER BY ticket_number DESC 
            LIMIT 1
        """)
        latest_ticket_result = db.execute(latest_ticket_query, {"prefix": date_prefix}).fetchone()
        
        new_sequence = 1
        if latest_ticket_result:
            # Extract the sequence part (e.g., '001' from '251015-001')
            latest_number_str = latest_ticket_result[0].split('-')[-1]
            try:
                latest_sequence = int(latest_number_str)
                new_sequence = latest_sequence + 1
            except ValueError:
                # Fallback to 1 if sequence parsing fails (shouldn't happen with the current format)
                new_sequence = 1

        ticket_number = f"{date_prefix}-{new_sequence:03d}" 
        # -----------------------------------------------------

        # Safely access optional fields and convert paid_amount 
        rack_number_val = ticket_data.rack_number
        instructions_val = ticket_data.special_instructions
        paid_amount_val = decimal.Decimal(str(ticket_data.paid_amount)) # Convert from float input
        pickup_date_val = ticket_data.pickup_date

        # 4. Insert Ticket
        ticket_insert_query = text("""
            INSERT INTO tickets (ticket_number, customer_id, total_amount, rack_number, special_instructions, paid_amount, pickup_date)
            VALUES (:ticket_number, :customer_id, :total_amount, :rack_number, :special_instructions, :paid_amount, :pickup_date)
            RETURNING id, created_at, status
        """)
        
        ticket_result = db.execute(ticket_insert_query, {
            "ticket_number": ticket_number,
            "customer_id": ticket_data.customer_id,
            "total_amount": total_amount,
            "rack_number": rack_number_val,
            "special_instructions": instructions_val,
            "paid_amount": paid_amount_val,
            "pickup_date": pickup_date_val
        }).fetchone()

        if ticket_result is None:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database failed to insert ticket.")

        ticket_id = ticket_result[0]
        created_at = ticket_result[1]
        status_val = ticket_result[2] 

        # 5. Insert Ticket Items (Batch insertion logic)
        item_rows = []
        for item in ticket_items_to_insert:
            item["ticket_id"] = ticket_id
            item_rows.append(item)

        item_insert_query = text("""
            INSERT INTO ticket_items (ticket_id, clothing_type_id, quantity, starch_level, crease, plant_price, margin, item_total)
            VALUES (:ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, :plant_price, :margin, :item_total)
            RETURNING id
        """)
        db.execute(item_insert_query, item_rows)
        
        # 6. Commit transaction
        db.commit()

        # 7. Build the complete response object
        response_items = []
        for i, item in enumerate(ticket_items_to_insert, 1):
            clothing_type_id = item['clothing_type_id']
            clothing_name = type_prices[clothing_type_id]['name']

            response_items.append(
                TicketItemResponse(
                    id=i, 
                    ticket_id=ticket_id,
                    clothing_type_id=clothing_type_id,
                    clothing_name=clothing_name,
                    quantity=item['quantity'],
                    starch_level=item['starch_level'],
                    crease=item['crease'],
                    item_total=float(item['item_total']),
                    plant_price=float(item['plant_price']),
                    margin=float(item['margin']),
                    additional_charge=0.0
                )
            )

        return TicketResponse(
            id=ticket_id,
            ticket_number=ticket_number,
            customer_id=ticket_data.customer_id,
            customer_name=customer[1],
            customer_phone=customer[2],
            total_amount=float(total_amount),
            paid_amount=float(paid_amount_val), 
            status=status_val,
            rack_number=rack_number_val,
            special_instructions=instructions_val,
            pickup_date=pickup_date_val,
            created_at=created_at,
            items=response_items
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error during ticket creation: {e}")
        # Raising a generic 500 error prevents leaking internal details
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during ticket processing.")

        
        
@app.get("/api/tickets/{ticket_id}", response_model=TicketResponse, tags=["Tickets"])
async def get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Retrieves a single ticket by ID with all item and customer details."""
    
    # 1. Fetch main ticket and customer details
    ticket_query = text("""
        SELECT 
            t.id, t.ticket_number, t.customer_id, t.total_amount, t.paid_amount, 
            t.status, t.rack_number, t.special_instructions, t.pickup_date, t.created_at,
            t.is_void, -- 🎯 ADDED: Fetch the is_void status
            c.name, c.phone
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.id = :id
    """)
    ticket_result = db.execute(ticket_query, {"id": ticket_id}).fetchone()

    if not ticket_result:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 🎯 MODIFIED: Unpack the new is_void_val from the result tuple
    (
        t_id, t_num, c_id, total_amt, paid_amt, status_val, rack_num, 
        instructions, pickup_date, created_at, is_void_val, c_name, c_phone
    ) = ticket_result
    
    # 2. Fetch all ticket items for this ticket (items_query remains the same)
    items_query = text("""
        SELECT
            ti.id, ti.clothing_type_id, ti.quantity, ti.starch_level, ti.crease, 
            ti.item_total, ti.plant_price, ti.margin,
            ct.name as clothing_name
        FROM ticket_items ti
        JOIN clothing_types ct ON ti.clothing_type_id = ct.id
        WHERE ti.ticket_id = :ticket_id
    """)
    item_results = db.execute(items_query, {"ticket_id": t_id}).fetchall()

    # 3. Map item results to TicketItemResponse model
    response_items = []
    for item in item_results:
        (i_id, ct_id, qty, starch, crease, total, plant_price, margin, name) = item
        response_items.append(
            TicketItemResponse(
                id=i_id,
                ticket_id=t_id,
                clothing_type_id=ct_id,
                clothing_name=name,
                quantity=qty,
                starch_level=starch,
                crease=crease,
                item_total=float(total),
                plant_price=float(plant_price),
                margin=float(margin),
                additional_charge=0.0
            )
        )

    # 4. Construct and return the final TicketResponse
    return TicketResponse(
        id=t_id,
        ticket_number=t_num,
        customer_id=c_id,
        customer_name=c_name,
        customer_phone=c_phone,
        total_amount=float(total_amt),
        paid_amount=float(paid_amt) if paid_amt is not None else 0.0,
        status=status_val,
        rack_number=str(rack_num) if rack_num is not None else None,
        special_instructions=instructions,
        pickup_date=pickup_date,
        created_at=created_at,
        is_void=is_void_val, # 🎯 ADDED: Include the new field
        items=response_items
    )
    
            
@app.get("/api/tickets", response_model=List[TicketResponse], tags=["Tickets"])
async def list_tickets(db: Session = Depends(get_db)):
    """Retrieves a list of tickets, including customer details."""
    
    # 1. Query the main ticket details
    ticket_query = text("""
        SELECT 
            t.id, t.ticket_number, t.customer_id, t.total_amount, 
            COALESCE(t.paid_amount, 0.0) AS paid_amount, 
            t.is_void, -- 🎯 ADDED: Include the is_void field
            t.status, t.rack_number, t.special_instructions, 
            t.pickup_date, t.created_at, c.name, c.phone
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        ORDER BY t.created_at DESC
        LIMIT 100 
    """)
    ticket_results = db.execute(ticket_query).fetchall()

    if not ticket_results:
        # If no results are found, return an empty list [] to satisfy the response_model=List[...]
        return [] 

    # Extract all fetched ticket IDs
    # Assuming t.id is the first column [0]
    ticket_ids = [row[0] for row in ticket_results] 

    # 2. Query all ticket items for the fetched tickets (unchanged)
    items_query = text("""
        SELECT
            ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, ti.starch_level,
            ti.crease, COALESCE(ti.item_total, 0.0), ct.name as clothing_name,
            COALESCE(ti.plant_price, 0.0), COALESCE(ti.margin, 0.0)
        FROM ticket_items ti
        JOIN clothing_types ct ON ti.clothing_type_id = ct.id
        WHERE ti.ticket_id IN :ticket_ids
    """)
    item_results = db.execute(items_query, {"ticket_ids": tuple(ticket_ids)}).fetchall()

    # 3. Map items back to their respective tickets (unchanged)
    ticket_items_map = {}
    for item in item_results:
        (i_id, t_id, ct_id, qty, starch, crease, total, name, plant_price, margin) = item
        item_response = TicketItemResponse(
            id=i_id, ticket_id=t_id, clothing_type_id=ct_id, quantity=qty, 
            starch_level=starch, crease=crease, item_total=float(total), 
            clothing_name=name, plant_price=float(plant_price), margin=float(margin),
            additional_charge=0.0
        )
        if t_id not in ticket_items_map:
            ticket_items_map[t_id] = []
        ticket_items_map[t_id].append(item_response)

    # 4. Construct the final list of TicketResponse objects
    response_tickets: List[TicketResponse] = []
    for row in ticket_results:
        # 🎯 UPDATED DESTRUCTURING: Added is_void_val (6th element)
        (t_id, t_num, c_id, total_amt, paid_amt, is_void_val, status_val, rack_num, instructions, pickup_date, created_at, c_name, c_phone) = row
        
        response_tickets.append(
            TicketResponse(
                id=t_id, ticket_number=t_num, customer_id=c_id, 
                customer_name=c_name, customer_phone=c_phone, 
                total_amount=float(total_amt), paid_amount=float(paid_amt),
                status=status_val, 
                is_void=is_void_val, # 🎯 ADDED: Pass the new boolean value
                special_instructions=instructions, pickup_date=pickup_date, 
                created_at=created_at, 
                items=ticket_items_map.get(t_id, []),
                rack_number=str(rack_num) if rack_num is not None else None, 
            )
        )
        
    return response_tickets

@app.get("/api/customers/search")
def search_customers(query: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT * FROM customers 
                WHERE name LIKE :query OR phone LIKE :query
                ORDER BY name
            """),
            {"query": f"%{query}%"}
        )
        customers = []
        for row in result:
            customers.append({
                "id": row[0],
                "name": row[1],
                "phone": row[2],
                "email": row[3],
                "address": row[4],
                "last_visit_date": row[5],
                "created_at": row[6]
            })
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customers")
def create_customer(customer: CustomerBase, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                INSERT INTO customers (name, phone, email, address)
                VALUES (:name, :phone, :email, :address)
                RETURNING id
            """),
            {
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email or "",
                "address": customer.address or ""
            }
        )
        customer_id = result.scalar()
        db.commit()

        # Fetch the created customer
        result = db.execute(
            text("SELECT * FROM customers WHERE id = :id"),
            {"id": customer_id}
        ).fetchone()

        return {
            "id": result[0],
            "name": result[1],
            "phone": result[2],
            "email": result[3],
            "address": result[4],
            "last_visit_date": result[5],
            "created_at": result[6]
        }
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/clothing-types", response_model=List[ClothingTypeResponse], tags=["Clothing Types"])
def get_clothing_types(request: Request, db: Session = Depends(get_db)):
    """Retrieves all defined clothing types, including full image URLs."""
    try:
        result = db.execute(
            text("SELECT id, name, plant_price, margin, total_price, created_at, image_url FROM clothing_types ORDER BY name")
        )

        base_url = str(request.base_url).rstrip("/")
        clothing_types = []

        for row in result:
            image_url = row[6]
            if image_url and not image_url.startswith("http"):
                # Convert relative paths to full URLs
                image_url = f"{base_url}{image_url}"

            clothing_types.append(
                ClothingTypeResponse(
                    id=row[0],
                    name=row[1],
                    plant_price=float(row[2]),
                    margin=float(row[3]),
                    total_price=float(row[4]),
                    created_at=row[5],
                    image_url=image_url,
                )
            )
        return clothing_types
    except Exception as e:
        print(f"Error fetching clothing types: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.get("/api/tickets/find/{ticket_id}")
def find_ticket(ticket_id: str, db: Session = Depends(get_db)):
    try:
        # Try to find the ticket using both ID and ticket number
        result = db.execute(
            text("""
                SELECT t.*, c.name as customer_name 
                FROM tickets t
                LEFT JOIN customers c ON t.customer_id = c.id
                WHERE CAST(t.id AS TEXT) = :id 
                   OR t.ticket_number = :ticket_number
            """),
            {"id": ticket_id, "ticket_number": ticket_id}
        ).fetchone()
        
        if result:
            return {
                "found": True,
                "ticket": {
                    "id": result[0],
                    "ticket_number": result[1],
                    "customer_id": result[2],
                    "status": result[4],
                    "customer_name": result[-1]
                }
            }
        return {"found": False, "message": f"No ticket found for ID or number: {ticket_id}"}
    except Exception as e:
        return {"error": str(e)}

# Make sure this route comes after more specific routes like /search
@app.get("/api/ticketsd/{id}")
async def get_ticket(id: int, db: Session = Depends(get_db), current_user: str = Depends(verify_token)):
    try:
        # First check if ticket exists
        result = db.execute(
            text("""
                SELECT 
                    t.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    CASE 
                        WHEN t.rack_number IS NOT NULL THEN concat('Rack #', t.rack_number::text)
                        ELSE 'Not Assigned'
                    END as rack_display
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                WHERE t.id = :id
            """),
            {"id": id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # MAPPING: pickup_date is at index 7. We use isoformat() for JSON serialization.
        ticket = {
            "id": result[0],
            "ticket_number": result[1],
            "customer_id": result[2],
            "total_amount": float(result[3]),
            "status": result[4],
            "rack_number": result[5],
            "special_instructions": result[6],
            "pickup_date": result[7].isoformat() if result[7] else None, # <-- NEW DETAIL
            "created_at": result[8].isoformat(),
            "customer_name": result[9],
            "customer_phone": result[10],
            "customer_address": result[11],
            "rack_display": result[12]
        }
        
        # Get ticket items
        items_result = db.execute(
            text("""
                SELECT 
                    ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, 
                    ti.starch_level, ti.crease, ti.item_total, ct.name as clothing_name,
                    ti.plant_price, ti.margin -- <-- NEW DETAILS IN SELECT
                FROM ticket_items ti
                JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id = :ticket_id
            """),
            {"ticket_id": id}
        ).fetchall()
        
        items = []
        for row in items_result:
            # MAPPING: plant_price is at index 8, margin is at index 9
            items.append({
                "id": row[0],
                "ticket_id": row[1],
                "clothing_type_id": row[2],
                "quantity": row[3],
                "starch_level": row[4],
                "crease": row[5],
                "item_total": float(row[6]),
                "clothing_name": row[7],
                "plant_price": float(row[8]), # <-- NEW DETAIL
                "margin": float(row[9])      # <-- NEW DETAIL
            })
        
        # Return the combined ticket and items data
        return {**ticket, "items": items}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_ticket: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/tickets/_search") # Changed to _search to avoid conflict with {id} route
async def search_tickets(query: str, db: Session = Depends(get_db)):
    try:
        # Remove any spaces from the query
        query = query.strip()

        # If query is a number or starts with "01-", search for exact ticket number
        ticket_conditions = [
            "t.ticket_number LIKE :like_query",
            "t.ticket_number = :query",
            "t.ticket_number LIKE :dc_query"
        ]
        
        result = db.execute(
            text(f"""
                SELECT t.*, c.name as customer_name, c.phone as customer_phone, 
                        c.address as customer_address, r.number as rack_number
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                LEFT JOIN racks r ON t.rack_number = r.number
                WHERE {" OR ".join(ticket_conditions)}
                    OR c.name ILIKE :like_query 
                    OR c.phone LIKE :like_query
                ORDER BY t.created_at DESC
            """),
            {
                "query": query,
                "like_query": f"%{query}%",
                "dc_query": f"DC%{query}%"
            }
        ).fetchall()
        
        tickets = []
        for row in result:
            # Determine if the ticket is void by checking its status (e.g., 'VOIDED' or 'CANCELED')
            ticket_status = row[4].upper()
            is_void = ticket_status in ("VOIDED", "CANCELED")
            
            tickets.append({
                "id": row[0],
                "ticket_number": row[1],
                "customer_id": row[2],
                "total_amount": float(row[3]),
                "status": row[4],
                "is_void": is_void,  # <-- ADDED: Boolean flag for void status
                "rack_number": row[5],
                "special_instructions": row[6],
                "pickup_date": row[7],
                "created_at": row[8],
                "customer_name": row[9],
                "customer_phone": row[10],
                "customer_address": row[11]
            })
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    
    # ======================
# LOGIN ROUTE
# ======================

@app.post("/api/auth/login")
def login(request: LoginRequest):
    # Try to find user in DB
    try:
        db = SessionLocal()
        # Ensure we select all fields needed for the response
        row = db.execute(
            text("SELECT id, username, password_hash, role, email FROM users WHERE username = :u"), 
            {"u": request.username}
        ).fetchone()
        
        if row:
            # User found in DB, proceed with password verification
            user_id, username, password_hash, role, email = row[0], row[1], row[2], row[3], row[4]
            
            if verify_password(request.password, password_hash):
                
                # 1. Create JWT Token
                access_token = create_access_token(
                    data={"sub": username, "role": role}, # Use 'sub' for subject/username
                    expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
                )
                
                # 2. Return JWT Token and User Details
                print(f"!!! Successful login for {username}. Token created.") # <--- ADDED DEBUG
                return {
                    "access_token": access_token, 
                    "token_type": "bearer",
                    "user": {
                        "id": user_id,
                        "username": username,
                        "email": email,
                        "role": role
                    }
                }
            
            # If the user exists but the password is wrong
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        # If execution reaches this point, the username was not found in the database.
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    finally:
        try:
            db.close()
        except:
            pass


class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: Optional[str] = 'user'


class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


@app.post('/api/users')
def create_user(req: CreateUserRequest, admin: dict = Depends(require_admin)):
    try:
        db = SessionLocal()
        
        # 1. Check for existing username
        existing_username = db.execute(
            text('SELECT id FROM users WHERE username = :u'), 
            {'u': req.username}
        ).fetchone()
        if existing_username:
            raise HTTPException(status_code=400, detail='User with this username already exists')
        
        # 2. Check for existing email (NEW Logic)
        if req.email:
            existing_email = db.execute(
                text('SELECT id FROM users WHERE email = :e'), 
                {'e': req.email}
            ).fetchone()
            if existing_email:
                raise HTTPException(status_code=400, detail='User with this email address already exists')
        
        # Proceed with creation
        pw_hash = hash_password(req.password)
        res = db.execute(
            text('INSERT INTO users (username, password_hash, email, role) VALUES (:u, :p, :e, :r) RETURNING id, username, email, role, created_at'),
            {'u': req.username, 'p': pw_hash, 'e': req.email or '', 'r': req.role or 'user'}
        )
        db.commit()
        row = res.fetchone()
        return {'id': row[0], 'username': row[1], 'email': row[2], 'role': row[3], 'created_at': row[4]}
    finally:
        try:
            db.close()
        except:
            pass
        
@app.get('/api/users')
def list_users(admin: dict = Depends(require_admin)):
    try:
        db = SessionLocal()
        # This SQL query returns all users with required detailss
        result = db.execute(text('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'))
        users = []
        for r in result:
            users.append({
                'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3], 'created_at': r[4]
            })
        return users
    finally:
        try:
            db.close()
        except:
            pass
        
@app.delete('/api/users/{user_id}')
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    """Delete a user by id. Admin-only. Prevent deleting the last remaining admin."""
    try:
        db = SessionLocal()
        # Check if the user exists
        row = db.execute(text('SELECT id, username, role FROM users WHERE id = :id'), {'id': user_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail='User not found')

        target_role = row[2]

        # If target is an admin, ensure there is at least one other admin
        if target_role == 'admin':
            admin_count = db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'admin'")).scalar() or 0
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail='Cannot delete the last admin user')

        db.execute(text('DELETE FROM users WHERE id = :id'), {'id': user_id})
        db.commit()
        return {'success': True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            db.close()
        except:
            pass


@app.put('/api/users/{user_id}')
def update_user(user_id: int, req: UpdateUserRequest, admin: dict = Depends(require_admin)):
    try:
        db = SessionLocal()
        row = db.execute(text('SELECT id, username, role FROM users WHERE id = :id'), {'id': user_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail='User not found')

        # If username is being changed, ensure uniqueness
        if req.username and req.username != row[1]:
            exists = db.execute(text('SELECT id FROM users WHERE username = :u'), {'u': req.username}).fetchone()
            if exists:
                raise HTTPException(status_code=400, detail='Username already taken')

        # If role is being changed from admin to non-admin, ensure we don't remove last admin
        if req.role and row[2] == 'admin' and req.role != 'admin':
            admin_count = db.execute(text("SELECT COUNT(*) FROM users WHERE role = 'admin'")).scalar() or 0
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail='Cannot remove admin role from the last admin user')

        # Build update
        updates = []
        params: Dict[str, Any] = {'id': user_id}
        if req.username:
            updates.append('username = :username')
            params['username'] = req.username
        if req.email is not None:
            updates.append('email = :email')
            params['email'] = req.email
        if req.role is not None:
            updates.append('role = :role')
            params['role'] = req.role
        if req.password:
            pw_hash = hash_password(req.password)
            updates.append('password_hash = :pw')
            params['pw'] = pw_hash

        if updates:
            sql = f"UPDATE users SET {', '.join(updates)} WHERE id = :id"
            db.execute(text(sql), params)
            db.commit()

        # Return updated user
        updated = db.execute(text('SELECT id, username, email, role, created_at FROM users WHERE id = :id'), {'id': user_id}).fetchone()
        return {'id': updated[0], 'username': updated[1], 'email': updated[2], 'role': updated[3], 'created_at': updated[4]}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            db.close()
        except:
            pass


class UpdateTicketRequest(BaseModel):
    ticket_number: Optional[str] = None
    pickup_date: Optional[str] = None  # ISO string


@app.put('/api/tickets/{ticket_id}')
def update_ticket(ticket_id: int, req: UpdateTicketRequest, admin: dict = Depends(require_admin)):
    try:
        db = SessionLocal()
        row = db.execute(text('SELECT id, ticket_number FROM tickets WHERE id = :id'), {'id': ticket_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail='Ticket not found')

        updates = []
        params = {'id': ticket_id}
        if req.ticket_number is not None:
            updates.append('ticket_number = :ticket_number')
            params['ticket_number'] = req.ticket_number
        if req.pickup_date is not None:
            updates.append('pickup_date = :pickup_date')
            params['pickup_date'] = req.pickup_date

        if updates:
            sql = f"UPDATE tickets SET {', '.join(updates)} WHERE id = :id RETURNING *"
            updated = db.execute(text(sql), params).fetchone()
            db.commit()
        else:
            updated = row

        return {
            'success': True,
            'ticket': {
                'id': updated[0],
                'ticket_number': updated[1],
                'customer_id': updated[2] if len(updated) > 2 else None,
                'pickup_date': updated[7] if len(updated) > 7 else None,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            db.close()
        except:
            pass



@app.get("/api/dashboard/stats", tags=["Dashboard"])
async def get_dashboard_stats(
    db: Session = Depends(get_db), 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Returns core dashboard statistics and logged-in admin details.
    
    Requires 'admin' role access.
    """
    
    # === MODIFICATION 1: Role-Based Authorization Check ===
    # Assuming 'role' is present in the current_user dictionary (from token payload)
    user_role = current_user.get("role")
    
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Must have 'admin' role to view dashboard statistics."
        )
    # ======================================================

    # 1. Dashboard Stats Logic 
    try:
        # Total Tickets (all)
        total_tickets = db.execute(text("SELECT COUNT(id) FROM tickets")).scalar()
        
        # Tickets Ready for Pickup (status = 'ready_for_pickup')
        pending_pickup = db.execute(text("SELECT COUNT(id) FROM tickets WHERE status = 'ready_for_pickup'")).scalar()
        
        # Tickets In Process (status = 'in_process')
        in_process = db.execute(text("SELECT COUNT(id) FROM tickets WHERE status = 'in_process'")).scalar()
        
        # Occupied Racks (racks with at least one ticket not 'picked_up')
        occupied_racks = db.execute(
            text("SELECT COUNT(DISTINCT rack_number) FROM tickets WHERE rack_number IS NOT NULL AND status != 'picked_up'")
        ).scalar()

        # Total Racks (Assumes a table named 'racks' exists for configuration)
        total_racks = db.execute(text("SELECT COUNT(id) FROM racks")).scalar()
        
        # Available Racks
        available_racks = total_racks - occupied_racks if total_racks is not None and occupied_racks is not None else 0

    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics from database",
        )
    
    # 2. Construct the response, including admin_info
    return {
        "total_tickets": total_tickets or 0,
        "pending_pickup": pending_pickup or 0,
        "in_process": in_process or 0,
        "occupied_racks": occupied_racks or 0,
        "available_racks": available_racks or 0,
        # Logged-in admin details (INCLUDING username, email, and role)
        "admin_info": {
            "username": current_user["username"],
            # Ensure 'email' is handled gracefully if not always present in the token payload
            "email": current_user.get("email", "N/A"), 
            # === MODIFICATION 2: Include the role ===
            "role": user_role,
        },
    }
# Assuming all necessary imports (FastAPI, HTTPException, Depends, text, datetime, BaseModel, etc.) 
# are available in the scope where this function is defined.
# Assuming all necessary imports (FastAPI, HTTPException, Depends, text, datetime, BaseModel, etc.) 
# are available in the scope where this function is defined.

@app.put("/api/tickets/{ticket_id}/pickup")
async def process_pickup_with_payment(
    ticket_id: int, 
    request: PickupRequest, 
    db: Session = Depends(get_db), 
    current_user: CurrentUser = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Processes the final balance payment, updates the ticket status to 'picked_up',
    and generates a detailed, printable receipt.
    """
    
    # ... Authorization Check ...

    # Begin transaction
    try:
        # 1. Fetch current ticket data. FIX: Trying t.created_at (very common column name)
        ticket_query = text("""
            SELECT 
                t.id, t.ticket_number, t.status, t.total_amount, t.paid_amount, t.rack_number, 
                c.name as customer_name, c.phone as customer_phone, t.created_at 
                -- ^^^ CRITICAL: REPLACE 't.created_at' IF YOUR COLUMN HAS A DIFFERENT NAME
            FROM tickets t
            JOIN customers c ON t.customer_id = c.id
            WHERE t.id = :id
            FOR UPDATE
        """)
        
        ticket_result = db.execute(ticket_query, {"id": ticket_id}).fetchone()

        if not ticket_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

        # Unpack result (9 columns)
        (
            _, ticket_number, status_val, total_amount, paid_amount, rack_num, 
            customer_name, customer_phone, dropoff_date_field 
        ) = ticket_result
        
        # Convert DB values to float for calculation
        total_amount_f = float(total_amount)
        paid_amount_f = float(paid_amount)
        
        # ... Validation & Payment Calculation ...
        if status_val == 'picked_up':
            raise HTTPException(status_code=400, detail="Ticket is already picked up.")
        
        if status_val != 'ready':
            raise HTTPException(status_code=400, detail=f"Ticket is not ready for pickup (Current status: {status_val}).")
        
        new_paid_amount_f = paid_amount_f + request.amount_paid
        outstanding_balance = total_amount_f - paid_amount_f
        
        if new_paid_amount_f < total_amount_f - 0.01:
            raise HTTPException(
                status_code=400, 
                detail=f"Outstanding balance of ${outstanding_balance:.2f} must be settled. Only ${request.amount_paid:.2f} was paid."
            )

        # 3. Fetch Line Items for the Receipt
        items_query = text("""
            SELECT
                ti.quantity, ct.name as clothing_name, ti.starch_level, ti.crease, ti.item_total
            FROM ticket_items ti
            JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE ti.ticket_id = :ticket_id
        """)
        items_result = db.execute(items_query, {"ticket_id": ticket_id}).fetchall()
        
        # 4. Perform Database Updates
        update_ticket_query = text("""
            UPDATE tickets
            SET status = 'picked_up', 
                paid_amount = :new_paid_amount,
                pickup_date = :now,
                rack_number = NULL 
            WHERE id = :id
            RETURNING *
        """)
        db.execute(update_ticket_query, {
            "id": ticket_id,
            "new_paid_amount": new_paid_amount_f,
            "now": datetime.now()
        })

        if rack_num:
            update_rack_query = text("""
                UPDATE racks
                SET is_occupied = FALSE, 
                    ticket_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE number = :rack_num
            """)
            db.execute(update_rack_query, {"rack_num": rack_num})
        
        db.commit() # Commit the entire transaction
        
        # 5. Generate Detailed, Printable HTML Receipt
        
        items_html = ""
        for qty, name, starch, crease, item_total in items_result:
            # ... (Items HTML generation remains the same) ...
            extras = []
            if starch and starch != 'none':
                extras.append(f"Starch: {starch}")
            if crease and crease != 'none':
                extras.append(f"Crease: {crease}")
                
            extras_html = f"<p style='font-size: 0.7em; margin: 0; padding-left: 10px;'>{', '.join(extras)}</p>" if extras else ""

            items_html += f"""
            <tr>
                <td style="text-align: left; padding-top: 5px;">
                    {qty}x {name}
                    {extras_html}
                </td>
                <td style="text-align: right; padding-top: 5px;">${float(item_total):.2f}</td>
            </tr>
            """

        receipt_html = f"""
        <div style="font-family: monospace; width: 100%; max-width: 300px; margin: 0 auto; padding: 5px; color: #000;">
            <h3 style="text-align: center; margin-bottom: 0px; font-size: 1.1em;">CLEANERS RECEIPT</h3>
            <p style="text-align: center; font-size: 0.9em; margin-top: 0; margin-bottom: 10px;">PICK UP</p>
            <hr style="border-top: 1px dashed #999; margin: 5px 0;"/>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; margin-bottom: 10px;">
                <tr><td style="font-weight: bold; width: 40%;">Ticket No:</td><td style="text-align: right;">{ticket_number}</td></tr>
                <tr><td style="font-weight: bold;">Customer:</td><td style="text-align: right;">{customer_name}</td></tr>
                <tr><td style="font-weight: bold;">Phone:</td><td style="text-align: right;">{customer_phone or 'N/A'}</td></tr>
                <tr><td style="font-weight: bold;">Drop-off:</td><td style="text-align: right;">{dropoff_date_field.strftime('%Y-%m-%d %H:%M') if dropoff_date_field else 'N/A'}</td></tr>
                <tr><td style="font-weight: bold;">Pickup:</td><td style="text-align: right;">{datetime.now().strftime('%Y-%m-%d %H:%M')}</td></tr>
            </table>
            
            <hr style="border-top: 1px dashed #999; margin: 5px 0;"/>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                <thead>
                    <tr style="border-bottom: 1px dashed #000;">
                        <th style="text-align: left; padding-bottom: 5px;">ITEM</th>
                        <th style="text-align: right; padding-bottom: 5px;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <hr style="border-top: 1px dashed #999; margin: 10px 0;"/>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 1.0em;">
                <tr><td>TOTAL CHARGE:</td><td style="text-align: right; font-weight: bold;">${total_amount_f:.2f}</td></tr>
                <tr><td>PREVIOUS PAID:</td><td style="text-align: right;">${paid_amount_f:.2f}</td></tr>
                <tr><td>PAID NOW:</td><td style="text-align: right;">${request.amount_paid:.2f}</td></tr>
                <tr style="font-size: 1.1em;"><td style="border-top: 2px solid #000; padding-top: 5px;">TOTAL PAID:</td><td style="text-align: right; border-top: 2px solid #000; padding-top: 5px; font-weight: bold;">${new_paid_amount_f:.2f}</td></tr>
            </table>
            
            <p style="text-align: center; font-size: 0.8em; margin-top: 20px;">
                *** Thank you for your business! ***
            </p>
        </div>
        """
        
        # 6. Return the detailed receipt HTML
        return {
            "success": True, 
            "message": f"Ticket #{ticket_number} successfully picked up.",
            "ticket_id": ticket_id,
            "receipt_html": receipt_html
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback() 
        print(f"Error in pickup transaction: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process pickup due to a server error. {str(e)}"
        )
        
        
            
@app.get("/api/racks")
def get_racks(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT r.*, t.ticket_number, c.name as customer_name
                FROM racks r
                LEFT JOIN tickets t ON r.ticket_id = t.id
                LEFT JOIN customers c ON t.customer_id = c.id
                ORDER BY r.number
            """)
        ).fetchall()
        
        racks = []
        for row in result:
            racks.append({
                "id": row[0],
                "number": row[1],
                "is_occupied": bool(row[2]),
                "ticket_id": row[3],
                "updated_at": row[4],
                "ticket_number": row[5],
                "customer_name": row[6]
            })
        return racks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/racks/available")
def get_available_racks(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT number 
                FROM racks 
                WHERE is_occupied = FALSE 
                ORDER BY number 
                LIMIT 20
            """)
        ).fetchall()
        
        return [{"number": row[0]} for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/clothing-types", tags=["Clothing Types"])
async def create_clothing_type(
    name: str = Form(...),
    plant_price: float = Form(...),
    margin: float = Form(...),
    image_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Create a new clothing type with an image upload for identification.
    Handles PostgreSQL generated column 'total_price' automatically.
    """
    try:
        # --- Save uploaded image to static folder ---
        image_url = await save_uploaded_file(image_file)

        # --- Insert record (omit total_price since it's a generated column) ---
        result = db.execute(
            text("""
                INSERT INTO clothing_types (name, plant_price, margin, image_url)
                VALUES (:name, :plant_price, :margin, :image_url)
                RETURNING id, created_at, total_price
            """),
            {
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": image_url,
            },
        )
        db.commit()

        row = result.fetchone()

        return {
            "id": row[0],
            "name": name,
            "plant_price": plant_price,
            "margin": margin,
            "total_price": row[2],  # Fetched from generated column
            "created_at": row[1],
            "image_url": image_url,
        }

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to add clothing type: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving clothing type: {e}",
        )

@app.put("/api/clothing-types/{id}", tags=["Clothing Types"])
async def update_clothing_type(
    id: int,
    name: str = Form(...),
    plant_price: float = Form(...),
    margin: float = Form(...),
    image_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """
    Update an existing clothing type (optionally replacing the image).
    Automatically deletes old image file if a new one is uploaded.
    """
    try:
        # 🔍 Get existing clothing type
        row = db.execute(
            text("SELECT image_url FROM clothing_types WHERE id = :id"),
            {"id": id}
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Clothing type not found")

        old_image_url = row[0]
        new_image_url = old_image_url  # Default to old one

        # 🖼 Handle new image upload (optional)
        if image_file:
            new_image_url = await save_uploaded_file(image_file, "clothing_images")

            # 🧹 Remove old image if it exists
            if old_image_url:
                try:
                    old_path = old_image_url.lstrip("/")
                    if os.path.exists(old_path):
                        os.remove(old_path)
                        print(f"[INFO] Old image deleted: {old_path}")
                except Exception as e:
                    print(f"[WARN] Failed to delete old image: {e}")

        # 💾 Update record (total_price is generated automatically)
        db.execute(
            text("""
                UPDATE clothing_types
                SET name = :name, plant_price = :plant_price, margin = :margin, image_url = :image_url
                WHERE id = :id
            """),
            {
                "id": id,
                "name": name,
                "plant_price": plant_price,
                "margin": margin,
                "image_url": new_image_url,
            },
        )
        db.commit()

        return {
            "id": id,
            "name": name,
            "plant_price": plant_price,
            "margin": margin,
            "image_url": new_image_url,
            "message": "Clothing type updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to update clothing type: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating clothing type: {e}")

    
@app.delete("/api/clothing-types/{id}", tags=["Clothing Types"])
def delete_clothing_type(id: int, db: Session = Depends(get_db)):
    """
    Deletes a clothing type from the database and removes its associated image file (if any).
    Prevents deletion if the clothing type is used in existing ticket items.
    """
    try:
        # 🔍 Check if clothing type exists and retrieve its image URL
        row = db.execute(
            text("SELECT image_url FROM clothing_types WHERE id = :id"),
            {"id": id}
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Clothing type not found")

        image_url = row[0]

        # 🚫 Check for references in ticket_items
        in_use = db.execute(
            text("SELECT COUNT(*) FROM ticket_items WHERE clothing_type_id = :id"),
            {"id": id}
        ).scalar()

        if in_use > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete clothing type that is used in existing tickets"
            )

        # 🗑 Delete clothing type record
        db.execute(text("DELETE FROM clothing_types WHERE id = :id"), {"id": id})
        db.commit()

        # 🧹 Delete image file from static folder (if exists)
        if image_url:
            try:
                # image_url might be like '/static/clothing_images/xxxx.jpg'
                image_path = image_url.lstrip("/")  # remove leading slash
                if os.path.exists(image_path):
                    os.remove(image_path)
                    print(f"[INFO] Deleted image file: {image_path}")
            except Exception as img_err:
                print(f"[WARN] Failed to delete image file for clothing type {id}: {img_err}")

        return {"success": True, "message": "Clothing type and image deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to delete clothing type: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tickets/{ticket_id}/rack")
async def assign_rack(ticket_id: str, rack: RackAssignment):
    """
    Assign or reassign a rack to a ticket.
    If the ticket is already assigned to a different rack, 
    the old rack will be freed before assigning the new one.
    """
    try:
        print(f"Attempting to assign rack {rack.rack_number} to ticket {ticket_id}")
        
        # Create a new session for reading ticket data
        read_session = SessionLocal()
        try:
            # Try to find by ticket number in different formats
            ticket = read_session.execute(
                text("""
                    SELECT t.*, c.name as customer_name, r.number as current_rack
                    FROM tickets t 
                    JOIN customers c ON t.customer_id = c.id
                    LEFT JOIN racks r ON t.rack_number = r.number
                    WHERE t.ticket_number = :ticket_number
                       OR t.ticket_number = :dc_ticket_number
                       OR t.ticket_number LIKE :ticket_number_pattern
                       OR CAST(t.id AS TEXT) = :ticket_number
                """),
                {
                    "ticket_number": ticket_id,
                    "dc_ticket_number": f"DC{ticket_id}",
                    "ticket_number_pattern": f"%{ticket_id}"
                }
            ).fetchone()
            
            if not ticket:
                raise HTTPException(status_code=404, detail=f"Ticket not found: {ticket_id}")

            # Check if ticket is already assigned to this rack
            current_rack = ticket[5]  # rack_number from tickets table
            if current_rack == rack.rack_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ticket is already assigned to rack #{rack.rack_number}"
                )

            # Check if new rack exists and is available
            rack_result = read_session.execute(
                text("""
                    SELECT r.*, t.ticket_number as occupied_by
                    FROM racks r
                    LEFT JOIN tickets t ON r.ticket_id = t.id
                    WHERE r.number = :number
                """),
                {"number": rack.rack_number}
            ).fetchone()

            if not rack_result:
                raise HTTPException(status_code=404, detail="Rack not found")

            if rack_result[2]:  # is_occupied
                occupied_by = rack_result[-1]  # last column from our SELECT
                raise HTTPException(
                    status_code=400,
                    detail=f"Rack #{rack.rack_number} is already occupied by ticket {occupied_by}"
                )

        finally:
            read_session.close()

        # Create a new session for the update transaction
        update_session = SessionLocal()
        try:
            # Perform all updates in a single transaction
            with update_session.begin():
                # If ticket is already assigned to a different rack, free it first
                if current_rack is not None:
                    print(f"Freeing up current rack #{current_rack}")
                    update_session.execute(
                        text("""
                            UPDATE racks 
                            SET is_occupied = FALSE, 
                                ticket_id = NULL, 
                                updated_at = CURRENT_TIMESTAMP 
                            WHERE number = :number
                        """),
                        {"number": current_rack}
                    )

                # Update ticket with new rack number
                update_session.execute(
                    text("""
                        UPDATE tickets 
                        SET rack_number = :rack_number, 
                            status = 'ready' 
                        WHERE id = :id
                    """),
                    {"rack_number": rack.rack_number, "id": ticket[0]}
                )

                # Update new rack
                update_session.execute(
                    text("""
                        UPDATE racks 
                        SET is_occupied = TRUE, 
                            ticket_id = :ticket_id, 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE number = :number
                    """),
                    {"ticket_id": ticket[0], "number": rack.rack_number}
                )

                # Get updated ticket details within the same transaction
                result = update_session.execute(
                    text("""
                        SELECT t.*, c.name as customer_name
                        FROM tickets t
                        JOIN customers c ON t.customer_id = c.id
                        WHERE t.id = :id
                    """),
                    {"id": ticket[0]}
                ).fetchone()

                success_message = (
                    f"Ticket reassigned from Rack #{current_rack} to Rack #{rack.rack_number}"
                    if current_rack is not None else
                    f"Ticket assigned to Rack #{rack.rack_number}"
                )

                return {
                    "success": True,
                    "message": success_message,
                    "ticket": {
                        "id": result[0],
                        "ticket_number": result[1],
                        "status": result[4],
                        "rack_number": result[5],
                        "customer_name": result[9]
                    }
                }
        except Exception as e:
            print(f"Error in update transaction: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to assign rack: {str(e)}"
            )
        finally:
            update_session.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Outer error in rack assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, status_update: TicketStatusUpdate, db: Session = Depends(get_db)):
    try:
        # Validate status
        valid_statuses = ['dropped_off', 'in_process', 'ready', 'picked_up']
        if status_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Get current ticket info
        ticket = db.execute(
            text("""
                SELECT t.*, c.name as customer_name
                FROM tickets t 
                JOIN customers c ON t.customer_id = c.id
                WHERE t.id = :id
            """),
            {"id": ticket_id}
        ).fetchone()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        current_status = ticket[4]  # status
        current_rack_number = ticket[5]  # rack_number
        ticket_number = ticket[1]  # ticket_number
        
        # Check if trying to mark as ready without a rack
        if status_update.status == 'ready' and not current_rack_number:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot mark ticket {ticket_number} as ready. Please assign it to a rack first."
            )
        
        # Check if status is the same
        if current_status == status_update.status:
            raise HTTPException(
                status_code=400,
                detail=f"Ticket {ticket_number} is already marked as {status_update.status}"
            )
        
        with db.begin():
            # Update the ticket status
            db.execute(
                text("""
                    UPDATE tickets 
                    SET status = :status
                    WHERE id = :id
                """),
                {
                    "status": status_update.status,
                    "id": ticket_id
                }
            )
            
            # If marking as picked up, handle rack
            if status_update.status == 'picked_up' and current_rack_number:
                db.execute(
                    text("""
                        UPDATE racks 
                        SET is_occupied = FALSE,
                            ticket_id = NULL,
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE number = :number
                    """),
                    {"number": current_rack_number}
                )
            
            # Get fresh ticket data
            updated_ticket = db.execute(
                text("""
                    SELECT t.*, c.name as customer_name
                    FROM tickets t
                    JOIN customers c ON t.customer_id = c.id
                    WHERE t.id = :id
                """),
                {"id": ticket_id}
            ).fetchone()
            
            status_messages = {
                'dropped_off': 'marked as dropped off',
                'in_process': 'moved to processing',
                'ready': f'marked as ready in Rack #{current_rack_number}',
                'picked_up': 'marked as picked up'
            }
            
            success_message = f"Ticket {ticket_number} has been {status_messages[status_update.status]}"
            
            return {
                "success": True,
                "message": success_message,
                "ticket": {
                    "id": updated_ticket[0],
                    "ticket_number": updated_ticket[1],
                    "status": updated_ticket[4],
                    "rack_number": updated_ticket[5],
                    "customer_name": updated_ticket[9]
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.put("/api/tickets/{ticket_number}/void", status_code=200)
async def void_ticket(
    ticket_number: str,
    void_data: TicketVoid,
    db: Session = Depends(get_db),
    # You should include a dependency here to ensure only authorized roles (like admin/manager) can void tickets
    # current_user: dict = Depends(get_current_user_with_role(["admin", "store_manager"])) 
):
    """
    Updates a ticket's void status using the ticket number.
    
    This route handles setting the 'is_void' flag to TRUE.
    """
    if not void_data.is_void:
        # We only expect this endpoint to be used to void (is_void=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint requires 'is_void' to be set to true to perform the void operation."
        )

    try:
        # 1. Check if the ticket exists and is not already voided (optional check, but good practice)
        ticket_check_query = text("SELECT is_void FROM tickets WHERE ticket_number = :ticket_number")
        ticket_result = db.execute(ticket_check_query, {"ticket_number": ticket_number}).scalar()

        if ticket_result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ticket {ticket_number} not found."
            )
        
        if ticket_result:
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ticket {ticket_number} is already voided."
            )

        # 2. Update the ticket's is_void status
        update_query = text(
            "UPDATE tickets SET is_void = :is_void, updated_at = :updated_at WHERE ticket_number = :ticket_number"
        )
        db.execute(update_query, {
            "is_void": True,
            "updated_at": datetime.now(),
            "ticket_number": ticket_number
        })
        db.commit()

        return {"success": True, "message": f"Ticket {ticket_number} has been successfully voided."}

    except HTTPException:
        # Reraise 404/409 exceptions
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to void ticket: {str(e)}"
        )


# main.py (Place this near your void_ticket endpoint)

@app.put("/api/tickets/{ticket_id}/refund", response_model=TicketResponse, tags=["Tickets"])
async def refund_ticket(
    ticket_id: int, 
    ticket_refund: TicketRefund, # Expects { "is_refunded": true }
    db: Session = Depends(get_db), 
    current_user: str = Depends(get_current_user)
):
    """
    Processes a refund for an active ticket by setting is_refunded to True
    and updating the ticket status.
    """
    if not ticket_refund.is_refunded:
        raise HTTPException(status_code=400, detail="Refund status must be set to true to process refund.")

    try:
        # 1. Check if the ticket exists
        check_query = text("SELECT is_void, is_refunded FROM tickets WHERE id = :id")
        result = db.execute(check_query, {"id": ticket_id}).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Ticket not found.")
        
        is_void, is_already_refunded = result
        
        # 2. Check business rules
        if is_void:
            raise HTTPException(status_code=400, detail="Cannot refund a ticket that has been voided.")
            
        if is_already_refunded:
            raise HTTPException(status_code=400, detail="Ticket is already marked as refunded.")

        # 3. Update the database
        update_query = text("""
            UPDATE tickets
            SET is_refunded = TRUE, 
                status = 'REFUNDED'
            WHERE id = :id
        """)
        db.execute(update_query, {"id": ticket_id})
        db.commit()

        # 4. Retrieve and return the updated ticket details
        # Assuming get_ticket_details is defined elsewhere and works correctly
        updated_ticket = await get_ticket_details(ticket_id=ticket_id, db=db, current_user=current_user)
        
        return updated_ticket

    except HTTPException:
        raise
    except Exception as e:
        # Rollback in case of any other unexpected error
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process refund: {str(e)}")
    
# Admin endpoints for system management
@app.post("/api/admin/reset-tickets")
async def reset_tickets(db: Session = Depends(get_db)):
    try:
        with db.begin():
            # Clear rack assignments first
            db.execute(text("""
                UPDATE racks 
                SET is_occupied = FALSE,
                    ticket_id = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE ticket_id IS NOT NULL
            """))
            
            # Delete all ticket items
            db.execute(text("DELETE FROM ticket_items"))
            
            # Finally delete all tickets
            db.execute(text("DELETE FROM tickets"))
            
            return {"success": True, "message": "All tickets have been reset"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/reset-system")
async def reset_system(db: Session = Depends(get_db)):
    """Reset the entire system for a fresh start."""
    try:
        # Read the cleanup SQL file
        with open('cleanup.sql', 'r') as file:
            cleanup_sql = file.read()

        with db.begin():
            # Execute the cleanup script
            db.execute(text(cleanup_sql))
            
            return {
                "success": True, 
                "message": "System has been reset. All tables cleared and racks recreated."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Search tickets endpoint
@search_router.get("/find-tickets")  # Changed to a URL that won't conflict
async def search_tickets(query: str, db: Session = Depends(get_db)):
    try:
        # Remove any spaces from the query
        query = query.strip()

        # If query is a number or starts with "01-", search for exact ticket number
        ticket_conditions = [
            "t.ticket_number LIKE :like_query",
            "t.ticket_number = :query",
            "t.ticket_number LIKE :dc_query"
        ]
        
        result = db.execute(
            text(f"""
                SELECT t.*, c.name as customer_name, c.phone as customer_phone, 
                       c.address as customer_address, r.number as rack_number
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                LEFT JOIN racks r ON t.rack_number = r.number
                WHERE {" OR ".join(ticket_conditions)}
                   OR c.name ILIKE :like_query 
                   OR c.phone LIKE :like_query
                ORDER BY t.created_at DESC
            """),
            {
                "query": query,
                "like_query": f"%{query}%",
                "dc_query": f"DC%{query}%"
            }
        ).fetchall()
        
        tickets = []
        for row in result:
            tickets.append({
                "id": row[0],
                "ticket_number": row[1],
                "customer_id": row[2],
                "total_amount": float(row[3]),
                "status": row[4],
                "rack_number": row[5],
                "special_instructions": row[6],
                "pickup_date": row[7],
                "created_at": row[8],
                "customer_name": row[9],
                "customer_phone": row[10],
                "customer_address": row[11]
            })
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Print ticket endpoint
@app.post("/api/print/tickets/{ticket_number}")
async def print_ticket(ticket_number: str, db: Session = Depends(get_db)):
    try:
        # Get ticket with all necessary information
        ticket_result = db.execute(
            text("""
                SELECT t.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                WHERE t.ticket_number = :ticket_number
            """),
            {"ticket_number": ticket_number}
        ).fetchone()

        if not ticket_result:
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Get ticket items
        items_result = db.execute(
            text("""
                SELECT ti.*, ct.name as clothing_name
                FROM ticket_items ti
                JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id = :ticket_id
            """),
            {"ticket_id": ticket_result[0]}  # ticket_id
        ).fetchall()

        # Format ticket data for printing
        ticket_data = {
            "id": ticket_result[0],
            "ticket_number": ticket_result[1],
            "customer_id": ticket_result[2],
            "total_amount": float(ticket_result[3]),
            "status": ticket_result[4],
            "rack_number": ticket_result[5],
            "special_instructions": ticket_result[6],
            "pickup_date": ticket_result[7],
            "created_at": ticket_result[8],
            "customer_name": ticket_result[9],
            "customer_phone": ticket_result[10],
            "items": [{
                "id": item[0],
                "ticket_id": item[1],
                "clothing_type_id": item[2],
                "quantity": item[3],
                "starch_level": item[4],
                "crease": item[5],
                "item_total": float(item[6]),
                "clothing_name": item[7],
                "additional_charge": float(item[8]) if len(item) > 8 else 0
            } for item in items_result]
        }

        try:
            from printer_service import printer_service
            await printer_service.print_ticket(ticket_data)
            return {"success": True, "message": f"Ticket {ticket_number} printed successfully"}
        except ImportError:
            # If printer service is not available, just log the attempt
            print(f"Printer service not available. Would have printed ticket: {ticket_number}")
            return {"success": True, "message": f"Ticket {ticket_number} processed (printer not available)"}
        except Exception as print_error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to print ticket: {str(print_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the routers
app.include_router(search_router)
app.include_router(tickets_router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
