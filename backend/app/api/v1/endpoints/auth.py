
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import create_access_token
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    new_user = user_service.create_user(db, user_data)

    if new_user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return new_user


@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else None

    authenticated_user = user_service.authenticate_user(
        db=db,
        email=str(user_data.email),
        password=user_data.password,
        ip_address=client_ip,
    )

    if authenticated_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(authenticated_user.id)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
