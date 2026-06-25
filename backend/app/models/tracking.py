from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    taken_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    skipped = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    medication = relationship("Medication", back_populates="logs")
    user = relationship("User")


class DoctorConsultation(Base):
    __tablename__ = "doctor_consultations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    doctor_name = Column(String, nullable=True)
    specialty = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="scheduled")  # scheduled | completed | cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    prescription = relationship("Prescription")
