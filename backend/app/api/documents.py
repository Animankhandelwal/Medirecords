import asyncio
import io
import os
import zipfile
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentType, ProcessingStatus
from app.models.prescription import Prescription, Medication
from app.models.lab_report import LabReport, LabValue
from app.api.deps import get_current_user
from app.services import ocr_service, extraction_service, storage_service

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and image files are supported")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 20MB")

    storage_key, file_url, backend = storage_service.upload_file(file_bytes, file.filename, file.content_type)

    doc = Document(
        user_id=current_user.id,
        file_name=file.filename,
        file_url=file_url,
        content_type=file.content_type,
        storage_key=storage_key,
        storage_backend=backend,
        processing_status=ProcessingStatus.PENDING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    background_tasks.add_task(_process_document, doc.id, file_bytes, file.content_type)

    return {"id": doc.id, "status": "processing", "file_name": file.filename}


def _filtered_documents_query(
    db: Session,
    user_id: int,
    year: Optional[int],
    month: Optional[int],
    day: Optional[int],
):
    """Filter documents by year/month/day, falling back to upload date when a
    document's date couldn't be extracted from its contents."""
    effective_date = func.coalesce(Document.document_date, Document.created_at)
    query = db.query(Document).filter(Document.user_id == user_id)
    if year is not None:
        query = query.filter(extract("year", effective_date) == year)
    if month is not None:
        query = query.filter(extract("month", effective_date) == month)
    if day is not None:
        query = query.filter(extract("day", effective_date) == day)
    return query


@router.get("/")
def list_documents(
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        _filtered_documents_query(db, current_user.id, year, month, day)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [_doc_dict(d) for d in docs]


@router.get("/export/zip")
def export_documents_zip(
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bundle every document matching the given year/month/day into a zip."""
    docs = (
        _filtered_documents_query(db, current_user.id, year, month, day)
        .filter(Document.storage_key.isnot(None))
        .order_by(Document.created_at.desc())
        .all()
    )
    if not docs:
        raise HTTPException(status_code=404, detail="No downloadable documents match that date")

    buffer = io.BytesIO()
    used_names = set()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for doc in docs:
            try:
                file_bytes = storage_service.download_file(doc.storage_key, doc.storage_backend or "local")
            except Exception:
                continue
            name = doc.file_name
            if name in used_names:
                base, ext = os.path.splitext(name)
                name = f"{base}-{doc.id}{ext}"
            used_names.add(name)
            zf.writestr(name, file_bytes)
    buffer.seek(0)

    label = "-".join(str(p) for p in (year, month, day) if p is not None) or "all"
    return Response(
        content=buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="documents-{label}.zip"'},
    )


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.storage_key:
        raise HTTPException(status_code=404, detail="Original file is not available for this document")

    file_bytes = storage_service.download_file(doc.storage_key, doc.storage_backend or "local")
    return Response(
        content=file_bytes,
        media_type=doc.content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
    )


@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_dict(doc)


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Deleted"}


def _process_document(doc_id: int, file_bytes: bytes, content_type: str):
    """Background task: OCR → classify → extract → store."""
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return

        doc.processing_status = ProcessingStatus.PROCESSING
        db.commit()

        # OCR
        if "pdf" in content_type:
            raw_text = ocr_service.extract_text_from_pdf_bytes(file_bytes)
        else:
            raw_text = ocr_service.extract_text_from_image_bytes(file_bytes)

        doc.raw_text = raw_text

        # Classify
        meta = extraction_service.classify_document(raw_text)
        doc.document_type = meta.get("document_type", "other")
        doc.doctor_name = meta.get("doctor_name")
        doc.hospital_name = meta.get("hospital_name")
        if meta.get("document_date"):
            try:
                doc.document_date = datetime.strptime(meta["document_date"], "%Y-%m-%d")
            except ValueError:
                pass

        # Extract structured data
        if doc.document_type == DocumentType.PRESCRIPTION:
            data = extraction_service.extract_prescription_data(raw_text)
            rx = Prescription(
                user_id=doc.user_id,
                document_id=doc.id,
                doctor_name=data.get("doctor_name") or doc.doctor_name,
                hospital_name=data.get("hospital_name") or doc.hospital_name,
                diagnosis=data.get("diagnosis"),
                notes=data.get("notes"),
            )
            if data.get("prescription_date"):
                try:
                    rx.prescription_date = datetime.strptime(data["prescription_date"], "%Y-%m-%d")
                except ValueError:
                    pass
            db.add(rx)
            db.flush()
            for med in data.get("medications", []):
                db.add(Medication(
                    prescription_id=rx.id,
                    name=med.get("name", "Unknown"),
                    generic_name=med.get("generic_name"),
                    dosage=med.get("dosage"),
                    frequency=med.get("frequency"),
                    duration=med.get("duration"),
                    route=med.get("route"),
                    purpose=med.get("purpose"),
                    instructions=med.get("instructions"),
                ))

        elif doc.document_type == DocumentType.LAB_REPORT:
            data = extraction_service.extract_lab_report_data(raw_text)
            report = LabReport(
                user_id=doc.user_id,
                document_id=doc.id,
                lab_name=data.get("lab_name"),
                doctor_name=data.get("doctor_name") or doc.doctor_name,
                report_type=data.get("report_type"),
                notes=data.get("notes"),
            )
            if data.get("report_date"):
                try:
                    report.report_date = datetime.strptime(data["report_date"], "%Y-%m-%d")
                except ValueError:
                    pass
            db.add(report)
            db.flush()
            for val in data.get("lab_values", []):
                db.add(LabValue(
                    lab_report_id=report.id,
                    test_name=val.get("test_name", "Unknown"),
                    test_name_normalized=val.get("test_name_normalized"),
                    value=val.get("value"),
                    value_text=val.get("value_text"),
                    unit=val.get("unit"),
                    reference_range_low=val.get("reference_range_low"),
                    reference_range_high=val.get("reference_range_high"),
                    reference_range_text=val.get("reference_range_text"),
                    is_abnormal=val.get("is_abnormal"),
                    category=val.get("category"),
                    report_date=report.report_date,
                ))

        doc.processing_status = ProcessingStatus.COMPLETED
        db.commit()

    except Exception as e:
        db.rollback()
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.processing_status = ProcessingStatus.FAILED
            doc.processing_error = str(e)
            db.commit()
    finally:
        db.close()


def _doc_dict(doc: Document) -> dict:
    return {
        "id": doc.id,
        "file_name": doc.file_name,
        "file_url": doc.file_url,
        "document_type": doc.document_type,
        "processing_status": doc.processing_status,
        "processing_error": doc.processing_error,
        "doctor_name": doc.doctor_name,
        "hospital_name": doc.hospital_name,
        "document_date": doc.document_date.isoformat() if doc.document_date else None,
        "created_at": doc.created_at.isoformat(),
        "content_type": doc.content_type,
        "downloadable": doc.storage_key is not None,
    }