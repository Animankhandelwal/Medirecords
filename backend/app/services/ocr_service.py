import io
import os
import boto3
from typing import Optional
from pathlib import Path
import tempfile


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Parse PDF text via LlamaIndex's PDFReader, fallback to image OCR for scanned PDFs."""
    from llama_index.readers.file import PDFReader

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)

    try:
        documents = PDFReader().load_data(file=tmp_path)
        extracted = "\n\n".join(doc.text for doc in documents if doc.text).strip()
    finally:
        tmp_path.unlink(missing_ok=True)

    if len(extracted) < 100:
        extracted = _ocr_pdf_via_images(file_bytes)

    return extracted


def _ocr_pdf_via_images(file_bytes: bytes) -> str:
    """Convert PDF pages to images and run OCR."""
    from pdf2image import convert_from_bytes
    images = convert_from_bytes(file_bytes, dpi=200)

    results = []
    for img in images:
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        results.append(_google_vision_ocr(img_bytes.getvalue()))

    return "\n\n--- Page Break ---\n\n".join(results)


def extract_text_from_image_bytes(file_bytes: bytes) -> str:
    """OCR an image using Google Vision API."""
    return _google_vision_ocr(file_bytes)


def _google_vision_ocr(image_bytes: bytes) -> str:
    """Call Google Cloud Vision for text detection."""
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")

    if credentials_path and os.path.exists(credentials_path):
        from google.cloud import vision
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)
        if response.text_annotations:
            return response.text_annotations[0].description
        return ""

    # Fallback: try AWS Textract
    return _aws_textract_ocr(image_bytes)


def _aws_textract_ocr(image_bytes: bytes) -> str:
    """Call AWS Textract for text extraction."""
    try:
        client = boto3.client("textract")
        response = client.detect_document_text(Document={"Bytes": image_bytes})
        blocks = response.get("Blocks", [])
        lines = [b["Text"] for b in blocks if b["BlockType"] == "LINE"]
        return "\n".join(lines)
    except Exception:
        return ""
