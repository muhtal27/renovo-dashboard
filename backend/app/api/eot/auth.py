from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import time
from uuid import UUID

from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ValidationError

from app.core.config import settings

EOT_CONTEXT_HEADER = "x-renovo-eot-context"
EOT_SIGNATURE_HEADER = "x-renovo-eot-signature"


class SignedOperatorContext(BaseModel):
    version: int
    user_id: str
    tenant_id: UUID
    role: str | None = None
    issued_at: int


class AuthenticatedOperatorContext(BaseModel):
    user_id: str
    tenant_id: UUID
    role: str | None = None


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _sign_payload(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def get_authenticated_operator_context(
    encoded_context: str | None = Header(default=None, alias=EOT_CONTEXT_HEADER),
    signature: str | None = Header(default=None, alias=EOT_SIGNATURE_HEADER),
) -> AuthenticatedOperatorContext:
    if not encoded_context or not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context is required.",
        )

    secret = settings.eot_internal_auth_secret
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="EOT internal authentication is not configured.",
        )

    expected_signature = _sign_payload(encoded_context, secret)
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context is invalid.",
        )

    try:
        payload_json = _decode_base64url(encoded_context).decode("utf-8")
        payload = SignedOperatorContext.model_validate(json.loads(payload_json))
    except (ValueError, ValidationError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context is malformed.",
        ) from exc

    if payload.version != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context version is unsupported.",
        )

    now = int(time.time())
    if abs(now - payload.issued_at) > settings.eot_internal_auth_ttl_seconds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context has expired.",
        )

    return AuthenticatedOperatorContext(
        user_id=payload.user_id,
        tenant_id=payload.tenant_id,
        role=payload.role,
    )
