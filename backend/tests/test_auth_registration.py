import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.donor_profile import BloodGroup, DonorProfile
from app.schemas.auth import UserCreate
from app.services.user_service import (
    EmailAlreadyInUseError,
    create_user,
    update_user_profile,
)


@pytest.fixture
def registration_db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = Session(engine)

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.mark.parametrize(
    ("consent", "latitude", "longitude"),
    [(False, None, None), (True, -1.28, 36.82)],
)
def test_registration_creates_donor_profile(
    registration_db,
    consent,
    latitude,
    longitude,
):
    registration = UserCreate(
        full_name="Test Donor",
        email="donor@example.com",
        phone_number="0712345678",
        password="password123",
        blood_group=BloodGroup.O_POSITIVE,
        latitude=latitude,
        longitude=longitude,
        consent_to_share_location=consent,
    )

    user = create_user(registration_db, registration)
    profile = registration_db.scalar(
        select(DonorProfile).where(DonorProfile.user_id == user.id)
    )

    assert profile is not None
    assert profile.blood_group == BloodGroup.O_POSITIVE
    assert profile.consent_to_share_location is consent
    assert profile.latitude == latitude
    assert profile.longitude == longitude


def test_update_user_profile_details(registration_db):
    registration = UserCreate(
        full_name="Original Name",
        email="original@example.com",
        phone_number="0700000000",
        password="password123",
        blood_group=BloodGroup.A_POSITIVE,
    )
    user = create_user(registration_db, registration)
    user.is_email_verified = True
    registration_db.commit()

    updated, email_changed = update_user_profile(
        registration_db,
        user,
        {"full_name": "Updated Name", "phone_number": "0799999999"},
    )

    assert not email_changed
    assert updated.full_name == "Updated Name"
    assert updated.phone_number == "0799999999"
    assert updated.is_email_verified is True


def test_update_user_profile_email_resets_verification(registration_db):
    registration = UserCreate(
        full_name="Email Test",
        email="verified@example.com",
        password="password123",
        blood_group=BloodGroup.B_POSITIVE,
    )
    user = create_user(registration_db, registration)
    user.is_email_verified = True
    registration_db.commit()

    updated, email_changed = update_user_profile(
        registration_db,
        user,
        {"email": "newemail@example.com"},
    )

    assert email_changed
    assert updated.email == "newemail@example.com"
    assert updated.is_email_verified is False


def test_update_user_profile_duplicate_email_raises_error(registration_db):
    user1 = create_user(
        registration_db,
        UserCreate(
            full_name="User One",
            email="user1@example.com",
            password="password123",
            blood_group=BloodGroup.O_NEGATIVE,
        ),
    )
    user2 = create_user(
        registration_db,
        UserCreate(
            full_name="User Two",
            email="user2@example.com",
            password="password123",
            blood_group=BloodGroup.O_POSITIVE,
        ),
    )

    with pytest.raises(EmailAlreadyInUseError):
        update_user_profile(
            registration_db,
            user2,
            {"email": "user1@example.com"},
        )
