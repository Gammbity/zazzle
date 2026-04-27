"""
Centralised S3 client + presigned URL helpers.

All S3 access in the codebase should go through this module. Reasons:
- one place to configure credentials / region / addressing style
- one place to enforce the "fail fast on missing secrets" invariant
- consistent key prefix conventions for user-scoped uploads
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError
from django.conf import settings


class S3ConfigurationError(RuntimeError):
    """Raised when S3 is used without the required settings."""


@dataclass(frozen=True)
class PresignedPost:
    url: str
    fields: Dict[str, str]


def _require(name: str) -> str:
    value = getattr(settings, name, None)
    if not value:
        raise S3ConfigurationError(f"{name} must be set to use S3.")
    return value


def get_client():
    return boto3.client(
        's3',
        aws_access_key_id=_require('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=_require('AWS_SECRET_ACCESS_KEY'),
        region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1'),
    )


def bucket() -> str:
    return _require('AWS_STORAGE_BUCKET_NAME')


def user_scoped_key(prefix: str, user_id: int, filename: str) -> str:
    """Return `<prefix>/<user_id>/<uuid>/<filename>` — filename is trusted caller-sanitised."""
    return f"{prefix}/{user_id}/{uuid.uuid4()}/{filename}"


def generate_upload_post(
    key: str,
    content_type: str,
    max_size: int,
    expires_in: int = 3600,
) -> Dict[str, Any]:
    """Generate a presigned POST for direct-to-S3 browser uploads.

    Conditions enforce content-type and max size server-side so a malicious
    client can't post a 10 GB file after requesting a 1 MB upload slot.
    """
    client = get_client()
    return client.generate_presigned_post(
        Bucket=bucket(),
        Key=key,
        Fields={'Content-Type': content_type},
        Conditions=[
            {'Content-Type': content_type},
            ['content-length-range', 1, max_size],
        ],
        ExpiresIn=expires_in,
    )


def head_object(key: str) -> Optional[Dict[str, Any]]:
    """Return S3 HEAD metadata for `key` or None if missing."""
    try:
        return get_client().head_object(Bucket=bucket(), Key=key)
    except ClientError as exc:
        if exc.response.get('Error', {}).get('Code') in ('404', 'NoSuchKey', 'NotFound'):
            return None
        raise


def delete_object(key: str) -> None:
    get_client().delete_object(Bucket=bucket(), Key=key)


def generate_download_url(key: str, expires_in: int = 300) -> str:
    return get_client().generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket(), 'Key': key},
        ExpiresIn=expires_in,
    )
