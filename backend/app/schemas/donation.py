
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.donor_profile import BloodGroup


class DonationRecordCreate(BaseModel):
    donor_id: int = Field(gt=0)
    blood_type: BloodGroup
    quantity: int = Field(gt=0, le=10000)
    donated_at: datetime | None = None


class DonationVerificationUpdate(BaseModel):
    verified: bool


class DonationRecordResponse(BaseModel):
    donation_id: int
    donor_id: int
    hospital_id: int
    blood_type: BloodGroup
    quantity: int
    donated_at: datetime
    verified: bool

    model_config = ConfigDict(from_attributes=True)
