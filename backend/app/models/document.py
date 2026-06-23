from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base


class DocumentType(str, enum.Enum):
    PRESCRIPTION = "prescription"
    LAB_REPORT = "lab_report"
    DISCHARGE_SUMMARY = "discharge_summary"
    RADIOLOGY = "radiology"
    OTHER = "other"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    document_type = Column(SAEnum(DocumentType), nullable=True)
    raw_text = Column(Text, nullable=True)
    processing_status = Column(SAEnum(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_error = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)
    hospital_name = Column(String, nullable=True)
    document_date = Column(DateTime, nullable=True)
    content_type = Column(String, nullable=True)
    storage_backend = Column(String, nullable=True)  # "s3" | "local"
    storage_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    prescription = relationship("Prescription", back_populates="document", uselist=False)
    lab_report = relationship("LabReport", back_populates="document", uselist=False)