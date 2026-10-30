
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.hospital import HospitalCreate, HospitalUpdate


def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    description: str,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
        )
    )


def create_hospital(
    db: Session,
    hospital_data: HospitalCreate,
    performed_by_user_id: int,
) -> Hospital | None:
    existing_hospital = db.scalar(
        select(Hospital).where(
            Hospital.registration_number == hospital_data.registration_number
        )
    )

    if existing_hospital:
        return None

    hospital = Hospital(**hospital_data.model_dump())
    db.add(hospital)

    try:
        db.flush()

        add_audit_entry(
            db,
            performed_by_user_id,
            "hospital_registered",
            "hospital",
            hospital.id,
            "A new hospital was registered.",
        )

        db.commit()
        db.refresh(hospital)
        return hospital

    except IntegrityError:
        db.rollback()
        return None
    except Exception:
        db.rollback()
        raise


def get_hospital(db: Session, hospital_id: int) -> Hospital | None:
    return db.get(Hospital, hospital_id)


def list_hospitals(
    db: Session,
    city: str | None = None,
    verified_only: bool = False,
) -> list[Hospital]:
    query = select(Hospital)

    if city:
        query = query.where(Hospital.city.ilike(f"%{city.strip()}%"))

    if verified_only:
        query = query.where(Hospital.is_verified.is_(True))

    return list(db.scalars(query.order_by(Hospital.name)).all())


def update_hospital(
    db: Session,
    hospital: Hospital,
    hospital_data: HospitalUpdate,
    performed_by_user_id: int,
) -> Hospital:
    updates = hospital_data.model_dump(exclude_unset=True)

    try:
        for field, value in updates.items():
            setattr(hospital, field, value)

        if updates:
            add_audit_entry(
                db,
                performed_by_user_id,
                "hospital_updated",
                "hospital",
                hospital.id,
                "Hospital details were updated.",
            )

        db.commit()
        db.refresh(hospital)
        return hospital

    except Exception:
        db.rollback()
        raise


def get_hospital_staff(
    db: Session,
    hospital_id: int,
) -> list[HospitalUser]:
    query = select(HospitalUser).where(
        HospitalUser.hospital_id == hospital_id
    )
    return list(db.scalars(query.order_by(HospitalUser.id)).all())


def authorize_hospital_staff(
    db: Session,
    hospital_id: int,
    user_id: int,
    performed_by_user_id: int,
) -> HospitalUser | None:
    hospital = db.get(Hospital, hospital_id)
    user = db.get(User, user_id)

    if hospital is None or user is None:
        return None

    if not hospital.is_verified:
        return None

    if user.role != UserRole.HOSPITAL_STAFF or not user.is_active:
        return None

    existing = db.scalar(
        select(HospitalUser).where(
            HospitalUser.hospital_id == hospital_id,
            HospitalUser.user_id == user_id,
        )
    )

    if existing:
        existing.is_authorized = True
        staff_link = existing
    else:
        staff_link = HospitalUser(
            hospital_id=hospital_id,
            user_id=user_id,
            is_authorized=True,
        )
        db.add(staff_link)

    try:
        db.flush()

        add_audit_entry(
            db,
            performed_by_user_id,
            "hospital_staff_authorized",
            "hospital_staff",
            staff_link.id,
            f"Staff authorization was granted for hospital ID {hospital_id}.",
        )

        db.commit()
        db.refresh(staff_link)
        return staff_link

    except Exception:
        db.rollback()
        raise


def set_hospital_verification(
    db: Session,
    hospital_id: int,
    is_verified: bool,
    performed_by_user_id: int,
) -> Hospital | None:
    hospital = db.get(Hospital, hospital_id)

    if hospital is None:
        return None

    try:
        previous_status = hospital.is_verified
        hospital.is_verified = is_verified

        if previous_status != is_verified:
            action = (
                "hospital_verified"
                if is_verified
                else "hospital_unverified"
            )

            description = (
                "Hospital verification was approved."
                if is_verified
                else "Hospital verification was revoked."
            )

            add_audit_entry(
                db,
                performed_by_user_id,
                action,
                "hospital",
                hospital.id,
                description,
            )

        db.commit()
        db.refresh(hospital)
        return hospital

    except Exception:
        db.rollback()
        raise


def revoke_hospital_staff(
    db: Session,
    hospital_id: int,
    user_id: int,
    performed_by_user_id: int,
) -> HospitalUser | None:
    staff_link = db.scalar(
        select(HospitalUser).where(
            HospitalUser.hospital_id == hospital_id,
            HospitalUser.user_id == user_id,
        )
    )

    if staff_link is None:
        return None

    try:
        was_authorized = staff_link.is_authorized
        staff_link.is_authorized = False

        if was_authorized:
            add_audit_entry(
                db,
                performed_by_user_id,
                "hospital_staff_authorization_revoked",
                "hospital_staff",
                staff_link.id,
                f"Staff authorization was revoked for hospital ID {hospital_id}.",
            )

        db.commit()
        db.refresh(staff_link)
        return staff_link

    except Exception:
        db.rollback()
        raise
