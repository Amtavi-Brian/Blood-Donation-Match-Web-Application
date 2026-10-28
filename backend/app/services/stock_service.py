
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.blood_stock import BloodStock
from app.models.hospital import Hospital
from app.models.stock_batch import StockBatch
from app.schemas.stock import (
    BloodStockCreate,
    StockBatchCreate,
)


def get_hospital_stock(
    db: Session,
    hospital_id: int,
) -> list[BloodStock]:
    statement = (
        select(BloodStock)
        .where(BloodStock.hospital_id == hospital_id)
        .order_by(BloodStock.blood_type, BloodStock.component)
    )
    return list(db.scalars(statement).all())


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


def create_stock_item(
    db: Session,
    hospital_id: int,
    data: BloodStockCreate,
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
            detail="This blood group and component already have a stock record.",
        )

    stock = BloodStock(
        hospital_id=hospital_id,
        blood_type=data.blood_type,
        component=data.component,
        quantity=0,
        threshold=data.threshold,
    )
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock


def add_stock_batch(
    db: Session,
    hospital_id: int,
    stock_id: int,
    data: StockBatchCreate,
) -> StockBatch:
    stock = get_stock_item(db, hospital_id, stock_id)
    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock record not found.",
        )

    now = datetime.now(timezone.utc)
    expiry = data.expiry_date

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry <= now:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Expiry date must be in the future.",
        )

    duplicate = db.scalar(
        select(StockBatch).where(
            StockBatch.stock_id == stock_id,
            StockBatch.batch_reference == data.batch_reference.strip(),
        )
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That batch reference already exists for this stock item.",
        )

    batch = StockBatch(
        stock_id=stock_id,
        batch_reference=data.batch_reference.strip(),
        quantity=data.quantity,
        remaining_quantity=data.quantity,
        expiry_date=expiry,
    )

    stock.quantity += data.quantity
    db.add(batch)

    try:
        db.commit()
        db.refresh(batch)
        db.refresh(stock)
    except Exception:
        db.rollback()
        raise

    return batch


def issue_stock(
    db: Session,
    hospital_id: int,
    stock_id: int,
    quantity: int,
) -> BloodStock:
    stock = get_stock_item(db, hospital_id, stock_id)
    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock record not found.",
        )

    now = datetime.now(timezone.utc)

    # Consume the earliest-expiring batches first (FEFO).
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
            detail="Insufficient unexpired stock for this issue.",
        )

    remaining_to_issue = quantity

    try:
        for batch in batches:
            expiry = batch.expiry_date
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)

            if expiry <= now:
                continue

            taken = min(batch.remaining_quantity, remaining_to_issue)
            batch.remaining_quantity -= taken
            remaining_to_issue -= taken

            if remaining_to_issue == 0:
                break

        stock.quantity -= quantity
        db.commit()
        db.refresh(stock)
    except Exception:
        db.rollback()
        raise

    return stock


def get_stock_batches(
    db: Session,
    hospital_id: int,
    stock_id: int,
) -> list[StockBatch]:
    stock = get_stock_item(db, hospital_id, stock_id)
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
