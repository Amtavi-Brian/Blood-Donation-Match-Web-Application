
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.donor import DonorProfileCreate, DonorProfileUpdate


def get_donor_profile(db: Session, user_id: int) -> DonorProfile | None:
    statement = select(DonorProfile).where(
        DonorProfile.user_id == user_id
    )
    return db.scalar(statement)


def create_donor_profile(
    db: Session,
    user: User,
    profile_data: DonorProfileCreate,
) -> DonorProfile:
    if user.role != UserRole.DONOR:
        raise ValueError("Only donor accounts can create donor profiles.")

    existing_profile = get_donor_profile(db, user.id)

    if existing_profile is not None:
        raise ValueError("A donor profile already exists for this account.")

    profile = DonorProfile(
        user_id=user.id,
        blood_group=profile_data.blood_group,
        city=profile_data.city,
        available_to_contact=profile_data.available_to_contact,
        consent_to_contact=profile_data.consent_to_contact,
    )

    db.add(profile)

    try:
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise

    return profile


def update_donor_profile(
    db: Session,
    user_id: int,
    profile_data: DonorProfileUpdate,
) -> DonorProfile | None:
    profile = get_donor_profile(db, user_id)

    if profile is None:
        return None

    updates = profile_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(profile, field, value)

    try:
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise

    return profile
