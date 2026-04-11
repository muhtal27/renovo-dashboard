# Observability and Operations

## Connection Health Model

Each `integration_connections` row tracks health via:

| Field | Purpose |
|-------|---------|
| `health_status` | `healthy` / `degraded` / `unhealthy` / `unknown` |
| `consecutive_failures` | Counter reset on success |
| `last_health_check_at` | When credentials were last validated |

### Health state transitions

```
unknown → healthy        (first successful health check or sync)
healthy → degraded       (1-2 consecutive failures)
degraded → unhealthy     (3+ consecutive failures OR auth_failed)
unhealthy → healthy      (successful sync or health check after operator intervention)
any → disabled           (operator manually disables)
```

### Health check execution

In v1 (no background scheduler), health checks run:
- **On every sync attempt** — validate credentials before pulling
- **On operator visit to Settings > Integrations** — trigger check for displayed connections
- **On webhook receipt** — if we can process the webhook, connection is healthy

v2: Add a background task (ARQ) that runs every 6 hours:
```python
async def check_connection_health(connection_id: UUID):
    connector = get_connector(connection.provider)
    is_valid = await connector.validate_credentials(ctx)
    update_health_status(connection, is_valid)
```

## Sync Logs

### Table: `integration_sync_logs`

Replaces `street_sync_logs` with a generic version.

```sql
CREATE TABLE integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    direction TEXT NOT NULL,                -- 'inbound', 'outbound'
    trigger TEXT NOT NULL,                  -- 'manual', 'webhook', 'rule', 'backfill'
    resource TEXT NOT NULL,                 -- 'properties', 'tenancies', 'case_status', 'documents'
    status TEXT NOT NULL,                   -- 'running', 'completed', 'partial', 'failed', 'dead_letter'

    -- Counts
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,                     -- Truncated to 500 chars
    error_detail JSONB,                     -- Full error context (stack trace, response body)

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,                    -- Computed on completion

    -- Retry state (for dead letters)
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    original_payload JSONB,                 -- For dead letter replay

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX ix_sync_logs_connection_started
    ON integration_sync_logs (connection_id, started_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_sync_logs_tenant_status
    ON integration_sync_logs (tenant_id, status, started_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX ix_sync_logs_dead_letters
    ON integration_sync_logs (tenant_id, status, next_retry_at)
    WHERE status = 'dead_letter' AND deleted_at IS NULL;
```

## Event Logs

### Table: `integration_events`

Internal domain events emitted by the platform (for rule engine and outbound sync):

```sql
CREATE TABLE integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL,
    event_type TEXT NOT NULL,               -- 'tenancy.ending_soon', 'case.status_changed', etc.
    entity_type TEXT,                       -- 'tenancy', 'case', 'inspection'
    entity_id UUID,                         -- ID of the affected entity
    payload JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_events_tenant_unprocessed
    ON integration_events (tenant_id, event_type, created_at)
    WHERE processed = false;

-- TTL: events older than 7 days are hard-deleted by cleanup job
CREATE INDEX ix_events_ttl ON integration_events (created_at);
```

## Webhook Delivery Logs

### Table: `integration_webhook_deliveries`

Tracks outbound webhook delivery to partners (public API webhooks):

```sql
CREATE TABLE integration_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL,
    webhook_id UUID NOT NULL,               -- References partner's webhook registration
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    delivery_url TEXT NOT NULL,

    -- Delivery status
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'delivered', 'failed', 'expired'
    response_status INTEGER,                -- HTTP status code from partner
    response_body TEXT,                     -- First 500 chars of response
    error_message TEXT,

    -- Retry tracking
    attempt INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX ix_webhook_deliveries_pending
    ON integration_webhook_deliveries (status, next_attempt_at)
    WHERE status IN ('pending', 'failed');

CREATE INDEX ix_webhook_deliveries_webhook
    ON integration_webhook_deliveries (webhook_id, created_at DESC);
```

### Delivery retry schedule

| Attempt | Delay after failure |
|---------|-------------------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

After 5 failures: mark as `expired`, surface in partner's webhook dashboard.
After 10 consecutive delivery failures to the same endpoint: mark webhook as `disabled`, notify partner.

## Inbound Webhook Log

### Table: `integration_webhook_log`

Tracks webhooks received from external providers:

```sql
CREATE TABLE integration_webhook_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID,                         -- NULL if can't resolve tenant
    connection_id UUID,
    provider TEXT NOT NULL,
    event_id TEXT,                          -- Provider's event/message ID (for dedup)
    event_type TEXT,
    status TEXT NOT NULL,                   -- 'processed', 'skipped', 'failed', 'rejected'
    processing_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_webhook_log_dedup
    ON integration_webhook_log (provider, event_id)
    WHERE event_id IS NOT NULL;

-- TTL: 24h dedup window
CREATE INDEX ix_webhook_log_ttl ON integration_webhook_log (created_at);
```

## Retry Monitoring

### Metrics to track

| Metric | Granularity | Alert threshold |
|--------|-------------|-----------------|
| Sync failure rate | Per connection, per hour | > 50% failures in last hour |
| Webhook delivery failure rate | Per partner endpoint, per hour | > 30% failures |
| Dead letter queue depth | Per tenant | > 10 items |
| Token refresh failures | Per connection | Any failure (immediate alert) |
| Webhook processing latency (p95) | Per provider | > 5 seconds |

### Implementation (v1 — no external monitoring stack)

In v1, monitoring is query-based (run from operator dashboard or admin panel):

```sql
-- Connections with auth failures
SELECT * FROM integration_connections
WHERE status = 'auth_failed' AND deleted_at IS NULL;

-- Recent dead letters
SELECT * FROM integration_sync_logs
WHERE status = 'dead_letter' AND created_at > now() - interval '24 hours';

-- Webhook delivery backlog
SELECT webhook_id, COUNT(*) as pending
FROM integration_webhook_deliveries
WHERE status IN ('pending', 'failed') AND next_attempt_at < now()
GROUP BY webhook_id;
```

v2: Export metrics to a time-series database or structured logging for dashboards.

## Dead-Letter Handling

### Operator actions (Settings > Integrations > Dead Letters)

| Action | Effect |
|--------|--------|
| **Retry** | Reset retry_count, set status='running', re-execute immediately |
| **Skip** | Set status='skipped', remove from queue |
| **View details** | Show original_payload, error history, affected entity |
| **Bulk retry** | Retry all dead letters for a connection |
| **Bulk skip** | Skip all dead letters older than N days |

### Automatic cleanup

Daily cleanup job (runs on first request after midnight, or via manual trigger):
```sql
-- Hard-delete expired dead letters (30 days)
DELETE FROM integration_sync_logs
WHERE status IN ('dead_letter', 'skipped') AND created_at < now() - interval '30 days';

-- Hard-delete old completed sync logs (90 days)
DELETE FROM integration_sync_logs
WHERE status IN ('completed', 'partial') AND created_at < now() - interval '90 days';

-- Hard-delete old webhook logs (30 days)
DELETE FROM integration_webhook_log
WHERE created_at < now() - interval '30 days';

-- Hard-delete old events (7 days)
DELETE FROM integration_events
WHERE created_at < now() - interval '7 days';
```

## Dashboards Needed

### Operator Dashboard (Settings > Integrations)

1. **Connection Overview**
   - List of all connected systems with health badges (green/yellow/red)
   - Last sync time per connection
   - Quick "Sync now" action per connection

2. **Sync History**
   - Filterable log of recent sync operations
   - Status, resource, counts, duration
   - Click-through to error details

3. **Dead Letter Queue**
   - Count badge (0 = hidden)
   - List with retry/skip actions
   - Error details and affected entities

4. **Rule Execution Log** (under Automation tab)
   - Recent rule executions with outcome
   - Filter by trigger type, rule name

### Admin Panel (future — platform-wide view)

Not needed for v1. When multiple agencies are live:
- Aggregate connection health across all tenants
- System-wide dead letter count
- Provider-level failure rates

## Alerts Needed (v1)

| Alert | Channel | Trigger |
|-------|---------|---------|
| Connection auth failed | In-app notification + email to admin | `connection.status` → `auth_failed` |
| Dead letters accumulating | In-app notification to admin | Dead letter count > 10 for connection |
| Sync failed repeatedly | In-app badge on Settings tab | `consecutive_failures >= 3` |
| Webhook endpoint disabled | Email to partner (public API) | 10 consecutive delivery failures |

### In-app notification implementation

Use existing in-app pattern: write to a `notifications` table (or future feature), surface in the operator header bar.

For v1 (simplest): surface alerts as a badge count on the Settings > Integrations tab. No push notifications.

## Support Tooling Needed

### Admin SQL queries (for internal support team)

```sql
-- Find all connections for a tenant
SELECT id, provider, status, health_status, last_synced_at
FROM integration_connections
WHERE tenant_id = :tid AND deleted_at IS NULL;

-- Recent sync failures for a connection
SELECT id, resource, error_message, started_at
FROM integration_sync_logs
WHERE connection_id = :cid AND status = 'failed'
ORDER BY started_at DESC LIMIT 20;

-- Replay a dead letter
UPDATE integration_sync_logs
SET status = 'running', retry_count = retry_count + 1, next_retry_at = NULL
WHERE id = :sync_log_id AND status = 'dead_letter';
```

### Future: Support CLI / admin API

Not needed for v1. Direct DB queries via Supabase dashboard are sufficient for a small team.

## Redaction Rules for Logs

**NEVER log any of these values:**
- OAuth access tokens or refresh tokens
- API keys or secrets
- Webhook signing secrets
- `credentials_encrypted` column values
- File contents being synced

**ALWAYS redact before logging:**
- Email addresses in error messages → `t***@example.com`
- API keys in error responses → `sk_...***`
- Bearer tokens in HTTP traces → `Bearer ***`

**Safe to log:**
- Connection IDs, tenant IDs, entity IDs
- Provider names, resource types, event types
- HTTP status codes, error messages (provider-generated)
- Sync counts (created/updated/skipped)
- Timestamps, durations
- Webhook event types and delivery IDs

### Implementation

```python
import re

REDACTION_PATTERNS = [
    (re.compile(r'(Bearer\s+)\S+'), r'\1***'),
    (re.compile(r'(sk_\w{4})\w+'), r'\1***'),
    (re.compile(r'(api_key["\s:=]+)\S+'), r'\1***'),
    (re.compile(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'),
     lambda m: f"{m.group(1)[:2]}***@{m.group(2)}"),
]

def redact(text: str) -> str:
    for pattern, replacement in REDACTION_PATTERNS:
        text = pattern.sub(replacement, text)
    return text
```

## Minimum Operational Metrics (v1)

These can be computed from database queries — no external metrics system required:

| Metric | Query frequency | Purpose |
|--------|----------------|---------|
| Active connections count | On dashboard load | Health overview |
| Connections in auth_failed state | On dashboard load | Immediate attention needed |
| Sync success rate (last 24h) | On dashboard load | Overall health |
| Average sync duration | On dashboard load | Performance baseline |
| Dead letter queue depth | On dashboard load + badge update | Operator attention |
| Inbound webhooks processed (last 24h) | On dashboard load | Activity indicator |
| Outbound webhook delivery rate | On dashboard load | Partner health |
| Rule executions (last 24h) | On automation tab load | Automation activity |
