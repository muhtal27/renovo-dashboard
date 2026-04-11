# Connector Contract

## Connector Types

| Type | Direction | Auth Model | Examples |
|------|-----------|-----------|----------|
| `pms` | Bidirectional | OAuth 2.0 / API key | Reapit, Street.co.uk |
| `partner_inbound` | Inbound (they push to us) | Our OAuth / API key | No Letting Go |
| `deposit_scheme` | Outbound (we push to them) | API key / Bearer | TDS, DPS, mydeposits |

## Connector Interface

Aligned to the existing Python async patterns in the backend.

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import StrEnum
from typing import Any
from uuid import UUID
from datetime import datetime


class ConnectorType(StrEnum):
    PMS = "pms"
    PARTNER_INBOUND = "partner_inbound"
    DEPOSIT_SCHEME = "deposit_scheme"


class AuthMode(StrEnum):
    OAUTH2 = "oauth2"              # OAuth 2.0 with PKCE or client credentials
    BEARER_TOKEN = "bearer_token"  # Static or long-lived bearer token
    API_KEY = "api_key"            # Key in header or query param


class Capability(StrEnum):
    # Inbound
    PULL_PROPERTIES = "pull_properties"
    PULL_TENANCIES = "pull_tenancies"
    PULL_CONTACTS = "pull_contacts"
    PULL_INSPECTIONS = "pull_inspections"
    RECEIVE_WEBHOOKS = "receive_webhooks"

    # Outbound
    PUSH_CASE_STATUS = "push_case_status"
    PUSH_CASE_DOCUMENTS = "push_case_documents"
    PUSH_CASE_NOTES = "push_case_notes"
    PUSH_FULL_CASE = "push_full_case"

    # Deposit-specific
    SUBMIT_CLAIM = "submit_claim"
    UPLOAD_EVIDENCE = "upload_evidence"
    TRACK_DISPUTE = "track_dispute"
    PULL_OUTCOME = "pull_outcome"


@dataclass
class ConnectorConfig:
    """Static metadata about a connector (not per-tenant)."""
    provider: str                        # 'reapit', 'street', 'tds', etc.
    display_name: str                    # 'Reapit Foundations'
    connector_type: ConnectorType
    auth_mode: AuthMode
    capabilities: set[Capability]
    webhook_events: list[str]            # Events this connector can receive ['property.updated', ...]
    config_schema: dict[str, Any]        # JSON Schema for connection-specific config
    requires_marketplace_install: bool   # True for Reapit


@dataclass
class ConnectionContext:
    """Per-tenant runtime context for a connector."""
    tenant_id: UUID
    connection_id: UUID
    provider: str
    credentials: dict[str, Any]          # Decrypted at runtime, never logged
    config: dict[str, Any]               # Connection-specific config (base_url, branch_id, etc.)
    last_synced_at: datetime | None


class BaseConnector(ABC):
    """Abstract base class for all connectors."""

    @classmethod
    @abstractmethod
    def get_config(cls) -> ConnectorConfig:
        """Return static connector metadata."""
        ...

    # --- Lifecycle ---

    @abstractmethod
    async def validate_credentials(self, ctx: ConnectionContext) -> bool:
        """Test that stored credentials are valid. Used for health checks."""
        ...

    async def on_connect(self, ctx: ConnectionContext) -> None:
        """Called after a new connection is established. Optional setup."""
        pass

    async def on_disconnect(self, ctx: ConnectionContext) -> None:
        """Called before a connection is deleted. Optional cleanup."""
        pass

    # --- Pull (inbound from external system) ---

    async def pull_properties(self, ctx: ConnectionContext, since: datetime | None = None) -> list[dict]:
        """Pull properties. `since` enables incremental sync."""
        raise NotImplementedError(f"{ctx.provider} does not support pull_properties")

    async def pull_tenancies(self, ctx: ConnectionContext, since: datetime | None = None) -> list[dict]:
        raise NotImplementedError(f"{ctx.provider} does not support pull_tenancies")

    async def pull_contacts(self, ctx: ConnectionContext, since: datetime | None = None) -> list[dict]:
        raise NotImplementedError(f"{ctx.provider} does not support pull_contacts")

    async def pull_inspections(self, ctx: ConnectionContext, since: datetime | None = None) -> list[dict]:
        raise NotImplementedError(f"{ctx.provider} does not support pull_inspections")

    # --- Push (outbound from Renovo to external system) ---

    async def push_case_status(self, ctx: ConnectionContext, case_id: UUID, status: str, metadata: dict) -> str | None:
        """Push case status. Returns external reference ID if created."""
        raise NotImplementedError(f"{ctx.provider} does not support push_case_status")

    async def push_case_documents(self, ctx: ConnectionContext, case_id: UUID, documents: list[dict]) -> list[str]:
        """Push documents. Returns list of external document IDs."""
        raise NotImplementedError(f"{ctx.provider} does not support push_case_documents")

    async def push_case_notes(self, ctx: ConnectionContext, case_id: UUID, notes: list[dict]) -> None:
        raise NotImplementedError(f"{ctx.provider} does not support push_case_notes")

    # --- Deposit scheme operations ---

    async def submit_claim(self, ctx: ConnectionContext, claim_payload: dict) -> str:
        """Submit a deposit claim. Returns scheme's claim reference."""
        raise NotImplementedError(f"{ctx.provider} does not support submit_claim")

    async def upload_evidence(self, ctx: ConnectionContext, claim_ref: str, files: list[dict]) -> None:
        raise NotImplementedError(f"{ctx.provider} does not support upload_evidence")

    async def get_dispute_status(self, ctx: ConnectionContext, claim_ref: str) -> dict:
        raise NotImplementedError(f"{ctx.provider} does not support get_dispute_status")

    # --- Webhook handling ---

    async def handle_webhook(self, ctx: ConnectionContext, event_type: str, payload: dict) -> None:
        """Process an inbound webhook event. Called by the webhook router."""
        raise NotImplementedError(f"{ctx.provider} does not support webhooks")

    def verify_webhook_signature(self, headers: dict, body: bytes, secret: str) -> bool:
        """Verify webhook signature. Returns False if invalid."""
        raise NotImplementedError(f"{ctx.provider} does not support webhook verification")
```

## Configuration Schema

Each connector declares its connection-specific config via JSON Schema. Stored in `integration_connections.config`.

Example for Reapit:
```json
{
  "type": "object",
  "properties": {
    "client_id": { "type": "string", "description": "Reapit app client ID" },
    "customer_id": { "type": "string", "description": "Reapit customer/installation ID" },
    "webhook_url": { "type": "string", "format": "uri", "description": "Auto-generated webhook endpoint" }
  },
  "required": ["client_id", "customer_id"]
}
```

## Health Check Contract

Every connector must implement `validate_credentials()`. The platform calls this:
- On connection creation (immediate validation)
- Every 6 hours (background health check)
- On operator-triggered "test connection"

Return value: `True` = healthy, `False` = credentials invalid or expired.

Side effects: If `False` and auth_mode is `oauth2`, the platform attempts token refresh before marking unhealthy.

## Webhook Intake Contract

### Generic webhook endpoint

```
POST /api/v1/webhooks/{provider}/{connection_id}
```

Processing flow:
1. Resolve `connection_id` → `integration_connections` row → tenant_id
2. Load connector class for provider
3. Call `connector.verify_webhook_signature(headers, body, webhook_secret)`
4. If invalid → 401 + log attempt
5. Parse event_type from payload (provider-specific extraction)
6. Call `connector.handle_webhook(ctx, event_type, payload)`
7. Connector processes event: upsert entities, emit internal events
8. Return 200 (must respond within 10s; heavy processing deferred via BackgroundTasks)

### Idempotency

Webhook handlers must be idempotent. The platform stores:
- `webhook_event_id` (from provider's `X-Event-Id` header or payload ID)
- Deduplication window: 24 hours

If a duplicate event arrives, return 200 without processing.

## Pull Contract

Pull operations are always initiated by Renovo (operator-triggered or rule-triggered).

```python
async def pull_properties(self, ctx: ConnectionContext, since: datetime | None = None) -> list[dict]
```

### Expectations
- If `since` is None: full backfill (all active records)
- If `since` is provided: incremental (records modified after that timestamp)
- Returns raw provider-format dicts (mapping happens in the sync engine, not the connector)
- Must handle pagination internally (the platform does not paginate on behalf of connectors)
- Must respect provider rate limits (use httpx with retry + backoff)
- Must raise `ConnectorError` subclass on failure (not raw httpx exceptions)

### Pagination handling

Connectors handle their own pagination. The existing Street client's auto-pagination pattern is the template:

```python
async def _paginate(self, path: str, params: dict) -> list[dict]:
    all_items = []
    page = 1
    while True:
        params["page[number]"] = page
        params["page[size]"] = 100
        response = await self._client.get(path, params=params)
        data = response.json()["data"]
        all_items.extend(data)
        if len(data) < 100:
            break
        page += 1
        if page > 200:  # Safety limit
            break
    return all_items
```

## Push Contract

Push operations are triggered by internal events (case status change, document generated).

```python
async def push_case_status(self, ctx: ConnectionContext, case_id: UUID, status: str, metadata: dict) -> str | None
```

### Expectations
- Returns external reference ID if the push creates a new entity in the external system
- Returns None if updating an existing entity
- Must be idempotent: pushing the same status twice should not create duplicates
- The platform stores the last pushed state; connectors only receive changed data
- Must raise `ConnectorPushError` on failure (platform handles retry)

## Retry Expectations

| Operation | Max retries | Backoff | Timeout per attempt |
|-----------|-------------|---------|---------------------|
| Pull (full) | 2 | Exponential (5s, 20s) | 120s |
| Pull (incremental) | 3 | Exponential (2s, 8s, 30s) | 60s |
| Push | 5 | Exponential (1s, 4s, 16s, 60s, 300s) | 30s |
| Webhook processing | 0 (return 200 immediately, process in background) | N/A | 10s response, 120s background |
| Health check | 1 | 5s | 15s |

## Idempotency Expectations

- Pull: upsert by external_id — safe to re-pull
- Push: include Renovo's internal event_id as idempotency key in outbound requests (provider-specific header)
- Webhook: deduplicate by provider's event ID within 24h window

## Error Classification

```python
class ConnectorError(Exception):
    """Base error for all connector failures."""
    def __init__(self, message: str, retryable: bool = False, provider: str = ""):
        self.message = message
        self.retryable = retryable
        self.provider = provider


class ConnectorAuthError(ConnectorError):
    """Credentials invalid or expired. Triggers token refresh or connection disable."""
    def __init__(self, message: str, provider: str = ""):
        super().__init__(message, retryable=False, provider=provider)


class ConnectorRateLimitError(ConnectorError):
    """Rate limited. Retry after delay."""
    def __init__(self, message: str, retry_after: int = 60, provider: str = ""):
        super().__init__(message, retryable=True, provider=provider)
        self.retry_after = retry_after


class ConnectorNotFoundError(ConnectorError):
    """External resource not found. Don't retry."""
    def __init__(self, message: str, provider: str = ""):
        super().__init__(message, retryable=False, provider=provider)


class ConnectorPushError(ConnectorError):
    """Failed to push data to external system."""
    def __init__(self, message: str, retryable: bool = True, provider: str = ""):
        super().__init__(message, retryable=retryable, provider=provider)
```

## Mapping Layer Responsibilities

The connector returns raw provider data. The **sync engine** (not the connector) is responsible for:

1. Extracting fields from provider format into canonical format
2. Resolving external IDs to internal IDs via `external_refs`
3. Detecting creates vs updates (new external_id = create; existing = update)
4. Applying field-level merge rules (see 03-sync-semantics.md)
5. Emitting internal events for downstream processing

Each connector provides a static `FIELD_MAPPINGS` dict:

```python
# Example: Reapit property mapping
REAPIT_PROPERTY_MAPPING = {
    "internal_field": "provider_json_path",
    # ---
    "name": "address.summary",
    "address_line_1": "address.line1",
    "address_line_2": "address.line2",
    "city": "address.line4",
    "postcode": "address.postcode",
    "country_code": lambda data: "GB",  # Reapit is UK-only
    "reference": lambda data: f"reapit:{data['id']}",
}
```

The sync engine uses these mappings via a generic `apply_mapping(raw_data, mapping_dict)` utility.

## Connector Registration

Connectors are registered in a module-level registry:

```python
# backend/app/integrations/registry.py

from app.integrations.reapit.connector import ReapitConnector
from app.integrations.street.connector import StreetConnector
from app.integrations.tds.connector import TDSConnector
# ...

CONNECTOR_REGISTRY: dict[str, type[BaseConnector]] = {
    "reapit": ReapitConnector,
    "street": StreetConnector,
    "tds": TDSConnector,
    "dps": DPSConnector,
    "mydeposits": MyDepositsConnector,
}

def get_connector(provider: str) -> type[BaseConnector]:
    if provider not in CONNECTOR_REGISTRY:
        raise ValueError(f"Unknown provider: {provider}")
    return CONNECTOR_REGISTRY[provider]
```

## Directory Structure

```
backend/app/integrations/
├── __init__.py
├── base.py              # BaseConnector, ConnectorConfig, ConnectionContext, errors
├── registry.py          # CONNECTOR_REGISTRY
├── mapping.py           # apply_mapping() utility
├── reapit/
│   ├── __init__.py
│   ├── connector.py     # ReapitConnector(BaseConnector)
│   ├── client.py        # ReapitApiClient (httpx wrapper)
│   ├── mappings.py      # REAPIT_*_MAPPING dicts
│   └── auth.py          # OAuth/OIDC token management
├── street/
│   ├── __init__.py
│   ├── connector.py     # StreetConnector(BaseConnector) — refactored from current
│   ├── client.py        # Existing StreetApiClient (moved here)
│   └── mappings.py
├── tds/
│   ├── __init__.py
│   ├── connector.py
│   └── client.py
├── dps/
│   └── ...
└── mydeposits/
    └── ...
```
