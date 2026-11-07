import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.donor_profile import BloodGroup, DonorProfile
from app.schemas.auth import UserCreate
from app.services.user_service import create_user


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
