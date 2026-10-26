
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HospitalCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    registration_number: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5)
    city: str = Field(min_length=2, max_length=100)
    contact_phone: str = Field(min_length=7, max_length=30)


class HospitalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, min_length=5)
    city: str | None = Field(default=None, min_length=2, max_length=100)
    contact_phone: str | None = Field(default=None, min_length=7, max_length=30)


class HospitalResponse(BaseModel):
    id: int
    name: str
    registration_number: str
    address: str
    city: str
    contact_phone: str
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HospitalStaffCreate(BaseModel):
    hospital_id: int = Field(gt=0)


class HospitalStaffResponse(BaseModel):
    id: int
    user_id: int
    hospital_id: int
    is_authorized: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
