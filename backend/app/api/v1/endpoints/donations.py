from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.donation import (
    DonationRecordCreate,
    DonationRecordResponse,
    DonationVerificationUpdate,
)
from app.services import donation_service

router = APIRouter(prefix="/donations", tags=["Donations"])


def require_hospital_access(
    db: Session,
    current_user: User,
    hospital_id: int,
) -> None:
    """Allow only authorized staff of a verified hospital."""

    if (
        current_user.role != UserRole.HOSPITAL_STAFF
        or not current_user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active hospital staff can manage donation records.",
        )

    hospital = db.get(Hospital, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verified hospital not found.",
        )

    association = (
        db.query(HospitalUser)
        .filter(
            HospitalUser.user_id == current_user.id,
            HospitalUser.hospital_id == hospital_id,
            HospitalUser.is_authorized.is_(True),
        )
        .first()
    )

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this hospital's donations.",
        )


def require_donor(current_user: User) -> None:
    if current_user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donor accounts can access their donation history.",
        )


@router.post(
    "/hospitals/{hospital_id}",
    response_model=DonationRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_donation_record(
    hospital_id: int,
    data: DonationRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    try:
        return donation_service.create_donation(
            db=db,
            donor_id=data.donor_id,
            hospital_id=hospital_id,
            blood_type=data.blood_type,
            quantity=data.quantity,
            donated_at=data.donated_at,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/me",
    response_model=list[DonationRecordResponse],
)
def list_my_donations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_donor(current_user)

    donor_id = donation_service.get_donor_id_for_user(db, current_user)

    if donor_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found. Create your profile first.",
        )

    return donation_service.list_donations_for_donor(db, donor_id)


@router.get(
    "/hospitals/{hospital_id}",
    response_model=list[DonationRecordResponse],
)
def list_hospital_donations(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    return donation_service.list_donations_for_hospital(
        db,
        hospital_id,
    )


@router.patch(
    "/hospitals/{hospital_id}/{donation_id}/verify",
    response_model=DonationRecordResponse,
)
def verify_donation_record(
    hospital_id: int,
    donation_id: int,
    data: DonationVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_hospital_access(db, current_user, hospital_id)

    if not data.verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donation verification cannot be reversed through this endpoint.",
        )

    donation = donation_service.verify_donation(
        db,
        donation_id,
        hospital_id,
    )

    if donation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation record not found for this hospital.",
        )

    return donation