from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
import os
import time

def init_database(max_retries=10, retry_delay_seconds=5):
    """
    Initializes the PostgreSQL database schema for the Cleanpress application.
    Implements a retry loop to wait for the database service to become available.
    """
    # --- 1. Configuration (using Environment Variables for best practice) ---
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
    DB_HOST = os.getenv("POSTGRES_HOST", "db")
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME = os.getenv("POSTGRES_DB", "cleanpress")

    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = None

    # --- 2. Resilient Connection with Retry Loop ---
    for attempt in range(max_retries):
        print(f"Attempting to connect to DB at: {DB_HOST}:{DB_PORT}/{DB_NAME} (Attempt {attempt + 1}/{max_retries})")
        try:
            engine = create_engine(DATABASE_URL)
            # Attempt a basic connection check
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print("Connection successful. Database is ready.")
                break
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"DB not ready (OperationalError), retrying in {retry_delay_seconds} seconds...")
                time.sleep(retry_delay_seconds)
            else:
                print(f"Max retries reached. Database connection failed.")
                raise e # Re-raise the final error
        except Exception as e:
            print(f"An unexpected error occurred during connection: {e}")
            raise # Re-raise other exceptions

    if engine is None:
        raise RuntimeError("Failed to create SQLAlchemy engine after all retries.")

    # --- 3. Table Creation and Data Initialization ---
    try:
        with engine.connect() as conn:
            print("Starting table creation...")

            # Create customers table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS customers (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE NOT NULL,
                    email TEXT,
                    address TEXT,
                    last_visit_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # Create clothing_types table (using a GENERATED column for total_price)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS clothing_types (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    plant_price DECIMAL(10,2) NOT NULL,
                    margin DECIMAL(10,2) NOT NULL,
                    # total_price is calculated automatically upon insert/update
                    total_price DECIMAL(10,2) GENERATED ALWAYS AS (plant_price + margin) STORED,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # Create tickets table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tickets (
                    id SERIAL PRIMARY KEY,
                    ticket_number TEXT UNIQUE NOT NULL,
                    customer_id INTEGER NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    status TEXT DEFAULT 'in_process', -- Possible values: 'in_process', 'ready', 'picked_up'
                    rack_number INTEGER,
                    special_instructions TEXT,
                    pickup_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """))

            # Create ticket_items table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ticket_items (
                    id SERIAL PRIMARY KEY,
                    ticket_id INTEGER NOT NULL,
                    clothing_type_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    starch_level TEXT DEFAULT 'no_starch', -- Possible values: 'no_starch', 'light', 'medium', 'heavy'
                    crease TEXT DEFAULT 'no_crease', -- Possible values: 'no_crease', 'single', 'double'
                    item_total DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id),
                    FOREIGN KEY (clothing_type_id) REFERENCES clothing_types (id)
                )
            """))

            # Create racks table for inventory management
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS racks (
                    id SERIAL PRIMARY KEY,
                    number INTEGER UNIQUE NOT NULL,
                    is_occupied BOOLEAN DEFAULT FALSE,
                    ticket_id INTEGER UNIQUE, -- Ensure only one ticket per rack
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
                )
            """))

            # Initialize racks (1-500) if the table is empty
            rack_count_result = conn.execute(text("SELECT COUNT(*) as count FROM racks")).fetchone()
            if not rack_count_result or rack_count_result[0] == 0:
                print("Initializing 500 racks (numbers 1 through 500)...")
                rack_inserts = [
                    {"number": i} for i in range(1, 501)
                ]
                conn.execute(text("INSERT INTO racks (number) VALUES (:number)"), rack_inserts)
                print("Racks initialized.")

            # Initialize default clothing types if the table is empty
            type_count_result = conn.execute(text("SELECT COUNT(*) as count FROM clothing_types")).fetchone()
            if not type_count_result or type_count_result[0] == 0:
                print("Initializing default clothing types...")
                default_types = [
                    ("Shirt", 3.50, 1.50),
                    ("Pants", 4.00, 2.00),
                    ("Dress", 8.00, 4.00),
                    ("Suit Jacket", 6.00, 3.00),
                    ("Tie", 2.50, 1.50)
                ]
                type_inserts = [
                    {"name": name, "plant_price": pp, "margin": m}
                    for name, pp, m in default_types
                ]
                conn.execute(text("""
                    INSERT INTO clothing_types (name, plant_price, margin)
                    VALUES (:name, :plant_price, :margin)
                """), type_inserts)
                print("Clothing types initialized.")

            # Commit the entire transaction
            conn.commit()
            print("Database initialization complete and changes committed.")

    except Exception as e:
        print(f"FATAL ERROR DURING TABLE/DATA INIT: {e}")
        # Re-raise the exception to signal a failure
        raise

if __name__ == "__main__":
    init_database()
