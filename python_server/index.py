import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from utils.common import hash_password

# Routers
from routers.registration import router as registration_router
from routers.auth import router as auth_router
from routers.organizations import router as organizations_router
from routers.org_functions import router as org_functions_router
from routers.org_functions2 import router as org_functions2_router

import uvicorn

# ======================
# CONFIGURATION
# ======================
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")


DATABASE_URL = os.getenv("DATABASE_URL")

# --- ADD THIS LOGIC FOR SECURE CLOUD CONNECTIONS ---
connect_args = {}
# Most cloud providers (like Neon, Supabase, etc.) require SSL for connections
if "sslmode" not in DATABASE_URL:
    connect_args["sslmode"] = "require"

# Check if a specific dialect that uses 'sslmode' (like psycopg2) is being used
if DATABASE_URL.startswith("postgresql+psycopg2") or DATABASE_URL.startswith("postgresql://"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"}
    )
else:
    engine = create_engine(DATABASE_URL)
# ---------------------------------------------------

# engine = create_engine(DATABASE_URL) # Your original line (if you are NOT using the fix above)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Default Platform Admin credentials
DEFAULT_ADMIN_NAME = "Taiwo Courteous"
DEFAULT_ADMIN_EMAIL = "tinumidun@moduslights.com"
DEFAULT_ADMIN_PASSWORD = "1234567890"

# ======================
# INIT APP
# ======================
app = FastAPI(title="XoCleaners1 User Management API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# ROUTES
# ======================
app.include_router(registration_router)
app.include_router(auth_router)
app.include_router(organizations_router)
app.include_router(org_functions_router)
app.include_router(org_functions2_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the SaaS User Management API. Use /docs for API documentation."}

# ======================
# STARTUP EVENT
# ======================
@app.on_event("startup")
def create_platform_admin_on_startup():
    print("🔥 Running startup event: create_platform_admin_on_startup()")
    try:
        db = SessionLocal()
    except Exception as conn_error:
        print("❌ Could not connect to the database!")
        print("   Connection error:", conn_error)
        return

    try:
        # Check if admin already exists
        check_stmt = text("SELECT id FROM platform_admins WHERE email = :email")
        existing_admin = db.execute(check_stmt, {"email": DEFAULT_ADMIN_EMAIL}).fetchone()

        if existing_admin:
            print(f"✅ Platform admin '{DEFAULT_ADMIN_EMAIL}' already exists. Skipping creation.")
            return

        # Hash the default password
        hashed_pw = hash_password(DEFAULT_ADMIN_PASSWORD)

        # Insert the platform admin
        insert_stmt = text("""
            INSERT INTO platform_admins (full_name, email, password_hash, role, is_super_admin)
            VALUES (:name, :email, :password_hash, 'platform_admin', TRUE)
        """)
        db.execute(insert_stmt, {
            "name": DEFAULT_ADMIN_NAME,
            "email": DEFAULT_ADMIN_EMAIL,
            "password_hash": hashed_pw
        })
        db.commit()
        print(f"✅ Platform admin '{DEFAULT_ADMIN_EMAIL}' created successfully!")
    except Exception as sql_error:
        db.rollback()
        print("❌ Error creating platform admin!")
        print("   SQL/Error details:", sql_error)
    finally:
        db.close()