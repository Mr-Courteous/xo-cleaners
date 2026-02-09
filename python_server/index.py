import os
from typing import Optional

# =====================
# LOAD ENVIRONMENT VARIABLES FIRST
# =====================
from dotenv import load_dotenv
load_dotenv()  # Load .env file (must be before other imports that use env vars)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # ✅ ADDED THIS IMPORT
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from utils.common import hash_password
from database import SessionLocal, engine
  
# Routers
from routers.registration import router as registration_router
from routers.auth import router as auth_router
from routers.organizations import router as organizations_router
from routers.org_functions import router as org_functions_router
from routers.org_functions2 import router as org_functions2_router
from routers.clothing_types import router as clothing_types_router
from routers.org_functions3 import router as org_functions3_router
from routers.org_settings import router as settings_router
from routers.org_functions4 import router as org_functions4_router
from routers.customer_routes import router as customer_router
from routers.platform_admin import router as platform_admin_router
from routers.org_functions5 import router as org_functions5_router
from routers.org_functions6 import router as org_functions6_router  


import uvicorn

# ======================
# CONFIGURATION
# ====================== 
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")

# # DATABASE_URL = os.getenv("DATABASE_URL") 


# if not DATABASE_URL:
#     raise EnvironmentError("The DATABASE_URL environment variable is missing!")

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Default Platform Admin credential
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

# ✅✅✅ NEW STATIC FILES MOUNTING LOGIC ✅✅✅
# 1. Get the directory where this index.py file is located
current_dir = os.path.dirname(os.path.realpath(__file__))

# 2. Construct the path: python_server/static/clothing_images
static_folder_path = os.path.join(current_dir, "static", "clothing_images")

# 3. Mount the folder
#    URL: http://localhost:8001/static/images/shirt.jpg
#    File: static/clothing_images/shirt.jpg
if os.path.exists(static_folder_path):
    app.mount("/static/clothing_images", StaticFiles(directory=static_folder_path), name="static_images")
    print(f"✅ Static images mounted from: {static_folder_path}")
else:
    print(f"⚠️ WARNING: Static folder not found at: {static_folder_path}")
    # Create it if it doesn't exist (optional helper)
    # os.makedirs(static_folder_path, exist_ok=True)
# ✅✅✅ END NEW LOGIC ✅✅✅


# ======================
# ROUTES
# ======================
app.include_router(registration_router)
app.include_router(auth_router)
app.include_router(organizations_router)
app.include_router(org_functions_router)
app.include_router(org_functions2_router)
app.include_router(clothing_types_router)
app.include_router(org_functions3_router)
app.include_router(settings_router)
app.include_router(org_functions4_router)
app.include_router(customer_router)
app.include_router(platform_admin_router)
app.include_router(org_functions5_router)
app.include_router(org_functions6_router)


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
        print("❌ Could not connect to the database after app started!")
        print("   Connection error:", conn_error)
        return

    try:
        check_stmt = text("SELECT id FROM platform_admins WHERE email = :email")
        existing_admin = db.execute(check_stmt, {"email": DEFAULT_ADMIN_EMAIL}).fetchone()

        if existing_admin:
            print(f"✅ Platform admin '{DEFAULT_ADMIN_EMAIL}' already exists. Skipping creation.")
            return

        hashed_pw = hash_password(DEFAULT_ADMIN_PASSWORD)

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