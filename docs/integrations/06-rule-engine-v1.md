# Rule Engine v1

## Design Philosophy

The rule engine is a simple trigger → condition → action system. It is NOT a workflow engine, BPMN runtime, or state machine. It handles reactive automation: "when X happens, if Y is true, do Z."

## Supported Triggers

Triggers are internal domain events emitted by the sync engine, case service, or public API handlers.

| Trigger | Emitted when | Payload |
|---------|-------------|---------|
| `tenancy.ending_soon` | Tenancy end_date is within N days (configurable, checked on sync) | `{tenancy_id, property_id, end_date, days_remaining}` |
| `tenancy.ended` | Tenancy end_date has passed (checked on sync or webhook update) | `{tenancy_id, property_id, end_date}` |
| `inspection.received` | Inspection data pushed via public API or synced from PMS | `{inspection_id, property_id, tenancy_id, inspection_type}` |
| `case.status_changed` | Case transitions to a new status | `{case_id, tenancy_id, old_status, new_status}` |
| `case.document_generated` | AI draft or report generated | `{case_id, document_type, document_id}` |
| `connection.sync_completed` | A sync run finished (any resource) | `{connection_id, provider, resource, records_created, records_updated}` |
| `claim.deadline_approaching` | Deposit scheme claim deadline within N days | `{case_id, tenancy_id, scheme, deadline_date, days_remaining}` |

## Supported Conditions

Conditions filter whether an action should execute. Multiple conditions are ANDed.

| Condition | Parameters | Example |
|-----------|-----------|---------|
| `tenancy.end_date_within_days` | `days: int` | End date is within 30 days |
| `tenancy.deposit_scheme_is` | `scheme: string` | Deposit scheme is "tds" |
| `case.status_is` | `status: string` | Case is in "review" |
| `case.priority_is` | `priority: string` | Priority is "high" |
| `case.has_no_assignee` | (none) | Case is unassigned |
| `inspection.type_is` | `type: string` | Inspection type is "checkout" |
| `property.postcode_starts_with` | `prefix: string` | Postcode starts with "M1" |

## Supported Actions

| Action | Parameters | Effect |
|--------|-----------|--------|
| `create_case` | `priority?: string, assign_to?: string` | Creates a draft EOT case for the tenancy |
| `assign_case` | `user_id: string \| "round_robin" \| "least_loaded"` | Assigns case to specified operator or via distribution |
| `send_notification` | `channel: "email" \| "in_app", template: string` | Sends notification to operator or team |
| `change_case_status` | `status: string` | Transitions case to specified status |
| `start_analysis` | (none) | Triggers AI analysis on the case |
| `log_timeline_event` | `description: string` | Adds audit entry to case timeline |

## Execution Model

### Event flow

```
1. Domain event emitted (e.g., sync engine creates a tenancy with end_date in 28 days)
2. Event dispatcher queries active rules for this tenant + trigger type
3. For each matching rule:
   a. Evaluate all conditions against the event payload + entity state
   b. If all conditions pass → execute action
   c. Log execution in rule_execution_log
4. Processing is sequential per event (no parallel rule execution)
```

### Sync vs Async

| Action | Execution mode | Rationale |
|--------|---------------|-----------|
| `create_case` | Synchronous | Must complete before event processing finishes |
| `assign_case` | Synchronous | Fast DB operation |
| `send_notification` | **Async** (BackgroundTask) | Email delivery is slow; don't block |
| `change_case_status` | Synchronous | Must be atomic with event |
| `start_analysis` | **Async** (BackgroundTask) | AI analysis takes 30-120s |
| `log_timeline_event` | Synchronous | Fast DB write |

## Auditability

Every rule execution is logged:

```sql
CREATE TABLE rule_execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    rule_id UUID NOT NULL REFERENCES automation_rules(id),
    trigger_event TEXT NOT NULL,
    trigger_payload JSONB NOT NULL,
    conditions_met BOOLEAN NOT NULL,
    action_taken TEXT,
    action_result JSONB,           -- e.g., {"case_id": "created_uuid"} or {"error": "..."}
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_ms INTEGER
);

CREATE INDEX ix_rule_exec_tenant_rule ON rule_execution_log (tenant_id, rule_id, executed_at DESC);
CREATE INDEX ix_rule_exec_tenant_event ON rule_execution_log (tenant_id, trigger_event, executed_at DESC);
```

Operators can view execution history in Settings > Automation > Logs.

## Failure Behavior

| Failure type | Behavior |
|-------------|----------|
| Condition evaluation error | Log error, skip rule, continue to next rule |
| Action execution error (sync) | Log error, mark execution as `failed`, continue to next rule |
| Action execution error (async) | Log error in background; no retry in v1 |
| Database error during logging | Swallow error (don't let logging failures break event processing) |
| Rule references deleted entity | Skip rule, log as `skipped` |

**No cascading failures:** A failing rule never prevents other rules from executing.

**No retry in v1:** Failed actions are logged for operator review. Operators can manually trigger the action if needed. Automatic retry is a v2 feature.

## Rule Storage

```sql
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    trigger_event TEXT NOT NULL,          -- e.g., 'tenancy.ending_soon'
    conditions JSONB NOT NULL DEFAULT '[]',  -- Array of condition objects
    action_type TEXT NOT NULL,            -- e.g., 'create_case'
    action_params JSONB NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 0,  -- Execution order (lower = first)
    created_by UUID,                      -- User who created the rule
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_automation_rules_tenant_name_active
        UNIQUE NULLS NOT DISTINCT (tenant_id, name, deleted_at)
);

CREATE INDEX ix_automation_rules_tenant_trigger
    ON automation_rules (tenant_id, trigger_event)
    WHERE deleted_at IS NULL AND is_active = true;
```

### Example rule record

```json
{
  "id": "rule_abc123",
  "tenant_id": "tenant_xyz",
  "name": "Auto-create case on checkout inspection",
  "trigger_event": "inspection.received",
  "conditions": [
    { "type": "inspection.type_is", "params": { "type": "checkout" } }
  ],
  "action_type": "create_case",
  "action_params": { "priority": "medium" },
  "is_active": true,
  "priority": 0
}
```

## Agency Configuration

### Settings UI (Settings > Automation)

- List active rules with enable/disable toggle
- Create rule wizard:
  1. Select trigger from dropdown
  2. Add conditions (optional, 0-3 conditions per rule)
  3. Select action and configure parameters
  4. Name the rule
  5. Save (active by default)
- Edit existing rules (inline edit or modal)
- View execution log (last 50 executions with status)
- Delete rule (soft delete)

### Access control

- **Admin:** Full CRUD on rules
- **Manager:** View rules, view execution log, enable/disable
- **Operator:** View rules only

## Default Rule Templates

Pre-configured templates that agencies can activate with one click:

| Template name | Trigger | Conditions | Action |
|--------------|---------|-----------|--------|
| "Auto-create case 28 days before tenancy end" | `tenancy.ending_soon` | `days_remaining <= 28` | `create_case` (medium priority) |
| "Auto-create case on checkout received" | `inspection.received` | `inspection_type == checkout` | `create_case` (medium priority) |
| "Notify manager when case reaches review" | `case.status_changed` | `new_status == review` | `send_notification` (in_app, to managers) |
| "Alert on claim deadline (7 days)" | `claim.deadline_approaching` | `days_remaining <= 7` | `send_notification` (email, to assigned operator) |

Templates are created as inactive rules. Operator activates and optionally customizes.

## Explicit Non-Goals for v1

| Feature | Why deferred |
|---------|-------------|
| Complex branching (if/else/switch) | Adds significant complexity; simple AND conditions sufficient for v1 |
| Scheduled triggers (cron-based) | Requires background scheduler infrastructure not yet present |
| Multi-step workflows (action chains) | Would need workflow state machine; out of scope |
| Custom condition expressions (scripting) | Security risk; fixed condition types are safer |
| Webhook as trigger source | Webhooks trigger domain events which trigger rules — no direct webhook→rule path |
| Rule versioning / rollback | Soft delete + audit log is sufficient for v1 |
| A/B testing rules | Enterprise feature; not needed yet |
| Rate limiting per rule | Single execution per event is inherently bounded |
| Cross-tenant rule templates (marketplace) | Future consideration for agency groups |

## Implementation Notes

### Event dispatcher location

```python
# backend/app/services/event_dispatcher.py

class EventDispatcher:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def emit(self, tenant_id: UUID, event: str, payload: dict) -> None:
        """Emit an event and process matching rules."""
        rules = await self._get_active_rules(tenant_id, event)
        for rule in rules:
            await self._execute_rule(rule, payload)

    async def _get_active_rules(self, tenant_id: UUID, event: str) -> list[AutomationRule]:
        # Query automation_rules WHERE tenant_id AND trigger_event AND is_active
        # ORDER BY priority ASC
        ...

    async def _execute_rule(self, rule: AutomationRule, payload: dict) -> None:
        # Evaluate conditions → if pass → execute action → log result
        ...
```

### Integration points

The event dispatcher is called from:
1. **Sync engine** — after processing inbound data (tenancy created/updated → check end_date triggers)
2. **Case service** — after status transition (`case.status_changed`)
3. **Public API handlers** — after receiving inspection data (`inspection.received`)
4. **Document service** — after generating AI drafts (`case.document_generated`)

### Tenancy ending detection

Since there's no scheduled job infrastructure in v1, `tenancy.ending_soon` is evaluated:
- On every tenancy sync (when end_date is pulled from PMS)
- Compared against current date at sync time
- If within threshold → emit event

This means detection depends on sync frequency. Acceptable for v1 given on-demand pull model.

v2 improvement: Add daily background check that scans tenancies with end_date within configured threshold.
