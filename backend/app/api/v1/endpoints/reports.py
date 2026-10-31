from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services import analytics_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def get_report_summary(db: Session = Depends(get_db)):
    return analytics_service.get_analytics_summary(db)


@router.get("/stock-health")
def get_stock_health(db: Session = Depends(get_db)):
    return analytics_service.get_stock_health(db)
