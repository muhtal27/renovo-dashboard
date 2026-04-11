# Integration Platform — Session Handoff

> Updated: 2026-04-11 after completing Phase 1, Phase 2, and Phase 3

## What was built

### Phase 1: Integration Foundation
Six database tables deployed to Supabase production:
- `integration_connections` — encrypted credential store per tenant
- `external_refs` — maps external IDs to internal UUIDs across providers
- `integration_sync_logs` — pull/push audit trail
- `integration_events` — internal domain event queue
- `integration_webhook_log` — inbound webhook dedupe (connection-scoped)
- `integration_audit_log` — credential/connection operation trail

Backend framework (`backend/app/integrations/`):
- `base.py` — BaseConnector ABC, ConnectorConfig, ConnectionContext, WebhookAuthPolicy (4 policies), Capability enum, error hierarchy
- `registry.py` — CONNECTOR_REGISTRY with @register_connector decorator
- `credentials.py` — Fernet encryption (guarded import, fails gracefully without cryptography)
- `mapping.py` — apply_mapping() for dot-path + callable field extraction

Services (`backend/app/services/`):
- `integration_sync.py` — IntegrationSyncService with run_pull(), health state machine, manual resync
- `integration_events.py` — IntegrationEventDispatcher
- `sync_processor.py` — SyncProcessor: upserts mapped data into Property/Tenancy tables with external_refs

API (`backend/app/api/integrations/`):
- Generic connection CRUD, manual sync trigger, sync logs, webhook intake at `/api/integrations/webhooks/{provider}/{connection_id}`

Frontend proxy routes at `app/api/integrations/connections/`.

### Phase 2: Reapit Connector
Reapit Foundations integration using **Client Credentials** flow (NOT Authorization Code — confirmed from Reapit docs).

Backend (`backend/app/integrations/reapit/`):
- `auth.py` — Client Credentials token exchange with in-memory cache per customer_id
- `client.py` — ReapitApiClient (httpx async, auto-pagination, 10-page cap for Vercel timeout)
- `mappings.py` — PROPERTY_MAPPING, TENANCY_MAPPING (validated against real SBOX data)
- `connector.py` — ReapitConnector implementing BaseConnector, registered via @register_connector

Reapit-specific API (`backend/app/api/reapit/`):
- `POST /connect` — validates customer_id, creates connection, triggers backfill
- `POST /test` — lightweight health check
- `POST /debug-pull` — TEMPORARY diagnostic endpoint (should be removed)

Frontend:
- `app/api/reapit/authorize/route.ts` — proxy to /connect
- `app/api/reapit/test/route.ts` — proxy to /test
- `app/(operator)/settings/settings-tabs.tsx` — ReapitIntegrationPanel with customer ID input, sync controls, log table

### Phase 3: Public API v1 for Partners (NLG) ✅ NEW
Full public REST API deployed at `https://backend.renovoai.co.uk/v1/`.

**Auth system** (`backend/app/api/v1/auth.py`):
- `POST /v1/oauth/token` — OAuth 2.0 Client Credentials flow, returns HS256 JWT with tenant_id + scopes
- API key validation for sandbox (prefix `renv1_test_sk_`)
- `require_scope(scope)` dependency factory for per-endpoint authorization
- JWT claims: sub (client_id), tenant_id, app_id, scopes, exp (1hr default)

**Core endpoints** (`backend/app/api/v1/inspections.py`, `cases.py`):
- `POST /v1/inspections` — push inspection/inventory data from partners, auto-matches property by normalized postcode + address_line_1
- `POST /v1/inspections/{id}/documents` — add documents to inspections
- `GET /v1/cases` — cursor-paginated case list with tenancy_id and status filters
- `GET /v1/cases/{id}` — full case detail with issues (+ estimated_cost from recommendations), documents, timeline
- `GET /v1/cases/{id}/documents/{doc_id}/download` — document download URL

**Webhook system** (`backend/app/api/v1/webhooks.py`, `backend/app/services/webhook_delivery.py`):
- `POST /v1/webhooks` — register HTTPS endpoint, validates event names, encrypts secret via Fernet
- `GET /v1/webhooks` — list active registrations for app
- `DELETE /v1/webhooks/{id}` — soft-delete
- HMAC-SHA256 signed outbound delivery with retry backoff (60s, 5m, 30m, max 3 attempts)
- Events: case.created, case.status_changed, case.assigned, case.document_generated, case.resolved, inspection.received, claim.submitted, claim.outcome_received

**Cross-cutting** (`backend/app/api/v1/errors.py`, `middleware.py`):
- Structured error format: `{"error": {"code": "...", "message": "...", "details": [...], "request_id": "req_..."}}`
- X-Request-Id on every response
- X-RateLimit-Limit/Remaining/Reset headers (static for v1, enforcement deferred until Redis)
- Idempotency-Key support on POST endpoints (DB-backed, 24hr TTL)
- OpenAPI 3.1 spec auto-generated at `/v1/openapi.json`, Swagger UI at `/v1/docs`

**Database tables** (5 new + inspections extended):
- `api_applications` — partner app registration (client_id, client_secret_hash, tenant_id, scopes)
- `api_keys` — sandbox API keys (key_hash, scopes, expires_at)
- `api_webhook_registrations` — partner webhook endpoints (url, events, secret_encrypted)
- `api_webhook_deliveries` — outbound delivery log (status, attempts, retry backoff)
- `api_idempotency_keys` — response cache with TTL
- `inspections` extended: inspection_type, external_reference, inspector_name, inspected_at, source, rooms_data (JSONB), property_id now nullable

**ORM models** (`backend/app/models/api_*.py`):
- ApiApplication, ApiKey — TenantScopedModel (soft-delete, timestamps)
- ApiWebhookRegistration — TenantScopedModel with secret_encrypted (BYTEA)
- ApiWebhookDelivery, ApiIdempotencyKey — UUIDPrimaryKeyMixin only (append-only, no soft delete)

**Service layer** (`backend/app/services/public_api.py`):
- PublicApiService: match_property(), find_active_tenancy(), create_inspection(), list_cases(), get_case_detail(), get_document_download()

**Repositories** (`backend/app/repositories/public_api.py`):
- ApiApplicationRepository, ApiKeyRepository, ApiWebhookRegistrationRepository, ApiWebhookDeliveryRepository, ApiIdempotencyKeyRepository

### Current state
- Reapit sandbox (SBOX) connected in production — 1,000 properties + 636 tenancies synced
- Public API v1 live at `https://backend.renovoai.co.uk/v1/`
- Swagger UI at `https://backend.renovoai.co.uk/v1/docs`
- All 8 endpoint paths serving correctly (OAuth, inspections, cases, webhooks)
- 11 existing cases queryable via the public API

## Key technical decisions

1. **Reapit uses Client Credentials** — no OAuth redirect. Global client_id/secret in env vars, per-agency customer_id in connection config.
2. **Webhook dedupe scoped to (connection_id, idempotency_key)** — not provider-global.
3. **WebhookAuthPolicy** declared per connector (SIGNATURE_REQUIRED, SIGNATURE_OPTIONAL, PAYLOAD_VERIFIED, NOT_SUPPORTED).
4. **Credential encryption** via Fernet (cryptography library). Single key in CREDENTIAL_ENCRYPTION_KEY env var.
5. **Health state machine**: unknown→healthy→degraded→unhealthy. Auth errors go directly to unhealthy.
6. **Pagination capped at 10 pages** (1000 records) per sync to stay within Vercel's 60s function timeout.
7. **No status filters** on Reapit property/tenancy pulls — SBOX has non-standard statuses (e.g., "valuation").
8. **Public API uses HS256 JWT** — signed with PUBLIC_API_JWT_SECRET env var. Same-service auth, RS256 unnecessary.
9. **Rate limiting deferred** — headers present but enforcement requires Redis (no persistent state on Vercel serverless).
10. **Public API mounted as sub-application** — separate FastAPI() instance at `/v1` with independent OpenAPI docs and error handlers.
11. **Token endpoint uses manual form parsing** — `urllib.parse.parse_qs` instead of FastAPI `Form()` to avoid `python-multipart` dependency which isn't in the Vercel runtime.
12. **Directory named `app/api/v1/` not `app/api/public/`** — Vercel's `@vercel/static` builder matches `public/**/*` glob and strips those files from the function deployment. Renaming avoids the conflict.
13. **Empty `__init__.py` files must have content** — Vercel skips zero-byte files during deployment, breaking Python package imports.

## Environment variables (Vercel backend project)

```
CREDENTIAL_ENCRYPTION_KEY=AuENA6P8Hldqk1qdIujpKoNfM685IVIOY5Q_TqXGMEg=
REAPIT_CLIENT_ID=htq53v5uAIzX8p5Iouq6bj9mQQCW7piR
REAPIT_CLIENT_SECRET=HHspj1-r-2kpVQlEaWNuBjsGdRkzakq0BXbhKQRdivrxPK2BrG7o96wgobe3OC4n
REAPIT_REDIRECT_URI=https://renovoai.co.uk/api/reapit/callback
PUBLIC_API_JWT_SECRET=OrKxqzrqj185CiXe7KfrEzUmLXiEnWL2i9ltvfqfC6Y
```

IMPORTANT: Use `printf '%s' 'value'` (not `echo`) when setting via `vercel env add` — `echo` adds a trailing newline that corrupts the values.

## Vercel deployment gotchas

1. **Never name a Python package directory `public/`** — Vercel's `@vercel/static` builder glob `public/**/*` will steal those files from the Python function.
2. **Never commit empty `__init__.py` files** — Vercel skips zero-byte files. Always add at least a comment.
3. **Don't use FastAPI `Form()` params** — requires `python-multipart` which isn't reliably available in the Vercel Python runtime. Parse form bodies manually with `urllib.parse.parse_qs`.
4. **`requirements.txt` exists but Vercel uses `pyproject.toml`** — the `uv` installer reads `[project].dependencies` from pyproject.toml. Keep both in sync.
5. **Deploy with `vercel --prod`** from the `backend/` directory. Deploys from working directory (not git HEAD).

## Repos

- **Frontend**: github.com/muhtal27/renovo-dashboard (main branch) — deploys to Vercel (renovoai.co.uk)
- **Backend**: github.com/muhtal27/renovo-backend (main branch) — deploys to Vercel (backend.renovoai.co.uk)
- Backend is gitignored from frontend repo but lives at `/Users/retailltd/renovo-dashboard/backend/` locally

## What to build next

### Phase 4: Deposit scheme connectors
Spec: `docs/integrations/09-phased-implementation-plan.md` (Phase 4 section)
- TDS, DPS, mydeposits connectors
- Full claim lifecycle: submit, upload evidence, track dispute, pull outcome
- BLOCKER: need API access from each scheme (outreach required)

### Phase 5: Rule engine + polish
Spec: `docs/integrations/06-rule-engine-v1.md`
- automation_rules + rule_execution_log tables
- Trigger→condition→action engine
- Settings UI for rule management

### NLG onboarding (post-Phase 3)
- Create NLG sandbox tenant with test data
- Issue NLG sandbox API key via `api_applications` + `api_keys` tables
- Write NLG-specific integration guide
- Support NLG through initial integration

## Cleanup items for next session

1. **Remove debug-pull endpoint** — `backend/app/api/reapit/router.py` has a temporary `/debug-pull` diagnostic endpoint and `app/api/reapit/debug-pull/route.ts` frontend proxy. Remove both.
2. **Remove tracked __pycache__** — some may have crept back in. Run `git rm -r --cached '*.pyc'` if needed.
3. **Street.co.uk migration** — the old StreetConnection/StreetSyncLog tables and code still exist alongside the new generic framework. Plan migration to use IntegrationConnection.
4. **Squash diagnostic commits** — the backend git history has several diagnostic commits from debugging the Vercel deployment. Consider squashing before the next feature branch.
5. **Partner onboarding UI** — the Settings page currently has no UI for managing API applications or API keys. Operators need a panel to create partner apps, issue keys, and view webhook registrations.
6. **Inspection → Case pipeline** — when a partner pushes an inspection via `POST /v1/inspections`, it creates the Inspection record but does NOT auto-create a Case. The agency still needs to manually create cases from matched inspections. Consider automating this.

## Files to read first in next session

1. `docs/integrations/HANDOFF.md` — this file
2. `docs/integrations/00-overview.md` — architecture and glossary
3. `docs/integrations/09-phased-implementation-plan.md` — full phase breakdown with tickets
4. `backend/app/api/v1/router.py` — public API router assembly
5. `backend/app/api/v1/auth.py` — OAuth + API key auth
6. `backend/app/services/public_api.py` — inspection creation + case queries
7. `backend/app/services/webhook_delivery.py` — outbound webhook engine
8. `backend/app/integrations/base.py` — connector interface
9. `backend/app/integrations/reapit/connector.py` — working connector example
