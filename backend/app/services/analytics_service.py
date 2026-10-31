from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.blood_request import BloodRequest, BloodRequestStatus
from app.models.blood_stock import BloodStock
from app.models.donation_record import DonationRecord
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital


def _serialize_enum(value):
    if value is None:
        return None
    return value.value if hasattr(value, "value") else str(value)


def get_analytics_summary(db: Session) -> dict:
    """Return a compact operational snapshot for the analytics dashboard."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    total_hospitals = db.scalar(select(func.count(Hospital.id))) or 0
    verified_hospitals = db.scalar(
        select(func.count(Hospital.id)).where(Hospital.is_verified.is_(True))
    ) or 0

    total_stock_units = (
        db.scalar(select(func.coalesce(func.sum(BloodStock.quantity), 0))) or 0
    )
    pending_requests = (
        db.scalar(
            select(func.count(BloodRequest.id)).where(
                BloodRequest.status == BloodRequestStatus.PENDING
            )
        )
        or 0
    )
    fulfilled_requests = (
        db.scalar(
            select(func.count(BloodRequest.id)).where(
                BloodRequest.status == BloodRequestStatus.FULFILLED
            )
        )
        or 0
    )
    active_donors = (
        db.scalar(
            select(func.count(DonorProfile.id)).where(
                DonorProfile.available_to_contact.is_(True),
                DonorProfile.consent_to_contact.is_(True),
            )
        )
        or 0
    )
    donations_last_30_days = (
        db.scalar(
            select(func.count(DonationRecord.donation_id)).where(
                DonationRecord.donated_at >= thirty_days_ago
            )
        )
        or 0
    )

    stock_by_group = db.execute(
        select(BloodStock.blood_type, func.sum(BloodStock.quantity).label("units"))
        .group_by(BloodStock.blood_type)
        .order_by(BloodStock.blood_type)
    ).all()

    demand_by_group = db.execute(
        select(
            BloodRequest.blood_group,
            func.sum(BloodRequest.units_needed).label("units_needed"),
        )
        .where(BloodRequest.status != BloodRequestStatus.CANCELLED)
        .group_by(BloodRequest.blood_group)
        .order_by(BloodRequest.blood_group)
    ).all()

    recent_requests = db.scalars(
        select(BloodRequest).order_by(BloodRequest.created_at.desc()).limit(5)
    ).all()

    summary = {
        "overview": {
            "total_hospitals": total_hospitals,
            "verified_hospitals": verified_hospitals,
            "total_stock_units": int(total_stock_units),
            "active_donors": active_donors,
            "pending_requests": pending_requests,
            "fulfilled_requests": fulfilled_requests,
            "donations_last_30_days": donations_last_30_days,
        },
        "stock_by_blood_type": [
            {"blood_group": _serialize_enum(group), "units": int(units or 0)}
            for group, units in stock_by_group
        ],
        "demand_by_blood_type": [
            {"blood_group": _serialize_enum(group), "units_needed": int(units or 0)}
            for group, units in demand_by_group
        ],
        "recent_requests": [
            {
                "id": request.id,
                "hospital_name": request.hospital.name if request.hospital else "Unknown",
                "blood_group": _serialize_enum(request.blood_group),
                "units_needed": request.units_needed,
                "urgency": _serialize_enum(request.urgency),
                "status": _serialize_enum(request.status),
                "created_at": request.created_at.isoformat(),
            }
            for request in recent_requests
        ],
    }

    return summary


def get_stock_health(db: Session) -> list[dict]:
    """Return each hospital stock item with a red/amber/green risk level."""
    records = db.scalars(
        select(BloodStock).order_by(
            BloodStock.hospital_id,
            BloodStock.blood_type,
            BloodStock.component,
        )
    ).all()

    result: list[dict] = []
    for record in records:
        ratio = 0 if record.threshold == 0 else record.quantity / record.threshold
        if ratio <= 0.3:
            risk = "critical"
        elif ratio <= 0.7:
            risk = "warning"
        else:
            risk = "healthy"

        result.append(
            {
                "hospital_id": record.hospital_id,
                "hospital_name": record.hospital.name if record.hospital else "Unknown hospital",
                "blood_group": _serialize_enum(record.blood_type),
                "component": record.component,
                "quantity": record.quantity,
                "threshold": record.threshold,
                "risk": risk,
            }
        )

    return result
