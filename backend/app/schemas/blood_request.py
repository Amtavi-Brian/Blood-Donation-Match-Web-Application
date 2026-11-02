
from datetime import datetime, timezone

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from app.models.donor_profile import BloodGroup
from app.models.blood_request import (
    BloodRequestStatus,
    BloodRequestUrgency,
)


def validate_needed_by(value: datetime | None) -> datetime | None:
    """Reject required-by dates that are already in the past."""
    if value is None:
        return None

    now = datetime.now(timezone.utc)

    # Handle naive datetimes consistently as UTC.
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    if value <= now:
        raise ValueError("needed_by must be a future date and time.")

    return value


class BloodRequestCreate(BaseModel):
    blood_group: BloodGroup
    units_needed: int = Field(gt=0, le=10000)
    urgency: BloodRequestUrgency = BloodRequestUrgency.ROUTINE
    notes: str | None = Field(default=None, max_length=2000)
    needed_by: datetime | None = None

    @field_validator("needed_by")
    @classmethod
    def check_needed_by(cls, value: datetime | None):
        return validate_needed_by(value)


class BloodRequestUpdate(BaseModel):
    blood_group: BloodGroup | None = None
    units_needed: int | None = Field(default=None, gt=0, le=10000)
    urgency: BloodRequestUrgency | None = None
    notes: str | None = Field(default=None, max_length=2000)
    needed_by: datetime | None = None

    @field_validator("needed_by")
    @classmethod
    def check_needed_by(cls, value: datetime | None):
        return validate_needed_by(value)


class BloodRequestStatusUpdate(BaseModel):
    status: BloodRequestStatus


class BloodRequestResponse(BaseModel):
    id: int
    hospital_id: int
    blood_group: BloodGroup
    units_needed: int
    urgency: BloodRequestUrgency
    status: BloodRequestStatus
    notes: str | None
    needed_by: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
