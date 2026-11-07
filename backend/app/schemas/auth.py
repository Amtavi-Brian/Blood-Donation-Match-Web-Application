
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator
from app.models.donor_profile import BloodGroup


class RegistrationRole(str, Enum):
    DONOR = "donor"


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    role: RegistrationRole = RegistrationRole.DONOR
    blood_group: BloodGroup | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    consent_to_share_location: bool = False

    @model_validator(mode="after")
    def validate_location_consent(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Both latitude and longitude must be provided together.")
        if self.consent_to_share_location and self.latitude is None:
            raise ValueError("Location is required when sharing consent is enabled.")
        if self.blood_group is None and (
            self.latitude is not None or self.consent_to_share_location
        ):
            raise ValueError("Location sharing is only available for donor accounts.")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class VerifyEmailOTP(BaseModel):
    email: EmailStr
    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


class ResendEmailOTP(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )



class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None
    role: str
    is_active: bool
    is_email_verified: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
