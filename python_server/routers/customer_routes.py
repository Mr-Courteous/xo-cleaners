import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field, validator

# Import your existing utilities
from utils.common import (
    get_db,
    get_current_user_payload,
    verify_password,
    hash_password
)

# =======================
# ROUTER SETUP
# =======================
router = APIRouter(
    prefix="/api/customer",
    tags=["Customer Portal"],
)

# =======================
# PYDANTIC MODELS
# =======================

# --- Profile ---
class CustomerProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # Preferences
    marketing_opt_in: Optional[bool] = None
    is_paused: Optional[bool] = Field(None, description="Vacation mode: Pause account temporarily")
    
    # Explicitly forbidding birthday updates in the model
    @validator('first_name', 'last_name', check_fields=False)
    def check_not_birthday(cls, v):
        return v

# --- Address ---
class SavedAddress(BaseModel):
    label: str = Field(..., example="Home")
    street: str
    city: str
    zip_code: str
    instructions: Optional[str] = None
    is_default: bool = False

# --- Pickup ---
class PickupRequest(BaseModel):
    pickup_date: datetime
    address_id: int
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = Field(None, example="EVERY_MONDAY")

# --- Payment Method ---
class PaymentMethodCreate(BaseModel):
    provider: str = Field(..., example="stripe") # stripe, paypal, cashapp
    token_id: str = Field(..., description="Token from payment provider")
    last_four: str
    card_type: Optional[str] = None

# --- Feedback ---
class OrderFeedback(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

# =======================
# ROUTES
# =======================

# -----------------------------------------------------------------------------
# 1. PROFILE MANAGEMENT (CRUD - No Birthday) & PREFERENCES
# -----------------------------------------------------------------------------
@router.get("/profile")
async def get_my_profile(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("sub_id") # Assuming sub_id is the user ID integer
    if not user_id:
        # Fallback if your payload structure uses ID directly
        user_id = payload.get("id")

    query = text("""
        SELECT id, first_name, last_name, email, phone, address, 
               joined_at, loyalty_points, referral_code, 
               marketing_opt_in, is_paused, dob
        FROM allUsers 
        WHERE id = :id AND role = 'customer'
    """)
    user = db.execute(query, {"id": user_id}).fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return dict(user._mapping)

@router.patch("/profile")
async def update_my_profile(
    data: CustomerProfileUpdate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Updates profile details. DOB is intentionally excluded from the Pydantic model
    so it cannot be updated here. Includes 'Pause Account' (vacation mode).
    """
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Construct dynamic update query
    fields = []
    values = {"id": user_id}
    
    if data.first_name is not None:
        fields.append("first_name = :first_name")
        values["first_name"] = data.first_name
    if data.last_name is not None:
        fields.append("last_name = :last_name")
        values["last_name"] = data.last_name
    if data.phone is not None:
        fields.append("phone = :phone")
        values["phone"] = data.phone
    if data.address is not None:
        fields.append("address = :address")
        values["address"] = data.address
    if data.marketing_opt_in is not None:
        fields.append("marketing_opt_in = :marketing_opt_in")
        values["marketing_opt_in"] = data.marketing_opt_in
    if data.is_paused is not None:
        fields.append("is_paused = :is_paused")
        values["is_paused"] = data.is_paused

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    query = text(f"UPDATE allUsers SET {', '.join(fields)} WHERE id = :id RETURNING id, first_name")
    
    try:
        db.execute(query, values)
        db.commit()
        return {"message": "Profile updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update profile")

# -----------------------------------------------------------------------------
# 2. TICKETS & TRACKING (Previous & Ongoing)
# -----------------------------------------------------------------------------
@router.get("/tickets")
async def get_my_tickets(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    base_query = """
        SELECT t.id, t.ticket_number, t.status, t.created_at, t.pickup_date, 
               t.total_amount, t.paid_amount, (t.total_amount - t.paid_amount) as balance
        FROM tickets t
        WHERE t.customer_id = :uid
    """
    
    params = {"uid": user_id}
    
    if status_filter == 'active':
        base_query += " AND t.status NOT IN ('picked_up', 'refunded', 'cancelled')"
    elif status_filter == 'history':
        base_query += " AND t.status IN ('picked_up', 'refunded', 'cancelled')"
        
    base_query += " ORDER BY t.created_at DESC"
    
    results = db.execute(text(base_query), params).fetchall()
    return [dict(row._mapping) for row in results]

@router.get("/tickets/{ticket_id}")
async def track_ticket_status(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Get detailed status, estimated delivery, and items for a specific order.
    """
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Fetch Ticket
    t_query = text("""
        SELECT t.*, o.organization_name 
        FROM tickets t
        JOIN organizations o ON t.organization_id = o.id
        WHERE t.id = :tid AND t.customer_id = :uid
    """)
    ticket = db.execute(t_query, {"tid": ticket_id, "uid": user_id}).fetchone()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Fetch Items
    i_query = text("SELECT * FROM ticket_items WHERE ticket_id = :tid")
    items = db.execute(i_query, {"tid": ticket_id}).fetchall()
    
    # Construct Response
    ticket_dict = dict(ticket._mapping)
    ticket_dict['items'] = [dict(i._mapping) for i in items]
    
    # Calculate Estimated Ready Time (Simple logic: Created + 3 days if not set)
    # In a real app, this might come from a DB column 'estimated_ready_at'
    if not ticket_dict.get('ready_by'):
        created = ticket_dict.get('created_at')
        if created:
            ticket_dict['estimated_ready_by'] = created + timedelta(days=3)
    
    return ticket_dict

# -----------------------------------------------------------------------------
# 3. PICKUP SCHEDULING (Book / Cancel / Auto-Schedule)
# -----------------------------------------------------------------------------
@router.post("/pickups")
async def book_pickup(
    request: PickupRequest,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Check for vacation mode
    user_check = db.execute(text("SELECT is_paused FROM allUsers WHERE id=:id"), {"id": user_id}).fetchone()
    if user_check and user_check.is_paused:
        raise HTTPException(status_code=400, detail="Account is paused. Please unpause to book pickups.")

    # Create Pickup Request (Assuming a table 'pickup_requests' exists, or inserting into tickets with status 'pickup_requested')
    # Here we simulate inserting into a pickup_requests table
    try:
        query = text("""
            INSERT INTO pickup_requests 
            (customer_id, address_id, requested_date, notes, is_recurring, recurrence_rule, status)
            VALUES (:uid, :addr, :date, :notes, :recur, :rule, 'pending')
            RETURNING id
        """)
        
        result = db.execute(query, {
            "uid": user_id,
            "addr": request.address_id,
            "date": request.pickup_date,
            "notes": request.notes,
            "recur": request.is_recurring,
            "rule": request.recurrence_rule
        }).fetchone()
        
        db.commit()
        return {"message": "Pickup scheduled successfully", "pickup_id": result.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pickups/{pickup_id}/cancel")
async def cancel_pickup(
    pickup_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    query = text("""
        UPDATE pickup_requests 
        SET status = 'cancelled' 
        WHERE id = :pid AND customer_id = :uid AND status = 'pending'
        RETURNING id
    """)
    result = db.execute(query, {"pid": pickup_id, "uid": user_id}).fetchone()
    
    if not result:
        raise HTTPException(status_code=400, detail="Pickup not found or cannot be cancelled")
        
    db.commit()
    return {"message": "Pickup cancelled"}

# -----------------------------------------------------------------------------
# 4. PAYMENTS (Methods & Transactions)
# -----------------------------------------------------------------------------
@router.post("/payment-methods")
async def add_payment_method(
    method: PaymentMethodCreate,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    # NOTE: Never store raw card numbers. Store tokens from Stripe/Square.
    query = text("""
        INSERT INTO customer_payment_methods 
        (customer_id, provider, token_id, last_four, card_type, is_default)
        VALUES (:uid, :prov, :tok, :last, :type, FALSE)
        RETURNING id
    """)
    
    try:
        db.execute(query, {
            "uid": user_id,
            "prov": method.provider,
            "tok": method.token_id,
            "last": method.last_four,
            "type": method.card_type
        })
        db.commit()
        return {"message": "Payment method added"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not save payment method")

@router.post("/tickets/{ticket_id}/pay")
async def make_payment(
    ticket_id: int,
    amount: float,
    payment_method_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    # 1. Verify Ticket Ownership & Balance
    t_query = text("SELECT total_amount, paid_amount FROM tickets WHERE id=:tid AND customer_id=:uid")
    ticket = db.execute(t_query, {"tid": ticket_id, "uid": user_id}).fetchone()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    balance = ticket.total_amount - ticket.paid_amount
    if amount > balance:
        raise HTTPException(status_code=400, detail=f"Amount exceeds balance of {balance}")

    # 2. Process Payment via Gateway (Stripe/Paypal) - PLACEHOLDER
    # payment_response = stripe.Charge.create(...)
    payment_success = True 

    if payment_success:
        # 3. Update DB
        upd_query = text("""
            UPDATE tickets 
            SET paid_amount = paid_amount + :amt 
            WHERE id = :tid
        """)
        db.execute(upd_query, {"amt": amount, "tid": ticket_id})
        db.commit()
        return {"success": True, "new_balance": balance - amount}
    
    raise HTTPException(status_code=402, detail="Payment failed")

# -----------------------------------------------------------------------------
# 5. LOYALTY & REWARDS
# -----------------------------------------------------------------------------
@router.get("/rewards")
async def get_rewards_status(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Get points and referral code
    u_query = text("SELECT loyalty_points, referral_code FROM allUsers WHERE id=:uid")
    user = db.execute(u_query, {"uid": user_id}).fetchone()
    
    # Get active coupons (Assuming a coupons table)
    c_query = text("""
        SELECT code, description, discount_amount 
        FROM customer_coupons 
        WHERE customer_id = :uid AND is_used = FALSE
    """)
    coupons = db.execute(c_query, {"uid": user_id}).fetchall()
    
    return {
        "points": user.loyalty_points,
        "referral_code": user.referral_code,
        "referral_link": f"https://yourcleaners.com/register?ref={user.referral_code}",
        "coupons": [dict(c._mapping) for c in coupons]
    }

# -----------------------------------------------------------------------------
# 6. FEEDBACK & INVOICES
# -----------------------------------------------------------------------------
@router.post("/tickets/{ticket_id}/feedback")
async def submit_feedback(
    ticket_id: int,
    feedback: OrderFeedback,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Verify ownership
    check = db.execute(text("SELECT id FROM tickets WHERE id=:tid AND customer_id=:uid"), 
                      {"tid": ticket_id, "uid": user_id}).fetchone()
    if not check:
        raise HTTPException(status_code=404, detail="Ticket not found")

    query = text("""
        INSERT INTO ticket_feedback (ticket_id, customer_id, rating, comments, created_at)
        VALUES (:tid, :uid, :rating, :comments, :now)
    """)
    
    try:
        db.execute(query, {
            "tid": ticket_id, 
            "uid": user_id, 
            "rating": feedback.rating, 
            "comments": feedback.comments,
            "now": datetime.now(timezone.utc)
        })
        db.commit()
        return {"message": "Thank you for your feedback!"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error saving feedback")

@router.get("/tickets/{ticket_id}/invoice")
async def download_invoice(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns the HTML content for the digital invoice.
    Frontend can convert this to PDF or print it.
    """
    user_id = payload.get("id") or payload.get("sub_id")
    
    # Reuse your existing Receipt Logic here. 
    # For now, we fetch the data to ensure ownership.
    query = text("SELECT id FROM tickets WHERE id=:tid AND customer_id=:uid")
    if not db.execute(query, {"tid": ticket_id, "uid": user_id}).fetchone():
        raise HTTPException(status_code=404, detail="Ticket not found")

    # In a real scenario, you would import `renderReceiptHtml` from your templates
    # and return the string.
    return {"download_url": f"/api/files/invoices/{ticket_id}.pdf"}