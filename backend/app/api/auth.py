from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import date
from app.db.database import get_db
from app.models.user import User, BloodGroup
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    date_of_birth: date | None = None
    gender: str | None = None
    blood_group: BloodGroup | None = None
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        blood_group=data.blood_group,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
        "gender": user.gender,
        "blood_group": user.blood_group,
        "phone": user.phone,
    }