import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text  # <-- TEMPORARILY COMMENTED OUT
# from sqlalchemy.orm import sessionmaker      # <-- TEMPORARILY COMMENTED OUT
from utils.common import hash_password # Still needed for local function calls

# Routers (TEMPORARILY COMMENTED OUT)
# from routers.registration import router as registration_router
# from routers.auth import router as auth_router
# from routers.organizations import router as organizations_router
# from routers.org_functions import router as org_functions_router
# from routers.org_functions2 import router as org_functions2_router

import uvicorn

# ======================
# CONFIGURATION
# ======================

# --- TEMPORARY DB DISABLEMENT: Using Mock Objects to allow startup ---

class MockEngine:
    """Placeholder to stop create_engine from running immediately."""
    def __init__(self):
        print("💡 USING MOCK DATABASE ENGINE. DB CONNECTION IS DISABLED.")
    def execute(self, *args, **kwargs):
        raise RuntimeError("Database is disabled. Cannot execute SQL.")

class MockSession:
    """Placeholder for sessionmaker."""
    def __init__(self):
        pass

# The actual configuration block is now replaced by mock objects
# DATABASE_URL = os.getenv("DATABASE_URL")
# if not DATABASE_URL:
#     raise EnvironmentError("The DATABASE_URL environment variable is missing!")
# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"sslmode": "require"}
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Placeholder objects to avoid fatal import/loading errors
engine = MockEngine()
SessionLocal = MockSession

# Default Platform Admin credentials (kept, but currently unused)
DEFAULT_ADMIN_NAME = "Taiwo Courteous"
DEFAULT_ADMIN_EMAIL = "tinumidun@moduslights.com"
DEFAULT_ADMIN_PASSWORD = "1234567890"

# ======================
# INIT APP
# ======================
app = FastAPI(title="XoCleaners1 User Management API - DB DISABLED")

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
# TEMPORARILY COMMENTED OUT ALL DB-DEPENDENT ROUTERS
# app.include_router(registration_router)
# app.include_router(auth_router)
# app.include_router(organizations_router)
# app.include_router(org_functions_router)
# app.include_router(org_functions2_router)

# WORKING ROUTE: Use this route to check if the app is alive
@app.get("/")
def read_root():
    return {"message": "✅ Application is Running! Database connection is TEMPORARILY DISABLED. Use /status to confirm."}

@app.get("/status")
def get_status():
    return {"status": "SUCCESS", "db_enabled": False, "message": "The application is alive! The previous crash was likely related to the database connection/config."}

# ======================
# STARTUP EVENT (TEMPORARILY COMMENTED OUT)
# ======================
# @app.on_event("startup") # <-- COMMENT OUT THIS DECORATOR
def create_platform_admin_on_startup():
    print("🔥 Startup event skipped: create_platform_admin_on_startup()")
    print("⚠️ Database logic is temporarily disabled to diagnose the crash.")
    return
    # The rest of the function body is now unreachable/harmless

# Note: You should also check if you have a `get_db` function defined
# anywhere else in this file or imported by the routers. If so, it
# will need to be temporarily replaced with a mock version as well.