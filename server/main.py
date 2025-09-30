# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine, text
# from sqlalchemy.orm import Session, sessionmaker
# from datetime import datetime
# import random
# import os
# from typing import Optional, List
# from pydantic import BaseModel

# # Initialize FastAPI app
# app = FastAPI(title="CleanPress API")

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, replace with your frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# # Database setup
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # Pydantic models for request/response
# class CustomerBase(BaseModel):
#     name: str
#     phone: str
#     email: Optional[str] = None
#     address: Optional[str] = None

# class ClothingTypeBase(BaseModel):
#     name: str
#     plant_price: float
#     margin: float

# class TicketItem(BaseModel):
#     clothing_type_id: int
#     quantity: int
#     starch_level: str = "no_starch"
#     crease: str = "no_crease"
#     item_total: float

# class TicketCreate(BaseModel):
#     customer_id: int
#     items: List[TicketItem]
#     special_instructions: Optional[str] = None

# def get_db():
#     db = Session(engine)
#     try:
#         yield db
#     finally:
#         db.close()

# # Pydantic models for requests
# class TicketStatusUpdate(BaseModel):
#     status: str

# class RackAssignment(BaseModel):
#     rack_number: int

# def generate_ticket_number(db: Session):
#     # Get the highest ticket number from the database
#     result = db.execute(
#         text("""
#             SELECT ticket_number 
#             FROM tickets 
#             WHERE ticket_number LIKE '01-%'
#             ORDER BY CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER) DESC 
#             LIMIT 1
#         """)
#     ).fetchone()
    
#     if result and result[0]:
#         # Extract the number part and increment
#         last_number = int(result[0].split('-')[1])
#         next_number = last_number + 1
#     else:
#         # Start from 101 if no existing tickets
#         next_number = 101
    
#     return f"01-{str(next_number).zfill(6)}"

# # Helper function for rack assignment
# def assign_rack_to_ticket(db: Session, ticket_id: str, rack_number: int):
#     # Make sure we don't have any lingering transactions
#     db.rollback()
    
#     try:
#         # Start a fresh transaction
#         transaction = db.begin()
        
#         # Try to find by ticket number in different formats
#         ticket = db.execute(
#             text("""
#                 SELECT id, status FROM tickets 
#                 WHERE ticket_number = :ticket_number
#                 OR ticket_number = :dc_ticket_number
#                 OR ticket_number LIKE :ticket_number_pattern
#             """),
#             {
#                 "ticket_number": ticket_id,
#                 "dc_ticket_number": f"DC{ticket_id}",
#                 "ticket_number_pattern": f"%{ticket_id}"
#             }
#         ).fetchone()
        
#         if not ticket:
#             transaction.rollback()
#             raise HTTPException(status_code=404, detail=f"Ticket not found: {ticket_id}")

#         # Check if rack exists and is available
#         rack_check = db.execute(
#             text("SELECT * FROM racks WHERE number = :number"),
#             {"number": rack_number}
#         ).fetchone()

#         if not rack_check:
#             transaction.rollback()
#             raise HTTPException(status_code=404, detail="Rack not found")

#         if rack_check[2]:  # is_occupied
#             transaction.rollback()
#             raise HTTPException(status_code=400, detail="Rack is already occupied")

#         # Update ticket
#         db.execute(
#             text("""
#                 UPDATE tickets 
#                 SET rack_number = :rack_number, status = 'ready' 
#                 WHERE id = :id
#             """),
#             {"rack_number": rack_number, "id": ticket[0]}
#         )

#         # Update rack
#         db.execute(
#             text("""
#                 UPDATE racks 
#                 SET is_occupied = TRUE, 
#                     ticket_id = :ticket_id, 
#                     updated_at = CURRENT_TIMESTAMP 
#                 WHERE number = :number
#             """),
#             {"ticket_id": ticket[0], "number": rack_number}
#         )

#         # Get updated ticket details
#         updated_ticket = db.execute(
#             text("""
#                 SELECT t.*, c.name as customer_name
#                 FROM tickets t
#                 JOIN customers c ON t.customer_id = c.id
#                 WHERE t.id = :id
#             """),
#             {"id": ticket[0]}
#         ).fetchone()

#         # Commit the transaction
#         transaction.commit()

#         return {
#             "success": True,
#             "message": f"Ticket assigned to Rack #{rack_number}",
#             "ticket": {
#                 "id": updated_ticket[0],
#                 "ticket_number": updated_ticket[1],
#                 "status": updated_ticket[4],
#                 "rack_number": updated_ticket[5],
#                 "customer_name": updated_ticket[-1]
#             }
#         }
#     except Exception as e:
#         if transaction:
#             transaction.rollback()
#         raise e
