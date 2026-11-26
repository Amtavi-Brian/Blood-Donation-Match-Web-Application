import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdate
from app.services import user_service
from app.services.otp_service import send_verification_otp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = user_data.model_dump(exclude_unset=True)

    for field, label in (("full_name", "Full name"), ("email", "Email")):
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{label} cannot be empty.",
            )

    try:
        user, email_changed = user_service.update_user_profile(
            db=db,
            user=current_user,
            update_data=update_data,
        )
    except user_service.EmailAlreadyInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if email_changed:
        try:
            send_verification_otp(db, user)
        except Exception:
            logger.exception("Verification email delivery failed.")

    return user
