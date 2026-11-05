from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole


def list_verified_hospital_locations(
    db: Session,
    city: str | None = None,
) -> list[Hospital]:
    statement = select(Hospital).where(
        Hospital.is_verified.is_(True),
        Hospital.latitude.is_not(None),
        Hospital.longitude.is_not(None),
    )

    if city:
        statement = statement.where(Hospital.city.ilike(city.strip()))

    statement = statement.order_by(Hospital.name.asc())

    return list(db.scalars(statement).all())


def list_consented_donor_locations(
    db: Session,
    hospital_id: int,
) -> list[DonorProfile]:
    hospital = db.get(Hospital, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise ValueError("Verified hospital not found.")

    statement = (
        select(DonorProfile)
        .join(User, User.id == DonorProfile.user_id)
        .where(
            User.role == UserRole.DONOR,
            User.is_active.is_(True),
            User.is_email_verified.is_(True),
            DonorProfile.consent_to_share_location.is_(True),
            DonorProfile.latitude.is_not(None),
            DonorProfile.longitude.is_not(None),
        )
    )

    return list(db.scalars(statement).all())


def staff_can_view_hospital_donors(
    db: Session,
    hospital_id: int,
    staff_user_id: int,
) -> bool:
    statement = select(HospitalUser.id).where(
        HospitalUser.hospital_id == hospital_id,
        HospitalUser.user_id == staff_user_id,
        HospitalUser.is_authorized.is_(True),
    )

    return db.scalar(statement) is not None


def approximate_donor_location(
    latitude: float,
    longitude: float,
) -> tuple[float, float]:
    """
    Round coordinates to approximately 1 km precision.
    Never return the donor's exact coordinates.
    """
    return round(latitude, 2), round(longitude, 2)