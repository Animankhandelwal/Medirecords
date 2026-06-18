from sqlalchemy import Column, Integer, String, DateTime, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base


class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"
    UNKNOWN = "Unknown"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(SAEnum(BloodGroup), nullable=True, default=BloodGroup.UNKNOWN)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    lab_reports = relationship("LabReport", back_populates="user", cascade="all, delete-orphan")
