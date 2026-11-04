
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
)
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestUpdate,
)


def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    entity_id: int,
    description: str,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type="blood_request",
            entity_id=entity_id,
            description=description,
        )
    )


def get_authorized_hospital_id(
    db: Session,
    user: User,
) -> int | None:
    """Return an authorized association with a verified hospital."""
    if user.role != UserRole.HOSPITAL_STAFF or not user.is_active:
        return None

    statement = (
        select(HospitalUser.hospital_id)
        .join(Hospital, Hospital.id == HospitalUser.hospital_id)
        .where(
            HospitalUser.user_id == user.id,
            HospitalUser.is_authorized.is_(True),
            Hospital.is_verified.is_(True),
        )
        .order_by(HospitalUser.id)
    )

    return db.scalars(statement).first()


def create_blood_request(
    db: Session,
    hospital_id: int,
    request_data: BloodRequestCreate,
    performed_by_user_id: int,
) -> BloodRequest:
    hospital = db.get(Hospital, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise ValueError("A verified hospital is required.")

    blood_request = BloodRequest(
        hospital_id=hospital_id,
        **request_data.model_dump(),
    )

    try:
        db.add(blood_request)
        db.flush()

        add_audit_entry(
            db,
            performed_by_user_id,
            "blood_request_created",
            blood_request.id,
            "A new blood request was created.",
        )

        db.commit()
        db.refresh(blood_request)
        return blood_request

    except Exception:
        db.rollback()
        raise


def list_blood_requests(
    db: Session,
    status_filter: BloodRequestStatus | None = None,
) -> list[BloodRequest]:
    """List requests from verified hospitals."""
    statement = (
        select(BloodRequest)
        .join(Hospital, Hospital.id == BloodRequest.hospital_id)
        .options(selectinload(BloodRequest.hospital))
        .where(Hospital.is_verified.is_(True))
        .order_by(BloodRequest.created_at.desc())
    )

    if status_filter is not None:
        statement = statement.where(
            BloodRequest.status == status_filter
        )
    else:
        statement = statement.where(
            BloodRequest.status != BloodRequestStatus.CANCELLED
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
    performed_by_user_id: int,
) -> BloodRequest:
    changes = update_data.model_dump(exclude_unset=True)

    if not changes:
        raise ValueError("At least one field must be provided.")

    if blood_request.status != BloodRequestStatus.PENDING:
        raise ValueError("Only pending requests can be updated.")

    try:
        for field, value in changes.items():
            setattr(blood_request, field, value)

        add_audit_entry(
            db,
            performed_by_user_id,
            "blood_request_updated",
            blood_request.id,
            "Blood request details were updated.",
        )

        db.commit()
        db.refresh(blood_request)
        return blood_request

    except Exception:
        db.rollback()
        raise


def update_blood_request_status(
    db: Session,
    blood_request: BloodRequest,
    new_status: BloodRequestStatus,
    performed_by_user_id: int,
) -> BloodRequest:
    """Apply an allowed status transition and record it in the audit log."""

    current_status = blood_request.status

    allowed_transitions = {
        BloodRequestStatus.PENDING: {
            BloodRequestStatus.FULFILLED,
            BloodRequestStatus.CANCELLED,
        },
        BloodRequestStatus.FULFILLED: set(),
        BloodRequestStatus.CANCELLED: set(),
    }

    if new_status == current_status:
        return blood_request

    if new_status not in allowed_transitions[current_status]:
        raise ValueError(
            f"Cannot change a request from "
            f"'{current_status.value}' to '{new_status.value}'."
        )

    try:
        blood_request.status = new_status

        action = (
            "blood_request_fulfilled"
            if new_status == BloodRequestStatus.FULFILLED
            else "blood_request_cancelled"
        )

        description = (
            "Blood request was marked as fulfilled."
            if new_status == BloodRequestStatus.FULFILLED
            else "Blood request was cancelled."
        )

        add_audit_entry(
            db,
            performed_by_user_id,
            action,
            blood_request.id,
            description,
        )

        db.commit()
        db.refresh(blood_request)
        return blood_request

    except Exception:
        db.rollback()
        raise
