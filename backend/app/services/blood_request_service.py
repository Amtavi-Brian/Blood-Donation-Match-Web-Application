
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.audit_log import AuditLog
from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
    BloodRequestUrgency,
)
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.notififcation import Notification
from app.models.user import User, UserRole
from app.schemas.blood_request import (
    BloodRequestCreate,
    BloodRequestUpdate,
)
from app.schemas.notification import NotificationCreate
from app.services.matching_service import find_potential_donors
from app.services.notification_service import create_notification
from app.services.sms_service import send_sms

logger = logging.getLogger(__name__)

def add_audit_entry(
    db: Session,
    user_id: int,
    action: str,
    entity_id: int,
    description: str,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            entity_type="blood_request",
            entity_id=entity_id,
            description=description,
        )
    )


def get_authorized_hospital_id(
    db: Session,
    user: User,
) -> int | None:
    """Return an authorized association with a verified hospital."""
    if user.role != UserRole.HOSPITAL_STAFF or not user.is_active:
        return None

    statement = (
        select(HospitalUser.hospital_id)
        .join(Hospital, Hospital.id == HospitalUser.hospital_id)
        .where(
            HospitalUser.user_id == user.id,
            HospitalUser.is_authorized.is_(True),
            Hospital.is_verified.is_(True),
        )
        .order_by(HospitalUser.id)
    )

    return db.scalars(statement).first()

def notify_donors_about_emergency(
    db: Session,
    blood_request: BloodRequest,
    hospital: Hospital,
    performed_by_user_id: int,
) -> int:
    """
    Notify matching donors about an emergency blood request.

    Only active donors who have consented to contact and are
    available to contact are returned by the matching service.
    """

    if blood_request.urgency != BloodRequestUrgency.EMERGENCY:
        return 0

    potential_donors = find_potential_donors(
        db=db,
        blood_request=blood_request,
        performed_by_user_id=performed_by_user_id,
    )

    title = f"Emergency blood request #{blood_request.id}"

    needed_by_text = (
        blood_request.needed_by.strftime("%d %B %Y at %H:%M")
        if blood_request.needed_by
        else "As soon as possible"
    )

    message = (
        f"{hospital.name} in {hospital.city} has issued an emergency "
        f"blood request.\n\n"
        f"Blood group: {blood_request.blood_group.value}\n"
        f"Units needed: {blood_request.units_needed}\n"
        f"Hospital: {hospital.name}\n"
        f"Location: {hospital.city}\n"
        f"Hospital contact: {hospital.contact_phone}\n"
        f"Required by: {needed_by_text}\n\n"
        "If you are willing to help, please contact the hospital "
        "using the phone number above.\n\n"
        "IMPORTANT: This notification identifies a potential match "
        "only. Final donor eligibility and blood compatibility must "
        "be assessed by qualified hospital staff."
    )

    notifications_created = 0

    for donor in potential_donors:
        try:
            profile = db.get(DonorProfile, donor.donor_profile_id)

            if(
                profile is None
                or profile.blood_group != blood_request.blood_group
                or not profile.available_to_contact
                or not profile.consent_to_contact
            ):
                continue

            donor_user = db.get(User, profile.user_id)

            if(
                donor_user is None
                or not donor_user.is_active
                or donor_user.role != UserRole.DONOR
            ):
                continue

            # Prevent duplicate notifications for this request.
            existing_notification = db.scalar(
                select(Notification.notification_id).where(
                    Notification.user_id == donor_user.id,
                    Notification.notification_type
                    == "emergency_blood_request",
                    Notification.title == title,
                ).limit(1)
            )

            if existing_notification:
                continue

                       # Create the in-app notification and send the email.
            create_notification(
                db=db,
                data=NotificationCreate(
                    user_id=donor_user.id,
                    title=title,
                    message=message,
                    notification_type="emergency_blood_request",
                ),
                performed_by_user_id=performed_by_user_id,
            )

            notifications_created += 1

            # Send SMS only when the donor has provided a phone number.
            # Contact consent and availability were checked above.
            if donor_user.phone_number:
                sms_message = (
                    f"URGENT BLOOD REQUEST: {hospital.name}, "
                    f"{hospital.city}, needs {blood_request.units_needed} "
                    f"unit(s) of {blood_request.blood_group.value}. "
                    f"Contact: {hospital.contact_phone}. "
                    "Final eligibility must be confirmed by hospital staff."
                )

                try:
                    send_sms(
                        recipient=donor_user.phone_number,
                        message=sms_message,
                    )

                except Exception:
                    logger.exception(
                        "SMS failed for donor profile %s "
                        "on blood request %s. In-app notification "
                        "and email were already processed.",
                        donor.donor_profile_id,
                        blood_request.id,
                    )
        except Exception:
            logger.exception(
                "Failed to notify donor profile %s about blood request %s.",
                donor.donor_profile_id,
                blood_request.id,
            )

    logger.info(
        "Created %s emergency donor notifications for blood request %s.",
        notifications_created,
        blood_request.id,
    )

    return notifications_created

def create_blood_request(
    db: Session,
    hospital_id: int,
    request_data: BloodRequestCreate,
    performed_by_user_id: int,
) -> BloodRequest:

    hospital = db.get(Hospital, hospital_id)

    if not hospital:
        raise ValueError("Hospital does not exist.")

    if not hospital.is_verified:
        raise ValueError("Hospital is not verified.")

    request = BloodRequest(
        hospital_id=hospital_id,
        **request_data.model_dump(),
    )

    try:
        db.add(request)
        db.flush()

        add_audit_entry(
            db=db,
            user_id=performed_by_user_id,
            action="blood_request_created",
            entity_id=request.id,
            description=(
                f"Created a {request.urgency.value} blood request "
                f"for blood group {request.blood_group.value}."
            ),
        )

        db.commit()
        db.refresh(request)

    except Exception:
        db.rollback()
        raise

    # Notify potential donors only after the request is saved.
    if request.urgency == BloodRequestUrgency.EMERGENCY:
        try:
            notify_donors_about_emergency(
                db=db,
                blood_request=request,
                hospital=hospital,
                performed_by_user_id=performed_by_user_id,
            )

        except Exception:
            # Notification problems must not undo the blood request.
            logger.exception(
                "Blood request %s was created, but donor notification "
                "processing failed.",
                request.id,
            )

    return request

def list_blood_requests(
    db: Session,
    status_filter: BloodRequestStatus | None = None,
    hospital_id: int | None = None,
    include_cancelled: bool = False,
) -> list[BloodRequest]:
    """
    List blood requests belonging to verified hospitals.

    Supports filtering by status and hospital.
    Cancelled requests are excluded by default.
    """

    statement = (
        select(BloodRequest)
        .join(Hospital, Hospital.id == BloodRequest.hospital_id)
        .options(selectinload(BloodRequest.hospital))
        .where(Hospital.is_verified.is_(True))
    )

    if hospital_id is not None:
        statement = statement.where(
            BloodRequest.hospital_id == hospital_id
        )

    if status_filter is not None:
        statement = statement.where(
            BloodRequest.status == status_filter
        )

    if not include_cancelled:
        statement = statement.where(
            BloodRequest.status != BloodRequestStatus.CANCELLED
        )

    statement = statement.order_by(
        BloodRequest.created_at.desc()
    )

    return list(db.scalars(statement).all())

def get_blood_request(
    db: Session,
    request_id: int,
) -> BloodRequest | None:
    statement = (
        select(BloodRequest)
        .options(selectinload(BloodRequest.hospital))
        .where(BloodRequest.id == request_id)
    )

    return db.scalars(statement).first()


def update_blood_request(
    db: Session,
    blood_request: BloodRequest,
    update_data: BloodRequestUpdate,
    performed_by_user_id: int,
) -> BloodRequest:
    changes = update_data.model_dump(exclude_unset=True)

    if not changes:
        raise ValueError("At least one field must be provided.")

    if blood_request.status != BloodRequestStatus.PENDING:
        raise ValueError("Only pending requests can be updated.")

    try:
        for field, value in changes.items():
            setattr(blood_request, field, value)

        add_audit_entry(
            db,
            performed_by_user_id,
            "blood_request_updated",
            blood_request.id,
            "Blood request details were updated.",
        )

        db.commit()
        db.refresh(blood_request)
        return blood_request

    except Exception:
        db.rollback()
        raise


def update_blood_request_status(
    db: Session,
    blood_request: BloodRequest,
    new_status: BloodRequestStatus,
    performed_by_user_id: int,
) -> BloodRequest:
    """Apply an allowed status transition and record it in the audit log."""

    current_status = blood_request.status

    allowed_transitions = {
        BloodRequestStatus.PENDING: {
            BloodRequestStatus.FULFILLED,
            BloodRequestStatus.CANCELLED,
        },
        BloodRequestStatus.FULFILLED: set(),
        BloodRequestStatus.CANCELLED: set(),
    }

    if new_status == current_status:
        return blood_request

    if new_status not in allowed_transitions[current_status]:
        raise ValueError(
            f"Cannot change a request from "
            f"'{current_status.value}' to '{new_status.value}'."
        )

    try:
        blood_request.status = new_status

        action = (
            "blood_request_fulfilled"
            if new_status == BloodRequestStatus.FULFILLED
            else "blood_request_cancelled"
        )

        description = (
            "Blood request was marked as fulfilled."
            if new_status == BloodRequestStatus.FULFILLED
            else "Blood request was cancelled."
        )

        add_audit_entry(
            db,
            performed_by_user_id,
            action,
            blood_request.id,
            description,
        )

        db.commit()
        db.refresh(blood_request)
        return blood_request

    except Exception:
        db.rollback()
        raise
