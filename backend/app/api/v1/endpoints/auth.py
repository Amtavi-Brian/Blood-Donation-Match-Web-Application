from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.services import user_service
from app.auth.security import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = user_service.create_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    return new_user

@router.post("/login", response_model=Token)
def login(
    user: UserLogin,
    db: Session = Depends(get_db)

):
    authenticate_user = user_service.authenticate_user(db, user.email, user.password) 

    if authenticate_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "sub": authenticate_user.email
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}