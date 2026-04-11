# Integration Platform — Session Handoff

> Written: 2026-04-11 after completing Phase 1 (foundation) and Phase 2 (Reapit connector)

## What was built

### Phase 1: Integration Foundation
Six new database tables deployed to Supabase production:
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

### Current state
- Reapit sandbox (SBOX) connected in production
- 1,000 properties + 636 tenancies synced from SBOX
- 1,636 external_refs created
- Incremental sync working (modifiedFrom filter)
- Connection health: active/healthy

## Key technical decisions

1. **Reapit uses Client Credentials** — no OAuth redirect. Global client_id/secret in env vars, per-agency customer_id in connection config.
2. **Webhook dedupe scoped to (connection_id, idempotency_key)** — not provider-global.
3. **WebhookAuthPolicy** declared per connector (SIGNATURE_REQUIRED, SIGNATURE_OPTIONAL, PAYLOAD_VERIFIED, NOT_SUPPORTED).
4. **Credential encryption** via Fernet (cryptography library). Single key in CREDENTIAL_ENCRYPTION_KEY env var.
5. **Health state machine**: unknown→healthy→degraded→unhealthy. Auth errors go directly to unhealthy.
6. **Pagination capped at 10 pages** (1000 records) per sync to stay within Vercel's 60s function timeout.
7. **No status filters** on Reapit property/tenancy pulls — SBOX has non-standard statuses (e.g., "valuation").

## Environment variables (Vercel backend project)

```
CREDENTIAL_ENCRYPTION_KEY=AuENA6P8Hldqk1qdIujpKoNfM685IVIOY5Q_TqXGMEg=
REAPIT_CLIENT_ID=htq53v5uAIzX8p5Iouq6bj9mQQCW7piR
REAPIT_CLIENT_SECRET=HHspj1-r-2kpVQlEaWNuBjsGdRkzakq0BXbhKQRdivrxPK2BrG7o96wgobe3OC4n
REAPIT_REDIRECT_URI=https://renovoai.co.uk/api/reapit/callback
```

IMPORTANT: Use `printf '%s' 'value'` (not `echo`) when setting via `vercel env add` — `echo` adds a trailing newline that corrupts the values.

## Repos

- **Frontend**: github.com/muhtal27/renovo-dashboard (main branch) — deploys to Vercel (renovoai.co.uk)
- **Backend**: github.com/muhtal27/renovo-backend (main branch) — deploys to Vercel (backend.renovoai.co.uk)
- Backend is gitignored from frontend repo but lives at `/Users/retailltd/renovo-dashboard/backend/` locally

## What to build next

### Phase 3: Public API for partners (NLG)
Spec: `docs/integrations/04-public-api-v1.md`
- OAuth 2.0 client credentials + API key auth for partners
- POST /v1/inspections (push inventory data)
- GET /v1/cases (query case status)
- Webhook delivery to partners
- OpenAPI spec generation

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

## Cleanup items for next session

1. **Remove debug-pull endpoint** — `backend/app/api/reapit/router.py` has a temporary `/debug-pull` diagnostic endpoint and `app/api/reapit/debug-pull/route.ts` frontend proxy. Remove both.
2. **Remove tracked __pycache__** — some may have crept back in. Run `git rm -r --cached '*.pyc'` if needed.
3. **Street.co.uk migration** — the old StreetConnection/StreetSyncLog tables and code still exist alongside the new generic framework. Plan migration to use IntegrationConnection.

## Files to read first in next session

1. `docs/integrations/00-overview.md` — architecture and glossary
2. `docs/integrations/09-phased-implementation-plan.md` — full phase breakdown with tickets
3. `backend/app/integrations/base.py` — connector interface
4. `backend/app/services/integration_sync.py` — sync engine
5. `backend/app/integrations/reapit/connector.py` — working connector example
