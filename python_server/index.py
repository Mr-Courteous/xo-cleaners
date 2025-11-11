import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from utils.common import hash_password
 
# Routers
from routers.registration import router as registration_router
from routers.auth import router as auth_router
from routers.organizations import router as organizations_router
from routers.org_functions import router as org_functions_router
from routers.org_functions2 import router as org_functions2_router
# from routers.clothing_types import router as clothing_types_router
from routers.clothing_types import router as clothing_types_router
from routers.org_functions3 import router as org_functions3_router
from datetime import datetime, timezone

import uvicorn

# ======================
# CONFIGURATION (CLEAN & SSL-ENABLED) 
# ====================== 

# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")

DATABASE_URL = os.getenv("DATABASE_URL",)

if not DATABASE_URL:
    # This prevents the app from proceeding without a DATABASE_URL
    raise EnvironmentError("The DATABASE_URL environment variable is missing!")

# --- FIX: These lines must be comments ---
# CRITICAL FIX: Add connect_args to require SSL/TLS for cloud PostgreSQL.
# This runs immediately when the module loads, ensuring initial connection checks pass.
# --- END FIX ---
engine = create_engine(
    DATABASE_URL,
    # Use this line if your cloud database requires SSL
    # connect_args={"sslmode": "require"}
)

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
# app.include_router(clothing_types_router)
app.include_router(clothing_types_router)
app.include_router(org_functions3_router)

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
        # Check database connection is actually possible
        db = SessionLocal()
    except Exception as conn_error:
        # This will now catch connection errors that occur after successful loading
        print("❌ Could not connect to the database after app started!")
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