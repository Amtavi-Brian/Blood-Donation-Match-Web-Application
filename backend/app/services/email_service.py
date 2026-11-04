
import logging
import smtplib

from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings


logger = logging.getLogger(__name__)


def send_email(
    recipient: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> bool:
    """
    Send an email using Gmail SMTP.

    Returns True when the email is sent successfully.
    Returns False when email delivery is disabled.
    """

    if not settings.EMAILS_ENABLED:
        logger.info("Email delivery is disabled. Email was not sent.")
        return False

    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise ValueError("SMTP username or password is not configured.")

    sender_email = (
        settings.EMAILS_FROM_EMAIL or settings.SMTP_USERNAME
    )

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = formataddr(
        (settings.EMAILS_FROM_NAME, sender_email)
    )
    message["To"] = recipient

    # Plain-text fallback
    message.set_content(
        text_content or "Please view this email in an HTML-compatible email client."
    )

    # HTML email content
    message.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=30,
        ) as server:

            server.ehlo()

            if settings.SMTP_STARTTLS:
                server.starttls()
                server.ehlo()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(message)

        logger.info("Email successfully sent to %s", recipient)
        return True

    except (smtplib.SMTPException, OSError):
        logger.exception("Failed to send email to %s", recipient)
        raise
