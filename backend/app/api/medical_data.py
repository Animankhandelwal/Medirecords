from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.user import User
from app.models.prescription import Prescription, Medication
from app.models.lab_report import LabReport, LabValue
from app.api.deps import get_current_user

router = APIRouter(prefix="/medical", tags=["medical-data"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Summary stats for dashboard overview."""
    prescription_count = db.query(Prescription).filter(Prescription.user_id == current_user.id).count()
    medication_count = (
        db.query(Medication)
        .join(Prescription)
        .filter(Prescription.user_id == current_user.id)
        .count()
    )
    lab_report_count = db.query(LabReport).filter(LabReport.user_id == current_user.id).count()
    abnormal_count = (
        db.query(LabValue)
        .join(LabReport)
        .filter(LabReport.user_id == current_user.id, LabValue.is_abnormal == True)
        .count()
    )
    return {
        "prescription_count": prescription_count,
        "medication_count": medication_count,
        "lab_report_count": lab_report_count,
        "abnormal_lab_values": abnormal_count,
    }


@router.get("/lab-trends/{test_name}")
def get_lab_trend(
    test_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get historical values for a specific test (e.g. HbA1c) for charting."""
    values = (
        db.query(LabValue)
        .join(LabReport)
        .filter(
            LabReport.user_id == current_user.id,
            LabValue.test_name_normalized == test_name,
            LabValue.value != None,
        )
        .order_by(LabValue.report_date.asc())
        .all()
    )
    return [
        {
            "date": v.report_date.isoformat() if v.report_date else None,
            "value": v.value,
            "unit": v.unit,
            "is_abnormal": v.is_abnormal,
            "reference_range_text": v.reference_range_text,
        }
        for v in values
    ]


@router.get("/lab-tests")
def get_available_lab_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all unique lab test names the patient has on record."""
    tests = (
        db.query(LabValue.test_name_normalized, LabValue.unit, LabValue.category)
        .join(LabReport)
        .filter(LabReport.user_id == current_user.id, LabValue.test_name_normalized != None)
        .distinct()
        .all()
    )
    return [{"name": t[0], "unit": t[1], "category": t[2]} for t in tests]


@router.get("/prescriptions")
def list_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prescriptions = (
        db.query(Prescription)
        .filter(Prescription.user_id == current_user.id)
        .order_by(Prescription.prescription_date.desc())
        .all()
    )
    result = []
    for rx in prescriptions:
        meds = db.query(Medication).filter(Medication.prescription_id == rx.id).all()
        result.append({
            "id": rx.id,
            "doctor_name": rx.doctor_name,
            "hospital_name": rx.hospital_name,
            "diagnosis": rx.diagnosis,
            "prescription_date": rx.prescription_date.isoformat() if rx.prescription_date else None,
            "notes": rx.notes,
            "medications": [
                {
                    "id": m.id,
                    "name": m.name,
                    "generic_name": m.generic_name,
                    "dosage": m.dosage,
                    "frequency": m.frequency,
                    "duration": m.duration,
                    "route": m.route,
                    "purpose": m.purpose,
                    "instructions": m.instructions,
                    "is_active": m.is_active,
                }
                for m in meds
            ],
        })
    return result


@router.get("/lab-reports")
def list_lab_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reports = (
        db.query(LabReport)
        .filter(LabReport.user_id == current_user.id)
        .order_by(LabReport.report_date.desc())
        .all()
    )
    result = []
    for r in reports:
        values = db.query(LabValue).filter(LabValue.lab_report_id == r.id).all()
        result.append({
            "id": r.id,
            "lab_name": r.lab_name,
            "doctor_name": r.doctor_name,
            "report_date": r.report_date.isoformat() if r.report_date else None,
            "report_type": r.report_type,
            "notes": r.notes,
            "lab_values": [
                {
                    "id": v.id,
                    "test_name": v.test_name,
                    "test_name_normalized": v.test_name_normalized,
                    "value": v.value,
                    "value_text": v.value_text,
                    "unit": v.unit,
                    "reference_range_text": v.reference_range_text,
                    "reference_range_low": v.reference_range_low,
                    "reference_range_high": v.reference_range_high,
                    "is_abnormal": v.is_abnormal,
                    "category": v.category,
                }
                for v in values
            ],
        })
    return result