import logging
import re

import africastalking

from app.core.config import settings


logger = logging.getLogger(__name__)


def normalize_phone_number(phone_number: str) -> str:
    """
    Normalize Kenyan mobile numbers and validate international numbers.

    Examples:
        0712345678    -> +254712345678
        0112345678    -> +254112345678
        254712345678  -> +254712345678
        +254712345678 -> +254712345678
    """
    phone_number = phone_number.strip().replace(" ", "").replace("-", "")

    if re.fullmatch(r"0[17]\d{8}", phone_number):
        phone_number = "+254" + phone_number[1:]

    elif re.fullmatch(r"254[17]\d{8}", phone_number):
        phone_number = "+" + phone_number

    if not re.fullmatch(r"\+[1-9]\d{7,14}", phone_number):
        raise ValueError(
            "Invalid phone number. Use a Kenyan mobile number "
            "such as 0712345678 or international format +254712345678."
        )

    return phone_number

def send_sms(
    recipient: str,
    message: str,
) -> bool:
    """
    Send an SMS using Africa's Talking.

    Returns False when SMS is disabled.
    Raises an exception when configuration or delivery fails.
    """

    if not settings.SMS_ENABLED:
        logger.info("SMS delivery is disabled.")
        return False

    if not settings.AT_API_KEY:
        raise ValueError(
            "Africa's Talking API key is not configured."
        )

    if not settings.AT_USERNAME:
        raise ValueError(
            "Africa's Talking username is not configured."
        )

    if not message or not message.strip():
        raise ValueError("SMS message cannot be empty.")

    phone_number = normalize_phone_number(recipient)

    try:
        africastalking.initialize(
            settings.AT_USERNAME,
            settings.AT_API_KEY,
        )

        sms = africastalking.SMS

        send_options = {}

        if settings.AT_SENDER_ID:
            send_options["sender_id"] = settings.AT_SENDER_ID

        response = sms.send(
            message.strip(),
            [phone_number],
            **send_options,
        )

        logger.info(
            "Africa's Talking accepted an SMS request for %s.",
            phone_number[-4:],
        )

        logger.debug("Africa's Talking response: %s", response)

        return True

    except Exception:
        logger.exception(
            "Failed to send SMS to a number ending in %s.",
            phone_number[-4:],
        )
        raise
