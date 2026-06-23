import uuid
from pathlib import Path
from typing import Tuple
import boto3
from app.core.config import settings

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


def upload_file(file_bytes: bytes, filename: str, content_type: str) -> Tuple[str, str, str]:
    """Store the file in S3 if configured, otherwise on local disk.

    Returns (storage_key, file_url, backend) where backend is "s3" or "local".
    Local fallback exists so uploads still work (and remain downloadable) when
    no S3 bucket is configured, e.g. in local dev.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    name = f"{uuid.uuid4()}.{ext}"

    if settings.S3_BUCKET_NAME:
        try:
            key = f"documents/{name}"
            _s3_client().put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            )
            url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            return key, url, "s3"
        except Exception:
            pass

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / name).write_bytes(file_bytes)
    return name, f"/local/{name}", "local"


def download_file(storage_key: str, backend: str) -> bytes:
    """Fetch the original file bytes for a stored document."""
    if backend == "s3":
        obj = _s3_client().get_object(Bucket=settings.S3_BUCKET_NAME, Key=storage_key)
        return obj["Body"].read()
    return (UPLOAD_DIR / storage_key).read_bytes()


def get_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    return _s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expires_in,
    )