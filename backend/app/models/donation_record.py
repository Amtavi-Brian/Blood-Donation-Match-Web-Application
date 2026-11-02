
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.donor_profile import BloodGroup


class DonationRecord(Base):
    __tablename__ = "donation_records"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_donation_records_quantity_positive",
        ),
    )

    donation_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    donor_id: Mapped[int] = mapped_column(
        ForeignKey("donor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    blood_type: Mapped[BloodGroup] = mapped_column(
        Enum(BloodGroup, name="donation_blood_group"),
        nullable=False,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    donated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    donor = relationship("DonorProfile")
    hospital = relationship("Hospital")
