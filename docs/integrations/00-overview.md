# Integration Platform Overview

## Platform Objective

Build a universal integration layer that allows UK letting agencies to connect Renovo to their existing property management stack — PMS, inventory providers, deposit schemes — so that end-of-tenancy workflows execute seamlessly without data re-entry or context switching.

Renovo becomes invisible infrastructure: results appear in the tools agencies already use.

## Scope

### In scope for v1
- **Reapit Foundations** connector (bidirectional, marketplace app)
- **Public API** for partners (No Letting Go and future inventory providers)
- **Deposit scheme connectors** (TDS, DPS, mydeposits — full lifecycle)
- **Connector framework** (abstract interface, credential vault, sync engine)
- **Rule engine v1** (configurable triggers and actions per agency)
- **Developer portal** scaffold (OpenAPI spec, getting started guide)

### Non-goals for v1
- Alto, Jupix, Expert Agent, Arthur Online, AgentOS connectors (deferred to v2)
- Rightmove / Zoopla data feed consumption
- Complex workflow orchestration (multi-step branching logic)
- Multi-language SDK generation (TypeScript SDK only for v1)
- Self-service marketplace for arbitrary third-party developers
- Real-time streaming / WebSocket push to connected systems
- Data migration tooling from legacy systems

## Core Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data ownership | PMS is source of truth. Renovo caches PMS data, stores its own domain data (cases, defects, assessments) | Agencies trust their PMS; reduces liability |
| Sync direction | Bidirectional. Inbound: property/tenancy data. Outbound: case results, documents, status | Agents see results without leaving their PMS |
| Real-time mechanism | Inbound webhooks (PMS pushes to us) + on-demand pull (operator clicks "sync now") | No scheduled polling; reduces infrastructure cost |
| Multi-connect | Agencies can connect multiple systems simultaneously | An agency may use Reapit for properties AND NLG for inventories AND TDS for deposits |
| Conflict resolution | Source-priority per field with timestamp tiebreaker. PMS wins for master data; Renovo wins for case data | See 03-sync-semantics.md |
| Auth for public API | OAuth 2.0 client credentials (production) + API keys (sandbox) | Industry standard; tiered complexity |
| Background processing | FastAPI BackgroundTasks for v1; graduate to ARQ (Redis-backed) when volume requires | Lightest viable pattern given no existing queue infrastructure |
| Credential storage | Fernet symmetric encryption via `cryptography` library, key from env | Matches current async stack; no new infrastructure |

## Integration Classes

### 1. PMS Connectors (bidirectional)
Systems that own property/tenancy master data. Renovo reads from them and writes case results back.

- **Reapit Foundations** (v1)
- Street.co.uk (existing, to be migrated to generic framework)
- Alto, Jupix, Expert Agent (future)

Characteristics: OAuth or API key auth, webhook support varies, proprietary data models, marketplace listing may be required.

### 2. Partner / Public API Connectors (inbound-primary)
Systems that push data TO Renovo via our public API. They integrate with us, not the reverse.

- **No Letting Go** (v1 — push inventory/inspection data)
- Inventory Base, Imfuna, InventoryHive (future)

Characteristics: We define the contract. Partners authenticate via our OAuth/API key. We provide SDK and docs.

### 3. Deposit Scheme Connectors (outbound-primary)
Systems where Renovo submits claims and tracks outcomes.

- **TDS** (v1)
- **DPS** (v1)
- **mydeposits** (v1)
- SafeDeposits Scotland (future — no API available)

Characteristics: Renovo initiates all interactions. Submissions are document-heavy. Status tracking via polling (schemes lack webhooks). Regulatory compliance required.

## Glossary

| Term | Definition |
|------|-----------|
| **Connector** | A module implementing the connector interface for a specific external system |
| **Connection** | A per-tenant instance of a connector with stored credentials and configuration |
| **Sync run** | A single execution of data synchronization (pull or push) with audit trail |
| **External reference** | A mapping from an external system's ID to a Renovo internal ID |
| **Event** | A domain occurrence (e.g., `case.status_changed`) that can trigger outbound sync or automation |
| **Rule** | A configurable trigger → condition → action triple that automates responses to events |
| **Capability** | A declared feature of a connector (e.g., `can_receive_webhooks`, `can_write_back_cases`) |
| **Credential vault** | Encrypted per-tenant storage for API tokens, OAuth secrets, and refresh tokens |
| **Dead letter** | A failed sync/delivery attempt stored for operator review and manual retry |
| **Backfill** | Initial import of historical data when a connection is first established |
| **Advisory webhook** | A webhook that signals "something changed" but doesn't carry the full payload — Renovo must pull the details |
| **Authoritative webhook** | A webhook carrying the complete updated resource — no pull needed |

## Relationship to Existing Code

The current Street.co.uk integration (`backend/app/integrations/street/`, `StreetConnection`, `StreetSyncLog` models) is the prototype for this framework. It will be migrated to use the generic connector interface, and its tables will be superseded by the new `integration_connections` and `integration_sync_logs` tables.

The existing HMAC auth between Next.js and FastAPI remains unchanged. The public API will use a separate auth mechanism (OAuth 2.0 / API keys) that does not share the internal HMAC secret.
