# Canonical Domain Model

## Field Ownership Matrix

### Agency / Tenant

| Aspect | Value |
|--------|-------|
| Purpose | Multi-tenant root entity representing a letting agency |
| Source of truth | Renovo (agencies register with us) |
| Stored permanently | id, name, slug, settings, created_at |
| Cached from external | Nothing — this is Renovo-native |
| Editable in Renovo | Yes |
| Written back externally | No |
| External ID mapping | Not applicable |
| Deletion behavior | Soft delete; cascades to all tenant-scoped data |

### Property

| Aspect | Value |
|--------|-------|
| Purpose | A rental property managed by the agency |
| Source of truth | **PMS** (Reapit, Street, etc.) |
| Stored permanently | Internal ID, tenant_id, external references |
| Cached from external | name, address_line_1, address_line_2, city, postcode, country_code, reference |
| Editable in Renovo | **No** — read-only cache. Operator sees but cannot modify address data |
| Written back externally | No — properties are never created by Renovo |
| External ID mapping | `external_refs` table: (entity_type='property', internal_id, provider, external_id) |
| Deletion behavior | Soft delete. If PMS marks as archived, set deleted_at on next sync |

### Tenancy

| Aspect | Value |
|--------|-------|
| Purpose | A tenancy agreement between tenant and landlord for a property |
| Source of truth | **PMS** |
| Stored permanently | Internal ID, tenant_id, property_id, external references |
| Cached from external | tenant_name, tenant_email, landlord_name, start_date, end_date, deposit_amount, deposit_scheme |
| Editable in Renovo | **Conditional** — deposit_scheme can be set/corrected by operator if PMS doesn't provide it |
| Written back externally | **Conditional** — tenancy status ("checked out") written back when case reaches `resolved` |
| External ID mapping | `external_refs` table: (entity_type='tenancy', internal_id, provider, external_id) |
| Deletion behavior | Soft delete. Never hard-delete tenancies with linked cases |

### Landlord

| Aspect | Value |
|--------|-------|
| Purpose | Contact record for the property owner |
| Source of truth | **PMS** |
| Stored permanently | Internal ID, tenant_id |
| Cached from external | name, email, phone (embedded in tenancy or separate contact table if needed) |
| Editable in Renovo | **No** |
| Written back externally | No |
| External ID mapping | `external_refs` table: (entity_type='landlord', internal_id, provider, external_id) |
| Deletion behavior | Soft delete |

Note: In v1, landlord data is stored as fields on the `tenancies` table (landlord_name). A separate `contacts` table may be introduced in v2 for richer contact management.

### Tenant (the person renting)

| Aspect | Value |
|--------|-------|
| Purpose | Contact record for the renting individual |
| Source of truth | **PMS** |
| Stored permanently | Internal ID, tenant_id |
| Cached from external | name, email, phone (embedded in tenancy record in v1) |
| Editable in Renovo | **No** |
| Written back externally | No |
| External ID mapping | `external_refs` table: (entity_type='person', internal_id, provider, external_id) |
| Deletion behavior | Soft delete |

### Inspection

| Aspect | Value |
|--------|-------|
| Purpose | A property inspection event (check-in, check-out, interim) |
| Source of truth | **Shared** — created by inventory provider (NLG) or PMS, enriched by Renovo |
| Stored permanently | Full record including extracted structured data |
| Cached from external | title, status, scheduled_for, notes |
| Editable in Renovo | **Yes** — Renovo processes and annotates inspection data |
| Written back externally | **Conditional** — completion status and linked case reference written back to PMS |
| External ID mapping | `external_refs` table: (entity_type='inspection', internal_id, provider, external_id) |
| Deletion behavior | Soft delete |

### Case

| Aspect | Value |
|--------|-------|
| Purpose | An end-of-tenancy case being processed through Renovo's workflow |
| Source of truth | **Renovo** |
| Stored permanently | Full record — this is Renovo's core domain object |
| Cached from external | Nothing — cases originate in Renovo |
| Editable in Renovo | **Yes** — full CRUD |
| Written back externally | **Yes** — status, summary, assigned operator, key dates, linked documents pushed to PMS |
| External ID mapping | When synced out, store PMS's returned reference: `external_refs` (entity_type='case', provider, external_id) |
| Deletion behavior | Soft delete. Cases in `submitted`/`disputed`/`resolved` are never deleted |

### Issue (Defect)

| Aspect | Value |
|--------|-------|
| Purpose | An identified defect/issue within a case |
| Source of truth | **Renovo** |
| Stored permanently | Full record |
| Cached from external | Nothing |
| Editable in Renovo | **Yes** |
| Written back externally | **Yes** — as part of full case mirror to PMS (summary or structured) |
| External ID mapping | None in v1 (issues don't exist in PMS) |
| Deletion behavior | Soft delete |

### Evidence

| Aspect | Value |
|--------|-------|
| Purpose | Photos, videos, documents supporting a case |
| Source of truth | **Renovo** (may originate from inventory provider via public API) |
| Stored permanently | Full record + file in Supabase Storage |
| Cached from external | Nothing |
| Editable in Renovo | **Yes** |
| Written back externally | **Conditional** — key evidence files may be attached to case record in PMS |
| External ID mapping | If pushed from partner API, store partner's reference |
| Deletion behavior | Soft delete record; files retained for compliance (90 days after case resolution) |

### Document

| Aspect | Value |
|--------|-------|
| Purpose | Formal documents (check-in reports, tenancy agreements, charge letters) |
| Source of truth | **Mixed** — check-in/checkout reports from inventory provider; charge letters from Renovo |
| Stored permanently | Full record + file |
| Cached from external | Inventory reports pushed via public API are stored permanently |
| Editable in Renovo | **Yes** — Renovo-generated documents. No for externally-sourced documents |
| Written back externally | **Yes** — generated documents (liability report, charge letter) pushed to PMS |
| External ID mapping | If from partner, store their document reference |
| Deletion behavior | Soft delete; files retained per compliance policy |

### Timeline Event

| Aspect | Value |
|--------|-------|
| Purpose | Audit trail of actions taken on a case |
| Source of truth | **Renovo** |
| Stored permanently | Full record (append-only, never edited) |
| Cached from external | Nothing |
| Editable in Renovo | **No** — append-only |
| Written back externally | **Yes** — timeline summary pushed as part of case mirror |
| External ID mapping | None |
| Deletion behavior | Never deleted (audit trail) |

### Claim

| Aspect | Value |
|--------|-------|
| Purpose | The deposit claim generated from case issues |
| Source of truth | **Renovo** |
| Stored permanently | Full record |
| Cached from external | Nothing |
| Editable in Renovo | **Yes** |
| Written back externally | **Yes** — claim amount and breakdown pushed to PMS; full claim submitted to deposit scheme |
| External ID mapping | Deposit scheme reference stored after submission |
| Deletion behavior | Soft delete |

### Deposit Dispute

| Aspect | Value |
|--------|-------|
| Purpose | Tracking a dispute raised with a deposit protection scheme |
| Source of truth | **Deposit scheme** (TDS/DPS/mydeposits) |
| Stored permanently | Internal tracking record |
| Cached from external | dispute_reference, status, outcome, adjudicator_notes, decision_date |
| Editable in Renovo | **Conditional** — can add internal notes; cannot modify scheme data |
| Written back externally | N/A — we read from the scheme |
| External ID mapping | Scheme's dispute reference ID |
| Deletion behavior | Never deleted |

### Integration Connection

| Aspect | Value |
|--------|-------|
| Purpose | A configured link between a tenant and an external system |
| Source of truth | **Renovo** |
| Stored permanently | Provider type, status, encrypted credentials, configuration, last_synced_at |
| Cached from external | Nothing |
| Editable in Renovo | **Yes** — admin only |
| Written back externally | No |
| External ID mapping | N/A |
| Deletion behavior | Soft delete; revokes credentials on delete |

### Sync Event / Sync Log

| Aspect | Value |
|--------|-------|
| Purpose | Audit trail of every sync operation (pull or push) |
| Source of truth | **Renovo** |
| Stored permanently | Full record (direction, resource, counts, errors, duration) |
| Cached from external | Nothing |
| Editable in Renovo | **No** — append-only |
| Written back externally | No |
| External ID mapping | N/A |
| Deletion behavior | Retained 90 days, then hard-deleted |

---

## External Reference Mapping Model

### Proposed table: `external_refs`

```sql
CREATE TABLE external_refs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,          -- 'property', 'tenancy', 'person', 'inspection', 'case', 'document'
    internal_id UUID NOT NULL,          -- FK to the internal entity (not enforced via FK for flexibility)
    provider TEXT NOT NULL,             -- 'reapit', 'street', 'nlg', 'tds', 'dps', 'mydeposits'
    external_id TEXT NOT NULL,          -- The ID in the external system
    external_url TEXT,                  -- Optional deep link to the record in the external system
    metadata JSONB DEFAULT '{}',        -- Provider-specific metadata (e.g., reapit app_id, last_etag)
    synced_at TIMESTAMPTZ NOT NULL,     -- When this mapping was last confirmed valid
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_external_refs_active
        UNIQUE NULLS NOT DISTINCT (tenant_id, entity_type, provider, external_id, deleted_at)
);

CREATE INDEX ix_external_refs_internal
    ON external_refs (tenant_id, entity_type, internal_id)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_external_refs_provider_lookup
    ON external_refs (tenant_id, provider, entity_type, external_id)
    WHERE deleted_at IS NULL;
```

### Lookup patterns

```python
# Find internal property by Reapit ID
SELECT internal_id FROM external_refs
WHERE tenant_id = :tid AND entity_type = 'property'
  AND provider = 'reapit' AND external_id = :reapit_property_id
  AND deleted_at IS NULL;

# Find all external IDs for an internal case
SELECT provider, external_id, external_url FROM external_refs
WHERE tenant_id = :tid AND entity_type = 'case' AND internal_id = :case_id
  AND deleted_at IS NULL;
```

---

## Canonical IDs

- All internal IDs are UUID v7 (time-ordered for index performance)
- External IDs are stored as TEXT (providers use varying formats — UUIDs, integers, slugs)
- A single internal entity can have multiple external references (one per connected provider)
- External references are scoped to tenant_id (prevents cross-tenant leakage)

## Timestamps to Track

| Field | Purpose | Stored on |
|-------|---------|-----------|
| `created_at` | When the internal record was created | All entities |
| `updated_at` | When the internal record was last modified | All entities |
| `synced_at` | When the external data was last pulled/confirmed | `external_refs`, `integration_connections` |
| `external_modified_at` | The external system's last-modified timestamp (for change detection) | Stored in `external_refs.metadata.modified_at` |
| `pushed_at` | When case data was last pushed to the external system | `integration_sync_logs` (direction='outbound') |

## Tenant Isolation Rules

1. All `external_refs` rows are scoped by `tenant_id`
2. A connector's credentials are stored per-tenant — no shared credentials across agencies
3. Webhook ingestion must resolve tenant_id from the webhook payload or registered endpoint before processing
4. Public API requests carry the tenant context via OAuth token claims (see 07-security.md)
5. A single Reapit installation ID maps to exactly one Renovo tenant
6. Cross-tenant data access is impossible at the repository layer (TenantScopedRepository enforces WHERE tenant_id = :tid)
