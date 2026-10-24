
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.donor import (
    DonorProfileCreate,
    DonorProfileResponse,
    DonorProfileUpdate,
)
from app.services import donor_service

router = APIRouter(prefix="/donors", tags=["Donors"])


def require_donor(user: User) -> None:
    if user.role != UserRole.DONOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only donor accounts can access this resource.",
        )


@router.post(
    "/me",
    response_model=DonorProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_donor_profile(
    profile_data: DonorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_donor(current_user)

    try:
        return donor_service.create_donor_profile(
            db,
            current_user,
            profile_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/me", response_model=DonorProfileResponse)
def read_my_donor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_donor(current_user)

    profile = donor_service.get_donor_profile(db, current_user.id)

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found. Create your profile first.",
        )

    return profile


@router.put("/me", response_model=DonorProfileResponse)
def update_my_donor_profile(
    profile_data: DonorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_donor(current_user)

    profile = donor_service.update_donor_profile(
        db,
        current_user.id,
        profile_data,
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found. Create your profile first.",
        )

    return profile
