
import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.email_otp import EmailOTP
from app.models.user import User
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

OTP_EXPIRATION_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


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
    """
    Hash an OTP using HMAC-SHA256 and the application secret key.

    HMAC prevents someone with database access alone from
    cheaply testing all possible six-digit OTP values.
    """
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        otp.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def send_verification_otp(
    db: Session,
    user: User,
) -> None:
    """Generate, store, and email a verification OTP."""

    now = utc_now()

    if user.is_email_verified:
        raise OTPError("This email address is already verified.")

    latest_otp = db.scalar(
        select(EmailOTP)
        .where(EmailOTP.user_id == user.id)
        .order_by(EmailOTP.created_at.desc(), EmailOTP.id.desc())
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
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(
            minutes=OTP_EXPIRATION_MINUTES
        ),
        attempts=0,
    )

    try:
        # Invalidate previous unused OTPs.
        previous_otps = db.scalars(
            select(EmailOTP).where(
                EmailOTP.user_id == user.id,
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

    subject = "Verify your Blood Donation Match account"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Verify your email address</h2>

            <p>Hello {user.full_name},</p>

            <p>
                Use the following one-time password to verify
                your Blood Donation Match account:
            </p>

            <h1 style="letter-spacing: 8px;">{otp}</h1>

            <p>This code expires in 5 minutes.</p>

            <p>
                If you did not request this code, please ignore
                this email.
            </p>

            <p>Blood Donation Match Team</p>
        </body>
    </html>
    """

    text_content = (
        f"Hello {user.full_name},\n\n"
        f"Your email verification code is: {otp}\n\n"
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
            raise OTPError(
                "The verification email could not be sent."
            )

    except Exception:
        # Prevent an unusable OTP from remaining active
        # after email delivery fails.
        try:
            otp_record.consumed_at = utc_now()
            db.commit()
        except Exception:
            db.rollback()

        logger.exception(
            "Failed to send verification OTP to user ID %s",
            user.id,
        )
        raise


def verify_email_otp(
    db: Session,
    user: User,
    submitted_otp: str,
) -> bool:
    """Verify an OTP and mark the user's email as verified."""

    if user.is_email_verified:
        raise OTPError("This email address is already verified.")

    now = utc_now()

    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user.id,
            EmailOTP.consumed_at.is_(None),
        )
        .order_by(
            EmailOTP.created_at.desc(),
            EmailOTP.id.desc(),
        )
        .limit(1)
    )

    if otp_record is None:
        raise OTPInvalidError(
            "No active verification code was found."
        )

    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now >= expires_at:
        otp_record.consumed_at = now
        db.commit()

        raise OTPExpiredError(
            "Your verification code has expired. Request a new one."
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

        raise OTPInvalidError("The verification code is incorrect.")

    try:
        otp_record.consumed_at = now
        user.is_email_verified = True

        db.commit()
        db.refresh(user)

        return True

    except Exception:
        db.rollback()
        raise
