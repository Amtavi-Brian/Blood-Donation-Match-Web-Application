from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.donation_record import DonationRecord
from app.models.blood_request import (
    BloodRequest,
    BloodRequestStatus,
    BloodRequestUrgency,
)
from app.models.blood_stock import BloodStock


# --------------------------------------------------
# Helper functions
# --------------------------------------------------

def count_records(db: Session, model, *conditions) -> int:
    statement = select(func.count()).select_from(model)

    if conditions:
        statement = statement.where(*conditions)

    return db.scalar(statement) or 0


def sum_column(db: Session, model, column, *conditions) -> int:
    statement = select(
        func.coalesce(func.sum(column), 0)
    ).select_from(model)

    if conditions:
        statement = statement.where(*conditions)

    return db.scalar(statement) or 0


# --------------------------------------------------
# Dashboard analytics
# System-wide statistics (administrator access)
# --------------------------------------------------

def get_dashboard_analytics(db: Session) -> dict:
    return {
        "total_users": count_records(db, User),

        "total_donors": count_records(db, DonorProfile),

        "active_donors": count_records(
            db,
            DonorProfile,
            User.is_active.is_(True),
        ) if False else db.scalar(
            select(func.count())
            .select_from(DonorProfile)
            .join(User, DonorProfile.user_id == User.id)
            .where(
                User.is_active.is_(True),
                User.role == UserRole.DONOR,
            )
        ) or 0,

        "total_hospitals": count_records(db, Hospital),

        "verified_hospitals": count_records(
            db, Hospital, Hospital.is_verified.is_(True)
        ),

        "total_donations": count_records(db, DonationRecord),

        "verified_donations": count_records(
            db, DonationRecord, DonationRecord.verified.is_(True)
        ),

        "pending_requests": count_records(
            db,
            BloodRequest,
            BloodRequest.status == BloodRequestStatus.PENDING,
        ),

        "fulfilled_requests": count_records(
            db,
            BloodRequest,
            BloodRequest.status == BloodRequestStatus.FULFILLED,
        ),

        "cancelled_requests": count_records(
            db,
            BloodRequest,
            BloodRequest.status == BloodRequestStatus.CANCELLED,
        ),

        "total_blood_stock_quantity": sum_column(
            db, BloodStock, BloodStock.quantity
        ),

        "low_stock_items": count_records(
            db,
            BloodStock,
            BloodStock.quantity <= BloodStock.threshold,
        ),
    }


# --------------------------------------------------
# Donation analytics
# Can be filtered by hospital
# --------------------------------------------------

def get_donation_analytics(
    db: Session,
    hospital_id: int | None = None,
) -> dict:

    conditions = []

    if hospital_id is not None:
        conditions.append(
            DonationRecord.hospital_id == hospital_id
        )

    verified_conditions = conditions + [
        DonationRecord.verified.is_(True)
    ]

    total = count_records(db, DonationRecord, *conditions)
    verified = count_records(
        db, DonationRecord, *verified_conditions
    )

    return {
        "total_donations": total,
        "verified_donations": verified,
        "unverified_donations": total - verified,
        "verified_quantity": sum_column(
            db,
            DonationRecord,
            DonationRecord.quantity,
            *verified_conditions,
        ),
    }


# --------------------------------------------------
# Blood request analytics
# Can be filtered by hospital
# --------------------------------------------------

def get_blood_request_analytics(
    db: Session,
    hospital_id: int | None = None,
) -> dict:

    conditions = []

    if hospital_id is not None:
        conditions.append(
            BloodRequest.hospital_id == hospital_id
        )

    return {
        "total_requests": count_records(
            db, BloodRequest, *conditions
        ),

        "pending_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.status == BloodRequestStatus.PENDING,
        ),

        "fulfilled_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.status == BloodRequestStatus.FULFILLED,
        ),

        "cancelled_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.status == BloodRequestStatus.CANCELLED,
        ),

        "routine_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.urgency == BloodRequestUrgency.ROUTINE,
        ),

        "urgent_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.urgency == BloodRequestUrgency.URGENT,
        ),

        "emergency_requests": count_records(
            db,
            BloodRequest,
            *conditions,
            BloodRequest.urgency == BloodRequestUrgency.EMERGENCY,
        ),
    }


# --------------------------------------------------
# Blood stock analytics
# Can be filtered by hospital
# --------------------------------------------------

def get_blood_stock_analytics(
    db: Session,
    hospital_id: int | None = None,
) -> dict:

    conditions = []

    if hospital_id is not None:
        conditions.append(
            BloodStock.hospital_id == hospital_id
        )

    total_items = count_records(
        db, BloodStock, *conditions
    )

    total_quantity = sum_column(
        db, BloodStock, BloodStock.quantity, *conditions
    )

    low_stock_items = count_records(
        db,
        BloodStock,
        *conditions,
        BloodStock.quantity <= BloodStock.threshold,
    )

    statement = (
        select(
            BloodStock.blood_type,
            func.coalesce(func.sum(BloodStock.quantity), 0),
            func.sum(
                case(
                    (
                        BloodStock.quantity <= BloodStock.threshold,
                        1,
                    ),
                    else_=0,
                )
            ),
        )
        .group_by(BloodStock.blood_type)
        .order_by(BloodStock.blood_type)
    )

    if conditions:
        statement = statement.where(*conditions)

    results = db.execute(statement).all()

    blood_groups = [
        {
            "blood_group": blood_type.value,
            "total_quantity": int(quantity or 0),
            "low_stock_items": int(low_stock or 0),
        }
        for blood_type, quantity, low_stock in results
    ]

    return {
        "total_stock_items": total_items,
        "total_quantity": total_quantity,
        "low_stock_items": low_stock_items,
        "blood_groups": blood_groups,
    }


# --------------------------------------------------
# Donor analytics
# System-wide statistics (administrator access)
# --------------------------------------------------

def get_donor_analytics(db: Session) -> dict:

    donor_query = (
        select(func.count())
        .select_from(DonorProfile)
        .join(User, DonorProfile.user_id == User.id)
        .where(User.role == UserRole.DONOR)
    )

    active_query = donor_query.where(
        User.is_active.is_(True)
    )

    available_query = active_query.where(
        DonorProfile.available_to_contact.is_(True)
    )

    consented_query = active_query.where(
        DonorProfile.consent_to_contact.is_(True)
    )

    return {
        "total_donors": db.scalar(donor_query) or 0,
        "active_donors": db.scalar(active_query) or 0,
        "available_donors": db.scalar(available_query) or 0,
        "consented_donors": db.scalar(consented_query) or 0,
    }


# --------------------------------------------------
# Hospital analytics
# System-wide statistics (administrator access)
# --------------------------------------------------

def get_hospital_analytics(db: Session) -> dict:

    staff_query = (
        select(func.count(func.distinct(User.id)))
        .select_from(User)
        .join(
            HospitalUser,
            HospitalUser.user_id == User.id,
        )
        .where(
            User.role == UserRole.HOSPITAL_STAFF,
            User.is_active.is_(True),
        )
    )

    authorized_staff_query = staff_query.where(
        HospitalUser.is_authorized.is_(True)
    )

    return {
        "total_hospitals": count_records(db, Hospital),

        "verified_hospitals": count_records(
            db, Hospital, Hospital.is_verified.is_(True)
        ),

        "unverified_hospitals": count_records(
            db, Hospital, Hospital.is_verified.is_(False)
        ),

        "total_hospital_staff": db.scalar(staff_query) or 0,

        "authorized_hospital_staff": (
            db.scalar(authorized_staff_query) or 0
        ),
    }