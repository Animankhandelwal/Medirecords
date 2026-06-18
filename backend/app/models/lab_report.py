from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    lab_name = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    report_date = Column(DateTime, nullable=True)
    report_type = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lab_reports")
    document = relationship("Document", back_populates="lab_report")
    lab_values = relationship("LabValue", back_populates="lab_report", cascade="all, delete-orphan")


class LabValue(Base):
    __tablename__ = "lab_values"

    id = Column(Integer, primary_key=True, index=True)
    lab_report_id = Column(Integer, ForeignKey("lab_reports.id"), nullable=False)
    test_name = Column(String, nullable=False)
    test_name_normalized = Column(String, nullable=True, index=True)
    value = Column(Float, nullable=True)
    value_text = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    reference_range_low = Column(Float, nullable=True)
    reference_range_high = Column(Float, nullable=True)
    reference_range_text = Column(String, nullable=True)
    is_abnormal = Column(Boolean, nullable=True)
    category = Column(String, nullable=True)
    report_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lab_report = relationship("LabReport", back_populates="lab_values")
