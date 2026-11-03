
from pydantic import BaseModel, ConfigDict, Field

from app.models.donor_profile import BloodGroup


class DonorProfileCreate(BaseModel):
    blood_group: BloodGroup
    city: str | None = Field(default=None, max_length=100)
    available_to_contact: bool = True
    consent_to_contact: bool = False
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    consent_to_share_location: bool = False


class DonorProfileUpdate(BaseModel):
    blood_group: BloodGroup | None = None
    city: str | None = Field(default=None, max_length=100)
    available_to_contact: bool | None = None
    consent_to_contact: bool | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    consent_to_share_location: bool | None = None


class DonorProfileResponse(BaseModel):
    id: int
    user_id: int
    blood_group: BloodGroup
    city: str | None
    available_to_contact: bool
    consent_to_contact: bool

    model_config = ConfigDict(from_attributes=True)
