from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
)
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestUpdate,
)


def get_authorized_hospital_id(
    db: Session,
    user: User,
) -> int | None:
    """Return an approved hospital association for hospital staff."""
    if user.role != UserRole.HOSPITAL_STAFF:
        return None

    statement = (
        select(HospitalUser.hospital_id)
        .where(
            HospitalUser.user_id == user.id,
            HospitalUser.is_authorized.is_(True),
        )
        .order_by(HospitalUser.id)
    )

    return db.scalars(statement).first()


def create_blood_request(
    db: Session,
    hospital_id: int,
    request_data: BloodRequestCreate,
) -> BloodRequest:
    blood_request = BloodRequest(
        hospital_id=hospital_id,
        **request_data.model_dump(),
    )

    db.add(blood_request)
    db.commit()
    db.refresh(blood_request)

    return blood_request


def list_blood_requests(
    db: Session,
    status_filter: BloodRequestStatus | None = None,
) -> list[BloodRequest]:
    statement = (
        select(BloodRequest)
        .options(selectinload(BloodRequest.hospital))
        .order_by(BloodRequest.created_at.desc())
    )

    if status_filter is not None:
        statement = statement.where(
            BloodRequest.status == status_filter
        )

    return list(db.scalars(statement).all())


def get_blood_request(
    db: Session,
    request_id: int,
) -> BloodRequest | None:
    statement = (
        select(BloodRequest)
        .options(selectinload(BloodRequest.hospital))
        .where(BloodRequest.id == request_id)
    )

    return db.scalars(statement).first()


def update_blood_request(
    db: Session,
    blood_request: BloodRequest,
    update_data: BloodRequestUpdate,
) -> BloodRequest:
    changes = update_data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(blood_request, field, value)

    db.commit()
    db.refresh(blood_request)

    return blood_request


def cancel_blood_request(
    db: Session,
    blood_request: BloodRequest,
) -> BloodRequest:
    blood_request.status = BloodRequestStatus.CANCELLED

    db.commit()
    db.refresh(blood_request)

    return blood_request