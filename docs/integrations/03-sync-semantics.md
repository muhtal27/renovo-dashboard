# Sync Semantics

## Webhook Model: Advisory vs Authoritative

| Provider | Webhook type | Implication |
|----------|-------------|-------------|
| Reapit | **Advisory** — sends `{topic: "properties.modified", entityId: "..."}` | Must pull the full resource after receiving webhook |
| Street.co.uk | No webhooks (pull-only) | Always on-demand pull |
| NLG (via public API) | **Authoritative** — partner pushes complete resource payload | Store directly, no pull needed |
| TDS/DPS/mydeposits | No webhooks | Poll status on demand or after claim submission |

**Rule:** Treat all PMS webhooks as advisory. Always pull the canonical resource after receiving a change notification. This prevents stale-webhook issues and partial payloads.

## Pull Model

### On-demand pull (operator-triggered)

1. Operator clicks "Sync now" in settings
2. Platform creates `integration_sync_logs` entry with status=`running`, direction=`inbound`
3. Calls connector's `pull_*` methods with `since=connection.last_synced_at`
4. Sync engine processes returned data through mapping layer
5. Upserts internal entities, creates/updates `external_refs`
6. Updates sync log with counts and status
7. Updates `connection.last_synced_at`

### On-demand pull (webhook-triggered)

1. Webhook arrives → platform identifies entity and provider
2. Immediately pulls ONLY the specific changed entity (not a full sync)
3. Connector calls `get_{entity}(external_id)` — a targeted single-resource pull
4. Processes and upserts
5. Logs as a mini sync (direction=`inbound`, trigger=`webhook`)

## Initial Import / Backfill

When a connection is first established:

1. Operator completes OAuth or enters API key
2. Platform validates credentials via `connector.validate_credentials()`
3. Platform calls `connector.on_connect()` (register webhooks, etc.)
4. Platform triggers full backfill in background:
   - `pull_properties(since=None)` → create all properties + external_refs
   - `pull_tenancies(since=None)` → create all tenancies + external_refs
   - `pull_contacts(since=None)` → create contact records
5. Each resource type is a separate sync log entry
6. If any resource fails, others continue (partial backfill is acceptable)
7. Connection status set to `active` only after at least properties succeed

**Timeout:** Full backfill has a 10-minute maximum. If exceeded, mark sync as `partial` and log which resources completed.

**Deferred backfill for large portfolios:** If property count > 500, backfill runs in batches of 100 with 2s delay between batches to avoid rate limits.

## Incremental Sync

After initial backfill, all subsequent syncs are incremental:

- `since` parameter = `connection.last_synced_at`
- Only modified records are returned by the provider
- If provider doesn't support `modified_since` filtering, connector pulls all and the sync engine diffs locally

**Cursor storage:** `integration_connections.sync_cursor` (JSONB) stores provider-specific pagination state for interrupted syncs:
```json
{
  "properties": { "last_page": 5, "last_modified": "2026-04-10T12:00:00Z" },
  "tenancies": { "last_page": null, "last_modified": "2026-04-10T12:00:00Z" }
}
```

## Replay Handling

If a webhook is received for an entity already at the same version:
1. Pull the resource
2. Compare `external_modified_at` with stored value in `external_refs.metadata.modified_at`
3. If unchanged → skip processing, log as `skipped` in sync log
4. If changed → process normally

This makes the system safe against webhook replays without maintaining a separate replay log.

## Deduplication Strategy

### Inbound (external → Renovo)

Deduplication key: `(tenant_id, entity_type, provider, external_id)`

- If the key exists in `external_refs`: this is an UPDATE
- If the key doesn't exist: this is a CREATE

### Outbound (Renovo → external)

Deduplication key: `(tenant_id, internal_id, provider, event_type)`

- Before pushing, check `integration_sync_logs` for a recent successful push of the same entity+event
- If the last push was < 60s ago with same payload hash → skip (idempotent)
- Include `X-Idempotency-Key: {sync_log_id}` header where provider supports it

### Webhook ingestion

Deduplication key: provider's event ID (from header or payload)

- Store in `integration_webhook_log` table with TTL index
- Check before processing: if exists → return 200, skip processing
- TTL: 24 hours (after which the same event ID can be processed again)

## Idempotency Keys

| Operation | Key format | Where stored |
|-----------|-----------|--------------|
| Inbound entity sync | `{tenant_id}:{provider}:{entity_type}:{external_id}` | `external_refs` uniqueness constraint |
| Outbound push | `{sync_log_id}` (UUID) | Sent as provider-specific idempotency header |
| Webhook reception | Provider's event/message ID | `integration_webhook_log.event_id` |
| Public API writes | Client-provided `Idempotency-Key` header | `api_idempotency_keys` table (TTL: 24h) |

## Ordering Guarantees

**Inbound:** No strict ordering guaranteed. Webhooks may arrive out of order.

Mitigation: On every inbound update, compare `external_modified_at`:
- If incoming timestamp > stored timestamp → apply update
- If incoming timestamp <= stored timestamp → skip (stale event)
- If provider doesn't supply timestamps → always apply (last-write-wins)

**Outbound:** Events are processed in order per case. The sync engine uses a per-case lock (asyncio.Lock keyed by case_id) to prevent concurrent pushes for the same case from interleaving.

## Conflict Resolution Rules

### Master data fields (property, tenancy, contacts)

**Rule: PMS always wins.**

These fields are read-only in Renovo. If PMS sends an update, it overwrites the cached value unconditionally. There is no merge logic for these fields.

Affected fields: property address, tenancy dates, tenant name/email, landlord name, deposit amount.

### Operator-editable fields on cached data

**Rule: Renovo wins if operator has explicitly set a value; otherwise PMS wins.**

Currently, only `tenancy.deposit_scheme` falls in this category.

Implementation:
```python
# Field has operator_override flag in metadata
if entity.metadata.get("operator_overrides", {}).get(field_name):
    # Operator set this — don't overwrite from PMS
    pass
else:
    # No operator override — accept PMS value
    entity.field = incoming_value
```

### Case data (Renovo-owned)

**Rule: Renovo always wins.**

Cases, issues, evidence, recommendations, claims are Renovo's domain. External systems receive case data but cannot modify it. If a PMS webhook contains case-related data that conflicts with Renovo's state, ignore it.

### Concurrent updates from multiple connected systems

**Rule: Most-specific provider wins.**

If both Reapit and Street.co.uk provide data for the same property:
1. This shouldn't happen (agencies typically use one PMS)
2. If it does: the system with the most recent `synced_at` for that entity wins
3. Log a conflict event visible to the operator in the connection health dashboard

## Source Priority Rules

| Field category | Priority (highest first) |
|----------------|--------------------------|
| Property address | PMS > Manual entry |
| Tenancy dates | PMS > Manual entry |
| Deposit amount | PMS > Manual entry |
| Deposit scheme | Operator override > PMS > empty |
| Case status | Renovo (authoritative) |
| Inspection data | Inventory provider (NLG) > PMS > Renovo |
| Case documents | Renovo (authoritative) |

## Timestamp Trust Rules

- PMS timestamps: Trusted for ordering. Used for incremental sync `since` parameter.
- Partner API timestamps: Trusted if provider includes `modified_at` in payload.
- Deposit scheme timestamps: Trusted for status transitions (decision dates).
- Internal timestamps: PostgreSQL `now()` at commit time. Always UTC.

**Clock skew allowance:** Accept events with timestamps up to 5 minutes in the future (accounts for clock drift between systems).

## Reconciliation Jobs

No scheduled reconciliation in v1. Instead:

- **Operator-triggered full resync:** Operator can click "Full resync" which clears `last_synced_at` and triggers a fresh backfill. This rechecks all data against the source.
- **Health check alerts:** If a connection hasn't synced in 7 days (and has active tenancies), surface a warning in the dashboard.

v2 consideration: Weekly automated reconciliation that compares internal state against PMS and logs discrepancies without auto-correcting.

## Retry Policy

### Inbound pull failures

| Attempt | Delay | Action on final failure |
|---------|-------|------------------------|
| 1 | Immediate | — |
| 2 | 5 seconds | — |
| 3 | 20 seconds | Mark sync as `failed`, surface in operator dashboard |

### Outbound push failures

| Attempt | Delay | Action on final failure |
|---------|-------|------------------------|
| 1 | Immediate | — |
| 2 | 1 second | — |
| 3 | 4 seconds | — |
| 4 | 16 seconds | — |
| 5 | 60 seconds | Move to dead letter queue |

### Auth failures (401/403)

- On first 401: attempt token refresh (OAuth) or re-validate key
- On second consecutive 401: mark connection as `auth_failed`, notify operator
- Do NOT retry the original request after auth failure — queue it for after re-auth

## Dead-Letter Queue Rules

Failed sync operations that exhaust retries go to a dead-letter queue:

```sql
-- Stored in integration_sync_logs with status = 'dead_letter'
-- Columns: original_payload (JSONB), failure_reason, last_attempt_at, retry_count
```

**Operator actions on dead letters:**
- **Retry:** Re-attempts the operation immediately
- **Skip:** Marks as `skipped` (acknowledged, won't retry)
- **Investigate:** Opens detail view showing payload and error history

**Auto-expiry:** Dead letters older than 30 days are hard-deleted.

**Alert threshold:** If dead letter count > 10 for a single connection in 24h → send operator email alert.

## Operator-Visible Conflict Logs

When a conflict is detected (concurrent updates from multiple sources, stale webhook, etc.):

```sql
INSERT INTO integration_conflict_log (
    tenant_id, entity_type, internal_id, provider, field_name,
    existing_value, incoming_value, resolution, resolved_at
)
```

Conflicts are surfaced in the Settings > Integrations panel. Operator can:
- View conflict history
- Manually override resolution
- Mark as "expected" (suppress future alerts for this field)

## Manual Resync Behavior

Operator clicks "Sync now" button:
1. If a sync is already `running` for this connection → reject with "Sync already in progress"
2. Clear `sync_cursor` for all resources
3. Set `since = last_synced_at` (incremental, not full backfill)
4. Process all resources sequentially (properties → tenancies → contacts)
5. Show live progress in UI (polling sync log status)

Operator clicks "Full resync" (admin only):
1. Set `last_synced_at = NULL` on connection
2. Clear all sync cursors
3. Trigger full backfill (since=None)
4. Note: Does NOT delete existing internal data — only upserts over it
