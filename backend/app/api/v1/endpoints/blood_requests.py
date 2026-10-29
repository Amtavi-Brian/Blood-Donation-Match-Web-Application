from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.blood_request import BloodRequestStatus
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestResponse,
    BloodRequestUpdate,
    BloodRequestStatusUpdate,
)

from app.services import blood_request_service
from backend.app.models import blood_request

router = APIRouter(
    prefix="/blood-requests",
    tags=["Blood Requests"],
)



def require_hospital_access(
    db: Session,
    user: User,
    hospital_id: int | None = None,
) -> int:
    """Require active, authorized staff at a verified hospital."""
    if user.role != UserRole.HOSPITAL_STAFF or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active hospital staff can manage blood requests.",
        )

    statement = (
        select(HospitalUser)
        .join(Hospital, Hospital.id == HospitalUser.hospital_id)
        .where(
            HospitalUser.user_id == user.id,
            HospitalUser.is_authorized.is_(True),
            Hospital.is_verified.is_(True),
        )
    )

    if hospital_id is not None:
        statement = statement.where(
            HospitalUser.hospital_id == hospital_id
        )

    association = db.scalars(
        statement.order_by(HospitalUser.id)
    ).first()

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No authorized association with a verified hospital "
                "was found."
            ),
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

    # Hide requests from unverified hospitals.
    if not blood_request.hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    # Hide cancelled requests from the general discovery endpoint.
    if blood_request.status == BloodRequestStatus.CANCELLED:
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

    if blood_request.status != BloodRequestStatus.PENDING:
        raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Only pending blood requests can be updated.",
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
    try:
        return blood_request_service.update_blood_request_status(
            db,
            blood_request,
        BloodRequestStatus.CANCELLED,
    )
    except ValueError as exc:
        raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    ) from exc


@router.patch(
    "/{request_id}/status",
    response_model=BloodRequestResponse,
)
def update_request_status(
    request_id: int,
    status_data: BloodRequestStatusUpdate,
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

    try:
        return blood_request_service.update_blood_request_status(
            db,
            blood_request,
            status_data.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
