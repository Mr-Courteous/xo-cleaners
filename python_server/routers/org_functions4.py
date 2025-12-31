from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, date
from fastapi import APIRouter, HTTPException, Depends, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError # Make sure to import this



# --- IMPORTS FROM YOUR UTILS ---
from utils.common import (
    get_db, 
    create_audit_log,
    get_current_user_payload
)



# 1. Define the Router
router = APIRouter(
    prefix="/api/organizations", 
    tags=["Organization Resources"]
)
# 2. Define the Response Model
class DashboardAnalyticsResponse(BaseModel):
    today_sales: float
    month_sales: float
    active_tickets: int
    ready_tickets: int
    picked_up_today: int
    total_customers: int


class RawTicket(BaseModel):
    id: int
    ticket_number: str
    customer_id: int
    status: str
    # total_price removed, calculated on frontend
    is_refunded: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class RawTicketItem(BaseModel):
    id: int
    ticket_id: int
    clothing_name: Optional[str] = "Unknown"
    quantity: int
    notes: Optional[str] = None
    price: float = 0.0  # Added price so frontend can calculate totals

class RawRack(BaseModel):
    id: int
    rack_number: int
    is_occupied: bool

class RawCustomer(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    joined_at: Optional[datetime] = None

class FullOrgDataResponse(BaseModel):
    """
    Returns ALL data related to the organization so the frontend 
    can perform its own filtering, graphing, and analysis.
    """
    tickets: List[RawTicket]
    items: List[RawTicketItem]
    racks: List[RawRack]
    customers: List[RawCustomer]
    
    



# =======================
# Response Models
# =======================

class RawTicket(BaseModel):
    id: int
    ticket_number: str
    customer_id: int
    status: str
    is_refunded: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_amount: float = 0.0 

class RawTicketItem(BaseModel):
    id: int
    ticket_id: int
    clothing_name: Optional[str] = "Unknown"
    quantity: int
    price: float = 0.0

class RawRack(BaseModel):
    id: int
    rack_number: int
    is_occupied: bool

class RawCustomer(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    joined_at: Optional[datetime] = None

class LedgerEntry(BaseModel):
    id: str
    date: datetime
    reference: str
    customer_name: str
    type: str # 'PAYMENT' or 'REFUND'
    amount: float
    method: str = "Cash/Card"
    
# --- Chart Models ---
class ChartPoint(BaseModel):
    label: str
    value: float
    color: Optional[str] = None

class ChartsResponse(BaseModel):
    revenue_by_status: List[ChartPoint]
    top_items: List[ChartPoint]
    daily_revenue: List[ChartPoint]

class FullOrgDataResponse(BaseModel):
    tickets: List[RawTicket]
    items: List[RawTicketItem]
    racks: List[RawRack]
    customers: List[RawCustomer]
    ledger: List[LedgerEntry] # <--- New Financial Data
    
class TicketMiniSummary(BaseModel):
    id: int
    ticket_number: str
    status: str
    total_amount: float
    paid_amount: float
    balance: float
    created_at: datetime

class CustomerFinancialResponse(BaseModel):
    customer_id: int
    total_tickets: int
    lifetime_total_sales: float
    lifetime_total_paid: float
    total_outstanding_balance: float # <--- This is the number you need to see if they owe money
    tickets: List[TicketMiniSummary]


# =======================
# Analytics Endpoint
# =======================
@router.get("/analytics/dashboard", response_model=FullOrgDataResponse)
async def get_dashboard_analytics(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns ALL raw data plus a computed Financial Ledger.
    """
    try:
        org_id = payload.get("organization_id")
        user_role = payload.get("role")
        
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")

        # ---------------------------------------------------------
        # 1. Fetch Tickets 
        # ---------------------------------------------------------
        tickets_query = text("""
            SELECT 
                t.id, t.ticket_number, t.customer_id, t.status, 
                COALESCE(t.is_refunded, FALSE) as is_refunded, 
                COALESCE(t.paid_amount, 0.0) as paid_amount,
                t.created_at, t.updated_at,
                u.first_name, u.last_name
            FROM tickets t
            LEFT JOIN allUsers u ON t.customer_id = u.id
            WHERE t.organization_id = :org_id
            ORDER BY t.created_at DESC
        """)
        tickets_rows = db.execute(tickets_query, {"org_id": org_id}).fetchall()
        
        tickets_data = []
        ledger_data = []

        for row in tickets_rows:
            # Add to Tickets List
            tickets_data.append(RawTicket(
                id=row.id,
                ticket_number=row.ticket_number,
                customer_id=row.customer_id,
                status=row.status,
                is_refunded=bool(row.is_refunded),
                created_at=row.created_at,
                updated_at=row.updated_at,
                paid_amount=float(row.paid_amount)
            ))

            # Build Ledger (Transactions)
            cust_name = f"{row.first_name} {row.last_name}" if row.first_name else "Walk-in Customer"
            
            # 1. Record Payment (Income)
            if row.paid_amount > 0:
                # Use updated_at as payment date if available (usually pickup time), else creation date
                pay_date = row.updated_at if row.updated_at else row.created_at
                ledger_data.append(LedgerEntry(
                    id=f"pay_{row.id}",
                    date=pay_date,
                    reference=f"Ticket #{row.ticket_number}",
                    customer_name=cust_name,
                    type="INCOME",
                    amount=float(row.paid_amount),
                    method="Standard"
                ))

            # 2. Record Refund (Expense)
            if row.is_refunded:
                # Assume refund happened recently (updated_at)
                ref_date = row.updated_at if row.updated_at else datetime.now(timezone.utc)
                ledger_data.append(LedgerEntry(
                    id=f"ref_{row.id}",
                    date=ref_date,
                    reference=f"Refund #{row.ticket_number}",
                    customer_name=cust_name,
                    type="REFUND",
                    amount= -float(row.paid_amount), # Negative for financial math
                    method="Reversal"
                ))

        # Sort Ledger by Date Descending
        ledger_data.sort(key=lambda x: x.date, reverse=True)

        # ---------------------------------------------------------
        # 2. Fetch Items 
        # ---------------------------------------------------------
        items_query = text("""
            SELECT 
                ti.id, ti.ticket_id, ti.quantity,
                ct.name as clothing_name,
                COALESCE(ct.plant_price, 0.0) as price
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE t.organization_id = :org_id
        """)
        items_rows = db.execute(items_query, {"org_id": org_id}).fetchall()
        items_data = [
            RawTicketItem(
                id=r.id, ticket_id=r.ticket_id, clothing_name=r.clothing_name or "Custom", 
                quantity=r.quantity, price=float(r.price)
            ) for r in items_rows
        ]

        # ---------------------------------------------------------
        # 3. Fetch Racks 
        # ---------------------------------------------------------
        racks_query = text("SELECT id, number as rack_number, is_occupied FROM racks WHERE organization_id = :org_id ORDER BY number ASC")
        racks_rows = db.execute(racks_query, {"org_id": org_id}).fetchall()
        racks_data = [RawRack(id=r.id, rack_number=r.rack_number, is_occupied=bool(r.is_occupied)) for r in racks_rows]

        # ---------------------------------------------------------
        # 4. Fetch Customers
        # ---------------------------------------------------------
        custs = db.execute(text("SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.joined_at FROM allUsers u JOIN tickets t ON t.customer_id = u.id WHERE t.organization_id = :org_id"), {"org_id": org_id}).fetchall()
        customers_data = [RawCustomer(id=c.id, first_name=c.first_name, last_name=c.last_name, email=c.email, joined_at=c.joined_at) for c in custs]

        return FullOrgDataResponse(
            tickets=tickets_data, 
            items=items_data, 
            racks=racks_data, 
            customers=customers_data,
            ledger=ledger_data
        )

    except Exception as e:
        print(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard data.")
    
    
# =======================
# NEW CHART DATA ROUTE
# =======================
@router.get("/analytics/charts", response_model=ChartsResponse)
async def get_chart_analytics(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns aggregated data specifically formatted for Pie, Bar, and Line charts.
    """
    try:
        org_id = payload.get("organization_id")
        
        # 1. PIE CHART: Revenue Distribution (Paid vs Outstanding vs Refunded)
        # Note: This is an approximation based on status.
        # "Paid" = picked_up, "Outstanding" = active/ready, "Refunded" = refunded
        status_revenue_query = text("""
            SELECT 
                CASE 
                    WHEN status = 'picked_up' AND is_refunded = FALSE THEN 'Collected'
                    WHEN status = 'refunded' OR is_refunded = TRUE THEN 'Refunded'
                    ELSE 'Outstanding'
                END as label,
                COUNT(*) as count,
                SUM(COALESCE(paid_amount, 0)) as value -- or total price if you have it stored
            FROM tickets
            WHERE organization_id = :org_id
            GROUP BY label
        """)
        rev_rows = db.execute(status_revenue_query, {"org_id": org_id}).fetchall()
        revenue_by_status = [
            ChartPoint(label=r.label, value=float(r.value or 0)) for r in rev_rows
        ]

        # 2. BAR CHART: Top 5 Clothing Items
        top_items_query = text("""
            SELECT ct.name as label, SUM(ti.quantity) as value
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE t.organization_id = :org_id
            GROUP BY ct.name
            ORDER BY value DESC
            LIMIT 5
        """)
        item_rows = db.execute(top_items_query, {"org_id": org_id}).fetchall()
        top_items = [
            ChartPoint(label=r.label or "Other", value=float(r.value)) for r in item_rows
        ]

        # 3. BAR CHART: Daily Revenue (Last 7 Days)
        # We assume 'updated_at' on 'picked_up' status is the payment date
        daily_query = text("""
            SELECT 
                TO_CHAR(updated_at, 'Mon DD') as label, 
                SUM(paid_amount) as value
            FROM tickets
            WHERE organization_id = :org_id 
              AND status = 'picked_up'
              AND updated_at >= NOW() - INTERVAL '7 days'
            GROUP BY label, DATE(updated_at)
            ORDER BY DATE(updated_at) ASC
        """)
        daily_rows = db.execute(daily_query, {"org_id": org_id}).fetchall()
        daily_revenue = [
            ChartPoint(label=r.label, value=float(r.value)) for r in daily_rows
        ]

        # 4. LINE CHART: New Customers (Last 6 Months)
        # Assuming you want to see growth
        # Note: This requires customers to be linked to org via tickets if they aren't directly linked in user table
        cust_query = text("""
            SELECT TO_CHAR(joined_at, 'Mon YYYY') as label, COUNT(*) as value
            FROM allUsers u
            WHERE id IN (SELECT customer_id FROM tickets WHERE organization_id = :org_id)
            GROUP BY label, DATE_TRUNC('month', joined_at)
            ORDER BY DATE_TRUNC('month', joined_at) ASC
            LIMIT 6
        """)
        cust_rows = db.execute(cust_query, {"org_id": org_id}).fetchall()
        customer_growth = [
            ChartPoint(label=r.label, value=float(r.value)) for r in cust_rows
        ]

        return ChartsResponse(
            revenue_by_status=revenue_by_status,
            top_items=top_items,
            daily_revenue=daily_revenue,
            customer_growth=customer_growth
        )

    except Exception as e:
        print(f"Error generating charts: {e}")
        raise HTTPException(status_code=500, detail="Failed to load chart data")
    # -----------------------------------------
# Server-side aggregated statistics (lightweight)
# -----------------------------------------
@router.get("/analytics/stats")
async def get_analytics_stats(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns aggregated statistics for the logged-in user's organization.
    Fields returned:
      - today_sales, month_sales
      - active_tickets, ready_tickets, picked_up_today, dropped_off_today
      - total_racks, occupied_racks, rack_utilization
      - clothing_items_today, clothing_count
      - total_customers, new_customers_month
    """
    try:
        org_id = payload.get("organization_id")
        user_role = payload.get("role")

        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        if not org_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Time boundaries
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

        # 1) Sales: sum of ticket_items.item_total for tickets with status 'picked_up'
        sales_today_q = text("""
            SELECT COALESCE(SUM(ti.item_total),0) as total
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            WHERE t.organization_id = :org_id
              AND t.status = 'picked_up'
              AND t.updated_at >= :start_today
        """)
        sales_month_q = text("""
            SELECT COALESCE(SUM(ti.item_total),0) as total
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            WHERE t.organization_id = :org_id
              AND t.status = 'picked_up'
              AND t.updated_at >= :start_month
        """)
        today_sales = float(db.execute(sales_today_q, {"org_id": org_id, "start_today": start_of_today}).scalar() or 0)
        month_sales = float(db.execute(sales_month_q, {"org_id": org_id, "start_month": start_of_month}).scalar() or 0)

        # 2) Tickets counts
        tickets_counts_q = text("""
            SELECT
              SUM(CASE WHEN status NOT IN ('picked_up','cancelled','refunded') THEN 1 ELSE 0 END) as active_tickets,
              SUM(CASE WHEN status = 'ready_for_pickup' THEN 1 ELSE 0 END) as ready_tickets,
              SUM(CASE WHEN status = 'picked_up' AND updated_at >= :start_today THEN 1 ELSE 0 END) as picked_up_today,
              SUM(CASE WHEN created_at >= :start_today THEN 1 ELSE 0 END) as dropped_off_today
            FROM tickets
            WHERE organization_id = :org_id
        """)
        tc = db.execute(tickets_counts_q, {"org_id": org_id, "start_today": start_of_today}).fetchone()
        active_tickets = int(tc.active_tickets or 0)
        ready_tickets = int(tc.ready_tickets or 0)
        picked_up_today = int(tc.picked_up_today or 0)
        dropped_off_today = int(tc.dropped_off_today or 0)

        # 3) Racks
        racks_q = text("""
            SELECT COUNT(*) as total_racks, SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) as occupied_racks
            FROM racks
            WHERE organization_id = :org_id
        """)
        rr = db.execute(racks_q, {"org_id": org_id}).fetchone()
        total_racks = int(rr.total_racks or 0)
        occupied_racks = int(rr.occupied_racks or 0)
        rack_util = round((occupied_racks / total_racks) * 100, 1) if total_racks > 0 else 0.0

        # 4) Clothing items today (sum of quantities for tickets created today)
        clothing_today_q = text("""
            SELECT COALESCE(SUM(ti.quantity),0) as qty
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            WHERE t.organization_id = :org_id
              AND t.created_at >= :start_today
        """)
        clothing_items_today = int(db.execute(clothing_today_q, {"org_id": org_id, "start_today": start_of_today}).scalar() or 0)

        # clothing count
        clothing_count_q = text("SELECT COUNT(*) FROM clothing_types WHERE organization_id = :org_id")
        clothing_count = int(db.execute(clothing_count_q, {"org_id": org_id}).scalar() or 0)

        # 5) Customers
        customers_q = text("SELECT COUNT(*) FROM allUsers WHERE organization_id = :org_id AND role = 'customer'")
        total_customers = int(db.execute(customers_q, {"org_id": org_id}).scalar() or 0)

        new_customers_q = text("SELECT COUNT(*) FROM allUsers WHERE organization_id = :org_id AND role = 'customer' AND joined_at >= :start_month")
        new_customers_month = int(db.execute(new_customers_q, {"org_id": org_id, "start_month": start_of_month}).scalar() or 0)

        # 6) Global revenue and counts (all time) - no date filter so frontend can slice as needed
        total_revenue_q = text("""
            SELECT COALESCE(SUM(ti.item_total),0) as total_revenue
            FROM ticket_items ti
            JOIN tickets t ON ti.ticket_id = t.id
            WHERE t.organization_id = :org_id
        """)
        total_revenue_all_time = float(db.execute(total_revenue_q, {"org_id": org_id}).scalar() or 0)

        total_paid_q = text("SELECT COALESCE(SUM(t.paid_amount),0) as total_paid FROM tickets t WHERE t.organization_id = :org_id")
        total_paid_all_time = float(db.execute(total_paid_q, {"org_id": org_id}).scalar() or 0)

        total_tickets_q = text("SELECT COUNT(*) FROM tickets WHERE organization_id = :org_id")
        total_tickets = int(db.execute(total_tickets_q, {"org_id": org_id}).scalar() or 0)

        total_pickups_q = text("SELECT COUNT(*) FROM tickets WHERE organization_id = :org_id AND status = 'picked_up'")
        total_pickups_all_time = int(db.execute(total_pickups_q, {"org_id": org_id}).scalar() or 0)

        total_assigned_racks_q = text("SELECT COUNT(*) FROM tickets WHERE organization_id = :org_id AND rack_number IS NOT NULL")
        total_tickets_with_racks_assigned = int(db.execute(total_assigned_racks_q, {"org_id": org_id}).scalar() or 0)

        clothing_items_total_q = text("SELECT COALESCE(SUM(ti.quantity),0) FROM ticket_items ti JOIN tickets t ON ti.ticket_id = t.id WHERE t.organization_id = :org_id")
        clothing_items_total = int(db.execute(clothing_items_total_q, {"org_id": org_id}).scalar() or 0)

        # date range of tickets
        ticket_range_q = text("SELECT MIN(created_at) as first_ticket, MAX(created_at) as last_ticket FROM tickets WHERE organization_id = :org_id")
        tr = db.execute(ticket_range_q, {"org_id": org_id}).fetchone()
        first_ticket = tr.first_ticket if tr and tr.first_ticket else None
        last_ticket = tr.last_ticket if tr and tr.last_ticket else None

        return {
            "today_sales": today_sales,
            "month_sales": month_sales,
            "active_tickets": active_tickets,
            "ready_tickets": ready_tickets,
            "picked_up_today": picked_up_today,
            "dropped_off_today": dropped_off_today,
            "total_racks": total_racks,
            "occupied_racks": occupied_racks,
            "rack_utilization": rack_util,
            "clothing_items_today": clothing_items_today,
            "clothing_count": clothing_count,
            "total_customers": total_customers,
            "new_customers_month": new_customers_month,
            # All-time aggregates
            "total_revenue_all_time": total_revenue_all_time,
            "total_paid_all_time": total_paid_all_time,
            "total_tickets": total_tickets,
            "total_pickups_all_time": total_pickups_all_time,
            "total_tickets_with_racks_assigned": total_tickets_with_racks_assigned,
            "clothing_items_total": clothing_items_total,
            "first_ticket": first_ticket,
            "last_ticket": last_ticket
        }

    except Exception as e:
        print(f"Error computing analytics stats: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to compute analytics stats")
        
        
@router.patch("/tickets/{ticket_id}/void", summary="Toggle ticket void status")
async def toggle_void_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Toggles the void status of a ticket.
    - If is_void is FALSE -> Sets is_void=TRUE, status='voided'
    - If is_void is TRUE  -> Sets is_void=FALSE, status='received'
    """
    org_id = payload.get("organization_id")
    user_role = payload.get("role")

    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
    if user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    try:
        # 1. Check current status
        check_query = text("SELECT is_void FROM tickets WHERE id = :id AND organization_id = :org_id")
        current_state = db.execute(check_query, {"id": ticket_id, "org_id": org_id}).scalar()

        if current_state is None:
            raise HTTPException(status_code=404, detail="Ticket not found.")

        # 2. Toggle Logic
        # If currently Void (True) -> Unvoid (False)
        # If currently Active (False) -> Void (True)
        new_void_state = not current_state
        
        # Determine new status string
        if new_void_state:
            new_status = 'voided'
            message = "Ticket has been voided."
        else:
            new_status = 'received' # Default active status when unvoiding
            message = "Ticket unvoided and set to 'received'."

        # 3. Update
        update_query = text("""
            UPDATE tickets 
            SET 
                is_void = :new_void, 
                status = :new_status,
                updated_at = :now
            WHERE id = :id
        """)
        
        db.execute(update_query, {
            "new_void": new_void_state,
            "new_status": new_status,
            "now": datetime.now(timezone.utc),
            "id": ticket_id
        })
        db.commit()

        return {
            "success": True, 
            "message": message, 
            "is_void": new_void_state, 
            "status": new_status
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tickets/{ticket_id}/refund", summary="Toggle ticket refund status")
async def toggle_refund_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Toggles the refund status.
    - If Active -> Sets is_refunded=TRUE AND status='refunded'
    - If Refunded -> Sets is_refunded=FALSE AND restores status to 'picked_up' (or 'ready')
    """
    org_id = payload.get("organization_id")
    user_role = payload.get("role")

    allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
    if user_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    try:
        # 1. Check current state
        check_query = text("SELECT is_refunded FROM tickets WHERE id = :id AND organization_id = :org_id")
        current_refund_state = db.execute(check_query, {"id": ticket_id, "org_id": org_id}).scalar()

        if current_refund_state is None:
            raise HTTPException(status_code=404, detail="Ticket not found.")

        # 2. Toggle Logic
        new_refund_state = not current_refund_state
        
        if new_refund_state:
            # APPLYING REFUND
            message = "Ticket marked as refunded."
            # Update status to 'refunded' so it persists visually on reload
            update_query = text("""
                UPDATE tickets 
                SET 
                    is_refunded = TRUE, 
                    status = 'refunded', 
                    updated_at = :now
                WHERE id = :id
            """)
        else:
            # REMOVING REFUND
            message = "Refund status removed."
            # Revert status to 'picked_up' (safest assumption for a refunded ticket)
            # You could also set it to 'ready_for_pickup' depending on your flow, 
            # but usually refunds happen after pickup.
            update_query = text("""
                UPDATE tickets 
                SET 
                    is_refunded = FALSE, 
                    status = 'picked_up', 
                    updated_at = :now
                WHERE id = :id
            """)
        
        db.execute(update_query, {
            "now": datetime.now(timezone.utc),
            "id": ticket_id
        })
        db.commit()

        return {
            "success": True, 
            "message": message, 
            "is_refunded": new_refund_state,
            "status": "refunded" if new_refund_state else "picked_up"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------------------------------------------------------
#  Extra: Full Ledger & Tickets Details for Store Owner
# -----------------------------------------------------------------------------
@router.get("/analytics/ledger")
async def get_analytics_ledger(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns full ticket list with items and a synthesized transactions list
    (based on ticket paid_amount and update timestamps). This endpoint is
    intended for store owners to audit all tickets and payments. Frontend
    may apply date filters client-side; this returns everything for the org.
    """
    try:
        org_id = payload.get("organization_id")
        user_role = payload.get("role")

        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
        if user_role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        if not org_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # 1) Fetch tickets with customer info
        tickets_q = text("""
            SELECT t.id, t.ticket_number, t.customer_id, t.total_amount, t.paid_amount,
                   t.status, t.rack_number, t.special_instructions, t.pickup_date, t.created_at, t.updated_at,
                   u.first_name as customer_first, u.last_name as customer_last, u.email as customer_email
            FROM tickets t
            LEFT JOIN allUsers u ON t.customer_id = u.id
            WHERE t.organization_id = :org_id
            ORDER BY t.created_at DESC
        """)
        tickets_rows = db.execute(tickets_q, {"org_id": org_id}).fetchall()

        tickets = []
        ticket_ids = []
        for r in tickets_rows:
            ticket_ids.append(r.id)
            tickets.append({
                "id": r.id,
                "ticket_number": r.ticket_number,
                "customer_id": r.customer_id,
                "customer_name": f"{r.customer_first or ''} {r.customer_last or ''}".strip(),
                "customer_email": r.customer_email,
                "total_amount": float(r.total_amount) if r.total_amount is not None else 0.0,
                "paid_amount": float(r.paid_amount) if r.paid_amount is not None else 0.0,
                "status": r.status,
                "rack_number": r.rack_number,
                "special_instructions": r.special_instructions,
                "pickup_date": r.pickup_date,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "items": []  # filled below
            })

        # 2) Fetch ticket items for these tickets
        items = []
        if ticket_ids:
            items_q = text("""
                SELECT ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, ti.item_total, ti.plant_price,
                       ti.margin, ti.size_charge, ti.starch_charge, ti.starch_level, ti.crease, ti.alterations,
                       ct.name as clothing_name
                FROM ticket_items ti
                LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id = ANY(:ticket_ids)
            """)
            # SQLAlchemy / DB driver may not accept array bind for :ticket_ids directly; use IN
            # Fallback: build IN list
            ids_tuple = tuple(ticket_ids) if len(ticket_ids) > 1 else (ticket_ids[0],)
            items_stmt = text(f"""
                SELECT ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, ti.item_total, ti.plant_price,
                       ti.margin, ti.size_charge, ti.starch_charge, ti.starch_level, ti.crease, ti.alterations,
                       ct.name as clothing_name
                FROM ticket_items ti
                LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id
                WHERE ti.ticket_id IN :ids
            """)
            # Some DB drivers require explicit expansion; use simple parameter
            items_rows = db.execute(text(f"SELECT ti.id, ti.ticket_id, ti.clothing_type_id, ti.quantity, ti.item_total, ti.plant_price, ti.margin, ti.size_charge, ti.starch_charge, ti.starch_level, ti.crease, ti.alterations, ct.name as clothing_name FROM ticket_items ti LEFT JOIN clothing_types ct ON ti.clothing_type_id = ct.id WHERE ti.ticket_id IN ({','.join([':id'+str(i) for i in range(len(ids_tuple))])})"), {**{f'id{i}': ids_tuple[i] for i in range(len(ids_tuple))}}).fetchall()

            for it in items_rows:
                item_obj = {
                    "id": it.id,
                    "ticket_id": it.ticket_id,
                    "clothing_type_id": it.clothing_type_id,
                    "clothing_name": it.clothing_name,
                    "quantity": it.quantity,
                    "item_total": float(it.item_total) if it.item_total is not None else 0.0,
                    "plant_price": float(it.plant_price) if it.plant_price is not None else 0.0,
                    "margin": float(it.margin) if it.margin is not None else 0.0,
                    "size_charge": float(it.size_charge) if it.size_charge is not None else 0.0,
                    "starch_charge": float(it.starch_charge) if it.starch_charge is not None else 0.0,
                    "starch_level": it.starch_level,
                    "crease": it.crease,
                    "alterations": it.alterations
                }
                items.append(item_obj)

            # attach items to their tickets
            items_by_ticket = {}
            for it in items:
                items_by_ticket.setdefault(it['ticket_id'], []).append(it)

            for t in tickets:
                t['items'] = items_by_ticket.get(t['id'], [])

        # 3) Try to fetch per-event transactions from ticket_payments table.
        #    If the table doesn't exist or query fails, fall back to synthesized transactions
        transactions = []
        try:
            tx_q = text("""
                SELECT tp.id as tx_id, tp.ticket_id, t.ticket_number, tp.amount, tp.method, tp.operator_id, tp.payment_type, tp.reference, tp.metadata, tp.created_at,
                       ou.first_name as operator_first, ou.last_name as operator_last
                FROM ticket_payments tp
                LEFT JOIN tickets t ON tp.ticket_id = t.id
                LEFT JOIN allUsers ou ON tp.operator_id = ou.id
                WHERE tp.organization_id = :org_id
                ORDER BY tp.created_at DESC
            """)
            tx_rows = db.execute(tx_q, {"org_id": org_id}).fetchall()
            for r in tx_rows:
                operator_name = None
                try:
                    operator_name = f"{r.operator_first or ''} {r.operator_last or ''}".strip()
                except Exception:
                    operator_name = None
                transactions.append({
                    "id": r.tx_id,
                    "ticket_id": r.ticket_id,
                    "ticket_number": r.ticket_number,
                    "amount": float(r.amount) if r.amount is not None else 0.0,
                    "method": r.method,
                    "operator_id": r.operator_id,
                    "operator_name": operator_name,
                    "payment_type": r.payment_type,
                    "reference": r.reference,
                    "metadata": r.metadata,
                    "created_at": r.created_at
                })
        except Exception as e:
            # If ticket_payments doesn't exist or read fails, synthesize from tickets' paid_amount
            print(f"ticket_payments query failed or not present: {e}")
            for t in tickets:
                if t['paid_amount'] and t['paid_amount'] > 0:
                    paid_at = t.get('updated_at') or t.get('pickup_date') or t.get('created_at')
                    transactions.append({
                        "ticket_id": t['id'],
                        "ticket_number": t['ticket_number'],
                        "amount": t['paid_amount'],
                        "paid_at": paid_at,
                        "status": t['status'],
                        "customer_name": t['customer_name']
                    })

        # 4) Return combined ledger
        return {
            "tickets": tickets,
            "transactions": transactions
        }

    except Exception as e:
        print(f"Error building ledger: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to build ledger")
    
    

@router.delete("/customers/{customer_id}/permanent", summary="PERMANENTLY Delete a Customer")
def delete_customer_permanently(
    customer_id: int,
    background_tasks: BackgroundTasks, # <--- 1. Add this
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    WARNING: This removes the user from the database entirely.
    This will FAIL if the customer has existing tickets (Foreign Key Violation).
    """
    try:
        # 1. Authorization
        org_id = payload.get("organization_id")
        user_role = payload.get("role")
        
        allowed_roles = ["org_owner", "store_admin", "STORE_OWNER"]
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Only Admins can permanently delete customers."
            )

        # 2. Verify existence
        check_query = text("SELECT id FROM allUsers WHERE id = :cid AND organization_id = :oid")
        user = db.execute(check_query, {"cid": customer_id, "oid": org_id}).fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Customer not found in your organization.")

        # 3. Attempt Hard Delete
        delete_query = text("DELETE FROM allUsers WHERE id = :cid AND organization_id = :oid")
        db.execute(delete_query, {"cid": customer_id, "oid": org_id})
        db.commit()

        return {"message": "Customer permanently deleted."}
    # 10. Audit Log (Running in background)
        # We use .get() to prevent crashing if the key is missing
        background_tasks.add_task(
            create_audit_log,
            org_id=payload.get("organization_id"),
            # Try 'id', if missing try 'user_id', if both missing use 0
            actor_id=payload.get("id") or payload.get("user_id") or 0,
            actor_name=payload.get("sub", "Unknown"),
            actor_role=payload.get("role", "Unknown"),
            action="Deleted customer",
            
            ticket_id=ticket_id,
            customer_id=ticket_data.customer_id,
            
            details={
                "ticket_id": ticket_id, 
                "customer_id": ticket_data.customer_id,
                "pieces": len(ticket_data.items)
            }
        )

    except IntegrityError:
        db.rollback()
        # This error happens if the customer has Tickets/Transactions linked to them
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete this customer because they have Ticket history. Please use 'Deactivate' instead."
        )
    except Exception as e:
        db.rollback()
        print(f"Error deleting customer: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete customer.")
    
    
    
@router.get("/customers/{customer_id}/financials", response_model=CustomerFinancialResponse, summary="Get full financial history for a customer")
async def get_customer_financials(
    customer_id: int,
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Fetches all tickets for a specific customer and calculates:
    1. Total amount they have ever spent.
    2. Total amount they have paid.
    3. Current Total Balance (Debt).
    """
    org_id = payload.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID missing.")

    try:
        # 1. Verify Customer belongs to this Org
        check_query = text("SELECT id FROM allUsers WHERE id = :cid AND organization_id = :oid")
        customer = db.execute(check_query, {"cid": customer_id, "oid": org_id}).fetchone()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found.")

        # 2. Fetch All Tickets for this Customer
        # We order by ID desc so the newest tickets are at the top
        query = text("""
            SELECT 
                id, ticket_number, status, total_amount, paid_amount, created_at
            FROM tickets
            WHERE customer_id = :cid AND organization_id = :oid
            ORDER BY created_at DESC
        """)
        
        results = db.execute(query, {"cid": customer_id, "oid": org_id}).fetchall()

        # 3. Calculate Financials in Python
        # (This is safer/easier than a complex SQL aggregate for this specific view)
        tickets_list = []
        total_sales = 0.0
        total_paid = 0.0

        for row in results:
            t_total = float(row.total_amount)
            t_paid = float(row.paid_amount)
            t_balance = t_total - t_paid
            
            # Add to lifetime totals
            total_sales += t_total
            total_paid += t_paid

            # Timezone Safety Fix
            c_at = row.created_at
            if c_at and c_at.tzinfo is None:
                c_at = c_at.replace(tzinfo=timezone.utc)

            tickets_list.append(
                TicketMiniSummary(
                    id=row.id,
                    ticket_number=row.ticket_number,
                    status=row.status,
                    total_amount=t_total,
                    paid_amount=t_paid,
                    balance=t_balance,
                    created_at=c_at
                )
            )

        # 4. Final Calculation
        total_outstanding = total_sales - total_paid

        return CustomerFinancialResponse(
            customer_id=customer_id,
            total_tickets=len(tickets_list),
            lifetime_total_sales=total_sales,
            lifetime_total_paid=total_paid,
            total_outstanding_balance=total_outstanding, # <--- If this is > 0.01, they owe money
            tickets=tickets_list
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer financials: {e}")
        raise HTTPException(status_code=500, detail="Failed to load customer financial history.")