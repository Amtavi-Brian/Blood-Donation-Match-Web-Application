
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy database models."""

    pass


# Import models so SQLAlchemy registers their tables
# in Base.metadata for Alembic autogeneration.
from app.models.user import User
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
