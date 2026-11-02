
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.auth import UserCreate, UserLogin


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
    )

    try:
        db.add(new_user)
        db.flush()

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


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """Return the user when the email and password are valid."""

    user = db.scalar(select(User).where(User.email == email))

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user
