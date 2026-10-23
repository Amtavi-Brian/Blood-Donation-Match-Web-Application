import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.session import Base

class Hospital(Base):
    __tablename__ = "hospitals"
    hospital_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(String(255), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)