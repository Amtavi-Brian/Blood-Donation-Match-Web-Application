
import hashlib
import hmac
import html
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.audit_log import AuditLog
from app.models.email_otp import EmailOTP
from app.models.user import User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

OTP_EXPIRATION_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5

EMAIL_VERIFICATION = "email_verification"
PASSWORD_RESET = "password_reset"


class OTPError(Exception):
    """Base exception for OTP-related errors."""


class OTPResendCooldownError(OTPError):
    pass


class OTPInvalidError(OTPError):
    pass


class OTPExpiredError(OTPError):
    pass


class OTPAttemptsExceededError(OTPError):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_otp(otp: str) -> str:
    """Hash an OTP using HMAC-SHA256 and the application secret key."""

    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        otp.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _send_otp(
    db: Session,
    user: User,
    purpose: str,
) -> None:
    """Generate, store, and email an OTP for a specific purpose."""

    if purpose not in {EMAIL_VERIFICATION, PASSWORD_RESET}:
        raise ValueError("Unsupported OTP purpose.")

    if purpose == EMAIL_VERIFICATION and user.is_email_verified:
        raise OTPError("This email address is already verified.")

    now = utc_now()

    latest_otp = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user.id,
            EmailOTP.purpose == purpose,
        )
        .order_by(
            EmailOTP.created_at.desc(),
            EmailOTP.id.desc(),
        )
        .limit(1)
    )

    if latest_otp is not None:
        created_at = latest_otp.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        elapsed = (now - created_at).total_seconds()

        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(
                OTP_RESEND_COOLDOWN_SECONDS - elapsed
            ) + 1

            raise OTPResendCooldownError(
                f"Please wait {remaining} seconds before requesting another OTP."
            )

    otp = f"{secrets.randbelow(1_000_000):06d}"

    otp_record = EmailOTP(
        user_id=user.id,
        purpose=purpose,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(minutes=OTP_EXPIRATION_MINUTES),
        attempts=0,
    )

    try:
        previous_otps = db.scalars(
            select(EmailOTP).where(
                EmailOTP.user_id == user.id,
                EmailOTP.purpose == purpose,
                EmailOTP.consumed_at.is_(None),
            )
        ).all()

        for previous in previous_otps:
            previous.consumed_at = now

        db.add(otp_record)
        db.commit()
        db.refresh(otp_record)

    except Exception:
        db.rollback()
        raise

    if purpose == EMAIL_VERIFICATION:
        subject = "Verify your Blood Donation Match account"
        heading = "Verify your email address"
        purpose_text = "verify your Blood Donation Match account"
        text_heading = "Your email verification code is"
    else:
        subject = "Reset your Blood Donation Match password"
        heading = "Password reset request"
        purpose_text = "reset your Blood Donation Match account password"
        text_heading = "Your password reset code is"

    safe_name = html.escape(user.full_name)

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>{heading}</h2>

            <p>Hello {safe_name},</p>

            <p>
                Use the following one-time password to {purpose_text}:
            </p>

            <h1 style="letter-spacing: 8px;">{otp}</h1>

            <p>This code expires in 5 minutes.</p>

            <p>
                If you did not request this code, please ignore this email.
            </p>

            <p>Blood Donation Match Team</p>
        </body>
    </html>
    """

    text_content = (
        f"Hello {user.full_name},\n\n"
        f"{text_heading}: {otp}\n\n"
        "This code expires in 5 minutes.\n"
        "If you did not request this code, ignore this email."
    )

    try:
        email_sent = send_email(
            recipient=user.email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

        if not email_sent:
            raise OTPError("The OTP email could not be sent.")

    except Exception:
        try:
            otp_record.consumed_at = utc_now()
            db.commit()
        except Exception:
            db.rollback()

        logger.exception(
            "Failed to send %s OTP to user ID %s",
            purpose,
            user.id,
        )
        raise


def send_verification_otp(
    db: Session,
    user: User,
) -> None:
    """Send an email-verification OTP."""

    _send_otp(db, user, EMAIL_VERIFICATION)


def send_password_reset_otp(
    db: Session,
    user: User,
) -> None:
    """Send a password-reset OTP."""

    _send_otp(db, user, PASSWORD_RESET)


def _get_valid_otp(
    db: Session,
    user: User,
    submitted_otp: str,
    purpose: str,
) -> EmailOTP:
    """Retrieve and validate an unused OTP without consuming a valid one."""

    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user.id,
            EmailOTP.purpose == purpose,
            EmailOTP.consumed_at.is_(None),
        )
        .order_by(
            EmailOTP.created_at.desc(),
            EmailOTP.id.desc(),
        )
        .limit(1)
    )

    if otp_record is None:
        raise OTPInvalidError("No active OTP was found. Request a new code.")

    now = utc_now()
    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now >= expires_at:
        otp_record.consumed_at = now
        db.commit()

        raise OTPExpiredError(
            "Your OTP has expired. Request a new code."
        )

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        otp_record.consumed_at = now
        db.commit()

        raise OTPAttemptsExceededError(
            "Too many incorrect attempts. Request a new code."
        )

    submitted_hash = hash_otp(submitted_otp)

    if not hmac.compare_digest(
        otp_record.otp_hash,
        submitted_hash,
    ):
        otp_record.attempts += 1

        if otp_record.attempts >= OTP_MAX_ATTEMPTS:
            otp_record.consumed_at = now

        db.commit()

        if otp_record.attempts >= OTP_MAX_ATTEMPTS:
            raise OTPAttemptsExceededError(
                "Too many incorrect attempts. Request a new code."
            )

        raise OTPInvalidError("The OTP is incorrect.")

    return otp_record


def verify_email_otp(
    db: Session,
    user: User,
    submitted_otp: str,
) -> bool:
    """Verify an email-verification OTP and activate email verification."""

    if user.is_email_verified:
        raise OTPError("This email address is already verified.")

    otp_record = _get_valid_otp(
        db,
        user,
        submitted_otp,
        EMAIL_VERIFICATION,
    )

    try:
        otp_record.consumed_at = utc_now()
        user.is_email_verified = True

        db.commit()
        db.refresh(user)

        return True

    except Exception:
        db.rollback()
        raise


def reset_password_with_otp(
    db: Session,
    user: User,
    submitted_otp: str,
    new_password: str,
) -> bool:
    """Validate a password-reset OTP and update the user's password."""

    otp_record = _get_valid_otp(
        db,
        user,
        submitted_otp,
        PASSWORD_RESET,
    )

    try:
        user.hashed_password = hash_password(new_password)
        otp_record.consumed_at = utc_now()

        db.add(
            AuditLog(
                user_id=user.id,
                action="password_reset",
                entity_type="user",
                entity_id=user.id,
                description="User successfully reset their password using email OTP.",
            )
        )

        db.commit()
        db.refresh(user)

        return True

    except Exception:
        db.rollback()
        raise
