from typing import Dict, Any, List
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
router = APIRouter()

# 2. Define the Response Model
class DashboardAnalyticsResponse(BaseModel):
    today_sales: float
    month_sales: float
    active_tickets: int
    ready_tickets: int
    picked_up_today: int
    total_customers: int

# 3. The Analytics Route
@router.get("/analytics/dashboard", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_user_payload)
):
    """
    Returns key metrics for the dashboard.
    Role definitions are unique to this route.
    """
    try:
        # 1. Extract Info
        org_id = payload.get("organization_id")
        user_role = payload.get("role")

        # 2. Authorization Check (Explicit Route-Specific Roles)
        allowed_roles = ["cashier", "store_admin", "org_owner", "STORE_OWNER", "owner"]
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{user_role}' is not authorized."
            )

        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization ID not found in token."
            )
        
        # 3. Define Timestamps (UTC)
        now = datetime.now(timezone.utc)
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 4. Calculate Revenue (Today & This Month)
        # CHANGED: 'ct.price' -> 'ct.total_price' (Based on your creation code)
        revenue_query = text("""
            SELECT 
                SUM(CASE WHEN t.created_at >= :day_start THEN 
                    ((ct.total_price * ti.quantity) + COALESCE(ti.additional_charge, 0)) 
                ELSE 0 END) as today_sales,
                
                SUM(CASE WHEN t.created_at >= :month_start THEN 
                    ((ct.total_price * ti.quantity) + COALESCE(ti.additional_charge, 0)) 
                ELSE 0 END) as month_sales
            FROM tickets t
            JOIN ticket_items ti ON t.id = ti.ticket_id
            JOIN clothing_types ct ON ti.clothing_type_id = ct.id
            WHERE t.organization_id = :org_id
            AND t.status != 'cancelled'
        """)
        
        revenue_result = db.execute(revenue_query, {
            "org_id": org_id,
            "day_start": start_of_day,
            "month_start": start_of_month
        }).fetchone()

        # 5. Get Ticket Status Counts
        status_query = text("""
            SELECT 
                COUNT(CASE WHEN status NOT IN ('picked_up', 'cancelled') THEN 1 END) as active_count,
                COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_count,
                COUNT(CASE WHEN status = 'picked_up' AND updated_at >= :day_start THEN 1 END) as picked_up_today
            FROM tickets
            WHERE organization_id = :org_id
        """)

        status_result = db.execute(status_query, {
            "org_id": org_id,
            "day_start": start_of_day
        }).fetchone()

        # 6. Total Customers Count
        customer_count_query = text("""
            SELECT COUNT(*) 
            FROM allUsers 
            WHERE organization_id = :org_id 
            AND role = 'customer'
            AND is_deactivated = FALSE
        """)
        total_customers = db.execute(customer_count_query, {"org_id": org_id}).scalar() or 0

        # 7. Return Response
        return DashboardAnalyticsResponse(
            today_sales=float(revenue_result.today_sales or 0),
            month_sales=float(revenue_result.month_sales or 0),
            active_tickets=status_result.active_count or 0,
            ready_tickets=status_result.ready_count or 0,
            picked_up_today=status_result.picked_up_today or 0,
            total_customers=total_customers
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in dashboard analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Database Error: {str(e)}"
        )