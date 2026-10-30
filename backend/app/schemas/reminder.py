
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.reminder import ReminderStatus


class ReminderCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=1, max_length=5000)
    reminder_type: str = Field(default="donation", min_length=3, max_length=50)
    scheduled_at: datetime

    @field_validator("title", "message", "reminder_type")
    @classmethod
    def clean_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("scheduled_at")
    @classmethod
    def validate_scheduled_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)

        if value <= datetime.now(timezone.utc):
            raise ValueError("Reminder must be scheduled for a future date.")

        return value


class ReminderResponse(BaseModel):
    reminder_id: int
    user_id: int
    title: str
    message: str
    reminder_type: str
    scheduled_at: datetime
    status: ReminderStatus
    created_at: datetime
    sent_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
