from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.donor import (
    DonorProfileCreate,
    DonorProfileUpdate,
)


class InvalidDonorLocationError(ValueError):
    """Raised when donor location information is invalid."""


def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    profile_id: int,
    description: str,
) -> None:
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type="donor_profile",
        entity_id=profile_id,
        description=description,
    )
    db.add(audit)


def validate_donor_location(data: dict) -> None:
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    consent = data.get("consent_to_share_location", False)

    if (latitude is None) != (longitude is None):
        raise InvalidDonorLocationError(
            "Both latitude and longitude must be provided together."
        )

    if consent and (latitude is None or longitude is None):
        raise InvalidDonorLocationError(
            "Provide your location before enabling location sharing."
        )


def create_donor_profile(
    db: Session,
    user: User,
    profile_data: DonorProfileCreate,
) -> DonorProfile:

    if user.role != UserRole.DONOR:
        raise ValueError(
            "Only donor accounts can create donor profiles."
        )

    if not user.is_active:
        raise ValueError(
            "An active account is required to create a donor profile."
        )

    existing_profile = db.scalar(
        select(DonorProfile).where(
            DonorProfile.user_id == user.id
        )
    )

    if existing_profile is not None:
        raise ValueError(
            "You already have a donor profile."
        )

    profile_values = profile_data.model_dump()

    validate_donor_location(profile_values)

    profile = DonorProfile(
        user_id=user.id,
        **profile_values,
    )

    try:
        db.add(profile)
        db.flush()

        add_audit_entry(
            db=db,
            user_id=user.id,
            action="donor_profile_created",
            profile_id=profile.id,
            description=(
                f"Created donor profile with ID {profile.id}."
            ),
        )

        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()
        raise

    return profile


def get_donor_profile(
    db: Session,
    user_id: int,
) -> DonorProfile | None:

    statement = select(DonorProfile).where(
        DonorProfile.user_id == user_id
    )

    return db.scalar(statement)


def update_donor_profile(
    db: Session,
    user_id: int,
    profile_data: DonorProfileUpdate,
) -> DonorProfile | None:

    profile = get_donor_profile(db, user_id)

    if profile is None:
        return None

    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        return profile

    # Validate the final location state, not just the fields
    # supplied in this update.
    current_location = {
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "consent_to_share_location": (
            profile.consent_to_share_location
        ),
    }

    final_location = {
        **current_location,
        **{
            key: value
            for key, value in update_data.items()
            if key in current_location
        },
    }

    validate_donor_location(final_location)

    try:
        changed_fields = []

        for field, value in update_data.items():
            if getattr(profile, field) != value:
                setattr(profile, field, value)
                changed_fields.append(field)

        if not changed_fields:
            return profile

        add_audit_entry(
            db=db,
            user_id=user_id,
            action="donor_profile_updated",
            profile_id=profile.id,
            description=(
                "Updated donor profile fields: "
                + ", ".join(changed_fields)
                + "."
            ),
        )

        db.commit()
        db.refresh(profile)

    except Exception:
        db.rollback()
        raise

    return profile