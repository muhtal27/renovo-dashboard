# Remaining Issues — Handoff for New Session

> Created: 2026-04-11 | Read `HANDOFF.md` first for full context

Two issues remain from the original 13. Everything else is resolved and deployed.

---

## Issue 12: Street.co.uk Migration to Generic Integration Framework

### Problem
The Street.co.uk integration was built before the generic integration platform (Phase 1).
It uses its own models, service, router, schemas, and frontend — all separate from the
generic `IntegrationConnection`/`IntegrationSyncLog` framework that Reapit and deposit
schemes use. This creates parallel data paths and maintenance burden.

### What needs to happen
Migrate Street to the generic framework: create a `StreetConnector` implementing
`BaseConnector`, move data from old tables to `integration_connections`/`integration_sync_logs`,
and update frontend to use the generic integration panel pattern.

### Old Street files (to migrate/remove)

**Backend models:**
- `backend/app/models/street_connection.py` — `StreetConnection` (table: `street_connections`)
  - Fields: `api_token_encrypted`, `base_url`, `label`, `last_synced_at`
  - Unique index: one active connection per tenant
- `backend/app/models/street_sync_log.py` — `StreetSyncLog` (table: `street_sync_logs`)
  - Fields: `connection_id`, `status`, `resource`, `records_created/updated/skipped`, `error_message`, `error_detail`, `started_at`, `finished_at`
- Exported from `backend/app/models/__init__.py` (lines 31-32, 72-73)

**Backend service:**
- `backend/app/services/street_sync.py` (340 lines) — `StreetSyncService`
  - `get_connection()`, `create_connection()`, `update_connection()`, `delete_connection()`
  - `test_connection()` — calls `client.get_branches()`
  - `run_sync()` — orchestrates sync, calls `_sync_properties()` and `_sync_tenancies()`
  - Properties synced with reference `"street:{street_id}"`, mapped to `Property` model
  - Tenancies synced with property FK resolution, mapped to `Tenancy` model

**Backend API client:**
- `backend/app/integrations/street/client.py` (223 lines) — `StreetApiClient`
  - Async context manager, bearer token auth, auto-pagination (max 200 pages)
  - 20+ methods: `get_properties()`, `get_tenancies()`, `get_tenants()`, etc.
  - Rate limit handling (429 + Retry-After)

**Backend router:**
- `backend/app/api/street/router.py` (196 lines) — mounted at `/api/street`
  - `GET /connection` — status check
  - `POST /connection` — create (409 if exists)
  - `PATCH /connection` — update
  - `DELETE /connection` — soft delete (204)
  - `POST /connection/test` — health check via branches endpoint
  - `POST /sync` — trigger sync (optional resource filter)
  - `GET /sync/logs` — list recent logs
  - All use `MANAGE_SETTINGS` permission

**Backend schemas:**
- `backend/app/schemas/street.py` (71 lines)
  - Request: `StreetConnectionCreateRequest`, `StreetConnectionUpdateRequest`, `StreetSyncRequest`
  - Response: `StreetConnectionResponse`, `StreetSyncLogResponse`, `StreetConnectionTestResponse`, `StreetSyncStatusResponse`

**Main app:**
- `backend/app/main.py` — `app.include_router(street_router, prefix="/api/street", tags=["street"])`

**Frontend panel:**
- `app/(operator)/settings/settings-tabs.tsx` — `StreetIntegrationPanel` component
  - Connection config (API token + label inputs)
  - Status badge, test/sync/disconnect buttons
  - Sync log table

**Frontend API client:**
- `lib/street-api.ts` (99 lines) — 7 functions wrapping fetch calls
- `lib/street-types.ts` (54 lines) — TypeScript types

**Frontend proxy routes:**
- `app/api/street/connection/route.ts` — GET/POST/PATCH/DELETE
- `app/api/street/connection/test/route.ts` — POST
- `app/api/street/sync/route.ts` — POST
- `app/api/street/sync/logs/route.ts` — GET

**Database migration:**
- `backend/alembic/versions/20260408_0001_street_integration.py`

**Other references:**
- `backend/scripts/profile_dashboard.py` — imports `StreetSyncService`

### Migration steps

**Step 1: Create StreetConnector**
Create `backend/app/integrations/street/connector.py` implementing `BaseConnector`:
- `ConnectorType.PMS`, `AuthMode.BEARER_TOKEN`
- Capabilities: `PULL_PROPERTIES`, `PULL_TENANCIES`
- `validate_credentials()` — call `client.get_branches()` (mirrors `test_connection()`)
- `pull_properties()`, `pull_tenancies()` — port from `StreetSyncService._sync_properties/tenancies()`
- `WebhookAuthPolicy.NOT_SUPPORTED`
- Register via `@register_connector`

Create `backend/app/integrations/street/mappings.py` — extract field mappings from the sync methods into `PROPERTY_MAPPING` and `TENANCY_MAPPING` dicts compatible with `apply_mapping()`.

**Step 2: Data migration**
Create Alembic migration:
- For each `street_connections` row, insert into `integration_connections`:
  - `provider='street'`, `auth_mode='bearer_token'`
  - Encrypt `api_token_encrypted` into `credentials_encrypted` via `encrypt_credentials({"api_token": decrypt_old_token})`
  - `config={"base_url": row.base_url, "label": row.label}`
  - Preserve `last_synced_at`, `created_at`, `deleted_at`
- For each `street_sync_logs` row, insert into `integration_sync_logs`:
  - Map `connection_id` to new integration connection ID
  - `provider='street'`, `direction='inbound'`, `trigger='manual'`
- Create `external_refs` entries for `street:{id}` references
- DO NOT drop old tables yet (kept for rollback)

**Step 3: Update frontend**
- Update `StreetIntegrationPanel` to use the generic integration API (`/api/integrations/connections`)
  - OR: replace with a simple config panel like `ReapitIntegrationPanel` that calls generic endpoints
- Update `lib/street-api.ts` to use generic integration endpoints
- Remove or redirect `app/api/street/*` proxy routes

**Step 4: Update backend**
- Remove `street_router` from `main.py`
- Remove old `backend/app/api/street/` directory
- Remove old `backend/app/schemas/street.py`
- Remove old `backend/app/services/street_sync.py`
- Update `backend/app/models/__init__.py` to remove `StreetConnection`/`StreetSyncLog` exports

**Step 5: Cleanup (separate PR after production validation)**
- Drop `street_connections` and `street_sync_logs` tables via migration
- Remove `backend/app/models/street_connection.py` and `street_sync_log.py`
- Update `backend/scripts/profile_dashboard.py`

### Key decisions to make
1. **Preserve old API routes?** Could keep `/api/street/*` as redirects during transition
2. **Data migration approach?** Online (Alembic) vs. offline (script) — Alembic recommended since tables are small
3. **Token re-encryption?** Old `api_token_encrypted` may use different encryption than `credentials_encrypted` (Fernet). Check if same key/method applies

---

## Issue 13: Partner Onboarding UI

### Problem
The backend has full models for `ApiApplication`, `ApiKey`, and `ApiWebhookRegistration`
(created in Phase 3), but there is no operator UI to manage them. Partners currently
require manual database operations to get API credentials.

### What exists (backend, ready to use)

**Models (all tenant-scoped, soft-delete):**
- `api_applications` — `name`, `client_id` (unique), `client_secret_hash` (SHA-256), `scopes` (JSONB), `is_sandbox`, `rate_limit_per_minute`, `status`
- `api_keys` — `app_id` (FK), `name`, `key_prefix`, `key_hash` (SHA-256, unique), `scopes`, `expires_at`, `last_used_at`, `status`
- `api_webhook_registrations` — `app_id` (FK), `url`, `events` (JSONB), `secret_encrypted` (Fernet), `status`, `consecutive_failures`
- `api_webhook_deliveries` — `registration_id` (FK), `event_type`, `payload`, `status`, `attempts`, `response_status`
- `api_idempotency_keys` — `key_hash`, `request_hash`, `response_status`, `response_body`, `expires_at`

**Repositories (`backend/app/repositories/public_api.py`):**
- `ApiApplicationRepository` — `get_by_client_id()`, `get_for_tenant()`, `list_for_tenant()`, `add()`, `soft_delete()`
- `ApiKeyRepository` — `validate_key()`, `list_for_app()`, `add()`, `revoke()`
- `ApiWebhookRegistrationRepository` — `list_for_app()`, `list_active_for_event()`, `get_for_tenant()`, `get_for_app()`, `find_by_url()`, `add()`, `soft_delete()`
- `ApiWebhookDeliveryRepository` — `add()`, `list_for_registration()`, `list_pending()`

**Auth flow (`backend/app/api/v1/auth.py`):**
- OAuth 2.0 Client Credentials at `POST /v1/oauth/token`
- Client secret verified via SHA-256 + HMAC compare
- API keys: prefix `renv1_test_sk_`, validated by hash lookup
- JWTs: HS256, prefixed `renv1_live_` or `renv1_test_`, 1hr TTL
- Scopes: intersection of requested and granted

### What's missing

**Backend — operator API endpoints:**
Create `backend/app/api/operator/applications.py` (or similar):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/operator/applications` | List apps for tenant |
| POST | `/operator/applications` | Create app (generate client_id + client_secret, return secret ONCE) |
| GET | `/operator/applications/{app_id}` | Get app detail |
| PATCH | `/operator/applications/{app_id}` | Update name, scopes, rate limit |
| DELETE | `/operator/applications/{app_id}` | Soft delete (revoke) |
| POST | `/operator/applications/{app_id}/keys` | Generate API key (return key ONCE) |
| GET | `/operator/applications/{app_id}/keys` | List keys (prefix + last_used only, no plaintext) |
| DELETE | `/operator/applications/{app_id}/keys/{key_id}` | Revoke key |
| POST | `/operator/applications/{app_id}/regenerate-secret` | Rotate client secret |

Webhook management is already handled via the public API (`POST /v1/webhooks`) and
doesn't need duplication in the operator API.

**Key generation patterns:**
- `client_id`: `secrets.token_hex(16)` (32 chars)
- `client_secret`: `secrets.token_urlsafe(48)` (64 chars), store SHA-256 hash only
- API key: `"renv1_test_sk_" + secrets.token_urlsafe(32)`, store SHA-256 hash only
- All secrets shown ONCE on creation, then only prefix/last4 visible

**Frontend — new Settings tab:**
Add "API Partners" tab to `app/(operator)/settings/settings-tabs.tsx`:

| Component | Description |
|-----------|-------------|
| Applications list | Table: name, client_id (truncated), status, created_at, actions |
| Create app dialog | Form: name, scopes (multi-select), sandbox toggle |
| App detail view | Shows client_id, scopes, rate limit, created keys, webhook registrations |
| Secret reveal | One-time display after creation with copy button and warning |
| Key management | List keys (prefix, last_used, status), create/revoke actions |
| API key reveal | One-time display after generation with copy button |

**Frontend proxy routes:**
- `app/api/operator/applications/route.ts` — GET/POST
- `app/api/operator/applications/[appId]/route.ts` — GET/PATCH/DELETE
- `app/api/operator/applications/[appId]/keys/route.ts` — GET/POST
- `app/api/operator/applications/[appId]/keys/[keyId]/route.ts` — DELETE
- `app/api/operator/applications/[appId]/regenerate-secret/route.ts` — POST

**Permission:** Reuse `MANAGE_SETTINGS` (ADMIN minimum). Adding a new `MANAGE_API_APPLICATIONS`
permission is optional but cleaner.

### UI design notes
Follow the existing settings panel patterns in `settings-tabs.tsx`:
- White bordered sections with `border-zinc-200/80 bg-white px-6 py-6`
- Section headers: `text-sm font-semibold text-zinc-950`
- Form labels: `text-xs font-medium text-zinc-500`
- Inputs: `h-10 rounded-lg border border-zinc-200`
- Status badges: `rounded-full bg-emerald-100/80 text-emerald-700` (active) / `bg-zinc-100 text-zinc-600` (inactive)
- Tables: zebra striped, `text-sm text-zinc-600`

### Available scopes (for scope selector)
From `backend/app/api/v1/auth.py`:
- `inventory:write` — push inspections
- `documents:write` — push documents
- `documents:read` — download documents
- `cases:read` — query cases
- `webhooks:manage` — register/manage webhooks

---

## Files to read first

1. `docs/integrations/HANDOFF.md` — full project context
2. `docs/integrations/REMAINING-ISSUES.md` — this file
3. `backend/app/integrations/reapit/connector.py` — working connector example (for Issue 12)
4. `backend/app/services/street_sync.py` — business logic to port (for Issue 12)
5. `backend/app/repositories/public_api.py` — existing CRUD for API models (for Issue 13)
6. `backend/app/api/v1/auth.py` — auth flow to understand (for Issue 13)
7. `app/(operator)/settings/settings-tabs.tsx` — frontend patterns (for both)
