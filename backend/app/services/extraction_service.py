import json
import re
from app.core import llm_orchestrator

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _parse_json(text: str) -> dict:
    """Some providers (e.g. Groq's Llama models) wrap JSON in markdown fences
    despite being told not to. Strip fences before parsing so this works
    consistently across providers."""
    return json.loads(_JSON_FENCE_RE.sub("", text.strip()))


CLASSIFY_PROMPT = """You are a medical document classifier. Given the raw OCR text of a medical document,
determine its type and extract key metadata.

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "document_type": "prescription" | "lab_report" | "discharge_summary" | "radiology" | "other",
  "document_date": "YYYY-MM-DD or null",
  "doctor_name": "string or null",
  "hospital_name": "string or null"
}"""

PRESCRIPTION_EXTRACT_PROMPT = """You are a medical data extraction expert. Extract all medications from this prescription.

Respond with ONLY valid JSON (no markdown):
{
  "diagnosis": "string or null",
  "doctor_name": "string or null",
  "hospital_name": "string or null",
  "prescription_date": "YYYY-MM-DD or null",
  "notes": "any general notes or null",
  "medications": [
    {
      "name": "drug brand name",
      "generic_name": "generic/chemical name or null",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. twice daily, BD, OD",
      "duration": "e.g. 7 days, 1 month",
      "route": "oral/topical/injection or null",
      "purpose": "what this medication treats",
      "instructions": "special instructions like after food, etc."
    }
  ]
}"""

LAB_REPORT_EXTRACT_PROMPT = """You are a medical data extraction expert. Extract all lab test values from this report.

Common test name normalizations:
- HbA1c / Glycated Hemoglobin / A1C → "HbA1c"
- Total Cholesterol → "Total Cholesterol"
- LDL / LDL-C / Low Density Lipoprotein → "LDL Cholesterol"
- HDL / HDL-C / High Density Lipoprotein → "HDL Cholesterol"
- Triglycerides / TG → "Triglycerides"
- Fasting Blood Sugar / FBS / FBG → "Fasting Blood Sugar"
- Postprandial Blood Sugar / PPBS / PP Sugar → "Postprandial Blood Sugar"
- Creatinine / Serum Creatinine → "Creatinine"
- eGFR → "eGFR"
- TSH / Thyroid Stimulating Hormone → "TSH"
- T3 → "T3"
- T4 / Thyroxine → "T4"
- Hemoglobin / Hb → "Hemoglobin"

Respond with ONLY valid JSON (no markdown):
{
  "lab_name": "string or null",
  "doctor_name": "referring doctor or null",
  "report_date": "YYYY-MM-DD or null",
  "report_type": "e.g. Lipid Profile, CBC, Thyroid Panel",
  "notes": "any summary/interpretation or null",
  "lab_values": [
    {
      "test_name": "exact name from report",
      "test_name_normalized": "standardized name from list above or best guess",
      "value": numeric value as float or null if text-only,
      "value_text": "raw value string including units if numeric extraction fails",
      "unit": "unit string or null",
      "reference_range_low": numeric low bound or null,
      "reference_range_high": numeric high bound or null,
      "reference_range_text": "raw reference range string",
      "is_abnormal": true/false/null,
      "category": "Lipid Profile" | "Blood Sugar" | "Thyroid" | "CBC" | "Kidney Function" | "Liver Function" | "Other"
    }
  ]
}"""


def classify_document(raw_text: str, provider: str = None) -> dict:
    text = llm_orchestrator.complete(
        f"{CLASSIFY_PROMPT}\n\nDocument text:\n{raw_text[:3000]}",
        max_tokens=300,
        provider=provider,
    )
    return _parse_json(text)


def extract_prescription_data(raw_text: str, provider: str = None) -> dict:
    text = llm_orchestrator.complete(
        f"{PRESCRIPTION_EXTRACT_PROMPT}\n\nPrescription text:\n{raw_text[:4000]}",
        max_tokens=2000,
        provider=provider,
    )
    return _parse_json(text)


def extract_lab_report_data(raw_text: str, provider: str = None) -> dict:
    text = llm_orchestrator.complete(
        f"{LAB_REPORT_EXTRACT_PROMPT}\n\nLab report text:\n{raw_text[:5000]}",
        max_tokens=3000,
        provider=provider,
    )
    return _parse_json(text)
