
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    action = Column(String(100), nullable=False, index=True)

    entity_type = Column(String(100), nullable=False, index=True)

    entity_id = Column(Integer, nullable=True, index=True)

    description = Column(Text, nullable=False)

    ip_address = Column(String(45), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = relationship("User", backref="audit_logs")

    __table_args__ = (
        Index("ix_audit_entity", "entity_type", "entity_id"),
    )
