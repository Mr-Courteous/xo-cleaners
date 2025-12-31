from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base 

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, nullable=False, index=True)
    actor_id = Column(Integer, nullable=False)
    actor_name = Column(String, nullable=True)
    actor_role = Column(String, nullable=True) 
    action = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # ✅ ADD THESE TWO NEW COLUMNS
    ticket_id = Column(Integer, nullable=True, index=True)
    customer_id = Column(Integer, nullable=True, index=True)