
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.donation_record import DonationRecord
from app.models.donor_profile import BloodGroup, DonorProfile
from app.models.hospital import Hospital
from app.models.user import User, UserRole


def create_donation(
    db: Session,
    donor_id: int,
    hospital_id: int,
    blood_type: BloodGroup,
    quantity: int,
    donated_at: datetime | None = None,
) -> DonationRecord:
    if quantity <= 0 or quantity > 10000:
        raise ValueError("Quantity must be between 1 and 10000.")

    if donated_at is None:
        donated_at = datetime.now(timezone.utc)
    elif donated_at.tzinfo is None:
        donated_at = donated_at.replace(tzinfo=timezone.utc)

    if donated_at > datetime.now(timezone.utc):
        raise ValueError("Donation date cannot be in the future.")

    donor = db.get(DonorProfile, donor_id)
    if donor is None:
        raise ValueError("Donor profile not found.")

    donor_user = donor.user
    if (
        donor_user is None
        or not donor_user.is_active
        or donor_user.role != UserRole.DONOR
    ):
        raise ValueError("An active donor account is required.")

    hospital = db.get(Hospital, hospital_id)
    if hospital is None or not hospital.is_verified:
        raise ValueError("Verified hospital not found.")

    if blood_type != donor.blood_group:
        raise ValueError(
            "Recorded blood group must match the donor profile."
        )

    donation = DonationRecord(
        donor_id=donor_id,
        hospital_id=hospital_id,
        blood_type=blood_type,
        quantity=quantity,
        donated_at=donated_at,
        verified=False,
    )

    try:
        db.add(donation)
        db.commit()
        db.refresh(donation)
    except Exception:
        db.rollback()
        raise

    return donation


def list_donations_for_donor(
    db: Session,
    donor_id: int,
) -> list[DonationRecord]:
    statement = (
        select(DonationRecord)
        .where(DonationRecord.donor_id == donor_id)
        .order_by(DonationRecord.donated_at.desc())
    )
    return list(db.scalars(statement).all())


def list_donations_for_hospital(
    db: Session,
    hospital_id: int,
) -> list[DonationRecord]:
    statement = (
        select(DonationRecord)
        .where(DonationRecord.hospital_id == hospital_id)
        .order_by(DonationRecord.donated_at.desc())
    )
    return list(db.scalars(statement).all())


def verify_donation(
    db: Session,
    donation_id: int,
    hospital_id: int,
) -> DonationRecord | None:
    statement = select(DonationRecord).where(
        DonationRecord.donation_id == donation_id,
        DonationRecord.hospital_id == hospital_id,
    )
    donation = db.scalar(statement)

    if donation is None:
        return None

    if not donation.verified:
        try:
            donation.verified = True
            db.commit()
            db.refresh(donation)
        except Exception:
            db.rollback()
            raise

    return donation


def get_donor_id_for_user(
    db: Session,
    user: User,
) -> int | None:
    donor = db.scalar(
        select(DonorProfile).where(
            DonorProfile.user_id == user.id
        )
    )
    return donor.id if donor else None
