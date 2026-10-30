
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.stock import (
    BloodStockCreate,
    BloodStockResponse,
    StockBatchCreate,
    StockBatchResponse,
    StockIssue,
)
from app.services import stock_service

router = APIRouter(prefix="/stock", tags=["Blood Stock"])


def require_hospital_access(
    db: Session,
    current_user: User,
    hospital_id: int,
) -> None:
    """Ensure the user is authorized to manage this hospital's stock."""

    if (
        current_user.role != UserRole.HOSPITAL_STAFF
        or not current_user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active hospital staff can manage blood stock.",
        )

    hospital = db.get(Hospital, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    association = (
        db.query(HospitalUser)
        .filter(
            HospitalUser.user_id == current_user.id,
            HospitalUser.hospital_id == hospital_id,
            HospitalUser.is_authorized.is_(True),
        )
        .first()
    )

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this hospital's stock.",
        )


@router.get(
    "/hospitals/{hospital_id}",
    response_model=list[BloodStockResponse],
)
def list_hospital_stock(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return stock_service.get_hospital_stock(db, hospital_id)


@router.post(
    "/hospitals/{hospital_id}",
    response_model=BloodStockResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_hospital_stock(
    hospital_id: int,
    data: BloodStockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return stock_service.create_stock_item(db, hospital_id, data)


@router.post(
    "/hospitals/{hospital_id}/items/{stock_id}/batches",
    response_model=StockBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_hospital_stock_batch(
    hospital_id: int,
    stock_id: int,
    data: StockBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return stock_service.add_stock_batch(
        db,
        hospital_id,
        stock_id,
        data,
    )


@router.get(
    "/hospitals/{hospital_id}/items/{stock_id}/batches",
    response_model=list[StockBatchResponse],
)
def list_hospital_stock_batches(
    hospital_id: int,
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return stock_service.get_stock_batches(
        db,
        hospital_id,
        stock_id,
    )


@router.post(
    "/hospitals/{hospital_id}/items/{stock_id}/issue",
    response_model=BloodStockResponse,
)
def issue_hospital_stock(
    hospital_id: int,
    stock_id: int,
    data: StockIssue,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return stock_service.issue_stock(
        db,
        hospital_id,
        stock_id,
        data.quantity,
    )
