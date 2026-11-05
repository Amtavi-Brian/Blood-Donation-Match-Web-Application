
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ResendEmailOTP,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyEmailOTP,
)
from app.services import user_service
from app.services.otp_service import (
    OTPAttemptsExceededError,
    OTPError,
    OTPExpiredError,
    OTPInvalidError,
    OTPResendCooldownError,
    reset_password_with_otp,
    send_password_reset_otp,
    send_verification_otp,
    verify_email_otp,
)
from app.services.user_service import EmailNotVerifiedError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    new_user = user_service.create_user(db, user_data)

    if new_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    try:
        send_verification_otp(db, new_user)
    except Exception:
        logger.exception("Verification email delivery failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Your account was created, but the verification email "
                "could not be sent. Please use the resend OTP endpoint."
            ),
        )

    return new_user


@router.post("/verify-email")
def verify_email(
    verification_data: VerifyEmailOTP,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == str(verification_data.email))
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    try:
        verify_email_otp(
            db=db,
            user=user,
            submitted_otp=verification_data.otp,
        )

    except OTPAttemptsExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )

    except (OTPExpiredError, OTPInvalidError, OTPError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return {
        "message": "Email verified successfully. You can now log in."
    }


@router.post("/resend-otp", status_code=status.HTTP_202_ACCEPTED)
def resend_otp(
    request_data: ResendEmailOTP,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == str(request_data.email))
    )

    if user is None or user.is_email_verified:
        return {
            "message": (
                "If an eligible unverified account exists, "
                "a verification email will be sent."
            )
        }

    try:
        send_verification_otp(db, user)

    except OTPResendCooldownError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )

    except Exception:
        logger.exception("Verification OTP delivery failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification email. Please try again.",
        )

    return {
        "message": (
            "If an eligible unverified account exists, "
            "a verification email will be sent."
        )
    }


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == str(request_data.email))
    )

    # Do not reveal whether an account exists or is eligible.
    if user is not None and user.is_active and user.is_email_verified:
        try:
            send_password_reset_otp(db, user)

        except OTPResendCooldownError:
            # Keep the response identical during the resend cooldown.
            pass

        except Exception:
            logger.exception("Password reset OTP delivery failed.")

    return {
        "message": (
            "If an eligible account exists, a password reset code "
            "will be sent to the registered email address."
        )
    }


@router.post("/reset-password")
def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.email == str(reset_data.email))
    )

    if user is None or not user.is_active or not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset code.",
        )

    try:
        reset_password_with_otp(
            db=db,
            user=user,
            submitted_otp=reset_data.otp,
            new_password=reset_data.new_password,
        )

    except OTPAttemptsExceededError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        )

    except (OTPExpiredError, OTPInvalidError, OTPError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset code.",
        )

    return {
        "message": (
            "Your password has been reset successfully. "
            "You can now log in using your new password."
        )
    }


@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else None

    try:
        authenticated_user = user_service.authenticate_user(
            db=db,
            email=str(user_data.email),
            password=user_data.password,
            ip_address=client_ip,
        )

    except EmailNotVerifiedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in.",
        )

    if authenticated_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(authenticated_user.id)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
