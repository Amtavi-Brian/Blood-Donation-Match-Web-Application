from datetime import datetime, timezone

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.models.donor_profile import BloodGroup


class DonationRecordCreate(BaseModel):
    donor_id: int = Field(gt=0)
    blood_type: BloodGroup
    quantity: int = Field(gt=0, le=10000)
    donated_at: datetime | None = None

    @field_validator("donated_at")
    @classmethod
    def validate_donated_at(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        if value is None:
            return value

        # Treat a timezone-naive datetime as UTC.
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)

        if value > datetime.now(timezone.utc):
            raise ValueError("Donation date cannot be in the future.")

        return value


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