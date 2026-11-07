from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.user import User, UserRole
from app.schemas.hospital import (
    HospitalCreate,
    HospitalResponse,
    HospitalUpdate,
    HospitalStaffResponse,
    HospitalStaffCreate,
)
from app.services import hospital_service
from app.schemas.location import (
    HospitalMapLocation,
    DonorMapLocation,
)
from app.services import location_service

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospitals"],
)

@router.get(
    "/me",
    response_model=list[HospitalResponse],
)
def get_my_hospitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.HOSPITAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospital staff can list their hospital associations.",
        )

    return (
        db.query(Hospital)
        .join(HospitalUser, HospitalUser.hospital_id == Hospital.id)
        .filter(
            HospitalUser.user_id == current_user.id,
            HospitalUser.is_authorized.is_(True),
            Hospital.is_verified.is_(True),
        )
        .order_by(Hospital.name)
        .all()
    )


@router.get(
    "/map",
    response_model=list[HospitalMapLocation],
)
def get_verified_hospitals_map(
    city: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    """
    Public map locations for verified hospitals only.
    """
    return location_service.list_verified_hospital_locations(
        db=db,
        city=city,
    )


@router.get(
    "/{hospital_id}/donors/map",
    response_model=list[DonorMapLocation],
)
def get_hospital_donor_map(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approximate locations of donors who consented to location sharing.
    Only authorized staff of this hospital can access this endpoint.
    """
    if current_user.role != UserRole.HOSPITAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospital staff can access donor map locations.",
        )

    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required.",
        )

    authorized = location_service.staff_can_view_hospital_donors(
        db=db,
        hospital_id=hospital_id,
        staff_user_id=current_user.id,
    )

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this hospital's donor map.",
        )

    try:
        donors = location_service.list_consented_donor_locations(
            db=db,
            hospital_id=hospital_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    locations = []

    for donor in donors:
        latitude, longitude = (
            location_service.approximate_donor_location(
                donor.latitude,
                donor.longitude,
            )
        )

        locations.append(
            DonorMapLocation(
                blood_group=donor.blood_group,
                city=donor.city,
                latitude=latitude,
                longitude=longitude,
            )
        )

    return locations

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

    try:
        hospital = hospital_service.create_hospital(
            db=db,
            hospital_data=hospital_data,
            performed_by_user_id=current_user.id,
        )

    except hospital_service.InvalidHospitalLocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A hospital with this registration number "
                "already exists."
            ),
        )

    return hospital


@router.get(
    "/",
    response_model=list[HospitalResponse],
)
def list_hospitals(
    city: str | None = Query(default=None, max_length=100),
    verified_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return hospital_service.list_hospitals(
        db=db,
        city=city,
        verified_only=verified_only,
    )


@router.get(
    "/{hospital_id}",
    response_model=HospitalResponse,
)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hospital = hospital_service.get_hospital(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    return hospital


@router.patch(
    "/{hospital_id}",
    response_model=HospitalResponse,
)
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

    hospital = hospital_service.get_hospital(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found.",
        )

    try:
        return hospital_service.update_hospital(
            db=db,
            hospital=hospital,
            hospital_data=hospital_data,
            performed_by_user_id=current_user.id,
        )

    except hospital_service.InvalidHospitalLocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


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
        db=db,
        hospital_id=hospital_id,
        is_verified=is_verified,
        performed_by_user_id=current_user.id,
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
        db=db,
        hospital_id=hospital_id,
        user_id=user_id,
        performed_by_user_id=current_user.id,
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
        db=db,
        hospital_id=hospital_id,
        user_id=user_id,
        performed_by_user_id=current_user.id,
    )

    if staff_link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital staff association not found.",
        )

    return staff_link