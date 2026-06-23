from fastapi import APIRouter, Depends
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.report_service import (
    generate_consultation_report,
    render_report_pdf,
    stream_consultation_report,
)
from app.core.constants import SPECIALIST_TYPES

router = APIRouter(prefix="/report", tags=["report-generator"])


class ReportRequest(BaseModel):
    specialist_type: str
    symptoms: str
    additional_context: str = ""


@router.get("/specialists")
def list_specialists():
    return SPECIALIST_TYPES


@router.post("/generate")
def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def stream():
        for chunk in stream_consultation_report(
            user=current_user,
            db=db,
            specialist_type=request.specialist_type,
            symptoms=request.symptoms,
            additional_context=request.additional_context,
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/plain")


@router.post("/generate-pdf")
def generate_report_pdf(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    markdown = generate_consultation_report(
        user=current_user,
        db=db,
        specialist_type=request.specialist_type,
        symptoms=request.symptoms,
        additional_context=request.additional_context,
    )
    pdf_bytes = render_report_pdf(
        user=current_user,
        db=db,
        specialist_type=request.specialist_type,
        symptoms=request.symptoms,
        report_markdown=markdown,
    )
    filename = f"medrecords-report-{request.specialist_type.lower().replace(' ', '-')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )