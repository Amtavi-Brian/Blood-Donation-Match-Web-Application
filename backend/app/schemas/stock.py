
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.donor_profile import BloodGroup


ALLOWED_COMPONENTS = {
    "whole_blood",
    "red_cells",
    "platelets",
    "plasma",
    "cryoprecipitate",
}


class BloodStockCreate(BaseModel):
    blood_type: BloodGroup
    component: str
    threshold: int = Field(default=5, ge=0, le=100000)

    @field_validator("component")
    @classmethod
    def validate_component(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in ALLOWED_COMPONENTS:
            raise ValueError(
                f"Component must be one of: {', '.join(sorted(ALLOWED_COMPONENTS))}"
            )
        return value


class BloodStockResponse(BaseModel):
    stock_id: int
    hospital_id: int
    blood_type: BloodGroup
    component: str
    quantity: int
    threshold: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockBatchCreate(BaseModel):
    batch_reference: str = Field(min_length=1, max_length=255)
    quantity: int = Field(gt=0, le=100000)
    expiry_date: datetime


class StockBatchResponse(BaseModel):
    batch_id: int
    batch_reference: str
    stock_id: int
    quantity: int
    remaining_quantity: int
    created_at: datetime
    expiry_date: datetime

    model_config = ConfigDict(from_attributes=True)


class StockIssue(BaseModel):
    quantity: int = Field(gt=0, le=100000)
