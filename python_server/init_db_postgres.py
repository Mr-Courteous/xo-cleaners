from sqlalchemy import create_engine, text
import os
import time # Added import for time

def init_database():
    # PostgreSQL connection URL
    # Using hardcoded password 'postgres' matching typical development setup
    DATABASE_URL = "postgresql://postgres:postgres@db:5432/cleanpress"
    
    print(f"Attempting to connect to DB at: {DATABASE_URL}") # Added logging
    
    try:
        # Create database engine
        engine = create_engine(DATABASE_URL)

        # Wait a moment to ensure the DB is fully ready for writes (Safety measure)
        time.sleep(2) 
        
        # Create tables
        with engine.connect() as conn:
            print("Connection successful. Starting table creation...") # Added logging
            
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

            # Create clothing_types table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS clothing_types (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    plant_price DECIMAL(10,2) NOT NULL,
                    margin DECIMAL(10,2) NOT NULL,
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
                    status TEXT DEFAULT 'in_process',
                    rack_number INTEGER,
                    special_instructions TEXT,
                    pickup_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers (id)
                )
            """))
            print("Tickets table definition executed.") # Added logging

            # Create ticket_items table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ticket_items (
                    id SERIAL PRIMARY KEY,
                    ticket_id INTEGER NOT NULL,
                    clothing_type_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    starch_level TEXT DEFAULT 'no_starch',
                    crease TEXT DEFAULT 'no_crease',
                    item_total DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id),
                    FOREIGN KEY (clothing_type_id) REFERENCES clothing_types (id)
                )
            """))

            # Create racks table
            conn.execute(text(""" 
                CREATE TABLE IF NOT EXISTS racks (
                    id SERIAL PRIMARY KEY,
                    number INTEGER UNIQUE NOT NULL,
                    is_occupied BOOLEAN DEFAULT FALSE,
                    ticket_id INTEGER,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
                )
            """))

            # Initialize racks (1-500)
            result = conn.execute(text("SELECT COUNT(*) as count FROM racks")).fetchone()
            if not result or result[0] == 0:
                print("Initializing 500 racks...") # Added logging
                for i in range(1, 501):
                    conn.execute(text(
                        "INSERT INTO racks (number) VALUES (:number)"
                    ), {"number": i})
                print("Racks initialized.") # Added logging

            # Initialize default clothing types
            result = conn.execute(text("SELECT COUNT(*) as count FROM clothing_types")).fetchone()
            if not result or result[0] == 0:
                print("Initializing default clothing types...") # Added logging
                default_types = [
                    ("Shirt", 3.50, 1.50),
                    ("Pants", 4.00, 2.00),
                    ("Dress", 8.00, 4.00),
                    ("Suit Jacket", 6.00, 3.00),
                    ("Tie", 2.50, 1.50)
                ]
                for name, plant_price, margin in default_types:
                    conn.execute(text("""
                        INSERT INTO clothing_types (name, plant_price, margin)
                        VALUES (:name, :plant_price, :margin)
                    """), {
                        "name": name,
                        "plant_price": plant_price,
                        "margin": margin
                    })
                print("Clothing types initialized.") # Added logging

            # Commit the changes (essential!)
            conn.commit() # Moved commit inside the connection block
            print("Database transaction committed. Tables should now exist.") # Added logging
            
    except Exception as e:
        print(f"FATAL ERROR DURING DB INIT: {e}") # Added robust error logging
        # Re-raise the exception to crash the Python script
        raise

if __name__ == "__main__":
    init_database()
