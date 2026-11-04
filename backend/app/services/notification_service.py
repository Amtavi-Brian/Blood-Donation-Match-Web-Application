
import logging
from datetime import datetime, timezone
from html import escape

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notififcation import Notification
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.notification import NotificationCreate
from app.services.email_service import send_email


logger = logging.getLogger(__name__)


def add_audit_entry(
    db: Session,
    user_id: int | None,
    action: str,
    entity_id: int,
    description: str,
) -> None:
    """Add an audit entry to the current database transaction."""
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type="notification",
            entity_id=entity_id,
            description=description,
        )
    )


def create_notification(
    db: Session,
    data: NotificationCreate,
    performed_by_user_id: int | None = None,
) -> Notification:
    user = db.query(User).filter(User.id == data.user_id).first()

    if not user or not user.is_active:
        raise ValueError("User does not exist or is inactive.")

    notification = Notification(
        user_id=data.user_id,
        title=data.title,
        message=data.message,
        notification_type=data.notification_type,
        is_read=False,
    )

    try:
        db.add(notification)
        db.flush()

        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="notification_created",
            entity_id=notification.notification_id,
            description=(
                f"Created a {notification.notification_type} "
                f"notification for user {notification.user_id}."
            ),
        )

        db.commit()
        db.refresh(notification)

    except Exception:
        db.rollback()
        raise

    # Send email only after the database transaction succeeds.
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px;">
                <h2 style="color: #b91c1c;">
                    Blood Donation Match
                </h2>

                <h3>{escape(notification.title)}</h3>

                <p>{escape(notification.message).replace(chr(10), '<br>')}</p>

                <hr>
                <p style="font-size: 12px; color: #777;">
                    This is an automated notification from
                    Blood Donation Match.
                </p>
            </div>
        </body>
        </html>
        """

        send_email(
            recipient=user.email,
            subject=notification.title,
            html_content=html_content,
            text_content=notification.message,
        )

    except Exception:
        # Email failure must not undo the saved notification.
        logger.exception(
            "Notification %s was saved, but its email could not be sent.",
            notification.notification_id,
        )

    return notification


def get_user_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Notification]:
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_notification(
    db: Session,
    notification_id: int,
    user_id: int,
) -> Notification | None:
    statement = select(Notification).where(
        Notification.notification_id == notification_id,
        Notification.user_id == user_id,
    )

    return db.scalar(statement)


def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: int,
) -> Notification | None:
    notification = get_notification(db, notification_id, user_id)

    if notification is None:
        return None

    if not notification.is_read:
        try:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)

            add_audit_entry(
                db=db,
                user_id=user_id,
                action="notification_marked_as_read",
                entity_id=notification.notification_id,
                description=(
                    f"User {user_id} marked notification "
                    f"{notification.notification_id} as read."
                ),
            )

            db.commit()
            db.refresh(notification)

        except Exception:
            db.rollback()
            raise

    return notification


def mark_all_notifications_as_read(
    db: Session,
    user_id: int,
) -> int:
    statement = select(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    )

    notifications = list(db.scalars(statement).all())
    current_time = datetime.now(timezone.utc)

    if not notifications:
        return 0

    try:
        for notification in notifications:
            notification.is_read = True
            notification.read_at = current_time

        add_audit_entry(
            db=db,
            user_id=user_id,
            action="notifications_marked_as_read",
            entity_id=notifications[0].notification_id,
            description=(
                f"User {user_id} marked {len(notifications)} "
                f"notifications as read."
            ),
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return len(notifications)


def get_unread_notification_count(
    db: Session,
    user_id: int,
) -> int:
    statement = select(func.count()).select_from(Notification).where(
        Notification.user_id == user_id,
        Notification.is_read.is_(False),
    )

    return db.scalar(statement) or 0
