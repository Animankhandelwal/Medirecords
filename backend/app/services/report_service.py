import re
from io import BytesIO
from datetime import datetime

from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Flowable,
    KeepTogether,
)

from app.core import llm_orchestrator
from app.models.user import User
from app.models.lab_report import LabReport
from app.services.assistant_service import build_patient_context

REPORT_PROMPT = """You are a specialist medical report generator. Generate a comprehensive pre-consultation report for a patient visiting a {specialist_type}.

Using the patient's medical history provided, create a professional structured report that the patient can bring to their appointment.

The report must include:
1. **Patient Summary** — demographics, known conditions, allergies (if mentioned)
2. **Current Symptoms** — as described by the patient below
3. **Medication History** — current and recent medications relevant to this specialist
4. **Relevant Lab Results & Trends** — highlight values relevant to {specialist_type} with trend analysis
5. **Key Concerns & Red Flags** — any values outside normal range or worsening trends
6. **Suggested Questions for Doctor** — 5-7 intelligent questions the patient should ask

Format as a clean, professional medical report. Use markdown with clear sections.

Current symptoms reported by patient:
{symptoms}

Additional context from patient:
{additional_context}

Patient medical history:
{patient_history}"""


def generate_consultation_report(
    user: User,
    db: Session,
    specialist_type: str,
    symptoms: str,
    additional_context: str = "",
    provider: str = None,
) -> str:
    """Generate a specialist consultation report."""
    patient_history = build_patient_context(user, db)

    prompt = REPORT_PROMPT.format(
        specialist_type=specialist_type,
        symptoms=symptoms,
        additional_context=additional_context,
        patient_history=patient_history,
    )

    return llm_orchestrator.complete(prompt, max_tokens=4000, provider=provider)


def stream_consultation_report(
    user: User,
    db: Session,
    specialist_type: str,
    symptoms: str,
    additional_context: str = "",
    provider: str = None,
):
    """Stream a specialist consultation report."""
    patient_history = build_patient_context(user, db)

    prompt = REPORT_PROMPT.format(
        specialist_type=specialist_type,
        symptoms=symptoms,
        additional_context=additional_context,
        patient_history=patient_history,
    )

    yield from llm_orchestrator.stream_complete(prompt, max_tokens=4000, provider=provider)


# --- PDF rendering -----------------------------------------------------

_INK = colors.HexColor("#0f172a")
_MUTED = colors.HexColor("#64748b")
_RULE = colors.HexColor("#e2e8f0")
_RED = colors.HexColor("#dc2626")
_GREEN = colors.HexColor("#16a34a")
_RED_ZONE = colors.HexColor("#fca5a5")
_GREEN_ZONE = colors.HexColor("#86efac")


class RangeBar(Flowable):
    """Horizontal bar showing a value's position against its reference range."""

    def __init__(self, low: float, high: float, value: float, width: float = 240, height: float = 8):
        super().__init__()
        self.low = low
        self.high = high
        self.value = value
        self.width = width
        self.height = height

    def wrap(self, available_width, available_height):
        return (self.width, self.height + 4)

    def draw(self):
        c = self.canv
        low, high, value = self.low, self.high, self.value
        span = high - low
        pad = span * 0.3 if span > 0 else max(abs(high), 1) * 0.3
        vmin, vmax = low - pad, high + pad
        total = (vmax - vmin) or 1

        def x_for(v):
            return max(0.0, min(self.width, (v - vmin) / total * self.width))

        x_low, x_high = x_for(low), x_for(high)

        c.setFillColor(_RED_ZONE)
        c.rect(0, 0, x_low, self.height, fill=1, stroke=0)
        c.setFillColor(_GREEN_ZONE)
        c.rect(x_low, 0, x_high - x_low, self.height, fill=1, stroke=0)
        c.setFillColor(_RED_ZONE)
        c.rect(x_high, 0, self.width - x_high, self.height, fill=1, stroke=0)

        x_val = x_for(value)
        c.setFillColor(_INK)
        c.circle(x_val, self.height / 2, 3, fill=1, stroke=0)


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("Title", parent=base["Heading1"], fontSize=15, textColor=_INK, spaceAfter=4),
        "h2": ParagraphStyle("H2", parent=base["Heading2"], fontSize=11, textColor=_INK, spaceBefore=12, spaceAfter=5),
        "h3": ParagraphStyle("H3", parent=base["Heading3"], fontName="Helvetica-Bold", fontSize=9.5, textColor=_INK, spaceBefore=8, spaceAfter=3),
        "body": ParagraphStyle("Body", parent=base["BodyText"], fontSize=9.5, leading=14, textColor=colors.HexColor("#334155")),
        "bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontSize=9.5, leading=14, leftIndent=14, bulletIndent=2, textColor=colors.HexColor("#334155")),
        "meta": ParagraphStyle("Meta", parent=base["BodyText"], fontSize=8.5, textColor=_MUTED),
    }


def _md_inline(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", text)
    return text


def _markdown_to_flowables(markdown: str, styles: dict) -> list:
    flowables = []
    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        heading = re.match(r"^(#{1,6})\s*(.*)$", line)
        if heading:
            level = len(heading.group(1))
            text = heading.group(2).strip()
            if not text:
                continue
            flowables.append(Paragraph(_md_inline(text), styles["h3"] if level >= 3 else styles["h2"]))
        elif line.startswith(("- ", "* ")):
            flowables.append(Paragraph(_md_inline(line[2:]), styles["bullet"], bulletText="•"))
        elif re.match(r"^\d+\.\s", line):
            text = re.sub(r"^\d+\.\s", "", line)
            flowables.append(Paragraph(_md_inline(text), styles["bullet"], bulletText="•"))
        else:
            flowables.append(Paragraph(_md_inline(line), styles["body"]))
    return flowables


def _lab_value_block(value, styles) -> KeepTogether:
    name = value.test_name_normalized or value.test_name
    display_value = value.value_text or (str(value.value) if value.value is not None else "—")
    color = "#dc2626" if value.is_abnormal else "#16a34a"
    label = f'<b>{name}</b> &nbsp; <font color="{color}">{display_value} {value.unit or ""}</font>'
    block = [Paragraph(label, styles["body"])]

    if value.reference_range_low is not None and value.reference_range_high is not None and value.value is not None:
        block.append(RangeBar(value.reference_range_low, value.reference_range_high, value.value))
        block.append(
            Paragraph(
                f"Reference: {value.reference_range_low}–{value.reference_range_high} {value.unit or ''}",
                styles["meta"],
            )
        )
    elif value.reference_range_text:
        block.append(Paragraph(f"Reference: {value.reference_range_text}", styles["meta"]))

    return KeepTogether(block)


def _draw_header_footer(canvas, doc, specialist_type: str):
    width, height = A4
    canvas.saveState()

    canvas.setFillColor(_INK)
    canvas.rect(0, height - 18 * mm, width, 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawString(20 * mm, height - 11.5 * mm, "MedRecords")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(width - 20 * mm, height - 11.5 * mm, f"{specialist_type} Consultation Report")

    canvas.setStrokeColor(_RULE)
    canvas.line(20 * mm, 16 * mm, width - 20 * mm, 16 * mm)
    canvas.setFillColor(_MUTED)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(
        20 * mm,
        12 * mm,
        "AI-generated from your uploaded records. Not a substitute for professional medical advice.",
    )
    canvas.drawRightString(width - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def render_report_pdf(
    user: User,
    db: Session,
    specialist_type: str,
    symptoms: str,
    report_markdown: str,
) -> bytes:
    """Render a specialist consultation report as a formatted PDF."""
    styles = _styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=26 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    elements = []

    generated = datetime.utcnow().strftime("%d %b %Y")
    meta_bits = [f"Patient: <b>{user.full_name}</b>", f"Generated: {generated}"]
    if user.gender:
        meta_bits.append(user.gender)
    if user.blood_group and user.blood_group.value != "Unknown":
        meta_bits.append(f"Blood group {user.blood_group.value}")
    elements.append(Paragraph(" &nbsp;&middot;&nbsp; ".join(meta_bits), styles["meta"]))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Reported Symptoms", styles["h2"]))
    elements.append(Paragraph(symptoms.replace("\n", "<br/>"), styles["body"]))

    elements.extend(_markdown_to_flowables(report_markdown, styles))

    lab_reports = (
        db.query(LabReport)
        .filter(LabReport.user_id == user.id)
        .order_by(LabReport.report_date.desc())
        .all()
    )
    latest_by_test = {}
    for report in lab_reports:
        for value in report.lab_values:
            key = value.test_name_normalized or value.test_name
            if key not in latest_by_test:
                latest_by_test[key] = value

    if latest_by_test:
        elements.append(PageBreak())
        elements.append(Paragraph("Lab Results", styles["title"]))
        by_category: dict[str, list] = {}
        for value in latest_by_test.values():
            by_category.setdefault(value.category or "General", []).append(value)
        for category, values in by_category.items():
            elements.append(Paragraph(category, styles["h2"]))
            for value in values:
                elements.append(_lab_value_block(value, styles))
                elements.append(Spacer(1, 6))

    doc.build(
        elements,
        onFirstPage=lambda c, d: _draw_header_footer(c, d, specialist_type),
        onLaterPages=lambda c, d: _draw_header_footer(c, d, specialist_type),
    )
    return buffer.getvalue()
