from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.donor_profile import BloodGroup
from app.models.blood_request import (
    BloodRequestStatus,
    BloodRequestUrgency,
)


class BloodRequestCreate(BaseModel):
    blood_group: BloodGroup
    units_needed: int = Field(gt=0, le=10000)
    urgency: BloodRequestUrgency = BloodRequestUrgency.ROUTINE
    notes: str | None = Field(default=None, max_length=2000)
    needed_by: datetime | None = None


class BloodRequestUpdate(BaseModel):
    blood_group: BloodGroup | None = None
    units_needed: int | None = Field(default=None, gt=0, le=10000)
    urgency: BloodRequestUrgency | None = None
    status: BloodRequestStatus | None = None
    notes: str | None = Field(default=None, max_length=2000)
    needed_by: datetime | None = None


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