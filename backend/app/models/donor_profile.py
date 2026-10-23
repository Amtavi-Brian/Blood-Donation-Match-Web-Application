import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.user import UserRole
from app.db.session import Base
class BloodType(str, enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"

class DonorProfile(Base):
    __tablename__ = "donor_profiles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    blood_type: Mapped[BloodType] = mapped_column(Enum(BloodType), nullable=True)
    age: Mapped[int] = mapped_column(nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=True)
    city: Mapped[str] = mapped_column(String(255), nullable=True)
    availability_status: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verification_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)