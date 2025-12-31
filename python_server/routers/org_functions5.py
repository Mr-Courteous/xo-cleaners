from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

# --- IMPORTS FROM YOUR UTILS ---
from utils.common import (
    get_db, 
    get_current_user_payload
)

# 1. Define the Router
router = APIRouter(
    prefix="/api/organizations", 
    tags=["Organization Resources"]
)
 

def _check_org_and_role(payload: Dict[str, Any], allowed_roles: List[str] = None):
    org_id = payload.get("organization_id")
    role = payload.get("role")
    if allowed_roles is None:
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
    if role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if not org_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return org_id

class TicketCheckoutItem(BaseModel):
    id: int
    ticket_number: str
    status: str
    created_at: datetime
    total_amount: float
    paid_amount: float
    remaining_balance: float # Positive = They owe money. Negative = They have credit.
    is_fully_paid: bool

class CustomerCheckoutProfile(BaseModel):
    customer_id: int
    customer_name: str
    customer_email: str
    
    # Financial Summaries
    total_debt: float       # Sum of all positive balances (Money they owe you)
    total_credit: float     # Sum of all negative balances (Money you owe them/Overpaid)
    net_balance: float      # Debt - Credit
    
    tickets: List[TicketCheckoutItem]

# -----------------------------
# Drop-off transactions (ticket creation)
# -----------------------------
@router.get("/analytics/transactions/dropoffs")
async def get_dropoff_transactions(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    limit: int = 100,
    offset: int = 0
):
    """Returns ticket creation events (drop-offs) for the organization."""
    try:
        org_id = _check_org_and_role(payload)

        q = text("""
            SELECT t.id as ticket_id, t.ticket_number, t.customer_id, t.created_at, t.created_by_user_id, t.total_amount
            FROM tickets t
            WHERE t.organization_id = :org_id
            ORDER BY t.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        rows = db.execute(q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
        out = []
        for r in rows:
            out.append({
                "ticket_id": r.ticket_id,
                "ticket_number": r.ticket_number,
                "customer_id": r.customer_id,
                "created_at": r.created_at,
                "created_by": getattr(r, 'created_by_user_id', None),
                "total_amount": float(r.total_amount) if r.total_amount is not None else 0.0,
                "type": "dropoff"
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching dropoffs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Rack assignment transactions
# -----------------------------
@router.get("/analytics/transactions/rack-assignments")
async def get_rack_assignments(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    limit: int = 100,
    offset: int = 0
):
    """Returns rack assignment events. If a dedicated history table exists use it; else synthesize
    from tickets where rack_number is set."""
    try:
        org_id = _check_org_and_role(payload)

        # Try to read a hypothetical rack_assignment_history table first
        try:
            hist_q = text("""
                SELECT id, ticket_id, rack_number, operator_id, created_at, note
                FROM rack_assignment_history
                WHERE organization_id = :org_id
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
            """)
            hist_rows = db.execute(hist_q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
            if hist_rows:
                out = []
                for r in hist_rows:
                    out.append({
                        "id": r.id,
                        "ticket_id": r.ticket_id,
                        "rack_number": r.rack_number,
                        "operator_id": r.operator_id,
                        "note": getattr(r, 'note', None),
                        "created_at": r.created_at,
                        "type": "rack_assignment"
                    })
                return out
        except Exception:
            # Fall through to synthesized
            pass

        # Synthesize from tickets that have rack_number assigned
        q = text("""
            SELECT t.id as ticket_id, t.ticket_number, t.rack_number, t.updated_at, t.created_by_user_id
            FROM tickets t
            WHERE t.organization_id = :org_id AND t.rack_number IS NOT NULL
            ORDER BY t.updated_at DESC NULLS LAST
            LIMIT :limit OFFSET :offset
        """)
        rows = db.execute(q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
        out = []
        for r in rows:
            out.append({
                "ticket_id": r.ticket_id,
                "ticket_number": r.ticket_number,
                "rack_number": r.rack_number,
                "assigned_at": r.updated_at or None,
                "assigned_by": getattr(r, 'created_by_user_id', None),
                "type": "rack_assignment"
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching rack assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Pickup transactions
# -----------------------------
@router.get("/analytics/transactions/pickups")
async def get_pickup_transactions(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    limit: int = 100,
    offset: int = 0
):
    """Returns pickup events (tickets marked picked_up)."""
    try:
        org_id = _check_org_and_role(payload)
        q = text("""
            SELECT t.id as ticket_id, t.ticket_number, t.customer_id, t.pickup_date, t.paid_amount, t.updated_at
            FROM tickets t
            WHERE t.organization_id = :org_id AND t.status = 'picked_up'
            ORDER BY t.pickup_date DESC NULLS LAST
            LIMIT :limit OFFSET :offset
        """)
        rows = db.execute(q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
        out = []
        for r in rows:
            out.append({
                "ticket_id": r.ticket_id,
                "ticket_number": r.ticket_number,
                "customer_id": r.customer_id,
                "pickup_date": r.pickup_date or r.updated_at,
                "paid_amount": float(r.paid_amount) if r.paid_amount is not None else 0.0,
                "type": "pickup"
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching pickups: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Clothing item transactions
# -----------------------------
@router.get("/analytics/transactions/clothing")
async def get_clothing_transactions(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    limit: int = 100,
    offset: int = 0
):
    """Returns ticket_items events: additions/updates to clothing items on tickets."""
    try:
        org_id = _check_org_and_role(payload)
        q = text("""
            SELECT ti.id, ti.ticket_id, ti.clothing_type_id, ct.name as clothing_name, ti.quantity, ti.item_total, ti.created_at, ti.updated_at
            FROM ticket_items ti
            LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            JOIN tickets t ON ti.ticket_id = t.id
            WHERE t.organization_id = :org_id
            ORDER BY COALESCE(ti.updated_at, ti.created_at) DESC
            LIMIT :limit OFFSET :offset
        """)
        rows = db.execute(q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
        out = []
        for r in rows:
            out.append({
                "id": r.id,
                "ticket_id": r.ticket_id,
                "clothing_type_id": r.clothing_type_id,
                "clothing_name": r.clothing_name,
                "quantity": r.quantity,
                "item_total": float(r.item_total) if r.item_total is not None else 0.0,
                "created_at": getattr(r, 'created_at', None),
                "updated_at": getattr(r, 'updated_at', None),
                "type": "clothing"
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching clothing transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Customer events
# -----------------------------
@router.get("/analytics/transactions/customers")
async def get_customer_transactions(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload),
    limit: int = 100,
    offset: int = 0
):
    """Returns customer-related events (new customers, updates)."""
    try:
        org_id = _check_org_and_role(payload)
        q = text("""
            SELECT id as customer_id, first_name, last_name, email, phone, joined_at, updated_at
            FROM allUsers
            WHERE organization_id = :org_id AND role = 'customer'
            ORDER BY joined_at DESC NULLS LAST
            LIMIT :limit OFFSET :offset
        """)
        rows = db.execute(q, {"org_id": org_id, "limit": limit, "offset": offset}).fetchall()
        out = []
        for r in rows:
            out.append({
                "customer_id": r.customer_id,
                "first_name": r.first_name,
                "last_name": r.last_name,
                "email": r.email,
                "phone": getattr(r, 'phone', None),
                "joined_at": getattr(r, 'joined_at', None),
                "updated_at": getattr(r, 'updated_at', None),
                "type": "customer"
            })
        return out
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers/{customer_id}/checkout-profile", response_model=CustomerCheckoutProfile)
def get_customer_checkout_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Fetches ALL tickets for a customer to facilitate complex payments.
    Calculates total debt and credit to allow over/under payment handling on the frontend.
    """
    
    # 1. Security Check
    organization_id = payload.get("organization_id")
    if not organization_id:
        raise HTTPException(status_code=401, detail="Organization ID missing.")

    # 2. Fetch Customer Details
    customer_query = text("""
        SELECT id, first_name, last_name, email 
        FROM allUsers 
        WHERE id = :cid AND organization_id = :oid AND role = 'customer'
    """)
    customer = db.execute(customer_query, {"cid": customer_id, "oid": organization_id}).fetchone()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # 3. Fetch ALL Tickets for this customer
    # We order by created_at DESC so newest are top, but you can change to ASC to pay off old debt first.
    tickets_query = text("""
        SELECT id, ticket_number, status, total_amount, paid_amount, created_at
        FROM tickets
        WHERE customer_id = :cid AND organization_id = :oid
        ORDER BY created_at DESC
    """)
    tickets = db.execute(tickets_query, {"cid": customer_id, "oid": organization_id}).fetchall()

    # 4. Calculate Financials
    formatted_tickets = []
    total_debt = 0.0
    total_credit = 0.0

    for t in tickets:
        t_total = float(t.total_amount)
        t_paid = float(t.paid_amount)
        balance = t_total - t_paid
        
        # Determine if fully paid (allow for tiny float discrepancies)
        is_fully_paid = balance <= 0.01

        # Aggregations
        if balance > 0.01:
            total_debt += balance
        elif balance < -0.01:
            # If balance is negative (e.g. -5.00), it means they overpaid by 5.
            # We add absolute value to total_credit
            total_credit += abs(balance)

        # Timezone safety for the list
        t_created = t.created_at
        if t_created.tzinfo is None:
            t_created = t_created.replace(tzinfo=timezone.utc)

        formatted_tickets.append(TicketCheckoutItem(
            id=t.id,
            ticket_number=t.ticket_number,
            status=t.status,
            created_at=t_created,
            total_amount=t_total,
            paid_amount=t_paid,
            remaining_balance=balance,
            is_fully_paid=is_fully_paid
        ))

    # 5. Return the Profile
    return CustomerCheckoutProfile(
        customer_id=customer.id,
        customer_name=f"{customer.first_name} {customer.last_name}",
        customer_email=customer.email,
        total_debt=round(total_debt, 2),
        total_credit=round(total_credit, 2),
        net_balance=round(total_debt - total_credit, 2),
        tickets=formatted_tickets
    )