from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from datetime import datetime
import random
import os
from typing import Optional, List
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="CleanPress API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/cleanpress")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Pydantic models for request/response
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class ClothingTypeBase(BaseModel):
    name: str
    plant_price: float
    margin: float

class TicketItem(BaseModel):
    clothing_type_id: int
    quantity: int
    starch_level: str = "no_starch"
    crease: str = "no_crease"
    item_total: float

class TicketCreate(BaseModel):
    customer_id: int
    items: List[TicketItem]
    special_instructions: Optional[str] = None

def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

# Pydantic models for requests
class TicketStatusUpdate(BaseModel):
    status: str

class RackAssignment(BaseModel):
    rack_number: int

def generate_ticket_number(db: Session):
    # Get the highest ticket number from the database
    result = db.execute(
        text("""
            SELECT ticket_number 
            FROM tickets 
            WHERE ticket_number LIKE '01-%'
            ORDER BY CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER) DESC 
            LIMIT 1
        """)
    ).fetchone()
    
    if result and result[0]:
        # Extract the number part and increment
        last_number = int(result[0].split('-')[1])
        next_number = last_number + 1
    else:
        # Start from 101 if no existing tickets
        next_number = 101
    
    return f"01-{str(next_number).zfill(6)}"

# Helper function for rack assignment
def assign_rack_to_ticket(db: Session, ticket_id: str, rack_number: int):
    # Make sure we don't have any lingering transactions
    db.rollback()
    
    try:
        # Start a fresh transaction
        transaction = db.begin()
        
        # Try to find by ticket number in different formats
        ticket = db.execute(
            text("""
                SELECT id, status FROM tickets 
                WHERE ticket_number = :ticket_number
                OR ticket_number = :dc_ticket_number
                OR ticket_number LIKE :ticket_number_pattern
            """),
            {
                "ticket_number": ticket_id,
                "dc_ticket_number": f"DC{ticket_id}",
                "ticket_number_pattern": f"%{ticket_id}"
            }
        ).fetchone()
        
        if not ticket:
            transaction.rollback()
            raise HTTPException(status_code=404, detail=f"Ticket not found: {ticket_id}")

        # Check if rack exists and is available
        rack_check = db.execute(
            text("SELECT * FROM racks WHERE number = :number"),
            {"number": rack_number}
        ).fetchone()

        if not rack_check:
            transaction.rollback()
            raise HTTPException(status_code=404, detail="Rack not found")

        if rack_check[2]:  # is_occupied
            transaction.rollback()
            raise HTTPException(status_code=400, detail="Rack is already occupied")

        # Update ticket
        db.execute(
            text("""
                UPDATE tickets 
                SET rack_number = :rack_number, status = 'ready' 
                WHERE id = :id
            """),
            {"rack_number": rack_number, "id": ticket[0]}
        )

        # Update rack
        db.execute(
            text("""
                UPDATE racks 
                SET is_occupied = TRUE, 
                    ticket_id = :ticket_id, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE number = :number
            """),
            {"ticket_id": ticket[0], "number": rack_number}
        )

        # Get updated ticket details
        updated_ticket = db.execute(
            text("""
                SELECT t.*, c.name as customer_name
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                WHERE t.id = :id
            """),
            {"id": ticket[0]}
        ).fetchone()

        # Commit the transaction
        transaction.commit()

        return {
            "success": True,
            "message": f"Ticket assigned to Rack #{rack_number}",
            "ticket": {
                "id": updated_ticket[0],
                "ticket_number": updated_ticket[1],
                "status": updated_ticket[4],
                "rack_number": updated_ticket[5],
                "customer_name": updated_ticket[-1]
            }
        }
    except Exception as e:
        if transaction:
            transaction.rollback()
        raise e

# API Routes
# Debug endpoint to find a ticket
@app.get("/api/tickets/find/{ticket_id}")
def find_ticket(ticket_id: str, db: Session = Depends(get_db)):
    try:
        # Try to find the ticket using both ID and ticket number
        result = db.execute(
            text("""
                SELECT t.*, c.name as customer_name 
                FROM tickets t
                LEFT JOIN customers c ON t.customer_id = c.id
                WHERE CAST(t.id AS TEXT) = :id 
                   OR t.ticket_number = :ticket_number
            """),
            {"id": ticket_id, "ticket_number": ticket_id}
        ).fetchone()
        
        if result:
            return {
                "found": True,
                "ticket": {
                    "id": result[0],
                    "ticket_number": result[1],
                    "customer_id": result[2],
                    "status": result[4],
                    "customer_name": result[-1]
                }
            }
        return {"found": False, "message": f"No ticket found for ID or number: {ticket_id}"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/customers/search")
def search_customers(query: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT * FROM customers 
                WHERE name LIKE :query OR phone LIKE :query
                ORDER BY name
            """),
            {"query": f"%{query}%"}
        )
        customers = []
        for row in result:
            customers.append({
                "id": row[0],
                "name": row[1],
                "phone": row[2],
                "email": row[3],
                "address": row[4],
                "last_visit_date": row[5],
                "created_at": row[6]
            })
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/customers")
def create_customer(customer: CustomerBase, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                INSERT INTO customers (name, phone, email, address)
                VALUES (:name, :phone, :email, :address)
                RETURNING id
            """),
            {
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email or "",
                "address": customer.address or ""
            }
        )
        customer_id = result.scalar()
        db.commit()

        # Fetch the created customer
        result = db.execute(
            text("SELECT * FROM customers WHERE id = :id"),
            {"id": customer_id}
        ).fetchone()

        return {
            "id": result[0],
            "name": result[1],
            "phone": result[2],
            "email": result[3],
            "address": result[4],
            "last_visit_date": result[5],
            "created_at": result[6]
        }
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tickets/search")
def search_tickets(query: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT t.*, c.name as customer_name, c.phone as customer_phone, 
                       c.address as customer_address, r.number as rack_number
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                LEFT JOIN racks r ON t.rack_number = r.number
                WHERE t.ticket_number LIKE :query 
                   OR c.name LIKE :query 
                   OR c.phone LIKE :query
                ORDER BY t.created_at DESC
            """),
            {"query": f"%{query}%"}
        ).fetchall()
        
        tickets = []
        for row in result:
            tickets.append({
                "id": row[0],
                "ticket_number": row[1],
                "customer_id": row[2],
                "total_amount": float(row[3]),
                "status": row[4],
                "rack_number": row[5],
                "special_instructions": row[6],
                "pickup_date": row[7],
                "created_at": row[8],
                "customer_name": row[9],
                "customer_phone": row[10],
                "customer_address": row[11]
            })
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    try:
        total_amount = sum(item.item_total for item in ticket.items)
        
        # Start transaction using context manager
        with db.begin():
            # Generate ticket number within the transaction
            ticket_number = generate_ticket_number(db)
            # Create ticket
            result = db.execute(
                text("""
                    INSERT INTO tickets (ticket_number, customer_id, total_amount, special_instructions)
                    VALUES (:ticket_number, :customer_id, :total_amount, :special_instructions)
                    RETURNING id
                """),
                {
                    "ticket_number": ticket_number,
                    "customer_id": ticket.customer_id,
                    "total_amount": total_amount,
                    "special_instructions": ticket.special_instructions or ""
                }
            )
            ticket_id = result.scalar()
            
            # Update customer's last visit date
            db.execute(
                text("""
                    UPDATE customers 
                    SET last_visit_date = CURRENT_TIMESTAMP 
                    WHERE id = :customer_id
                """),
                {"customer_id": ticket.customer_id}
            )
            
            # Insert ticket items
            for item in ticket.items:
                db.execute(
                    text("""
                        INSERT INTO ticket_items 
                        (ticket_id, clothing_type_id, quantity, starch_level, crease, item_total)
                        VALUES (:ticket_id, :clothing_type_id, :quantity, :starch_level, :crease, :item_total)
                    """),
                    {
                        "ticket_id": ticket_id,
                        "clothing_type_id": item.clothing_type_id,
                        "quantity": item.quantity,
                        "starch_level": item.starch_level,
                        "crease": item.crease,
                        "item_total": item.item_total
                    }
                )
            
            # Get complete ticket data with customer information
            result = db.execute(
                text("""
                    SELECT t.*, c.name as customer_name, c.phone as customer_phone
                    FROM tickets t
                    JOIN customers c ON t.customer_id = c.id
                    WHERE t.id = :ticket_id
                """),
                {"ticket_id": ticket_id}
            ).fetchone()

            # Calculate items summary for the message
            items_count = sum(item.quantity for item in ticket.items)
            success_message = f"Ticket {ticket_number} created successfully for {result[9]} with {items_count} items"
            
            return {
                "success": True,
                "message": success_message,
                "ticket": {
                    "id": result[0],
                    "ticket_number": result[1],
                    "customer_id": result[2],
                    "total_amount": float(result[3]),
                    "status": result[4],
                    "rack_number": result[5],
                    "special_instructions": result[6],
                    "pickup_date": result[7],
                    "created_at": result[8],
                    "customer_name": result[9],
                    "customer_phone": result[10]
                }
            }
    except Exception as e:
        db.rollback()
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tickets/{id}")
def get_ticket(id: int, db: Session = Depends(get_db)):
    try:
        # First check if ticket exists
        result = db.execute(
            text("""
                SELECT 
                    t.*,
                    c.name as customer_name,
                    c.phone as customer_phone,
                    c.address as customer_address,
                    CASE 
                        WHEN t.rack_number IS NOT NULL THEN concat('Rack #', t.rack_number::text)
                        ELSE 'Not Assigned'
                    END as rack_display
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                WHERE t.id = :id
            """),
            {"id": id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket = {
            "id": result[0],
            "ticket_number": result[1],
            "customer_id": result[2],
            "total_amount": float(result[3]),
            "status": result[4],
            "rack_number": result[5],
            "special_instructions": result[6],
            "pickup_date": result[7],
            "created_at": result[8],
            "customer_name": result[9],
            "customer_phone": result[10],
            "customer_address": result[11],
            "rack_display": result[12]
        }
        
        # Get ticket items
        items_result = db.execute(
            text("""
                SELECT ti.*, ct.name as clothing_name
                FROM ticket_items ti
                JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id = :ticket_id
            """),
            {"ticket_id": id}
        ).fetchall()
        
        items = []
        for row in items_result:
            items.append({
                "id": row[0],
                "ticket_id": row[1],
                "clothing_type_id": row[2],
                "quantity": row[3],
                "starch_level": row[4],
                "crease": row[5],
                "item_total": float(row[6]),
                "clothing_name": row[7]
            })
        
        return {**ticket, "items": items}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tickets/{ticket_id}/rack")
async def assign_rack(ticket_id: str, rack: RackAssignment):
    """
    Assign or reassign a rack to a ticket.
    If the ticket is already assigned to a different rack, 
    the old rack will be freed before assigning the new one.
    """
    try:
        print(f"Attempting to assign rack {rack.rack_number} to ticket {ticket_id}")
        
        # Create a new session for reading ticket data
        read_session = SessionLocal()
        try:
            # Try to find by ticket number in different formats
            ticket = read_session.execute(
                text("""
                    SELECT t.*, c.name as customer_name, r.number as current_rack
                    FROM tickets t 
                    JOIN customers c ON t.customer_id = c.id
                    LEFT JOIN racks r ON t.rack_number = r.number
                    WHERE t.ticket_number = :ticket_number
                       OR t.ticket_number = :dc_ticket_number
                       OR t.ticket_number LIKE :ticket_number_pattern
                       OR CAST(t.id AS TEXT) = :ticket_number
                """),
                {
                    "ticket_number": ticket_id,
                    "dc_ticket_number": f"DC{ticket_id}",
                    "ticket_number_pattern": f"%{ticket_id}"
                }
            ).fetchone()
            
            if not ticket:
                raise HTTPException(status_code=404, detail=f"Ticket not found: {ticket_id}")

            # Check if ticket is already assigned to this rack
            current_rack = ticket[5]  # rack_number from tickets table
            if current_rack == rack.rack_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ticket is already assigned to rack #{rack.rack_number}"
                )

            # Check if new rack exists and is available
            rack_result = read_session.execute(
                text("""
                    SELECT r.*, t.ticket_number as occupied_by
                    FROM racks r
                    LEFT JOIN tickets t ON r.ticket_id = t.id
                    WHERE r.number = :number
                """),
                {"number": rack.rack_number}
            ).fetchone()

            if not rack_result:
                raise HTTPException(status_code=404, detail="Rack not found")

            if rack_result[2]:  # is_occupied
                occupied_by = rack_result[-1]  # last column from our SELECT
                raise HTTPException(
                    status_code=400,
                    detail=f"Rack #{rack.rack_number} is already occupied by ticket {occupied_by}"
                )

        finally:
            read_session.close()

        # Create a new session for the update transaction
        update_session = SessionLocal()
        try:
            # Perform all updates in a single transaction
            with update_session.begin():
                # If ticket is already assigned to a different rack, free it first
                if current_rack is not None:
                    print(f"Freeing up current rack #{current_rack}")
                    update_session.execute(
                        text("""
                            UPDATE racks 
                            SET is_occupied = FALSE, 
                                ticket_id = NULL, 
                                updated_at = CURRENT_TIMESTAMP 
                            WHERE number = :number
                        """),
                        {"number": current_rack}
                    )

                # Update ticket with new rack number
                update_session.execute(
                    text("""
                        UPDATE tickets 
                        SET rack_number = :rack_number, 
                            status = 'ready' 
                        WHERE id = :id
                    """),
                    {"rack_number": rack.rack_number, "id": ticket[0]}
                )

                # Update new rack
                update_session.execute(
                    text("""
                        UPDATE racks 
                        SET is_occupied = TRUE, 
                            ticket_id = :ticket_id, 
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE number = :number
                    """),
                    {"ticket_id": ticket[0], "number": rack.rack_number}
                )

                # Get updated ticket details within the same transaction
                result = update_session.execute(
                    text("""
                        SELECT t.*, c.name as customer_name
                        FROM tickets t
                        JOIN customers c ON t.customer_id = c.id
                        WHERE t.id = :id
                    """),
                    {"id": ticket[0]}
                ).fetchone()

                success_message = (
                    f"Ticket reassigned from Rack #{current_rack} to Rack #{rack.rack_number}"
                    if current_rack is not None else
                    f"Ticket assigned to Rack #{rack.rack_number}"
                )

                return {
                    "success": True,
                    "message": success_message,
                    "ticket": {
                        "id": result[0],
                        "ticket_number": result[1],
                        "status": result[4],
                        "rack_number": result[5],
                        "customer_name": result[9]
                    }
                }
        except Exception as e:
            print(f"Error in update transaction: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to assign rack: {str(e)}"
            )
        finally:
            update_session.close()
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Outer error in rack assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/tickets/{ticket_id}/pickup")
def process_pickup(ticket_id: int):
    try:
        # Create a new session for reading ticket data
        read_session = SessionLocal()
        try:
            # Get ticket info with customer name
            ticket = read_session.execute(
                text("""
                    SELECT t.*, c.name as customer_name
                    FROM tickets t
                    JOIN customers c ON t.customer_id = c.id
                    WHERE t.id = :id
                """),
                {"id": ticket_id}
            ).fetchone()

            if not ticket:
                raise HTTPException(status_code=404, detail="Ticket not found")

            rack_number = ticket[5]  # rack_number column
            current_status = ticket[4]  # status column
            ticket_number = ticket[1]  # ticket_number column

            if current_status == "picked_up":
                raise HTTPException(
                    status_code=400,
                    detail="Ticket is already marked as picked up"
                )

            if rack_number is None:
                raise HTTPException(
                    status_code=400,
                    detail="Ticket is not assigned to any rack"
                )

        finally:
            read_session.close()

        # Create a new session for the update transaction
        update_session = SessionLocal()
        try:
            # Perform all updates in a single transaction
            with update_session.begin():
                # Update ticket
                updated_ticket = update_session.execute(
                    text("""
                        UPDATE tickets 
                        SET status = 'picked_up',
                            pickup_date = CURRENT_TIMESTAMP,
                            rack_number = NULL
                        WHERE id = :id
                        RETURNING *
                    """),
                    {"id": ticket_id}
                ).fetchone()

                # Free up rack
                update_session.execute(
                    text("""
                        UPDATE racks 
                        SET is_occupied = FALSE,
                            ticket_id = NULL,
                            updated_at = CURRENT_TIMESTAMP 
                        WHERE number = :number
                    """),
                    {"number": rack_number}
                )

            success_message = f"Ticket {ticket_number} has been picked up and removed from Rack #{rack_number}"

            return {
                "success": True,
                "message": success_message,
                "ticket": {
                    "id": updated_ticket[0],
                    "ticket_number": updated_ticket[1],
                    "status": updated_ticket[4],
                    "rack_number": updated_ticket[5],
                    "customer_name": ticket[9]  # customer_name from original query
                }
            }
        except Exception as e:
            print(f"Error in pickup transaction: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process pickup: {str(e)}"
            )
        finally:
            update_session.close()
    except HTTPException:
        raise
    except Exception as e:
        print(f"Outer error in pickup process: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Rack routes
@app.get("/api/racks")
def get_racks(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT r.*, t.ticket_number, c.name as customer_name
                FROM racks r
                LEFT JOIN tickets t ON r.ticket_id = t.id
                LEFT JOIN customers c ON t.customer_id = c.id
                ORDER BY r.number
            """)
        ).fetchall()
        
        racks = []
        for row in result:
            racks.append({
                "id": row[0],
                "number": row[1],
                "is_occupied": bool(row[2]),
                "ticket_id": row[3],
                "updated_at": row[4],
                "ticket_number": row[5],
                "customer_name": row[6]
            })
        return racks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/racks/available")
def get_available_racks(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT number 
                FROM racks 
                WHERE is_occupied = FALSE 
                ORDER BY number 
                LIMIT 20
            """)
        ).fetchall()
        
        return [{"number": row[0]} for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, status_update: TicketStatusUpdate, db: Session = Depends(get_db)):
    try:
        # Validate status
        valid_statuses = ['dropped_off', 'in_process', 'ready', 'picked_up']
        if status_update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")
            
        # Create a read session to get ticket info
        read_session = SessionLocal()
        try:
            # Try to find ticket by number in different formats
            ticket = read_session.execute(
                text("""
                    SELECT t.*, c.name as customer_name
                    FROM tickets t 
                    JOIN customers c ON t.customer_id = c.id
                    WHERE t.ticket_number = :ticket_number
                       OR t.ticket_number = :dc_ticket_number
                       OR t.ticket_number LIKE :ticket_number_pattern
                       OR CAST(t.id AS TEXT) = :ticket_number
                """),
                {
                    "ticket_number": ticket_id,
                    "dc_ticket_number": f"DC{ticket_id}",
                    "ticket_number_pattern": f"%{ticket_id}",
                }
            ).fetchone()
            
            if not ticket:
                raise HTTPException(status_code=404, detail="Ticket not found")
                
            ticket_id = ticket[0]  # actual ticket id
            ticket_number = ticket[1]  # ticket number
            current_status = ticket[4]  # current status
            current_rack_number = ticket[5]  # rack number
            customer_name = ticket[9]  # customer name
            
            # Check if trying to mark as ready without a rack
            if status_update.status == 'ready' and not current_rack_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot mark ticket {ticket_number} as ready. Please assign it to a rack first."
                )
                
            # Check if status is the same
            if current_status == status_update.status:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ticket {ticket_number} is already marked as {status_update.status}"
                )
        finally:
            read_session.close()

        # Create a new session for updates
        update_session = SessionLocal()
        try:
            with update_session.begin():
                # Update the ticket status
                result = update_session.execute(
                    text("""
                        UPDATE tickets 
                        SET status = :status
                        WHERE id = :id
                        RETURNING *
                    """),
                    {
                        "status": status_update.status,
                        "id": ticket_id
                    }
                ).fetchone()
                
                # Get fresh ticket data after update
                updated_ticket = update_session.execute(
                    text("""
                        SELECT t.*, c.name as customer_name
                        FROM tickets t
                        JOIN customers c ON t.customer_id = c.id
                        WHERE t.id = :id
                    """),
                    {"id": ticket_id}
                ).fetchone()

                # Create appropriate success message
                status_messages = {
                    'dropped_off': 'marked as dropped off',
                    'in_process': 'moved to processing',
                    'ready': f'marked as ready in Rack #{current_rack_number}',
                    'picked_up': 'marked as picked up'
                }
                
                success_message = f"Ticket {ticket_number} has been {status_messages[status_update.status]}"
                
                return {
                    "success": True,
                    "message": success_message,
                    "ticket": {
                        "id": updated_ticket[0],
                        "ticket_number": updated_ticket[1],
                        "status": updated_ticket[4],
                        "rack_number": updated_ticket[5],
                        "customer_name": updated_ticket[9]
                    }
                }
        except Exception as e:
            print(f"Error updating ticket status: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update ticket status: {str(e)}"
            )
        finally:
            update_session.close()
            
        db.begin()
        try:
            # If marking as picked up, also handle rack
            if status_update.status == 'picked_up':
                db.execute(
                    text("""
                        UPDATE tickets 
                        SET status = :status,
                            pickup_date = CURRENT_TIMESTAMP,
                            rack_number = NULL
                        WHERE id = :id
                    """),
                    {"id": ticket_id, "status": status_update.status}
                )
                
                # Free up the rack if exists
                if current_rack_number:
                    db.execute(
                        text("""
                            UPDATE racks 
                            SET is_occupied = FALSE,
                                ticket_id = NULL,
                                updated_at = CURRENT_TIMESTAMP 
                            WHERE number = :number
                        """),
                        {"number": current_rack_number}
                    )
                # Update the ticket status
                result = update_session.execute(
                    text("""
                        UPDATE tickets 
                        SET status = :status 
                        WHERE id = :id
                    """),
                    {"id": ticket_id, "status": status_update.status}
                )
            
            # Get updated ticket info
            result = db.execute(
                text("""
                    SELECT t.*, c.name as customer_name 
                    FROM tickets t
                    JOIN customers c ON t.customer_id = c.id
                    WHERE t.id = :id
                """),
                {"id": ticket_id}
            ).fetchone()
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Ticket {ticket_number} status updated to {status_update.status}",
                "ticket": {
                    "id": result[0],
                    "ticket_number": result[1],
                    "status": result[4],
                    "rack_number": result[5],
                    "customer_name": result[9]
                }
            }
        except Exception as e:
            db.rollback()
            raise e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Clothing type routes
@app.get("/api/clothing-types")
def get_clothing_types(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT * FROM clothing_types ORDER BY name"))
        clothing_types = []
        for row in result:
            clothing_types.append({
                "id": row[0],
                "name": row[1],
                "plant_price": float(row[2]),
                "margin": float(row[3]),
                "total_price": float(row[4]),
                "created_at": row[5]
            })
        return clothing_types
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clothing-types")
def create_clothing_type(clothing_type: ClothingTypeBase, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                INSERT INTO clothing_types (name, plant_price, margin)
                VALUES (:name, :plant_price, :margin)
                RETURNING *
            """),
            {
                "name": clothing_type.name,
                "plant_price": clothing_type.plant_price,
                "margin": clothing_type.margin
            }
        )
        db.commit()
        
        new_type = result.fetchone()
        return {
            "id": new_type[0],
            "name": new_type[1],
            "plant_price": float(new_type[2]),
            "margin": float(new_type[3]),
            "total_price": float(new_type[4]),
            "created_at": new_type[5]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/clothing-types/{id}")
def update_clothing_type(id: int, clothing_type: ClothingTypeBase, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                UPDATE clothing_types 
                SET name = :name, plant_price = :plant_price, margin = :margin
                WHERE id = :id
                RETURNING *
            """),
            {
                "id": id,
                "name": clothing_type.name,
                "plant_price": clothing_type.plant_price,
                "margin": clothing_type.margin
            }
        )
        db.commit()
        
        updated_type = result.fetchone()
        if not updated_type:
            raise HTTPException(status_code=404, detail="Clothing type not found")
            
        return {
            "id": updated_type[0],
            "name": updated_type[1],
            "plant_price": float(updated_type[2]),
            "margin": float(updated_type[3]),
            "total_price": float(updated_type[4]),
            "created_at": updated_type[5]
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/clothing-types/{id}")
def delete_clothing_type(id: int, db: Session = Depends(get_db)):
    try:
        # Check if clothing type is used in any tickets
        result = db.execute(
            text("""
                SELECT COUNT(*) FROM ticket_items WHERE clothing_type_id = :id
            """),
            {"id": id}
        ).scalar()
        
        if result > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete clothing type that is used in existing tickets"
            )
            
        db.execute(
            text("DELETE FROM clothing_types WHERE id = :id"),
            {"id": id}
        )
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard stats endpoint with improved transaction handling
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    try:
        # Create a new session specifically for this request
        db = SessionLocal()
        try:
            # Dictionary to store our stats
            stats = {}
            
            # Get total tickets - no transaction needed for read-only query
            result = db.execute(text("SELECT COUNT(*) FROM tickets")).scalar()
            stats["total_tickets"] = result or 0
            
            # Get pending pickup count
            result = db.execute(text("SELECT COUNT(*) FROM tickets WHERE status = 'ready'")).scalar()
            stats["pending_pickup"] = result or 0
            
            # Get in process count
            result = db.execute(text("SELECT COUNT(*) FROM tickets WHERE status = 'in_process'")).scalar()
            stats["in_process"] = result or 0
            
            # Get occupied racks count
            result = db.execute(text("""
                SELECT COUNT(*) FROM racks r
                WHERE r.is_occupied = TRUE
                AND EXISTS (
                    SELECT 1 FROM tickets t
                    WHERE t.rack_number = r.number
                    AND t.status != 'picked_up'
                )
            """)).scalar()
            stats["occupied_racks"] = result or 0
            
            # Get available racks count
            result = db.execute(text("""
                SELECT COUNT(*) FROM racks r
                WHERE r.is_occupied = FALSE
                OR NOT EXISTS (
                    SELECT 1 FROM tickets t
                    WHERE t.rack_number = r.number
                    AND t.status != 'picked_up'
                )
            """)).scalar()
            stats["available_racks"] = result or 0
            
            # Fix any inconsistent rack states in a separate transaction
            try:
                # Start a new transaction explicitly for the update
                with db.begin():
                    db.execute(text("""
                        UPDATE racks
                        SET is_occupied = FALSE,
                            ticket_id = NULL,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE number IN (
                            SELECT r.number
                            FROM racks r
                            LEFT JOIN tickets t ON r.number = t.rack_number
                            WHERE r.is_occupied = TRUE
                            AND (t.id IS NULL OR t.status = 'picked_up')
                        )
                    """))
            except Exception as update_error:
                print(f"Warning: Rack cleanup failed: {str(update_error)}")
                # Continue even if cleanup fails - it's not critical for stats
                pass
            
            return stats
            
        finally:
            db.close()

            return stats
    except Exception as e:
        # Log the error for debugging
        print(f"Dashboard stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Print ticket endpoint
@app.post("/api/print/tickets/{ticket_number}")
async def print_ticket(ticket_number: str, db: Session = Depends(get_db)):
    try:
        # Get ticket with all necessary information
        ticket_result = db.execute(
            text("""
                SELECT t.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
                FROM tickets t
                JOIN customers c ON t.customer_id = c.id
                WHERE t.ticket_number = :ticket_number
            """),
            {"ticket_number": ticket_number}
        ).fetchone()

        if not ticket_result:
            raise HTTPException(status_code=404, detail="Ticket not found")
            raise HTTPException(status_code=404, detail="Ticket not found")

        # Get ticket items
        items_result = db.execute(
            text("""
                SELECT ti.*, ct.name as clothing_name
                FROM ticket_items ti
                JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id = :ticket_id
            """),
            {"ticket_id": ticket_result[0]}  # ticket_id
        ).fetchall()

        # Format ticket data for printing
        ticket_data = {
            "id": ticket_result[0],
            "ticket_number": ticket_result[1],
            "customer_id": ticket_result[2],
            "total_amount": float(ticket_result[3]),
            "status": ticket_result[4],
            "rack_number": ticket_result[5],
            "special_instructions": ticket_result[6],
            "pickup_date": ticket_result[7],
            "created_at": ticket_result[8],
            "customer_name": ticket_result[9],
            "customer_phone": ticket_result[10],
            "items": [{
                "id": item[0],
                "ticket_id": item[1],
                "clothing_type_id": item[2],
                "quantity": item[3],
                "starch_level": item[4],
                "crease": item[5],
                "item_total": float(item[6]),
                "clothing_name": item[7],
                "additional_charge": float(item[8]) if len(item) > 8 else 0
            } for item in items_result]
        }

        try:
            from printer_service import printer_service
            await printer_service.print_ticket(ticket_data)
            return {"success": True, "message": f"Ticket {ticket_number} printed successfully"}
        except ImportError:
            # If printer service is not available, just log the attempt
            print(f"Printer service not available. Would have printed ticket: {ticket_number}")
            return {"success": True, "message": f"Ticket {ticket_number} processed (printer not available)"}
        except Exception as print_error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to print ticket: {str(print_error)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 3001))
    uvicorn.run(app, host="0.0.0.0", port=port)
