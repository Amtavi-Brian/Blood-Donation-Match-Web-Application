import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.session import Base


class UserRole(str, enum.Enum):
    DONOR = "Donor"
    PATIENT = "Patient"
    HOSPITAL = "Hospital"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    account_status: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)