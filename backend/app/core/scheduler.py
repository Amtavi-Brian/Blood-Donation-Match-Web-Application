
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.db.session import SessionLocal
from app.services.remnder_service import process_due_reminders

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone="UTC")


def process_reminder_job():
    """Process due reminders using a separate database session."""

    db = SessionLocal()

    try:
        count = process_due_reminders(db)

        if count:
            logger.info("Processed %s due reminders.", count)

    except Exception:
        logger.exception("Failed to process due reminders.")

    finally:
        db.close()


def start_scheduler():
    """Start the background reminder scheduler."""

    if not scheduler.running:
        scheduler.add_job(
            process_reminder_job,
            trigger="interval",
            minutes=1,
            id="process_due_reminders",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        scheduler.start()
        logger.info("Reminder scheduler started.")


def stop_scheduler():
    """Stop the background scheduler."""

    if scheduler.running:
        scheduler.shutdown(wait=True)
        logger.info("Reminder scheduler stopped.")
