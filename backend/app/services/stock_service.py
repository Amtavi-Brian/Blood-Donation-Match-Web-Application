
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.blood_stock import BloodStock
from app.models.hospital import Hospital
from app.models.stock_batch import StockBatch

from app.schemas.stock import (
    BloodStockCreate,
    StockBatchCreate,
)


# ---------------------------------------------------------
# AUDIT LOGGING HELPER
# ---------------------------------------------------------

def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    stock_id: int,
    description: str,
) -> None:
    """
    Add an audit entry for a blood stock operation.
    The caller is responsible for committing the transaction.
    """

    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type="blood_stock",
        entity_id=stock_id,
        description=description,
    )

    db.add(audit)


# ---------------------------------------------------------
# GET HOSPITAL STOCK
# ---------------------------------------------------------

def get_hospital_stock(
    db: Session,
    hospital_id: int,
) -> list[BloodStock]:

    statement = (
        select(BloodStock)
        .where(BloodStock.hospital_id == hospital_id)
        .order_by(
            BloodStock.blood_type,
            BloodStock.component,
        )
    )

    return list(db.scalars(statement).all())


# ---------------------------------------------------------
# GET INDIVIDUAL STOCK ITEM
# ---------------------------------------------------------

def get_stock_item(
    db: Session,
    hospital_id: int,
    stock_id: int,
) -> BloodStock | None:

    statement = select(BloodStock).where(
        BloodStock.stock_id == stock_id,
        BloodStock.hospital_id == hospital_id,
    )

    return db.scalar(statement)


# ---------------------------------------------------------
# CREATE STOCK RECORD
# ---------------------------------------------------------

def create_stock_item(
    db: Session,
    hospital_id: int,
    data: BloodStockCreate,
    performed_by_user_id: int,
) -> BloodStock:

    hospital = db.get(Hospital, hospital_id)

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    existing = db.scalar(
        select(BloodStock).where(
            BloodStock.hospital_id == hospital_id,
            BloodStock.blood_type == data.blood_type,
            BloodStock.component == data.component,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This blood group and component already "
                "have a stock record."
            ),
        )

    stock = BloodStock(
        hospital_id=hospital_id,
        blood_type=data.blood_type,
        component=data.component,
        quantity=0,
        threshold=data.threshold,
    )

    try:
        db.add(stock)

        # Generate the stock ID before creating its audit entry.
        db.flush()

        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="blood_stock_created",
            stock_id=stock.stock_id,
            description=(
                f"Created blood stock record for "
                f"{data.blood_type} ({data.component}) "
                f"at hospital ID {hospital_id}."
            ),
        )

        db.commit()
        db.refresh(stock)

    except Exception:
        db.rollback()
        raise

    return stock


# ---------------------------------------------------------
# ADD STOCK BATCH
# ---------------------------------------------------------

def add_stock_batch(
    db: Session,
    hospital_id: int,
    stock_id: int,
    data: StockBatchCreate,
    performed_by_user_id: int,
) -> StockBatch:

    stock = get_stock_item(
        db,
        hospital_id,
        stock_id,
    )

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock record not found.",
        )

    # Validate expiry date.
    now = datetime.now(timezone.utc)
    expiry = data.expiry_date

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry <= now:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Expiry date must be in the future.",
        )

    # Prevent duplicate batch references.
    batch_reference = data.batch_reference.strip()

    duplicate = db.scalar(
        select(StockBatch).where(
            StockBatch.stock_id == stock_id,
            StockBatch.batch_reference == batch_reference,
        )
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "That batch reference already exists "
                "for this stock item."
            ),
        )

    batch = StockBatch(
        stock_id=stock_id,
        batch_reference=batch_reference,
        quantity=data.quantity,
        remaining_quantity=data.quantity,
        expiry_date=expiry,
    )

    try:
        # Update the aggregate stock quantity.
        stock.quantity += data.quantity

        db.add(batch)

        # Add audit entry in the same transaction.
        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="stock_batch_added",
            stock_id=stock_id,
            description=(
                f"Added batch {batch_reference} containing "
                f"{data.quantity} units to stock record "
                f"{stock_id} at hospital ID {hospital_id}."
            ),
        )

        db.commit()

        db.refresh(batch)
        db.refresh(stock)

    except Exception:
        db.rollback()
        raise

    return batch


# ---------------------------------------------------------
# ISSUE BLOOD STOCK
# ---------------------------------------------------------

def issue_stock(
    db: Session,
    hospital_id: int,
    stock_id: int,
    quantity: int,
    performed_by_user_id: int,
) -> BloodStock:

    stock = get_stock_item(
        db,
        hospital_id,
        stock_id,
    )

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock record not found.",
        )

    now = datetime.now(timezone.utc)

    # FEFO: First Expiry, First Out.
    batches = list(
        db.scalars(
            select(StockBatch)
            .where(
                StockBatch.stock_id == stock_id,
                StockBatch.remaining_quantity > 0,
            )
            .order_by(StockBatch.expiry_date.asc())
        ).all()
    )

    # Calculate available unexpired stock.
    available = 0

    for batch in batches:
        expiry = batch.expiry_date

        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if expiry > now:
            available += batch.remaining_quantity

    if available < quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Insufficient unexpired stock "
                "for this issue."
            ),
        )

    remaining_to_issue = quantity

    try:
        # Consume the earliest-expiring batches first.
        for batch in batches:

            expiry = batch.expiry_date

            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)

            if expiry <= now:
                continue

            taken = min(
                batch.remaining_quantity,
                remaining_to_issue,
            )

            batch.remaining_quantity -= taken
            remaining_to_issue -= taken

            if remaining_to_issue == 0:
                break

        # Update aggregate stock quantity.
        stock.quantity -= quantity

        # Record the operation.
        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="blood_stock_issued",
            stock_id=stock_id,
            description=(
                f"Issued {quantity} units from blood "
                f"stock record {stock_id} at "
                f"hospital ID {hospital_id}."
            ),
        )

        db.commit()
        db.refresh(stock)

    except Exception:
        db.rollback()
        raise

    return stock


# ---------------------------------------------------------
# GET STOCK BATCHES
# ---------------------------------------------------------

def get_stock_batches(
    db: Session,
    hospital_id: int,
    stock_id: int,
) -> list[StockBatch]:

    stock = get_stock_item(
        db,
        hospital_id,
        stock_id,
    )

    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock record not found.",
        )

    return list(
        db.scalars(
            select(StockBatch)
            .where(StockBatch.stock_id == stock_id)
            .order_by(StockBatch.expiry_date.asc())
        ).all()
    )
