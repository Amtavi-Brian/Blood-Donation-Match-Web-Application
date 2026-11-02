import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import mapped_column, Mapped
from sqlalchemy.sql import func

from app.db.session import Base

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    consent_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    choice: Mapped[bool] = mapped_column(Boolean, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    withdrawn_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)