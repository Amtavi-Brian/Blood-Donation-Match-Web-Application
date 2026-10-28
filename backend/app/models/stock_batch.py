
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StockBatch(Base):
    __tablename__ = "stock_batches"

    __table_args__ = (
        UniqueConstraint(
            "stock_id",
            "batch_reference",
            name="uq_stock_batch_reference",
        ),
        CheckConstraint(
            "quantity > 0",
            name="ck_stock_batch_quantity_positive",
        ),
        CheckConstraint(
            "remaining_quantity >= 0",
            name="ck_stock_batch_remaining_nonnegative",
        ),
        CheckConstraint(
            "remaining_quantity <= quantity",
            name="ck_stock_batch_remaining_lte_quantity",
        ),
    )

    batch_id: Mapped[int] = mapped_column(primary_key=True, index=True)

    batch_reference: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stock_id: Mapped[int] = mapped_column(
        ForeignKey("blood_stocks.stock_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    remaining_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    expiry_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    stock = relationship(
        "BloodStock",
        back_populates="batches",
    )
