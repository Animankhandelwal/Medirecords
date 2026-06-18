import boto3
import uuid
from typing import Tuple
from app.core.config import settings


def upload_file(file_bytes: bytes, filename: str, content_type: str) -> Tuple[str, str]:
    """Upload file to S3 and return (s3_key, public_url)."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    key = f"documents/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    return key, url


def get_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expires_in,
    )
