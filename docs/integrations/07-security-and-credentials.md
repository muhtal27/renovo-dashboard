# Security and Credentials

## Credential Storage Model

### Proposed table: `integration_connections`

Replaces the current `street_connections` table with a generic credential store.

```sql
CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,                        -- 'reapit', 'street', 'tds', 'dps', 'mydeposits'
    display_name TEXT,                             -- User-friendly label (e.g., "Our Reapit account")
    status TEXT NOT NULL DEFAULT 'active',         -- 'pending', 'active', 'auth_failed', 'disabled'
    auth_mode TEXT NOT NULL,                       -- 'oauth2', 'bearer_token', 'api_key'

    -- Encrypted credential blob (Fernet symmetric encryption)
    credentials_encrypted BYTEA NOT NULL,

    -- Connection-specific non-secret configuration
    config JSONB NOT NULL DEFAULT '{}',            -- {base_url, customer_id, webhook_url, etc.}

    -- Sync state
    last_synced_at TIMESTAMPTZ,
    sync_cursor JSONB DEFAULT '{}',

    -- Health
    last_health_check_at TIMESTAMPTZ,
    health_status TEXT DEFAULT 'unknown',          -- 'healthy', 'degraded', 'unhealthy', 'unknown'
    consecutive_failures INTEGER DEFAULT 0,

    -- Webhook config
    webhook_secret TEXT,                           -- For verifying inbound webhooks from this provider

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_integration_connections_active
        UNIQUE NULLS NOT DISTINCT (tenant_id, provider, deleted_at)
);

CREATE INDEX ix_integration_connections_tenant_status
    ON integration_connections (tenant_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_integration_connections_provider_health
    ON integration_connections (provider, health_status)
    WHERE deleted_at IS NULL AND status = 'active';
```

Note: The UNIQUE constraint on `(tenant_id, provider)` allows only one connection per provider per tenant in v1. This can be relaxed in v2 if agencies need multiple Reapit installations.

### Credentials structure (before encryption)

```python
# OAuth 2.0 connections (Reapit)
{
    "access_token": "eyJ...",
    "refresh_token": "rt_...",
    "token_type": "Bearer",
    "expires_at": 1712847600,        # Unix timestamp
    "scope": "read:properties read:tenancies write:journal-entries"
}

# Bearer token connections (Street.co.uk)
{
    "api_token": "sk_live_..."
}

# API key connections (TDS, DPS)
{
    "api_key": "tds_prod_...",
    "api_secret": "sec_..."          # If scheme requires key+secret
}
```

## Encryption Approach

### Algorithm: Fernet (AES-128-CBC + HMAC-SHA256)

Using Python's `cryptography` library (already a transitive dependency via `supabase`):

```python
from cryptography.fernet import Fernet
import json
import os

# Key management
CREDENTIAL_ENCRYPTION_KEY = os.environ["CREDENTIAL_ENCRYPTION_KEY"]  # Fernet key (base64-encoded 32 bytes)

fernet = Fernet(CREDENTIAL_ENCRYPTION_KEY)

def encrypt_credentials(credentials: dict) -> bytes:
    """Encrypt credential dict to bytes for DB storage."""
    plaintext = json.dumps(credentials).encode("utf-8")
    return fernet.encrypt(plaintext)

def decrypt_credentials(encrypted: bytes) -> dict:
    """Decrypt credential bytes back to dict."""
    plaintext = fernet.decrypt(encrypted)
    return json.loads(plaintext.decode("utf-8"))
```

### Key storage

- `CREDENTIAL_ENCRYPTION_KEY` stored as environment variable (not in DB)
- Same key used across application instances
- Key is a Fernet key: `Fernet.generate_key()` (URL-safe base64 of 32 random bytes)

### Migration from current state

The existing `street_connections.api_token_encrypted` column stores tokens as plaintext TEXT (the "encrypted" suffix is aspirational — the code has a TODO comment). Migration:
1. Read all existing tokens
2. Encrypt with Fernet
3. Write to new `integration_connections.credentials_encrypted`
4. Mark `street_connections` as deprecated

## Token Refresh

### OAuth 2.0 refresh flow (Reapit)

```python
async def refresh_token(connection: IntegrationConnection) -> dict:
    """Refresh OAuth token. Returns new credentials dict."""
    creds = decrypt_credentials(connection.credentials_encrypted)

    if creds["expires_at"] > time.time() + 300:  # 5 min buffer
        return creds  # Still valid

    response = await httpx_client.post(
        f"{REAPIT_TOKEN_URL}",
        data={
            "grant_type": "refresh_token",
            "refresh_token": creds["refresh_token"],
            "client_id": connection.config["client_id"],
            "client_secret": REAPIT_CLIENT_SECRET,  # From env, not per-tenant
        }
    )

    if response.status_code == 200:
        new_creds = response.json()
        new_creds["expires_at"] = int(time.time()) + new_creds["expires_in"]
        connection.credentials_encrypted = encrypt_credentials(new_creds)
        await db.commit()
        return new_creds
    else:
        connection.status = "auth_failed"
        connection.consecutive_failures += 1
        await db.commit()
        raise ConnectorAuthError("Token refresh failed", provider="reapit")
```

### Refresh triggers

- Before any API call: check if `expires_at < now() + 300` → refresh
- On 401 response from provider: attempt one refresh then retry
- Health check (every 6h): proactively refresh if expiring within 24h

## Secret Rotation

### Encryption key rotation

1. Generate new Fernet key
2. Set `CREDENTIAL_ENCRYPTION_KEY_NEW` env var
3. Run migration script:
   - Decrypt all credentials with old key
   - Re-encrypt with new key
   - Update rows
4. Swap env vars: new key becomes primary, remove old
5. Verify by reading a sample credential

### Per-connection credential rotation

- **API keys:** Operator generates new key in provider portal, updates in Renovo Settings
- **OAuth tokens:** Automatic via refresh flow; no manual rotation needed
- **Webhook secrets:** Regenerated when connection is re-established

## Least-Privilege Scopes

### Reapit scopes requested

| Scope | Purpose | Required? |
|-------|---------|-----------|
| `read:properties` | Pull property cache | Yes |
| `read:tenancies` | Pull tenancy cache | Yes |
| `read:contacts` | Resolve tenant/landlord names | Yes |
| `write:journal-entries` | Push case status notes | Yes |
| `write:documents` | Attach generated documents | Yes |

We do NOT request: `write:properties`, `write:tenancies`, `write:contacts`, `read:transactions`, `write:offers`.

### Public API scopes (our OAuth server)

Partners request only the scopes they need. Default partner scopes:
- NLG: `inventory:write`, `cases:read`
- Future PMS connector: `cases:read`, `documents:read`

## Audit Logging

All credential-related operations are logged:

```sql
CREATE TABLE integration_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL,
    connection_id UUID,
    actor_id UUID,                  -- User who performed the action (NULL for system)
    action TEXT NOT NULL,           -- 'connection.created', 'credentials.refreshed', 'connection.disabled', etc.
    details JSONB DEFAULT '{}',     -- NON-SENSITIVE details (provider, status change, error message)
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_integration_audit_tenant ON integration_audit_log (tenant_id, created_at DESC);
```

### Logged actions

| Action | When |
|--------|------|
| `connection.created` | New connection established |
| `connection.deleted` | Connection removed |
| `connection.disabled` | Connection disabled (manual or auto) |
| `connection.reactivated` | Connection re-enabled |
| `credentials.refreshed` | OAuth token refreshed |
| `credentials.refresh_failed` | Token refresh failed |
| `credentials.updated` | Operator updated API key |
| `webhook.registered` | Webhook subscription created with provider |
| `webhook.received` | Inbound webhook processed |
| `webhook.verification_failed` | Webhook signature invalid |
| `sync.triggered` | Sync initiated (by operator or rule) |
| `api_key.created` | Public API key issued to partner |
| `api_key.revoked` | Public API key revoked |

**NEVER log:** token values, API keys, secrets, or credential payloads.

## Webhook Verification

### Inbound (provider → Renovo)

| Provider | Verification method |
|----------|-------------------|
| Reapit | HMAC-SHA256 signature in `X-Api-Signature` header |
| Resend | Svix signature (existing implementation) |
| Public API partners | HMAC-SHA256 with partner's webhook secret |

### Outbound (Renovo → partner)

When Renovo delivers webhooks to partners:
- Sign with partner's registered webhook secret
- Include: `X-Renovo-Signature`, `X-Renovo-Timestamp`, `X-Renovo-Delivery-Id`
- Signature: `HMAC-SHA256(secret, "{timestamp}.{body}")`

## Tenant Isolation

1. **Credential access:** `decrypt_credentials()` is only called within tenant-scoped service methods. No cross-tenant credential access is possible through the repository layer.

2. **Connection lookup:** Always filtered by `tenant_id`. The `get_connection(tenant_id, provider)` method enforces this at the query level.

3. **Webhook routing:** Inbound webhooks include `connection_id` in the URL path. The handler verifies that the resolved connection belongs to the expected tenant before processing.

4. **Public API tokens:** JWT tokens include `tenant_id` claim. All public API endpoints extract tenant from token — never from request body or headers.

5. **Admin endpoints:** Platform-admin operations (list all connections across tenants) require a separate admin auth mechanism (not yet implemented; not needed for v1).

## Admin Access Restrictions

- Only `admin` role can create/delete/update connections
- Only `admin` role can view decrypted connection status
- `manager` can view connection health and sync logs (no credential access)
- `operator` can see "connected" badge but no integration details
- No role can view raw credentials through any UI or API endpoint

## Sandbox vs Production Separation

### Environment isolation

| Aspect | Sandbox | Production |
|--------|---------|-----------|
| API base URL | `api.sandbox.renovoai.co.uk` | `api.renovoai.co.uk` |
| Database | Same DB, separate tenant with `slug: "sandbox-{partner}"` | Real tenant data |
| Reapit connection | Uses Reapit sandbox customer ID | Real customer ID |
| API keys | Prefixed `renv1_test_sk_` | Prefixed `renv1_live_sk_` |
| OAuth tokens | Prefixed `renv1_test_` | Prefixed `renv1_live_` |
| Webhooks | Deliver to partner sandbox URL | Deliver to production URL |
| Rate limits | 60 req/min | 300 req/min |
| Data | Seeded test data, no real PII | Real data |

### Credential separation

Production credentials and sandbox credentials are stored in separate `integration_connections` rows (different tenant_id). There is no mechanism to accidentally use production credentials in sandbox or vice versa.

## Document / Attachment Security

- Documents pushed via public API are stored in Supabase Storage with path: `tenants/{tenant_id}/integrations/{provider}/{filename}`
- Storage bucket has RLS: only the owning tenant can access
- Download URLs are signed with 1-hour expiry (not permanent public URLs)
- File type validation: only PDF, PNG, JPG, DOCX accepted
- File size limit: 25MB per file
- Virus scanning: deferred to v2 (note: Supabase doesn't offer native scanning)

## Retention / Deletion Policy

| Data type | Retention | Deletion trigger |
|-----------|-----------|-----------------|
| Integration credentials | Until connection deleted | `DELETE /connections/{id}` → immediate hard-delete of credentials |
| Sync logs | 90 days | Automated cleanup job (daily) |
| Webhook logs | 30 days | Automated cleanup job |
| Audit logs | 2 years | Manual archive (compliance requirement) |
| Dead letter items | 30 days | Automated cleanup |
| Cached PMS data (properties, tenancies) | Until connection deleted | On disconnect → soft-delete cached entities |
| External refs | Until connection deleted | On disconnect → soft-delete external_refs for that provider |

### On connection deletion

When an agency disconnects an integration:
1. Soft-delete the `integration_connections` row
2. Revoke OAuth tokens with provider (if supported)
3. Deregister webhooks with provider
4. Soft-delete all `external_refs` for this provider + tenant
5. Cached properties/tenancies remain (soft-deleted) for 90 days for audit
6. Cases and case data are NEVER deleted (Renovo-owned data persists regardless of PMS connection)
7. Log `connection.deleted` in audit log
