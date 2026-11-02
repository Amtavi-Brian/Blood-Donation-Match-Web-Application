
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.hospital_user import HospitalUser
from app.models.audit_log import AuditLog

from app.schemas.analytics import (
    DashboardAnalytics,
    DonationAnalytics,
    BloodRequestAnalytics,
    BloodStockAnalytics,
    DonorAnalytics,
    HospitalAnalytics,
)

from app.services import analytics_service


router = APIRouter(prefix="/reports", tags=["Reports"])


# --------------------------------------------------
# AUDIT LOGGING
# --------------------------------------------------

def record_report_access(
    db: Session,
    current_user: User,
    report_name: str,
    hospital_id: int | None = None,
) -> None:
    """Record successful access to an analytics report."""

    description = (
        f"User {current_user.id} accessed the "
        f"{report_name} report."
    )

    if hospital_id is not None:
        description += f" Hospital ID: {hospital_id}."

    audit_entry = AuditLog(
        user_id=current_user.id,
        action="report_accessed",
        entity_type="analytics_report",
        entity_id=hospital_id,
        description=description,
    )

    try:
        db.add(audit_entry)
        db.commit()
    except Exception:
        db.rollback()
        raise


# --------------------------------------------------
# AUTHORIZATION HELPERS
# --------------------------------------------------

def require_admin(current_user: User) -> None:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )


def require_hospital_access(
    db: Session,
    current_user: User,
    hospital_id: int,
) -> None:

    if current_user.role != UserRole.HOSPITAL_STAFF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospital staff can access hospital reports.",
        )

    hospital = db.get(Hospital, hospital_id)

    if hospital is None or not hospital.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verified hospital not found.",
        )

    association = (
        db.query(HospitalUser)
        .filter(
            HospitalUser.user_id == current_user.id,
            HospitalUser.hospital_id == hospital_id,
            HospitalUser.is_authorized.is_(True),
        )
        .first()
    )

    if association is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this hospital's reports.",
        )


# --------------------------------------------------
# DASHBOARD REPORT
# Administrator only
# --------------------------------------------------

@router.get(
    "/dashboard",
    response_model=DashboardAnalytics,
)
def dashboard_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    result = analytics_service.get_dashboard_analytics(db)

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="dashboard analytics",
    )

    return result


# --------------------------------------------------
# DONATION REPORT
# --------------------------------------------------

@router.get(
    "/donations",
    response_model=DonationAnalytics,
)
def donation_report(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        result = analytics_service.get_donation_analytics(db)
    else:
        require_hospital_access(db, current_user, hospital_id)

        result = analytics_service.get_donation_analytics(
            db,
            hospital_id=hospital_id,
        )

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="donation analytics",
        hospital_id=(
            hospital_id
            if current_user.role == UserRole.HOSPITAL_STAFF
            else None
        ),
    )

    return result


# --------------------------------------------------
# BLOOD REQUEST REPORT
# --------------------------------------------------

@router.get(
    "/blood-requests",
    response_model=BloodRequestAnalytics,
)
def blood_request_report(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        result = analytics_service.get_blood_request_analytics(db)
    else:
        require_hospital_access(db, current_user, hospital_id)

        result = analytics_service.get_blood_request_analytics(
            db,
            hospital_id=hospital_id,
        )

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="blood request analytics",
        hospital_id=(
            hospital_id
            if current_user.role == UserRole.HOSPITAL_STAFF
            else None
        ),
    )

    return result


# --------------------------------------------------
# BLOOD STOCK REPORT
# --------------------------------------------------

@router.get(
    "/blood-stock",
    response_model=BloodStockAnalytics,
)
def blood_stock_report(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.ADMIN:
        result = analytics_service.get_blood_stock_analytics(db)
    else:
        require_hospital_access(db, current_user, hospital_id)

        result = analytics_service.get_blood_stock_analytics(
            db,
            hospital_id=hospital_id,
        )

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="blood stock analytics",
        hospital_id=(
            hospital_id
            if current_user.role == UserRole.HOSPITAL_STAFF
            else None
        ),
    )

    return result


# --------------------------------------------------
# DONOR REPORT
# Administrator only
# --------------------------------------------------

@router.get(
    "/donors",
    response_model=DonorAnalytics,
)
def donor_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    result = analytics_service.get_donor_analytics(db)

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="donor analytics",
    )

    return result


# --------------------------------------------------
# HOSPITAL REPORT
# Administrator only
# --------------------------------------------------

@router.get(
    "/hospitals",
    response_model=HospitalAnalytics,
)
def hospital_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    result = analytics_service.get_hospital_analytics(db)

    record_report_access(
        db=db,
        current_user=current_user,
        report_name="hospital analytics",
    )

    return result
