
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models.blood_request import BloodRequest
from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.matching import PotentialDonorResponse


def find_potential_donors(
    db: Session,
    blood_request: BloodRequest,
) -> list[PotentialDonorResponse]:
    """
    Find active donors with the exact requested blood group
    who have consented to contact and are available.

    Donors in the hospital's city are listed first.
    This is preliminary matching, not clinical eligibility assessment.
    """
    hospital_city = blood_request.hospital.city

    statement = (
        select(DonorProfile, User)
        .join(User, User.id == DonorProfile.user_id)
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

    return [
        PotentialDonorResponse(
            donor_profile_id=profile.id,
            full_name=user.full_name,
            phone_number=user.phone_number,
            blood_group=profile.blood_group,
            city=profile.city,
        )
        for profile, user in rows
    ]
