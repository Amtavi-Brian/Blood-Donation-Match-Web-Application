
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.reminder import (
    ReminderCreate,
    ReminderResponse,
)
from app.services.remnder_service import (
    create_reminder,
    get_user_reminders,
    cancel_reminder,
)

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_user_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_reminder(
            db=db,
            user_id=current_user.id,
            title=reminder_data.title,
            message=reminder_data.message,
            scheduled_at=reminder_data.scheduled_at,
            reminder_type=reminder_data.reminder_type,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.get("/me", response_model=list[ReminderResponse])
def read_my_reminders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_reminders(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.patch("/{reminder_id}/cancel", response_model=ReminderResponse)
def cancel_user_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        reminder = cancel_reminder(
            db=db,
            reminder_id=reminder_id,
            user_id=current_user.id,
        )

        if not reminder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reminder not found.",
            )

        return reminder

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
