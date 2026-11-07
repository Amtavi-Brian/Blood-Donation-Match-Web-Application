
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.audit_log import AuditLog
from app.models.donor_profile import DonorProfile
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate
from app.schemas.hospital import HospitalStaffAccountCreate

class EmailNotVerifiedError(Exception):
    """Raised when a user attempts to log in before email verification."""


def create_user(db: Session, user_data: UserCreate) -> User | None:
    """Register a donor and record the registration activity."""

    existing_user = db.scalar(
        select(User).where(User.email == str(user_data.email))
    )

    if existing_user is not None:
        return None

    new_user = User(
        full_name=user_data.full_name,
        email=str(user_data.email),
        phone_number=user_data.phone_number,
        hashed_password=hash_password(user_data.password),
        role=UserRole.DONOR,
        is_active=True,
        is_email_verified=False,
    )

    try:
        db.add(new_user)
        db.flush()

        if user_data.blood_group is not None:
            donor_profile = DonorProfile(
                user_id=new_user.id,
                blood_group=user_data.blood_group,
                latitude=(
                    user_data.latitude
                    if user_data.consent_to_share_location
                    else None
                ),
                longitude=(
                    user_data.longitude
                    if user_data.consent_to_share_location
                    else None
                ),
                consent_to_share_location=user_data.consent_to_share_location,
            )
            db.add(donor_profile)
            db.flush()

            db.add(
                AuditLog(
                    user_id=new_user.id,
                    action="donor_profile_created",
                    entity_type="donor_profile",
                    entity_id=donor_profile.id,
                    description=(
                        f"Created donor profile with ID {donor_profile.id}."
                    ),
                )
            )

        audit_log = AuditLog(
            user_id=new_user.id,
            action="user_registered",
            entity_type="user",
            entity_id=new_user.id,
            description="A new donor account was registered.",
        )

        db.add(audit_log)
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()
        raise

    return new_user

def create_hospital_staff_user(
    db: Session,
    user_data: HospitalStaffAccountCreate,
) -> User | None:
    """Create an unverified hospital staff account."""

    existing_user = db.scalar(
        select(User).where(User.email == str(user_data.email))
    )

    if existing_user is not None:
        return None

    new_user = User(
        full_name=user_data.full_name,
        email=str(user_data.email),
        phone_number=user_data.phone_number,
        hashed_password=hash_password(user_data.password),
        role=UserRole.HOSPITAL_STAFF,
        is_active=True,
        is_email_verified=False,
    )

    try:
        db.add(new_user)
        db.flush()

        audit_log = AuditLog(
            user_id=new_user.id,
            action="hospital_staff_account_created",
            entity_type="user",
            entity_id=new_user.id,
            description=(
                "An administrator-created hospital staff account "
                "was registered and awaits email verification."
            ),
        )

        db.add(audit_log)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise

def authenticate_user(
    db: Session,
    email: str,
    password: str,
    ip_address: str | None = None,
) -> User | None:
    """Authenticate a user and record the login attempt."""

    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        action = "login_failed"
        user_id = None
        description = "Login failed: no account matched the submitted credentials."

    elif not user.is_active:
        action = "login_blocked_inactive_account"
        user_id = user.id
        description = "Login was blocked because the account is inactive."

    elif not verify_password(password, user.hashed_password):
        action = "login_failed"
        user_id = user.id
        description = "Login failed: incorrect password."

    elif not user.is_email_verified:
        action = "login_blocked_unverified_email"
        user_id = user.id
        description = "Login was blocked because the email address is not verified."

    else:
        action = "login_successful"
        user_id = user.id
        description = "User successfully logged in."

    try:
        db.add(
            AuditLog(
                user_id=user_id,
                action=action,
                entity_type="authentication",
                entity_id=user_id,
                description=description,
                ip_address=ip_address,
            )
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    if action == "login_blocked_unverified_email":
        raise EmailNotVerifiedError(
            "Please verify your email address before logging in."
        )

    if action != "login_successful":
        return None

    return user


def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
) -> list[User]:
    """Return registered users."""

    statement = (
        select(User)
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Find a user by their ID."""

    return db.get(User, user_id)


def set_user_active_status(
    db: Session,
    target_user_id: int,
    is_active: bool,
    performed_by_user_id: int,
) -> User | None:
    """Activate or deactivate an account and record the action."""

    user = db.get(User, target_user_id)

    if user is None:
        return None

    if user.is_active == is_active:
        return user

    if user.role == UserRole.ADMIN and not is_active:
        active_admins = db.scalar(
            select(func.count(User.id)).where(
                User.role == UserRole.ADMIN,
                User.is_active.is_(True),
            )
        )

        if active_admins <= 1:
            raise ValueError(
                "The last active administrator cannot be deactivated."
            )

    try:
        user.is_active = is_active

        action = (
            "user_account_activated"
            if is_active
            else "user_account_deactivated"
        )

        audit_log = AuditLog(
            user_id=performed_by_user_id,
            action=action,
            entity_type="user",
            entity_id=user.id,
            description=(
                f"Administrator {'activated' if is_active else 'deactivated'} "
                f"the account of user ID {user.id}."
            ),
        )

        db.add(audit_log)
        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise
