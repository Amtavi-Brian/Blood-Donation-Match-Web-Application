
import logging
from datetime import datetime, timezone
from html import escape

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.reminder import Reminder, ReminderStatus
from app.models.notififcation import Notification
from app.models.audit_log import AuditLog
from app.services.email_service import send_email


logger = logging.getLogger(__name__)


def add_audit_entry(
    db: Session,
    user_id: int | None,
    action: str,
    entity_id: int,
    description: str,
) -> None:
    """Add an audit record to the current transaction."""

    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type="reminder",
            entity_id=entity_id,
            description=description,
        )
    )


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

    try:
        db.add(reminder)
        db.flush()

        add_audit_entry(
            db=db,
            user_id=user_id,
            action="reminder_created",
            entity_id=reminder.reminder_id,
            description=(
                f"User {user_id} created a "
                f"{reminder.reminder_type} reminder."
            ),
        )

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

    try:
        reminder.status = ReminderStatus.CANCELLED

        add_audit_entry(
            db=db,
            user_id=user_id,
            action="reminder_cancelled",
            entity_id=reminder.reminder_id,
            description=(
                f"User {user_id} cancelled reminder "
                f"{reminder.reminder_id}."
            ),
        )

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
    Convert due reminders into internal notifications
    and send corresponding email notifications.
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

    if not due_reminders:
        return 0

    processed_count = 0
    email_jobs = []
    first_reminder_id = due_reminders[0].reminder_id

    try:
        for reminder in due_reminders:

            user = db.query(User).filter(
                User.id == reminder.user_id
            ).first()

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

            if user and user.is_active and user.email:
                email_jobs.append(
                    (
                        user.email,
                        reminder.title,
                        reminder.message,
                    )
                )

            processed_count += 1

        add_audit_entry(
            db=db,
            user_id=None,
            action="reminders_processed",
            entity_id=first_reminder_id,
            description=(
                f"Automated reminder processing completed. "
                f"{processed_count} reminder(s) were processed "
                f"and converted into notifications."
            ),
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    # Send emails only after the database transaction succeeds.
    for recipient, title, message in email_jobs:
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px;">
                    <h2 style="color: #b91c1c;">
                        Blood Donation Match
                    </h2>
                    <h3>{escape(title)}</h3>
                    <p>{escape(message).replace(chr(10), '<br>')}</p>
                    <hr>
                    <p style="font-size: 12px; color: #777;">
                        This is an automated reminder from
                        Blood Donation Match.
                    </p>
                </div>
            </body>
            </html>
            """

            send_email(
                recipient=recipient,
                subject=title,
                html_content=html_content,
                text_content=message,
            )

        except Exception:
            logger.exception(
                "Reminder email could not be sent to %s",
                recipient,
            )

    return processed_count
