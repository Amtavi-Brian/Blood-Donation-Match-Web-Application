from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.session import Base

class BloodStock(Base):
    __tablename__ = "blood_stocks"
    stock_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    blood_type: Mapped[str] = mapped_column(String(10), nullable=False)
    component: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    threshold: Mapped[int] = mapped_column(nullable=False)