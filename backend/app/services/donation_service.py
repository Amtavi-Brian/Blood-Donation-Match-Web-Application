
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.donation_record import DonationRecord
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.user import User


# ---------------------------------------------------------
# AUDIT LOGGING HELPER
# ---------------------------------------------------------

def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    donation_id: int,
    description: str,
) -> None:
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type="donation",
        entity_id=donation_id,
        description=description,
    )

    db.add(audit)


# ---------------------------------------------------------
# CREATE DONATION
# ---------------------------------------------------------

def create_donation(
    db: Session,
    donor_id: int,
    hospital_id: int,
    blood_type,
    quantity: int,
    performed_by_user_id: int,
    donated_at: datetime | None = None,
) -> DonationRecord:

    donor = db.get(DonorProfile, donor_id)

    if donor is None:
        raise ValueError("Donor profile not found.")

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
        donated_at=donated_at or datetime.now(timezone.utc),
        verified=False,
    )

    try:
        db.add(donation)

        # Generate donation ID before creating the audit record.
        db.flush()

        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="donation_recorded",
            donation_id=donation.donation_id,
            description=(
                f"Recorded a donation of {quantity} units "
                f"for donor ID {donor_id} at hospital "
                f"ID {hospital_id}."
            ),
        )

        db.commit()
        db.refresh(donation)

    except Exception:
        db.rollback()
        raise

    return donation


# ---------------------------------------------------------
# LIST DONATIONS FOR DONOR
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# LIST DONATIONS FOR HOSPITAL
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# VERIFY DONATION
# ---------------------------------------------------------

def verify_donation(
    db: Session,
    donation_id: int,
    hospital_id: int,
    performed_by_user_id: int,
) -> DonationRecord | None:

    statement = select(DonationRecord).where(
        DonationRecord.donation_id == donation_id,
        DonationRecord.hospital_id == hospital_id,
    )

    donation = db.scalar(statement)

    if donation is None:
        return None

    # Avoid duplicate audit entries when already verified.
    if not donation.verified:

        try:
            donation.verified = True

            add_audit_entry(
                db=db,
                user_id=performed_by_user_id,
                action="donation_verified",
                donation_id=donation.donation_id,
                description=(
                    f"Verified donation record "
                    f"{donation.donation_id} for donor "
                    f"ID {donation.donor_id} at hospital "
                    f"ID {hospital_id}."
                ),
            )

            db.commit()
            db.refresh(donation)

        except Exception:
            db.rollback()
            raise

    return donation


# ---------------------------------------------------------
# GET DONOR ID FOR AUTHENTICATED USER
# ---------------------------------------------------------

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
