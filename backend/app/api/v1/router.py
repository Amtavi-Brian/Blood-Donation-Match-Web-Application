
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    blood_requests,
    donors,
    hospitals,
    matching,
    reports,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(donors.router)
api_router.include_router(blood_requests.router)
api_router.include_router(hospitals.router)
api_router.include_router(matching.router)
api_router.include_router(reports.router)
