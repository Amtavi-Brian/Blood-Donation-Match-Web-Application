
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.donor_profile import BloodGroup
from app.models.hospital import Hospital

def utc_now():
    return datetime.now(timezone.utc)


class BloodRequestStatus(str, enum.Enum):
    PENDING = "pending"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class BloodRequestUrgency(str, enum.Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    __table_args__ = (
        CheckConstraint(
            "units_needed > 0",
            name="ck_blood_requests_units_positive",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    blood_group: Mapped[BloodGroup] = mapped_column(
        Enum(BloodGroup, name="blood_request_blood_group"),
        nullable=False,
        index=True,
    )

    units_needed: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    urgency: Mapped[BloodRequestUrgency] = mapped_column(
        Enum(BloodRequestUrgency, name="blood_request_urgency"),
        default=BloodRequestUrgency.ROUTINE,
        nullable=False,
    )

    status: Mapped[BloodRequestStatus] = mapped_column(
        Enum(BloodRequestStatus, name="blood_request_status"),
        default=BloodRequestStatus.PENDING,
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    needed_by: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    hospital: Mapped["Hospital"] = relationship(
        "Hospital",
        back_populates="blood_requests",
    )
