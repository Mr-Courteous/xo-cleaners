import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base # <--- 1. Make sure this is imported



DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")

# DATABASE_URL = os.getenv("DATABASE_URL") 


if not DATABASE_URL:
    raise EnvironmentError("The DATABASE_URL environment variable is missing!")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 2. ✅ THIS IS THE MISSING LINE
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()