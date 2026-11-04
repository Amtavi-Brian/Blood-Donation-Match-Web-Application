from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserResponse
from app.services import user_service
from app.schemas.hospital import HospitalStaffAccountCreate
from app.services.otp_service import send_verification_otp

router = APIRouter(prefix="/admin", tags=["Administration"])


class UserActivationUpdate(BaseModel):
    is_active: bool


def require_admin(current_user: User) -> None:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )

@router.post(
    "/hospital-staff",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_hospital_staff_account(
    staff_data: HospitalStaffAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    staff_user = user_service.create_hospital_staff_user(
        db=db,
        user_data=staff_data,
    )

    if staff_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    try:
        send_verification_otp(db, staff_user)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The staff account was created, but the verification "
                "email could not be sent. Use the resend OTP endpoint."
            ),
        )

    return staff_user

@router.get("/users", response_model=list[UserResponse])
def list_registered_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    return user_service.list_users(
        db=db,
        skip=skip,
        limit=limit,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
def get_registered_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    user = user_service.get_user_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


@router.patch(
    "/users/{user_id}/activation",
    response_model=UserResponse,
)
def update_user_activation(
    user_id: int,
    update_data: UserActivationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    if user_id == current_user.id and not update_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    try:
        user = user_service.set_user_active_status(
            db=db,
            target_user_id=user_id,
            is_active=update_data.is_active,
            performed_by_user_id=current_user.id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user