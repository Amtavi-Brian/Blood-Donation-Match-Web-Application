
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.services import audit_service


router = APIRouter(prefix="/audit", tags=["Audit Logs"])


def require_admin(current_user: User) -> None:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )


@router.get("/", response_model=AuditLogListResponse)
def list_audit_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    user_id: int | None = Query(default=None, gt=0),
    action: str | None = Query(default=None, max_length=100),
    entity_type: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    logs = audit_service.get_audit_logs(
        db=db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
    )

    total = audit_service.count_audit_logs(db)

    return {
        "total": total,
        "logs": logs,
    }


@router.get("/count")
def audit_log_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    return {
        "total_audit_logs": audit_service.count_audit_logs(db)
    }


@router.get("/{audit_id}", response_model=AuditLogResponse)
def get_audit_log(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    log = audit_service.get_audit_log(db, audit_id)

    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    return log
