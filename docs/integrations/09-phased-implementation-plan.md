# Phased Implementation Plan

## Phase 1: Foundation (Weeks 1-3)

### Goal
Build the generic connector framework, credential vault, and event system. Migrate Street.co.uk to the new pattern to validate the framework.

### Acceptance Criteria
- [ ] `integration_connections` table replaces `street_connections`
- [ ] `external_refs` table operational with Street data migrated
- [ ] `integration_sync_logs` table replaces `street_sync_logs`
- [ ] Credential encryption working (Fernet)
- [ ] BaseConnector interface defined and importable
- [ ] StreetConnector migrated to implement BaseConnector
- [ ] Event dispatcher emitting events on sync completion
- [ ] Existing Street "Sync now" button works through new framework
- [ ] All existing Street tests pass against new implementation

### Workstreams

#### 1.1 Database Schema (3 days)

**Tickets:**
- `INT-001`: Create `integration_connections` table + Alembic migration
- `INT-002`: Create `external_refs` table + Alembic migration
- `INT-003`: Create `integration_sync_logs` table + Alembic migration
- `INT-004`: Create `integration_events` table + Alembic migration
- `INT-005`: Create `integration_audit_log` table + Alembic migration
- `INT-006`: Data migration — copy `street_connections` → `integration_connections` with encryption
- `INT-007`: Data migration — generate `external_refs` rows from existing properties/tenancies with `street:` reference prefix

**Dependencies:** None. Can start immediately.

#### 1.2 Connector Framework (4 days)

**Tickets:**
- `INT-010`: Implement `BaseConnector` abstract class (`backend/app/integrations/base.py`)
- `INT-011`: Implement `ConnectorConfig`, `ConnectionContext`, error classes
- `INT-012`: Implement credential encryption/decryption utilities
- `INT-013`: Implement connector registry (`backend/app/integrations/registry.py`)
- `INT-014`: Implement generic mapping utility (`apply_mapping()`)
- `INT-015`: Implement `IntegrationConnectionRepository` (CRUD, tenant-scoped)

**Dependencies:** INT-001 (needs table to exist)

#### 1.3 Sync Engine (3 days)

**Tickets:**
- `INT-020`: Implement `SyncEngine` service — orchestrates pull operations, writes sync logs
- `INT-021`: Implement external_refs lookup/upsert logic in sync engine
- `INT-022`: Implement conflict detection (source priority, timestamp comparison)
- `INT-023`: Implement health status update logic (consecutive_failures tracking)

**Dependencies:** INT-010, INT-002, INT-003

#### 1.4 Event Dispatcher (2 days)

**Tickets:**
- `INT-030`: Implement `EventDispatcher` — emit events to `integration_events` table
- `INT-031`: Add event emission hooks to sync engine (on sync complete, on entity create/update)
- `INT-032`: Add event emission hooks to case service (on status change, on document generated)

**Dependencies:** INT-004

#### 1.5 Street Migration (3 days)

**Tickets:**
- `INT-040`: Implement `StreetConnector(BaseConnector)` — wrap existing client
- `INT-041`: Implement `STREET_PROPERTY_MAPPING` and `STREET_TENANCY_MAPPING` dicts
- `INT-042`: Update Street API routes to use new `SyncEngine` + `IntegrationConnectionRepository`
- `INT-043`: Update Settings UI to use new connection model (if field names changed)
- `INT-044`: Remove old `street_connections` table reference from code (keep table for rollback)
- `INT-045`: Write integration tests — Street sync through new framework produces same results

**Dependencies:** INT-020, INT-014

#### 1.6 Frontend Settings Generalization (2 days)

**Tickets:**
- `INT-050`: Generalize settings UI to show "Integrations" section with connection cards
- `INT-051`: Abstract Street-specific UI into a generic connection card component
- `INT-052`: Add sync log viewer component (reusable across providers)

**Dependencies:** INT-042

---

## Phase 2: Reapit Connector (Weeks 3-6)

### Goal
Implement the Reapit Foundations connector, OAuth flow, webhook receiver, and outbound push. Submit for marketplace approval.

### Acceptance Criteria
- [ ] OAuth flow completes successfully against Reapit sandbox
- [ ] Properties and tenancies sync from Reapit sandbox
- [ ] Webhooks received and processed (advisory → pull)
- [ ] Case status notes pushed to Reapit journal entries
- [ ] Generated documents attached to Reapit property
- [ ] Connection shows healthy in Settings
- [ ] Marketplace app listing submitted for review

### Workstreams

#### 2.1 Reapit Developer Setup (1 day — can start Week 1)

**Tickets:**
- `INT-100`: Register Reapit developer account
- `INT-101`: Create marketplace app listing (name, icons from `public/reapit/`, description, scopes)
- `INT-102`: Obtain sandbox credentials and customer ID

**Dependencies:** None. START IMMEDIATELY (parallel with Phase 1).

#### 2.2 OAuth Flow (4 days)

**Tickets:**
- `INT-110`: Implement Reapit OAuth callback route (`/api/v1/integrations/reapit/callback`)
- `INT-111`: Implement token exchange and storage (encrypted in `integration_connections`)
- `INT-112`: Implement token refresh logic (with proactive refresh before expiry)
- `INT-113`: Implement "Connect Reapit" button in Settings UI → starts OAuth flow
- `INT-114`: Handle OAuth `state` parameter for tenant resolution
- `INT-115`: Handle Reapit AppMarket-initiated installs (pending connection flow)

**Dependencies:** INT-001 (connection table), INT-012 (encryption)

#### 2.3 Inbound Sync (4 days)

**Tickets:**
- `INT-120`: Implement `ReapitApiClient` (httpx wrapper, pagination, rate limiting)
- `INT-121`: Implement `ReapitConnector.pull_properties()` with mapping
- `INT-122`: Implement `ReapitConnector.pull_tenancies()` with contact resolution
- `INT-123`: Implement `ReapitConnector.validate_credentials()` (health check)
- `INT-124`: Implement initial backfill trigger on connection establishment
- `INT-125`: Implement "Sync now" for Reapit in UI

**Dependencies:** INT-020 (sync engine), INT-112 (token refresh)

#### 2.4 Webhook Receiver (3 days)

**Tickets:**
- `INT-130`: Implement generic webhook route (`/api/v1/webhooks/{provider}/{connection_id}`)
- `INT-131`: Implement Reapit webhook signature verification
- `INT-132`: Implement Reapit webhook → targeted pull (property.modified → pull that property)
- `INT-133`: Register webhooks with Reapit on connection establishment (`on_connect`)
- `INT-134`: Deregister webhooks on connection deletion (`on_disconnect`)
- `INT-135`: Create `integration_webhook_log` table + logging

**Dependencies:** INT-120 (Reapit client), INT-040 (webhook infra from Phase 1 if not done)

#### 2.5 Outbound Push (4 days)

**Tickets:**
- `INT-140`: Implement `ReapitConnector.push_case_status()` → journal entry creation
- `INT-141`: Implement `ReapitConnector.push_case_documents()` → document upload
- `INT-142`: Wire case.status_changed event → outbound push to all connected PMS
- `INT-143`: Wire case.document_generated event → outbound push
- `INT-144`: Handle push failures gracefully (dead letter on exhausted retries)
- `INT-145`: Show "synced to Reapit" indicator on case timeline

**Dependencies:** INT-030 (event dispatcher), INT-120 (Reapit client)

#### 2.6 Marketplace Submission (1 day)

**Tickets:**
- `INT-150`: Finalize app listing (screenshots, description, integration guide)
- `INT-151`: Submit for Reapit marketplace review
- `INT-152`: Address any review feedback

**Dependencies:** All Phase 2 work complete and tested against sandbox

---

## Phase 3: Public API + NLG (Weeks 5-8)

### Goal
Launch public API v1 with OAuth + API key auth, inspection push endpoint, case read endpoints, and webhook delivery. NLG can connect and push inventory data.

### Acceptance Criteria
- [ ] OAuth token issuance working (client credentials)
- [ ] API key issuance and validation working
- [ ] `POST /v1/inspections` accepts and processes inventory data
- [ ] `GET /v1/cases` and `GET /v1/cases/{id}` return case data
- [ ] Webhook registration and delivery working
- [ ] Rate limiting enforced
- [ ] OpenAPI spec generated and accessible
- [ ] Partner onboarding guide written

### Workstreams

#### 3.1 Auth Infrastructure (4 days)

**Tickets:**
- `INT-200`: Create `api_applications` table (partner app registration)
- `INT-201`: Create `api_keys` table (sandbox keys)
- `INT-202`: Implement OAuth token endpoint (`POST /v1/oauth/token`)
- `INT-203`: Implement JWT token generation with tenant_id + scopes
- `INT-204`: Implement API key validation middleware
- `INT-205`: Implement auth middleware that accepts both OAuth tokens and API keys
- `INT-206`: Implement rate limiting (token bucket, per-app)

**Dependencies:** None (independent of Phase 1/2)

#### 3.2 Core API Endpoints (5 days)

**Tickets:**
- `INT-210`: Implement public API router (`backend/app/api/public/router.py`)
- `INT-211`: Implement `POST /v1/inspections` — accept inspection data, match to property
- `INT-212`: Implement `POST /v1/inspections/{id}/documents` — file upload
- `INT-213`: Implement `GET /v1/cases` — list cases with filters + pagination
- `INT-214`: Implement `GET /v1/cases/{id}` — case detail with issues/documents/timeline
- `INT-215`: Implement `GET /v1/cases/{id}/documents/{doc_id}/download` — signed URL
- `INT-216`: Implement idempotency key handling
- `INT-217`: Implement public API error format (structured errors, request_id)

**Dependencies:** INT-205 (auth middleware)

#### 3.3 Webhook Delivery System (3 days)

**Tickets:**
- `INT-220`: Create `api_webhook_registrations` table
- `INT-221`: Create `integration_webhook_deliveries` table
- `INT-222`: Implement `POST /v1/webhooks` — registration endpoint
- `INT-223`: Implement `GET /v1/webhooks` — list registrations
- `INT-224`: Implement `DELETE /v1/webhooks/{id}`
- `INT-225`: Implement webhook delivery engine (sign + send + retry)
- `INT-226`: Wire internal events → outbound webhook delivery

**Dependencies:** INT-030 (event dispatcher)

#### 3.4 Documentation (3 days — can overlap with 3.2)

**Tickets:**
- `INT-230`: Generate OpenAPI spec from FastAPI routes
- `INT-231`: Write "Getting Started" guide for partners
- `INT-232`: Write webhook event catalog
- `INT-233`: Set up developer portal scaffold (static site or Mintlify/Readme)
- `INT-234`: Create partner onboarding flow (apply → credentials → sandbox → production)

**Dependencies:** INT-210+ (API must exist to document)

#### 3.5 NLG Onboarding Support (2 days)

**Tickets:**
- `INT-240`: Create NLG sandbox tenant with test data
- `INT-241`: Issue NLG sandbox API key
- `INT-242`: Write NLG-specific integration guide (tailored to their data format)
- `INT-243`: Support NLG through initial integration (shared Slack channel or similar)

**Dependencies:** INT-211 (inspection endpoint working)

---

## Phase 4: Deposit Scheme Connectors (Weeks 7-10)

### Goal
Implement TDS, DPS, and mydeposits connectors with full claim lifecycle: submit, upload evidence, track status, pull outcome.

### Acceptance Criteria
- [ ] TDS claim submission working (sandbox)
- [ ] DPS claim submission working (sandbox)
- [ ] mydeposits claim submission working (sandbox)
- [ ] Evidence bundle upload working for all three
- [ ] Dispute status tracking working
- [ ] Outcome pulled and reflected in case status
- [ ] Operator UI for managing deposit submissions

### Workstreams

#### 4.1 Scheme API Research & Access (2 days — START IN WEEK 1)

**Tickets:**
- `INT-300`: Contact TDS developer support — request API access and docs
- `INT-301`: Contact DPS developer support — request API access and docs
- `INT-302`: Contact mydeposits developer support — request API access and docs
- `INT-303`: Document each scheme's API format, auth model, and sandbox availability

**Dependencies:** None. START IMMEDIATELY.

#### 4.2 TDS Connector (5 days)

**Tickets:**
- `INT-310`: Implement `TDSApiClient` (httpx wrapper)
- `INT-311`: Implement `TDSConnector.submit_claim()` — create dispute case
- `INT-312`: Implement `TDSConnector.upload_evidence()` — attach files
- `INT-313`: Implement `TDSConnector.get_dispute_status()` — poll status
- `INT-314`: Implement evidence bundle generator (format per TDS requirements)
- `INT-315`: Store TDS claim reference in `external_refs`

**Dependencies:** INT-303 (API docs), INT-010 (BaseConnector)

#### 4.3 DPS Connector (3 days)

**Tickets:**
- `INT-320`: Implement `DPSApiClient`
- `INT-321`: Implement `DPSConnector` (submit, upload, track)
- `INT-322`: Adapt evidence bundle format for DPS

**Dependencies:** INT-303, INT-310 (reuse patterns from TDS)

#### 4.4 mydeposits Connector (3 days)

**Tickets:**
- `INT-330`: Implement `MyDepositsApiClient`
- `INT-331`: Implement `MyDepositsConnector` (submit, upload, track)
- `INT-332`: Adapt evidence bundle format for mydeposits

**Dependencies:** INT-303, INT-310

#### 4.5 Operator UI for Deposit Management (3 days)

**Tickets:**
- `INT-340`: Add "Submit to scheme" action on case workspace (when status = `ready_for_claim`)
- `INT-341`: Add evidence bundle preview/edit before submission
- `INT-342`: Add deposit scheme status tracker (submitted → under review → decision)
- `INT-343`: Auto-update case status on scheme decision (resolved/disputed)
- `INT-344`: Add scheme submission to case timeline

**Dependencies:** INT-310+ (at least one connector working)

#### 4.6 Outcome Sync (2 days)

**Tickets:**
- `INT-350`: Implement "Check status" button (on-demand pull from scheme)
- `INT-351`: Parse scheme decision → update case status
- `INT-352`: Emit `claim.outcome_received` event (for rule engine + PMS push)

**Dependencies:** INT-313

---

## Phase 5: Rule Engine + Polish (Weeks 9-11)

### Goal
Implement configurable automation rules, connection health dashboard, and operational tooling.

### Acceptance Criteria
- [ ] Default rule templates available for activation
- [ ] Custom rule creation via Settings UI
- [ ] Rule execution log visible
- [ ] Connection health dashboard accurate
- [ ] Dead letter management working
- [ ] Data cleanup jobs operational
- [ ] All sync errors surfaced with actionable context

### Workstreams

#### 5.1 Rule Engine (5 days)

**Tickets:**
- `INT-400`: Create `automation_rules` table + migration
- `INT-401`: Create `rule_execution_log` table + migration
- `INT-402`: Implement rule evaluation engine (conditions → action dispatch)
- `INT-403`: Implement all v1 actions: create_case, assign_case, send_notification, change_status, start_analysis, log_timeline
- `INT-404`: Wire event dispatcher → rule evaluation
- `INT-405`: Create default rule templates (seed data)
- `INT-406`: Implement Settings > Automation UI (list, create, edit, enable/disable, logs)

**Dependencies:** INT-030 (event dispatcher)

#### 5.2 Operational Tooling (3 days)

**Tickets:**
- `INT-410`: Implement connection health dashboard component
- `INT-411`: Implement dead letter management UI (retry, skip, bulk actions)
- `INT-412`: Implement sync history viewer (filterable, paginated)
- `INT-413`: Implement data cleanup background function (TTL enforcement)
- `INT-414`: Implement integration audit log viewer (admin only)

**Dependencies:** All tables from earlier phases

#### 5.3 Notifications (2 days)

**Tickets:**
- `INT-420`: Implement "Connection unhealthy" notification (in-app + email)
- `INT-421`: Implement "Dead letters accumulating" notification
- `INT-422`: Implement rule failure notification
- `INT-423`: Badge count on Settings tab for attention items

**Dependencies:** INT-410 (health dashboard)

---

## What Should Be Built Before External Approvals Arrive

These can proceed while waiting for Reapit marketplace approval and deposit scheme API access:

| Work item | Blocked by approval? | Can build now? |
|-----------|---------------------|---------------|
| Connector framework (Phase 1) | No | Yes |
| Database migrations (Phase 1) | No | Yes |
| Street migration to new framework | No | Yes |
| Event dispatcher | No | Yes |
| Public API auth + core endpoints | No | Yes |
| Webhook delivery system | No | Yes |
| Rule engine | No | Yes |
| Reapit OAuth flow (against sandbox) | Need developer account (~48h) | Yes after registration |
| Reapit connector (against sandbox) | Need sandbox credentials | Yes after registration |
| Deposit connectors | Need scheme API access | Build interface + mock, implement when access arrives |
| Developer portal | No | Yes |

## What Can Run in Parallel

```
Week 1:  [Phase 1: Foundation]──────────────────────────┐
         [INT-100-102: Reapit registration]─────────────┤ (parallel)
         [INT-300-303: Deposit scheme outreach]──────────┤ (parallel)
                                                         │
Week 3:  [Phase 2: Reapit connector]────────────────────┤
         [Phase 3.1: Public API auth]───────────────────┤ (parallel)
                                                         │
Week 5:  [Phase 2 contd: Reapit push + marketplace]────┤
         [Phase 3.2-3.4: Public API endpoints + docs]───┤ (parallel)
                                                         │
Week 7:  [Phase 4: Deposit connectors]─────────────────┤
         [Phase 3.5: NLG onboarding]───────────────────┤ (parallel)
                                                         │
Week 9:  [Phase 5: Rule engine + polish]────────────────┘
```

## Team Allocation Suggestion (2-3 engineers)

| Engineer | Primary focus | Secondary |
|----------|--------------|-----------|
| Backend Lead | Connector framework, sync engine, event dispatcher | Reapit connector |
| Backend 2 | Public API, auth, rate limiting | Deposit connectors |
| Frontend | Settings UI generalization, rule engine UI, health dashboard | Developer portal |

With 2 engineers: combine Backend Lead + Backend 2 responsibilities. Frontend work can be done by either backend engineer with React experience (the existing codebase uses React 19 + TanStack Query).
