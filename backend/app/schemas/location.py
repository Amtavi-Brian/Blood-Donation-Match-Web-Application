from pydantic import BaseModel, ConfigDict, Field

from app.models.donor_profile import BloodGroup


class DonorLocationUpdate(BaseModel):
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    consent_to_share_location: bool


class DonorLocationStatus(BaseModel):
    consent_to_share_location: bool
    has_location: bool


class HospitalMapLocation(BaseModel):
    id: int
    name: str
    address: str
    city: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)


class DonorMapLocation(BaseModel):
    blood_group: BloodGroup
    city: str | None
    latitude: float
    longitude: float