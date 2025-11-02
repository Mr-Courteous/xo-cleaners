import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# ======================\
# CONFIGURATION
# ======================\

# Database setup
# Using port 5433 as observed in the user's index.py config
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ======================\
# DB Dependency 
# ======================\
def get_db():
    """Provides a database session for a request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
