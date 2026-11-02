
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.reminder import Reminder, ReminderStatus
from app.models.notififcation import Notification


def create_reminder(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    scheduled_at: datetime,
    reminder_type: str = "donation",
) -> Reminder:
    """Create a reminder for a user."""

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise ValueError("User does not exist or is inactive.")

    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    if scheduled_at <= datetime.now(timezone.utc):
        raise ValueError("Reminder must be scheduled for a future date.")

    reminder = Reminder(
        user_id=user_id,
        title=title.strip(),
        message=message.strip(),
        reminder_type=reminder_type.strip(),
        scheduled_at=scheduled_at,
        status=ReminderStatus.PENDING,
    )

    db.add(reminder)

    try:
        db.commit()
        db.refresh(reminder)
        return reminder
    except Exception:
        db.rollback()
        raise


def get_user_reminders(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
):
    """Retrieve reminders belonging to a specific user."""

    return (
        db.query(Reminder)
        .filter(Reminder.user_id == user_id)
        .order_by(Reminder.scheduled_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_pending_reminders(
    db: Session,
    limit: int = 100,
):
    """Retrieve reminders waiting to be processed."""

    return (
        db.query(Reminder)
        .filter(Reminder.status == ReminderStatus.PENDING)
        .order_by(Reminder.scheduled_at.asc())
        .limit(limit)
        .all()
    )


def cancel_reminder(
    db: Session,
    reminder_id: int,
    user_id: int,
):
    """Cancel a pending reminder belonging to a specific user."""

    reminder = (
        db.query(Reminder)
        .filter(
            Reminder.reminder_id == reminder_id,
            Reminder.user_id == user_id,
        )
        .first()
    )

    if not reminder:
        return None

    if reminder.status != ReminderStatus.PENDING:
        raise ValueError("Only pending reminders can be cancelled.")

    reminder.status = ReminderStatus.CANCELLED

    try:
        db.commit()
        db.refresh(reminder)
        return reminder
    except Exception:
        db.rollback()
        raise


def process_due_reminders(
    db: Session,
    limit: int = 100,
) -> int:
    """
    Convert due reminders into internal notifications.

    The reminder status and notification are committed together
    to avoid marking a reminder as sent without creating its notification.
    """

    now = datetime.now(timezone.utc)

    due_reminders = (
        db.query(Reminder)
        .filter(
            Reminder.status == ReminderStatus.PENDING,
            Reminder.scheduled_at <= now,
        )
        .order_by(Reminder.scheduled_at.asc())
        .limit(limit)
        .all()
    )

    processed_count = 0

    try:
        for reminder in due_reminders:
            notification = Notification(
                user_id=reminder.user_id,
                title=reminder.title,
                message=reminder.message,
                notification_type="reminder",
                is_read=False,
            )

            db.add(notification)

            reminder.status = ReminderStatus.SENT
            reminder.sent_at = now

            processed_count += 1

        db.commit()
        return processed_count

    except Exception:
        db.rollback()
        raise
