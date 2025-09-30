from sqlalchemy import create_engine, text
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
engine = create_engine(DATABASE_URL)

# Read the migration SQL
with open('migrations/update_ticket.sql', 'r') as file:
    migration_sql = file.read()

# Execute the migration
with engine.connect() as connection:
    connection.execute(text(migration_sql))
    connection.commit()

print("Migration completed successfully!")
