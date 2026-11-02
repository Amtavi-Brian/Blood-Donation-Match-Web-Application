
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.donor import (
    DonorProfileCreate,
    DonorProfileUpdate,
)


# ---------------------------------------------------------
# AUDIT LOGGING HELPER
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# CREATE DONOR PROFILE
# ---------------------------------------------------------

def create_donor_profile(
    db: Session,
    user: User,
    profile_data: DonorProfileCreate,
) -> DonorProfile:

    # Only donor accounts can create donor profiles.
    if user.role != UserRole.DONOR:
        raise ValueError(
            "Only donor accounts can create donor profiles."
        )

    if not user.is_active:
        raise ValueError(
            "An active account is required to create a donor profile."
        )

    # Check whether the user already has a donor profile.
    existing_profile = db.scalar(
        select(DonorProfile).where(
            DonorProfile.user_id == user.id
        )
    )

    if existing_profile is not None:
        raise ValueError(
            "You already have a donor profile."
        )

    profile = DonorProfile(
        user_id=user.id,
        blood_group=profile_data.blood_group,
        city=profile_data.city,
        available_to_contact=profile_data.available_to_contact,
        consent_to_contact=profile_data.consent_to_contact,
    )

    try:
        db.add(profile)

        # Generate profile ID before creating the audit record.
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


# ---------------------------------------------------------
# GET DONOR PROFILE
# ---------------------------------------------------------

def get_donor_profile(
    db: Session,
    user_id: int,
) -> DonorProfile | None:

    statement = select(DonorProfile).where(
        DonorProfile.user_id == user_id
    )

    return db.scalar(statement)


# ---------------------------------------------------------
# UPDATE DONOR PROFILE
# ---------------------------------------------------------

def update_donor_profile(
    db: Session,
    user_id: int,
    profile_data: DonorProfileUpdate,
) -> DonorProfile | None:

    profile = get_donor_profile(db, user_id)

    if profile is None:
        return None

    # Only update fields explicitly supplied by the user.
    update_data = profile_data.model_dump(
        exclude_unset=True
    )

    if not update_data:
        return profile

    try:
        changed_fields = []

        for field, value in update_data.items():
            if getattr(profile, field) != value:
                setattr(profile, field, value)
                changed_fields.append(field)

        # Do not create audit records when nothing changed.
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
