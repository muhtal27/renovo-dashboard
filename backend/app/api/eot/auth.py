from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import logging
import time
from uuid import UUID

from fastapi import Header, HTTPException, status
from pydantic import BaseModel, ValidationError

from app.core.config import settings

EOT_CONTEXT_HEADER = "x-renovo-eot-context"
EOT_SIGNATURE_HEADER = "x-renovo-eot-signature"

logger = logging.getLogger(__name__)


class SignedOperatorContext(BaseModel):
    version: int
    user_id: UUID
    tenant_id: UUID
    membership_id: UUID | None = None
    role: str | None = None
    issued_at: int


class AuthenticatedOperatorContext(BaseModel):
    user_id: UUID
    tenant_id: UUID
    membership_id: UUID | None = None


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
        logger.error(
            "EOT backend internal auth configuration missing",
            extra={"missing_env": "EOT_INTERNAL_AUTH_SECRET"},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "EOT internal authentication is not configured on the backend. "
                "Set EOT_INTERNAL_AUTH_SECRET in backend/.env or the deployed backend environment."
            ),
        )

    expected_signature = _sign_payload(encoded_context, secret)
    if not hmac.compare_digest(signature, expected_signature):
        logger.warning("EOT backend trusted operator context signature mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context is invalid.",
        )

    try:
        payload_json = _decode_base64url(encoded_context).decode("utf-8")
        payload = SignedOperatorContext.model_validate(json.loads(payload_json))
    except (ValueError, ValidationError, json.JSONDecodeError, UnicodeDecodeError, binascii.Error) as exc:
        logger.warning("EOT backend trusted operator context payload is malformed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context is malformed.",
        ) from exc

    if payload.version != 1:
        logger.warning(
            "EOT backend trusted operator context version is unsupported",
            extra={"version": payload.version},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context version is unsupported.",
        )

    now = int(time.time())
    if abs(now - payload.issued_at) > settings.eot_internal_auth_ttl_seconds:
        logger.warning(
            "EOT backend trusted operator context expired",
            extra={"issued_at": payload.issued_at, "ttl_seconds": settings.eot_internal_auth_ttl_seconds},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trusted operator context has expired.",
        )

    return AuthenticatedOperatorContext(
        user_id=payload.user_id,
        tenant_id=payload.tenant_id,
        membership_id=payload.membership_id,
    )
