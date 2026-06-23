from typing import Generator
from sqlalchemy.orm import Session
from app.core import llm_orchestrator
from app.core.constants import SPECIALIST_TYPES
from app.models.user import User
from app.models.prescription import Prescription, Medication
from app.models.lab_report import LabReport, LabValue
from app.services.extraction_service import _parse_json


def build_patient_context(user: User, db: Session) -> str:
    """Build a structured medical history string for the LLM context."""
    parts = [f"Patient: {user.full_name}"]
    if user.date_of_birth:
        parts.append(f"DOB: {user.date_of_birth}")
    if user.gender:
        parts.append(f"Gender: {user.gender}")
    if user.blood_group and user.blood_group.value != "Unknown":
        parts.append(f"Blood Group: {user.blood_group.value}")

    # Medications
    prescriptions = (
        db.query(Prescription)
        .filter(Prescription.user_id == user.id)
        .order_by(Prescription.prescription_date.desc())
        .limit(10)
        .all()
    )
    if prescriptions:
        parts.append("\n## Recent Prescriptions")
        for rx in prescriptions:
            date_str = rx.prescription_date.strftime("%Y-%m-%d") if rx.prescription_date else "Unknown date"
            parts.append(f"\n### {date_str} — {rx.doctor_name or 'Unknown doctor'} ({rx.hospital_name or ''})")
            if rx.diagnosis:
                parts.append(f"Diagnosis: {rx.diagnosis}")
            meds = db.query(Medication).filter(Medication.prescription_id == rx.id).all()
            for med in meds:
                line = f"- {med.name}"
                if med.dosage:
                    line += f" {med.dosage}"
                if med.frequency:
                    line += f", {med.frequency}"
                if med.duration:
                    line += f", for {med.duration}"
                if med.purpose:
                    line += f" (for: {med.purpose})"
                parts.append(line)

    # Lab reports
    lab_reports = (
        db.query(LabReport)
        .filter(LabReport.user_id == user.id)
        .order_by(LabReport.report_date.desc())
        .limit(15)
        .all()
    )
    if lab_reports:
        parts.append("\n## Recent Lab Reports")
        for report in lab_reports:
            date_str = report.report_date.strftime("%Y-%m-%d") if report.report_date else "Unknown date"
            parts.append(f"\n### {date_str} — {report.report_type or 'Lab Report'} ({report.lab_name or ''})")
            values = db.query(LabValue).filter(LabValue.lab_report_id == report.id).all()
            for val in values:
                abnormal = " [ABNORMAL]" if val.is_abnormal else ""
                ref = f" (ref: {val.reference_range_text})" if val.reference_range_text else ""
                parts.append(f"- {val.test_name}: {val.value_text or val.value} {val.unit or ''}{ref}{abnormal}")

    return "\n".join(parts)


SYSTEM_PROMPT = """You are a personal medical assistant. You have access to the patient's complete medical history including prescriptions, medications, and lab reports.

Your role is to:
1. Answer questions about their medical history clearly and accurately
2. Explain what medications are for, their dosages, and any important instructions
3. Help them understand their lab results and what trends mean
4. Flag concerning patterns (e.g., worsening HbA1c, declining kidney function)
5. Help them prepare questions for their doctor visits

Important guidelines:
- Always clarify you are an AI assistant, not a doctor
- Do not diagnose or prescribe — refer them to their doctor for medical decisions
- Be empathetic and use plain language
- When discussing lab values, explain what normal range means and if theirs is concerning

Patient medical history is provided below."""


def chat_stream(user: User, db: Session, messages: list[dict], provider: str = None) -> Generator[str, None, None]:
    """Stream assistant response given conversation messages."""
    context = build_patient_context(user, db)
    system = f"{SYSTEM_PROMPT}\n\n{context}"

    yield from llm_orchestrator.chat_stream(messages, system=system, max_tokens=2000, provider=provider)


SPECIALIST_SUGGESTION_PROMPT = f"""You are a medical triage assistant. Based on the conversation between a \
patient and an AI health assistant, plus the patient's medical history, recommend which type of specialist \
the patient should consult.

Choose exactly one specialist_type from this list (use the exact spelling): {", ".join(SPECIALIST_TYPES)}

Respond with ONLY valid JSON (no markdown, no explanation):
{{
  "specialist_type": "one of the listed types, exact match",
  "reasoning": "2-3 sentences explaining the recommendation, referencing specific symptoms or history mentioned",
  "urgency": "routine" | "soon" | "urgent",
  "summary_for_doctor": "a short 1-2 sentence summary of the concern to bring up at the appointment"
}}

If the conversation does not contain enough information to make a confident recommendation, set specialist_type \
to "General Physician" and explain what's missing in the reasoning."""


def suggest_specialist(user: User, db: Session, messages: list[dict], provider: str = None) -> dict:
    """Analyze the chat conversation plus medical history and recommend a specialist to consult."""
    context = build_patient_context(user, db)
    conversation = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}" for m in messages if m.get("content")
    )
    prompt = (
        f"{SPECIALIST_SUGGESTION_PROMPT}\n\n"
        f"## Patient Medical History\n{context}\n\n"
        f"## Conversation\n{conversation}"
    )
    text = llm_orchestrator.complete(prompt, max_tokens=500, provider=provider)
    data = _parse_json(text)
    if data.get("specialist_type") not in SPECIALIST_TYPES:
        data["specialist_type"] = "General Physician"
    return data
