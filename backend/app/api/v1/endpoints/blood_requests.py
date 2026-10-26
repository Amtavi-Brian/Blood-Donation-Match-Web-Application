from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.blood_request import BloodRequestStatus
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestResponse,
    BloodRequestUpdate,
)
from app.services import blood_request_service

router = APIRouter(
    prefix="/blood-requests",
    tags=["Blood Requests"],
)


def require_hospital_access(
    db: Session,
    user: User,
    hospital_id: int | None = None,
) -> int:
    """Check that the user is authorized for the hospital."""
    if user.role != UserRole.HOSPITAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospital staff can manage blood requests.",
        )

    statement = select(HospitalUser).where(
        HospitalUser.user_id == user.id,
        HospitalUser.is_authorized.is_(True),
    )

    if hospital_id is not None:
        statement = statement.where(
            HospitalUser.hospital_id == hospital_id
        )

    association = db.scalars(statement.order_by(HospitalUser.id)).first()

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized for this hospital.",
        )

    return association.hospital_id


@router.post(
    "/",
    response_model=BloodRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_request(
    request_data: BloodRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospital_id = require_hospital_access(db, current_user)

    return blood_request_service.create_blood_request(
        db,
        hospital_id,
        request_data,
    )


@router.get(
    "/",
    response_model=list[BloodRequestResponse],
)
def list_requests(
    status_filter: BloodRequestStatus | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return blood_request_service.list_blood_requests(
        db,
        status_filter,
    )


@router.get(
    "/{request_id}",
    response_model=BloodRequestResponse,
)
def read_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blood_request = blood_request_service.get_blood_request(
        db,
        request_id,
    )

    if blood_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    return blood_request


@router.patch(
    "/{request_id}",
    response_model=BloodRequestResponse,
)
def update_request(
    request_id: int,
    update_data: BloodRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blood_request = blood_request_service.get_blood_request(
        db,
        request_id,
    )

    if blood_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    require_hospital_access(
        db,
        current_user,
        blood_request.hospital_id,
    )

    return blood_request_service.update_blood_request(
        db,
        blood_request,
        update_data,
    )


@router.delete(
    "/{request_id}",
    response_model=BloodRequestResponse,
)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blood_request = blood_request_service.get_blood_request(
        db,
        request_id,
    )

    if blood_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    require_hospital_access(
        db,
        current_user,
        blood_request.hospital_id,
    )

    return blood_request_service.cancel_blood_request(
        db,
        blood_request,
    )