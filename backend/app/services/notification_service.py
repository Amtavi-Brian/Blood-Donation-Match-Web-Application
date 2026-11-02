
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notififcation import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate



def create_notification(
    db: Session,
    data: NotificationCreate,
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
        db.commit()
        db.refresh(notification)
    except Exception:
        db.rollback()
        raise

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

    try:
        for notification in notifications:
            notification.is_read = True
            notification.read_at = current_time

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
