import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base

class DonorMatch(Base):
    __tablename__ = "donor_matches"
    match_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    donor_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    request_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)