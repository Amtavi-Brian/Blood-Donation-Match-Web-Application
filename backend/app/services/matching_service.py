
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.blood_request import BloodRequest
from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.matching import PotentialDonorResponse


# ---------------------------------------------------------
# FIND POTENTIAL DONORS
# ---------------------------------------------------------

def find_potential_donors(
    db: Session,
    blood_request: BloodRequest,
    performed_by_user_id: int,
) -> list[PotentialDonorResponse]:
    """
    Find potential donors who:
    - Have the exact requested blood group.
    - Have an active donor account.
    - Are available to be contacted.
    - Have consented to be contacted.

    Donors in the hospital's city are prioritized.

    This is preliminary matching, not clinical eligibility
    or final blood compatibility assessment.
    """

    hospital_city = blood_request.hospital.city

    statement = (
        select(DonorProfile, User)
        .join(
            User,
            User.id == DonorProfile.user_id,
        )
        .where(
            DonorProfile.blood_group == blood_request.blood_group,
            DonorProfile.available_to_contact.is_(True),
            DonorProfile.consent_to_contact.is_(True),
            User.role == UserRole.DONOR,
            User.is_active.is_(True),
        )
        .order_by(
            case(
                (DonorProfile.city == hospital_city, 0),
                else_=1,
            ),
            DonorProfile.id,
        )
    )

    rows = db.execute(statement).all()

    results = [
        PotentialDonorResponse(
            donor_profile_id=profile.id,
            full_name=user.full_name,
            phone_number=user.phone_number,
            blood_group=profile.blood_group,
            city=profile.city,
        )
        for profile, user in rows
    ]

    # -----------------------------------------------------
    # AUDIT LOGGING
    # -----------------------------------------------------

    audit = AuditLog(
        user_id=performed_by_user_id,
        action="donor_matching_performed",
        entity_type="blood_request",
        entity_id=blood_request.id,
        description=(
            f"Performed donor matching for blood request "
            f"{blood_request.id}. "
            f"{len(results)} potential donor(s) were found."
        ),
    )

    try:
        db.add(audit)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return results
