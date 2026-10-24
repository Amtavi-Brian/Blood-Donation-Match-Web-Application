
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegistrationRole(str, Enum):
    DONOR = "donor"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    role: RegistrationRole = RegistrationRole.DONOR


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
