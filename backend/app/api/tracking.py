from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.prescription import Prescription, Medication
from app.models.tracking import MedicationLog, DoctorConsultation
from app.api.deps import get_current_user

router = APIRouter(prefix="/tracking", tags=["tracking"])


# ── Pydantic schemas ────────────────────────────────────────────────────────

class LogDoseIn(BaseModel):
    taken_at: Optional[datetime] = None
    skipped: bool = False
    notes: Optional[str] = None


class ConsultationIn(BaseModel):
    prescription_id: Optional[int] = None
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    scheduled_at: datetime
    location: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: str = "scheduled"


class ConsultationUpdate(BaseModel):
    doctor_name: Optional[str] = None
    specialty: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    location: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────────────────

def _owned_medication(med_id: int, user: User, db: Session) -> Medication:
    med = db.query(Medication).join(Prescription).filter(
        Medication.id == med_id,
        Prescription.user_id == user.id,
    ).first()
    if not med:
        raise HTTPException(404, "Medication not found")
    return med


def _serialize_log(log: MedicationLog) -> dict:
    return {
        "id": log.id,
        "medication_id": log.medication_id,
        "taken_at": log.taken_at.isoformat(),
        "skipped": log.skipped,
        "notes": log.notes,
    }


def _serialize_consultation(c: DoctorConsultation) -> dict:
    return {
        "id": c.id,
        "prescription_id": c.prescription_id,
        "doctor_name": c.doctor_name,
        "specialty": c.specialty,
        "scheduled_at": c.scheduled_at.isoformat(),
        "location": c.location,
        "reason": c.reason,
        "notes": c.notes,
        "status": c.status,
        "created_at": c.created_at.isoformat(),
    }


# ── Dose logging ─────────────────────────────────────────────────────────────

@router.post("/medications/{med_id}/log")
def log_dose(
    med_id: int,
    body: LogDoseIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_medication(med_id, current_user, db)
    log = MedicationLog(
        medication_id=med_id,
        user_id=current_user.id,
        taken_at=body.taken_at or datetime.utcnow(),
        skipped=body.skipped,
        notes=body.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _serialize_log(log)


@router.get("/medications/{med_id}/logs")
def get_dose_logs(
    med_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_medication(med_id, current_user, db)
    since = datetime.utcnow() - timedelta(days=days)
    logs = (
        db.query(MedicationLog)
        .filter(
            MedicationLog.medication_id == med_id,
            MedicationLog.user_id == current_user.id,
            MedicationLog.taken_at >= since,
        )
        .order_by(MedicationLog.taken_at.desc())
        .all()
    )
    return [_serialize_log(l) for l in logs]


@router.delete("/medications/logs/{log_id}")
def delete_dose_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(MedicationLog).filter(
        MedicationLog.id == log_id,
        MedicationLog.user_id == current_user.id,
    ).first()
    if not log:
        raise HTTPException(404, "Log not found")
    db.delete(log)
    db.commit()
    return {"deleted": log_id}


# ── Adherence summary ────────────────────────────────────────────────────────

@router.get("/summary")
def get_tracking_summary(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns per-medication adherence for the last `days` days.
    Adherence = taken / (taken + skipped) when logs exist.
    """
    since = datetime.utcnow() - timedelta(days=days)

    # All active medications for this user
    meds = (
        db.query(Medication)
        .join(Prescription)
        .filter(Prescription.user_id == current_user.id, Medication.is_active == True)
        .all()
    )

    result = []
    for med in meds:
        logs = (
            db.query(MedicationLog)
            .filter(
                MedicationLog.medication_id == med.id,
                MedicationLog.user_id == current_user.id,
                MedicationLog.taken_at >= since,
            )
            .all()
        )
        taken = sum(1 for l in logs if not l.skipped)
        skipped = sum(1 for l in logs if l.skipped)
        total = taken + skipped
        adherence = round(taken / total * 100) if total > 0 else None

        # Check if already logged today (UTC date)
        today_str = date.today().isoformat()
        logged_today = any(l.taken_at.date().isoformat() == today_str for l in logs)

        result.append({
            "medication_id": med.id,
            "medication_name": med.name,
            "dosage": med.dosage,
            "frequency": med.frequency,
            "duration": med.duration,
            "prescription_id": med.prescription_id,
            "taken_last_n_days": taken,
            "skipped_last_n_days": skipped,
            "adherence_pct": adherence,
            "logged_today": logged_today,
        })

    # Upcoming consultations in the window
    upcoming = (
        db.query(DoctorConsultation)
        .filter(
            DoctorConsultation.user_id == current_user.id,
            DoctorConsultation.scheduled_at >= datetime.utcnow(),
            DoctorConsultation.status == "scheduled",
        )
        .order_by(DoctorConsultation.scheduled_at.asc())
        .limit(5)
        .all()
    )

    return {
        "days": days,
        "medications": result,
        "upcoming_consultations": [_serialize_consultation(c) for c in upcoming],
    }


# ── Consultations ────────────────────────────────────────────────────────────

@router.post("/consultations")
def create_consultation(
    body: ConsultationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.prescription_id:
        rx = db.query(Prescription).filter(
            Prescription.id == body.prescription_id,
            Prescription.user_id == current_user.id,
        ).first()
        if not rx:
            raise HTTPException(404, "Prescription not found")

    c = DoctorConsultation(
        user_id=current_user.id,
        prescription_id=body.prescription_id,
        doctor_name=body.doctor_name,
        specialty=body.specialty,
        scheduled_at=body.scheduled_at,
        location=body.location,
        reason=body.reason,
        notes=body.notes,
        status=body.status,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _serialize_consultation(c)


@router.get("/consultations")
def list_consultations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    consultations = (
        db.query(DoctorConsultation)
        .filter(DoctorConsultation.user_id == current_user.id)
        .order_by(DoctorConsultation.scheduled_at.desc())
        .all()
    )
    return [_serialize_consultation(c) for c in consultations]


@router.put("/consultations/{consultation_id}")
def update_consultation(
    consultation_id: int,
    body: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(DoctorConsultation).filter(
        DoctorConsultation.id == consultation_id,
        DoctorConsultation.user_id == current_user.id,
    ).first()
    if not c:
        raise HTTPException(404, "Consultation not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(c, field, value)

    db.commit()
    db.refresh(c)
    return _serialize_consultation(c)


@router.delete("/consultations/{consultation_id}")
def delete_consultation(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    c = db.query(DoctorConsultation).filter(
        DoctorConsultation.id == consultation_id,
        DoctorConsultation.user_id == current_user.id,
    ).first()
    if not c:
        raise HTTPException(404, "Consultation not found")
    db.delete(c)
    db.commit()
    return {"deleted": consultation_id}