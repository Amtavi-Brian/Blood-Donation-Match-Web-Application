from datetime import datetime
import uuid

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.session import Base


class Notification(Base):   
    __tablename__ = "notifications"
    notification_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)