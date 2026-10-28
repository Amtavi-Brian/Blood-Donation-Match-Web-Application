
from pydantic import BaseModel, ConfigDict

from app.models.donor_profile import BloodGroup


class PotentialDonorResponse(BaseModel):
    donor_profile_id: int
    full_name: str
    phone_number: str | None = None
    blood_group: BloodGroup
    city: str | None = None

    model_config = ConfigDict(from_attributes=True)
