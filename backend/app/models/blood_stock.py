
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.donor_profile import BloodGroup


class BloodStock(Base):
    __tablename__ = "blood_stocks"

    __table_args__ = (
        UniqueConstraint(
            "hospital_id",
            "blood_type",
            "component",
            name="uq_blood_stock_hospital_type_component",
        ),
        CheckConstraint(
            "quantity >= 0",
            name="ck_blood_stock_quantity_nonnegative",
        ),
        CheckConstraint(
            "threshold >= 0",
            name="ck_blood_stock_threshold_nonnegative",
        ),
    )

    stock_id: Mapped[int] = mapped_column(primary_key=True, index=True)

    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    blood_type: Mapped[BloodGroup] = mapped_column(
        Enum(BloodGroup, name="blood_stock_blood_group"),
        nullable=False,
    )

    component: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Total remaining quantity across the stock's batches.
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    threshold: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    hospital = relationship("Hospital")

    batches = relationship(
        "StockBatch",
        back_populates="stock",
        cascade="all, delete-orphan",
    )
