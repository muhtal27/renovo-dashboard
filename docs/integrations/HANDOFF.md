# Integration Platform — Session Handoff

> Updated: 2026-04-11 after completing Phase 1-5, bug sweep, and known issue fixes (10 of 13 resolved)

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
- `auth.py` — Client Credentials token exchange with in-memory cache per customer_id, asyncio.Lock for concurrency safety
- `client.py` — ReapitApiClient (httpx async, auto-pagination, 10-page cap for Vercel timeout)
- `mappings.py` — PROPERTY_MAPPING, TENANCY_MAPPING (validated against real SBOX data)
- `connector.py` — ReapitConnector implementing BaseConnector, registered via @register_connector, PAYLOAD_VERIFIED webhook policy

Reapit-specific API (`backend/app/api/reapit/`):
- `POST /connect` — validates customer_id, creates connection, triggers backfill
- `POST /test` — lightweight health check
- `POST /debug-pull` — TEMPORARY diagnostic endpoint (guarded: disabled in production)

Frontend:
- `app/api/reapit/authorize/route.ts` — proxy to /connect
- `app/api/reapit/test/route.ts` — proxy to /test
- `app/(operator)/settings/settings-tabs.tsx` — ReapitIntegrationPanel with customer ID input, sync controls, log table

### Phase 3: Public API v1 for Partners (NLG)
Full public REST API deployed at `https://backend.renovoai.co.uk/v1/`.

**Auth system** (`backend/app/api/v1/auth.py`):
- `POST /v1/oauth/token` — OAuth 2.0 Client Credentials flow, returns HS256 JWT with tenant_id + scopes + rate_limit
- API key validation for sandbox (prefix `renv1_test_sk_`)
- `require_scope(scope)` dependency factory for per-endpoint authorization
- JWT claims: sub (client_id), tenant_id, app_id, scopes, rate_limit, exp (1hr default)
- Unprefixed JWTs are rejected (security fix applied this session)
- Content-Type enforcement on token endpoint

**Core endpoints** (`backend/app/api/v1/inspections.py`, `cases.py`):
- `POST /v1/inspections` — push inspection/inventory data from partners, auto-matches property by normalized postcode + address_line_1
- `POST /v1/inspections/{id}/documents` — add documents to inspections
- `GET /v1/cases` — cursor-paginated case list with tenancy_id and status filters
- `GET /v1/cases/{id}` — full case detail with issues (+ estimated_cost from recommendations), documents, timeline
- `GET /v1/cases/{id}/documents/{doc_id}/download` — document download URL

**Webhook system** (`backend/app/api/v1/webhooks.py`, `backend/app/services/webhook_delivery.py`):
- `POST /v1/webhooks` — register HTTPS endpoint, validates event names, encrypts secret via Fernet, min 32-char secret
- `GET /v1/webhooks` — list active registrations for app
- `DELETE /v1/webhooks/{id}` — soft-delete (consistent app_id + tenant_id authorization)
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

### Phase 4: Deposit Scheme Connectors (Stubs)
Five deposit scheme connectors registered, with stub implementations awaiting API access.

**Shared base** (`backend/app/integrations/deposit_scheme_base.py`):
- `DepositSchemeConnectorBase(BaseConnector)` — stubs for `submit_claim()`, `upload_evidence()`, `get_dispute_status()` that raise `NotImplementedError`

**Five connectors** (each with `__init__.py`, `connector.py`, `client.py`):
- `backend/app/integrations/tds/` — Tenancy Deposit Scheme (TDS)
- `backend/app/integrations/dps/` — Deposit Protection Service (DPS)
- `backend/app/integrations/mydeposits/` — mydeposits
- `backend/app/integrations/safedeposits_scotland/` — SafeDeposits Scotland
- `backend/app/integrations/lps/` — Letting Protection Service Scotland

All registered with `ConnectorType.DEPOSIT_SCHEME`, capabilities: `SUBMIT_CLAIM`, `UPLOAD_EVIDENCE`, `TRACK_DISPUTE`, `PULL_OUTCOME`. `WebhookAuthPolicy.NOT_SUPPORTED`.

**Claim submission service** (`backend/app/services/claim_submission.py`):
- `ClaimSubmissionService` with `submit_claim()`, `upload_evidence()`, `check_claim_status()`
- Orchestrates: find deposit connection → call connector → update Claim model → transition case status → create sync log → emit `claim.submitted` event
- Returns 503 when stub connector raises `NotImplementedError`

**API endpoints** (`backend/app/api/integrations/deposit_scheme.py`):
- `POST /api/integrations/cases/{case_id}/submit-claim` — submit to scheme (503 until real API)
- `POST /api/integrations/cases/{case_id}/upload-evidence` — upload evidence bundle
- `GET /api/integrations/cases/{case_id}/claim-status` — poll scheme for status

**Database extension** (migration `20260411_0003`):
- `claims` table extended with: `scheme_provider`, `scheme_reference`, `scheme_status`, `submitted_at`, `outcome` (JSONB), `outcome_received_at`, `adjudicator_notes`
- Index: `ix_claims_scheme_provider_status`

**Frontend**:
- 3 proxy routes at `app/api/integrations/cases/[caseId]/`
- "Submit to deposit scheme" button on `step-ready.tsx` (shows info on 503)
- Scheme status tracker on `step-submitted.tsx` with status badges
- 5 deposit scheme entries in Settings with "Coming soon" panels

### Phase 5: Rule Engine v1
Trigger-condition-action automation system for agencies.

**Database** (migration `20260411_0004`):
- `automation_rules` — per-tenant rule definitions (trigger_event, conditions JSONB, action_type, action_params JSONB, priority, soft-delete)
- `rule_execution_log` — append-only audit trail for every rule evaluation

**Rule engine core** (`backend/app/services/rule_engine.py`):
- `RuleEngine.process_event(tenant_id, event_type, payload)` — evaluates matching active rules sequentially
- 7 condition evaluators (dict registry): tenancy.end_date_within_days, tenancy.deposit_scheme_is, case.status_is, case.priority_is, case.has_no_assignee, inspection.type_is, property.postcode_starts_with
- 6 action executors (dict registry): create_case (sync), assign_case (sync, supports round_robin/least_loaded), send_notification (async, v1 stub), change_case_status (sync), start_analysis (async fire-and-forget), log_timeline_event (sync)
- Loop prevention via `contextvars.ContextVar` — re-entrant events persist for audit but don't re-trigger rule evaluation
- Failure isolation — each rule wrapped in try/except, failures never block other rules

**Event wiring** (5 callsites connected):
- `IntegrationEventDispatcher.emit()` now calls `RuleEngine.process_event()` inline after persisting each event
- `EOTService.transition_case_status()` emits `case.status_changed`
- `IntegrationSyncService.run_pull()` emits `connection.sync_completed` after each resource sync
- `SyncProcessor.process_tenancies()` emits `tenancy.ending_soon` (<=60 days) and `tenancy.ended`
- Public API `create_inspection` emits `inspection.received`

**Backend API** (`backend/app/api/integrations/automation.py`, mounted at `/api/integrations/automation`):
- `GET/POST /rules` — list and create rules
- `GET/PUT/DELETE /rules/{rule_id}` — single rule CRUD
- `PATCH /rules/{rule_id}/toggle` — enable/disable toggle
- `GET /logs` — execution log (filterable by rule_id)
- `GET /templates` — 4 default templates
- `POST /templates/{template_id}/activate` — create inactive rule from template

**Frontend**:
- 6 proxy routes at `app/api/integrations/automation/`
- "Automation" tab in Settings with Rules sub-view (CRUD table, create/edit wizard, templates) and Execution Log sub-view
- Rule wizard: trigger dropdown -> conditions (0-3 with params) -> action with params -> name

**Default templates** (`backend/app/services/rule_templates.py`):
1. Auto-create case 28 days before tenancy end
2. Auto-create case on checkout inspection received
3. Notify manager when case reaches review
4. Alert on claim deadline (7 days)

### Bug Sweep (34 fixes applied this session)

**Phase 1 fixes (6):**
1. Webhook status filter used wrong enum value (`"degraded"` → `ConnectionStatus.ACTIVE`)
2. `validate_connection` treated all errors as auth failures → only `ConnectorAuthError` is auth
3. Missing `on_connect()` lifecycle hook after connection creation
4. `generate_key()` crash guard when cryptography not installed
5. `_parse_date` datetime subclass handling
6. `_parse_decimal` now accepts zero deposits

**Phase 2 fixes (7):**
7. `_format_reapit_datetime` ensures UTC conversion
8. Webhook auth policy `SIGNATURE_REQUIRED` → `PAYLOAD_VERIFIED` (Reapit uses Ed25519)
9. Dead `uuid7()` removed from connection creation
10. `assert` → `RuntimeError` in ReapitApiClient
11. `Retry-After` header parsing with try/except
12. Empty body handling for 201 responses
13. Incorrect `landlord_id` mapping removed, zero deposit rejection fixed

**Phase 3 fixes (8):**
14. JWT `rate_limit` claim added to token issuance
15. Unprefixed JWTs rejected (security)
16. Document download tenant isolation via single joined query
17. Explicit `attempts=0` on webhook delivery
18. `list_pending()` includes NULL `next_retry_at`
19. Webhook event validation order fixed
20. Consistent `created_at` timestamp in inspections
21. Unnecessary `session.commit()` removed from token issuance

**Hardening fixes (13):**
22. UUID validation on all frontend proxy `connectionId` params
23. Integration proxy permissions `VIEW_CASE` → `MANAGE_SETTINGS`
24. `trigger_sync` maps errors to proper HTTP codes (403/429/409/502)
25. `debug-pull` blocked in production
26. `asyncio.Lock` on Reapit token cache
27. `customer_id` format validation (alphanumeric, 1-50 chars)
28. `inspection_type` typed as `Literal["checkout", "checkin", "interim"]`
29. `max_length` on all public API string fields
30. Webhook `secret` min_length=32
31. `delete_webhook` single query with `app_id` + `tenant_id`
32. Background webhook task wrapped in try/except
33. Malformed cursors return 400
34. Content-Type enforcement on OAuth token endpoint
35. `handleDisconnect` checks response status in frontend

### Code smell sweep (9 fixes applied this session)

36. Removed unused `ConnectionListResponse` schema from `schemas.py` and import from `router.py`
37. `apply_mapping` now logs warning on non-string/non-callable values instead of silent `None`
38. Moved lazy imports (`Capability`, `SyncProcessor`, `IntegrationEventDispatcher`) to top-level in `integration_sync.py`
39. `_resolve_path` now supports list indexing (e.g., `"rooms[0].name"`)
40. Sync log count fields now have Python-side `default=0` alongside `server_default`
41. `IntegrationEventDispatcher.emit()` docstring updated (now says "persisted immediately, then rule engine invoked inline")
42. Fixed `handleTest` double-parsing response body in both Street and Reapit panels (parse once, branch on status)
43. Token cache bounded to 100 entries with expired-entry eviction on each insert
44. Added duplicate webhook URL prevention (`409 duplicate_webhook` on `POST /v1/webhooks`)

### Cleanup applied this session

45. Removed `/debug-pull` endpoint from `backend/app/api/reapit/router.py` and `app/api/reapit/debug-pull/route.ts`
46. `__pycache__` confirmed not tracked in git (`.gitignore` covers it)
47. Inspection → Case pipeline now handled by rule engine template "Auto-create case on checkout received"

### Current state
- Reapit sandbox (SBOX) connected in production — 1,000 properties + 636 tenancies synced
- Public API v1 live at `https://backend.renovoai.co.uk/v1/`
- Swagger UI at `https://backend.renovoai.co.uk/v1/docs`
- All 8 endpoint paths serving correctly (OAuth, inspections, cases, webhooks)
- 5 deposit scheme connectors registered (stubs, returning 503)
- 3 deposit scheme API endpoints live (submit-claim, upload-evidence, claim-status)
- 11 existing cases queryable via the public API
- 34 bug fixes + 12 code smell/cleanup fixes + 10 known issue fixes deployed
- Rule engine v1 deployed with 7 conditions, 6 actions, 4 templates
- Webhook retry cron running daily at 3am UTC via Vercel cron (Hobby plan limit)
- Document download URLs now use Supabase signed URLs (1hr expiry)
- 5 event emission points wired (case status, sync, tenancy lifecycle, inspections)
- Automation tab live in Settings (rule CRUD, execution log, templates)

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
14. **Deposit scheme stubs return 503** — full code path exercised, real API swapped in per-connector when access arrives.
15. **Shared DepositSchemeConnectorBase** — reduces duplication across 5 near-identical connectors while keeping each independently registerable.
16. **Dual storage for scheme references** — `scheme_reference` on Claim (fast queries) + ExternalRef (framework consistency).
17. **Rule engine runs inline** — called synchronously from `IntegrationEventDispatcher.emit()` after persisting each event. No background consumer needed.
18. **Loop prevention via contextvars** — `_rule_engine_processing` ContextVar prevents re-entrant rule evaluation. Actions that emit events (e.g., `change_case_status`) persist events for audit but don't re-trigger rules.
19. **Async actions use asyncio.create_task()** — `send_notification` and `start_analysis` fire-and-forget since `BackgroundTasks` isn't available in service context.
20. **send_notification is a v1 stub** — logs intent but doesn't deliver. Requires notification infrastructure (not yet built).

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

### Phase 4 completion: Wire real deposit scheme APIs
When API access arrives from any scheme:
1. Implement real API calls in `backend/app/integrations/{scheme}/client.py`
2. Override stub methods in the connector's `connector.py`
3. Add connection flow to Settings UI (replace "Coming soon" panel)
4. Test full claim lifecycle: submit → upload evidence → check status → auto-resolve

**BLOCKER:** API access required from each scheme:

| Scheme | Status | Contact |
|--------|--------|---------|
| TDS | Pending | developer support |
| DPS | Pending | developer support |
| mydeposits | Pending | developer support |
| SafeDeposits Scotland | Pending | developer support |
| LPS | Pending | developer support |

### Phase 5 improvements (post-v1)
- **Notification delivery** — wire `send_notification` action to actual email/in-app infrastructure
- **Scheduled triggers** — daily background scan for `tenancy.ending_soon` and `claim.deadline_approaching` (currently detection depends on sync frequency)
- **Rule retry** — automatic retry for failed actions (currently operator must manually re-trigger)
- **Rule versioning** — currently relies on soft-delete + audit log
- **Cross-tenant templates** — agency group shared templates (marketplace)

### NLG onboarding (post-Phase 3)
- Create NLG sandbox tenant with test data
- Issue NLG sandbox API key via `api_applications` + `api_keys` tables
- Write NLG-specific integration guide
- Support NLG through initial integration

## Remaining known issues

### Resolved (this session)
1. ~~**Health state overwritten after partial sync**~~ — Fixed: only mark healthy if ALL resources succeed; mixed results preserve failure count and set DEGRADED
2. ~~**`run_pull` commits mid-loop**~~ — Fixed: changed mid-loop `commit()` to `flush()` for atomic final commit
3. **Webhook intake has no tenant_id filter** — Accepted: existing signature verification per-connector is the security layer; UUID unguessability is defense-in-depth
4. ~~**Token cache keyed per customer_id**~~ — Fixed: cache key now `"{client_id}:{customer_id}"` to prevent cross-tenant token sharing
5. ~~**`_get_public_key` uses sync httpx in async context**~~ — Fixed: converted to async with `httpx.AsyncClient`; `verify_webhook_signature` now async throughout the chain
6. ~~**`on_connect` doesn't check for duplicate webhooks**~~ — Fixed: lists existing webhooks before creation, skips already-registered topics
7. ~~**Double commit in `create_inspection`**~~ — Fixed: single atomic commit for inspection + idempotency cache
8. ~~**Idempotency cache returns JSONResponse bypassing response pipeline**~~ — Fixed: returns `CachedIdempotencyResponse` dataclass; endpoint validates through response model
9. ~~**Rate limiting headers misleading**~~ — Fixed: removed `X-RateLimit-Remaining` and `X-RateLimit-Reset`; only `X-RateLimit-Limit` (informational) remains. Enforcement deferred until Redis.
10. ~~**Webhook retries never execute**~~ — Fixed: added `process_pending_retries()` to `WebhookDeliveryService`, internal endpoint at `POST /api/internal/webhook-retries`, Vercel cron every 5 minutes
11. ~~**`download_url` returns raw file_url**~~ — Fixed: generates Supabase signed URLs via storage client; falls back to raw URL if Supabase unavailable

### Remaining (see `docs/integrations/REMAINING-ISSUES.md` for full handoff)
12. **Street.co.uk migration** — old StreetConnection/StreetSyncLog tables still exist alongside the new generic framework. Plan migration.
13. **Partner onboarding UI** — Settings page has no UI for managing API applications or API keys.

## Files to read first in next session

1. `docs/integrations/HANDOFF.md` — this file
2. `docs/integrations/REMAINING-ISSUES.md` — detailed handoff for issues 12 + 13
3. `docs/integrations/00-overview.md` — architecture and glossary
4. `backend/app/integrations/reapit/connector.py` — working connector example (model for Street migration)
5. `backend/app/services/street_sync.py` — Street business logic to port
6. `backend/app/repositories/public_api.py` — existing CRUD for API partner models
7. `backend/app/api/v1/auth.py` — public API auth flow
8. `app/(operator)/settings/settings-tabs.tsx` — frontend settings patterns
