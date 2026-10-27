
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.hospital import HospitalCreate, HospitalResponse, HospitalUpdate, HospitalStaffResponse
from app.schemas.hospital import HospitalStaffCreate
from app.services import hospital_service

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.post(
    "/",
    response_model=HospitalResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_hospital(
    hospital_data: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can register hospitals.",
        )

    hospital = hospital_service.create_hospital(db, hospital_data)

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A hospital with this registration number already exists.",
        )

    return hospital


@router.get("/", response_model=list[HospitalResponse])
def list_hospitals(
    city: str | None = Query(default=None, max_length=100),
    verified_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return hospital_service.list_hospitals(
        db,
        city=city,
        verified_only=verified_only,
    )


@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospital = hospital_service.get_hospital(db, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    return hospital


@router.patch("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(
    hospital_id: int,
    hospital_data: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update hospital details.",
        )

    hospital = hospital_service.get_hospital(db, hospital_id)

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    return hospital_service.update_hospital(db, hospital, hospital_data)


@router.patch(
    "/{hospital_id}/verification",
    response_model=HospitalResponse,
)
def verify_hospital(
    hospital_id: int,
    is_verified: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can verify hospitals.",
        )

    hospital = hospital_service.set_hospital_verification(
        db,
        hospital_id,
        is_verified,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    return hospital


@router.post(
    "/{hospital_id}/staff/{user_id}/authorize",
    response_model=HospitalStaffResponse,
)
def authorize_staff(
    hospital_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can authorize hospital staff.",
        )

    staff_link = hospital_service.authorize_hospital_staff(
        db,
        hospital_id,
        user_id,
    )

    if staff_link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital or user not found.",
        )

    return staff_link


@router.patch(
    "/{hospital_id}/staff/{user_id}/authorization",
    response_model=HospitalStaffResponse,
)
def revoke_staff_authorization(
    hospital_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can revoke staff authorization.",
        )

    staff_link = hospital_service.revoke_hospital_staff(
        db,
        hospital_id,
        user_id,
    )

    if staff_link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital staff association not found.",
        )

    return staff_link
