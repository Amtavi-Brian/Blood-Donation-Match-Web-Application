
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin


def create_user(db: Session, user_data: UserCreate) -> User | None:
    """Register a new donor if the email is not already registered."""

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

    db.add(new_user)

    try:
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
