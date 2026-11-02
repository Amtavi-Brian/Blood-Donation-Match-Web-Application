
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    description: str,
    user_id: int | None = None,
    entity_id: int | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    """
    Record an activity performed within the application.
    """

    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address,
    )

    try:
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    except Exception:
        db.rollback()
        raise


def get_audit_log(db: Session, audit_id: int) -> AuditLog | None:
    return db.get(AuditLog, audit_id)


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
):
    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)

    if action:
        query = query.filter(AuditLog.action == action)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    return (
        query.order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_audit_logs(db: Session) -> int:
    return db.query(AuditLog).count()
