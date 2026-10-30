
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    audit_id: int
    user_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    description: str
    ip_address: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    total: int
    logs: list[AuditLogResponse]


class AuditLogFilter(BaseModel):
    user_id: int | None = Field(default=None, gt=0)
    action: str | None = Field(default=None, max_length=100)
    entity_type: str | None = Field(default=None, max_length=100)
