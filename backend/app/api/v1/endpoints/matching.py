
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
)
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.matching import PotentialDonorResponse
from app.services import matching_service

router = APIRouter(prefix="/matching", tags=["Donor Matching"])


@router.get(
    "/requests/{request_id}/donors",
    response_model=list[PotentialDonorResponse],
)
def match_donors_to_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only active hospital staff may request matches.
    if (
        current_user.role != UserRole.HOSPITAL_STAFF
        or not current_user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active hospital staff can request donor matches.",
        )

    blood_request = db.get(BloodRequest, request_id)

    if blood_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    hospital = db.get(Hospital, blood_request.hospital_id)

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blood request not found.",
        )

    # Verify authorization specifically for the hospital that owns
    # this request; authorization at another hospital is insufficient.
    association = (
        db.query(HospitalUser)
        .filter(
            HospitalUser.user_id == current_user.id,
            HospitalUser.hospital_id == blood_request.hospital_id,
            HospitalUser.is_authorized.is_(True),
        )
        .first()
    )

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this hospital's requests.",
        )

    if blood_request.status != BloodRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Matching is available only for pending blood requests.",
        )

    # Load the hospital relationship used for city-based ordering.
    blood_request.hospital = hospital

    return matching_service.find_potential_donors(
        db,
        blood_request,
    )
