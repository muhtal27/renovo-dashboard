# EOT Schema Cleanup Audit and Staged Plan

This document supersedes the destructive draft in `/Users/retailltd/Downloads/codex-schema-cleanup.md`.

Scope audited:
- application code under `app/` and `lib/`
- schema and SQL objects under `supabase/migrations/`
- operational tests under `supabase/tests/`
- seeded/demo data under `supabase/seeds/`

Principle:
- the product has pivoted to EOT-first
- the database has not been fully pivoted
- anything still referenced by live SQL, RLS, RPCs, cron, seeds, portal smoke tests, or EOT evidence FKs is not safe for automatic drop

Audit method:
- repo-wide search across `app/`, `lib/`, `supabase/migrations/`, `supabase/seeds/`, and `supabase/tests/`
- direct checks for app-code references, RPC calls, RLS policies, trigger/function chains, grants, and FK-linked surfaces
- conservative classification whenever a dependency could not be disproven from repo state alone

## High-Risk Exclusions

These are excluded from automatic removal unless separately proven safe:

- `portal_profiles` contractor-related columns/FKs
  - `portal_profiles.contractor_id`
  - `portal_profiles_contractor_id_idx`
  - `portal_profiles -> contractors` FK
- `case_documents.tenancy_document_id`
- `case_documents.message_attachment_id`
- `lease_lifecycle_events` triggers/functions
  - move-out tracker sync depends on them in `20260322_add_move_out_tracker.sql`
- messages-related functions/triggers
  - portal actions and message enrichment still depend on `messages`
- call-sessions-related functions/triggers
  - inbound-call intake and context sync still exist

## Cross-Cutting Dependency Findings

- Live app-code references still exist for:
  - `case_documents.tenancy_document_id`
  - `case_documents.message_attachment_id`
  - `search_scotland_knowledge` RPC
- Portal smoke tests still assert presence of:
  - `portal_profiles`
  - `messages`
  - `maintenance_requests`
  - `maintenance_quotes`
  - portal action functions
- Demo and fixture seeds still reference:
  - `contractors`
  - `contractor_trades`
  - `maintenance_requests`
  - `viewing_requests`
  - `rent_ledger_entries`
  - `lease_lifecycle_events`
  - `call_sessions`
  - `portal_profiles`
- `run_rent_and_lease_automation` is still scheduled through `pg_cron`.
- `move_out_trackers` depend on `lease_lifecycle_events` through `ensure_move_out_tracker_after_lifecycle_event()` and trigger `trg_lease_lifecycle_events_ensure_move_out_tracker`.

## Policies, Grants, Foreign Keys, and RPC Usage

### Policies

- `portal_profiles`
  - `portal_profiles_operator_all`
  - `portal_profiles_self_select`
  - classification: Keep for now
- `maintenance_requests`
  - `maintenance_requests_operator_all`
  - `maintenance_requests_portal_select`
  - classification: Needs manual review
- `maintenance_quotes`
  - `maintenance_quotes_operator_all`
  - `maintenance_quotes_portal_select`
  - classification: Needs manual review
- `contractors`
  - `contractors_operator_all`
  - `contractors_portal_select`
  - classification: Keep for now because of `portal_profiles.contractor_id`
- `contractor_trades`
  - `contractor_trades_operator_all`
  - `contractor_trades_portal_select`
  - classification: Needs manual review
- `viewing_requests`
  - `viewing_requests_operator_all`
  - `viewing_requests_portal_select`
  - classification: Needs manual review
- `lease_lifecycle_events`
  - `lease_lifecycle_events_operator_all`
  - classification: Keep for now
- `resolved_messages`
  - `resolved_messages_operator_select`
  - classification: Archive first
- `contact_methods`
  - `contact_methods_operator_select`
  - classification: Archive first
- `case_events`
  - `case_events_operator_select`
  - classification: Archive first
- `case_assignments`
  - `case_assignments_operator_select`
  - classification: Archive first
- `case_tags`
  - `case_tags_operator_select`
  - classification: Archive first
- `tags`
  - `tags_operator_select`
  - classification: Archive first

### Grants

- `grant execute on function public.landlord_approve_quote(uuid, text) to authenticated`
  - classification: Needs manual review
- `grant execute on function public.landlord_case_signal(uuid, text, text) to authenticated`
  - classification: Needs manual review
- `grant execute on function public.landlord_add_case_update(uuid, text) to authenticated`
  - classification: Needs manual review
- `grant execute on function public.contractor_add_case_update(uuid, text) to authenticated`
  - classification: Needs manual review
- `grant execute on function public.tenant_add_case_update(uuid, text) to authenticated`
  - classification: Needs manual review
- `grant execute on function public.tenant_case_signal(uuid, text) to authenticated`
  - classification: Needs manual review

### Foreign keys

- `case_documents.tenancy_document_id -> tenancy_documents.id`
  - live app-code reference in `lib/end-of-tenancy/queries.ts`
  - classification: Keep for now
- `case_documents.message_attachment_id -> message_attachments.id`
  - live app-code reference in `lib/end-of-tenancy/queries.ts`
  - classification: Keep for now
- `portal_profiles.contractor_id -> contractors.id`
  - explicit high-risk exclusion
  - classification: Keep for now
- `call_events.call_session_id -> call_sessions.id`
  - classification: Needs manual review
- `case_tags.tag_id -> tags.id`
  - classification: Archive first, but only as a pair

### RPC usage

- `search_scotland_knowledge`
  - live app-code reference in `lib/end-of-tenancy/ai.ts`
  - classification: Keep for now
- no current app-code RPC usage was found for:
  - `landlord_approve_quote`
  - `landlord_case_signal`
  - `landlord_add_case_update`
  - `contractor_add_case_update`
  - `tenant_add_case_update`
  - `tenant_case_signal`
  - classification: Needs manual review because SQL grants, portal tests, and portal flows still reference them

## Classification Summary

### Safe to remove now

- view `public.v_cases_list`

### Archive first

- tables:
  - `case_assignments`
  - `case_tags`
  - `tags`
  - `resolved_messages`
  - `contact_methods`
  - `case_events`
  - `landlord_statements`
  - `tenancy_key_sets`
  - `tenancy_utilities`
- related policies attached to those tables should be removed only as part of the archive step, not earlier

### Keep for now

- `portal_profiles`
- `tenancy_documents`
- `message_attachments`
- `messages`
- `call_sessions`
- `contractors`
- `lease_lifecycle_events`
- `search_scotland_knowledge`
- message/call/lifecycle triggers and helper functions called out in the high-risk exclusions

### Needs manual review

- function `public.log_case_status_change()` because a live database trigger still depends on it:
  - `trg_cases_log_status_change` on `public.cases`
- `maintenance_requests`
- `maintenance_quotes`
- `contractor_trades`
- `viewing_requests`
- `rent_ledger_entries`
- `call_events`
- portal action functions granted to `authenticated`
- case auto-link functions and triggers on `public.cases`
- rent automation functions, triggers, and cron schedule

## Table Candidates

| Object | App-code refs | SQL / schema dependencies | External / operational risk | Classification |
|---|---|---|---|---|
| `case_assignments` | none found | RLS policy `case_assignments_operator_select`; operator index in `20260318_harden_operator_rls_and_indexes.sql` | fixture SQL still deletes from it | Archive first |
| `case_tags` | none found | RLS policy `case_tags_operator_select`; FK link to `tags` | fixture SQL still deletes from it | Archive first |
| `tags` | none found | RLS policy `tags_operator_select`; parent of `case_tags` | historic tagging data may still matter | Archive first |
| `resolved_messages` | none found | RLS policy `resolved_messages_operator_select` | historic message-resolution audit risk | Archive first |
| `contact_methods` | none found | RLS policy `contact_methods_operator_select` | low live risk, but preserve history first | Archive first |
| `case_events` | none found | RLS policy `case_events_operator_select`; only known writer is `log_case_status_change()` | seeded demo cleanup references it | Archive first |
| `landlord_statements` | none found | no live app or SQL deps found in repo search | finance/history risk if assumptions are wrong | Archive first |
| `tenancy_key_sets` | none found | no current app refs found | operational history may still matter | Archive first |
| `tenancy_utilities` | none found | no current app refs found | operational history may still matter | Archive first |
| `tenancy_documents` | indirect live use through `case_documents.tenancy_document_id` | FK from `case_documents`; selected/inserted in `lib/end-of-tenancy/queries.ts` | removing breaks evidence attach/read flows | Keep for now |
| `message_attachments` | indirect live use through `case_documents.message_attachment_id` | FK from `case_documents`; RLS policy `message_attachments_operator_select` | removing breaks evidence attach/read flows | Keep for now |
| `maintenance_requests` | no direct Next.js refs | referenced by `resolve_contact_case_context`, `ensure_case_work_item_for_case`, `landlord_approve_quote`, portal RLS functions and policies | portal smoke tests and seeds still use it | Needs manual review |
| `maintenance_quotes` | no direct Next.js refs | referenced by `landlord_portal_can_read_quote`, `landlord_approve_quote`, portal policies | portal smoke tests and seeds still use it | Needs manual review |
| `contractors` | no direct Next.js refs | referenced by `portal_profiles.contractor_id`, `resolve_contact_case_context`, portal policies, landlord approval flow | explicit high-risk FK surface | Keep for now |
| `contractor_trades` | no direct Next.js refs | depends on `contractors`; portal policies | seeds/tests still use it | Needs manual review |
| `viewing_requests` | no direct Next.js refs | referenced by `resolve_contact_case_context`, `ensure_case_work_item_for_case`, portal policies | seeds still use it | Needs manual review |
| `rent_ledger_entries` | no direct Next.js refs | `sync_rent_ledger_entry_context`, rent automation, RLS policy, cron job | daily cron and seeds still touch it | Needs manual review |
| `call_sessions` | no direct Next.js data query refs | inbound-call functions/triggers, policies, indexes, phone helper index | explicit high-risk integration area | Keep for now |
| `call_events` | no direct Next.js refs | child FK to `call_sessions` | call integration unknown; seeds still reference call subsystem | Needs manual review |
| `messages` | no direct Next.js refs in current operator flows | portal action functions, message trigger, RLS, outbound-idempotency indexes | explicit high-risk messages surface | Keep for now |

## View Candidate

| Object | App-code refs | SQL dependencies | External risk | Classification |
|---|---|---|---|---|
| `v_cases_list` | none found in `app/` or `lib/` | defined once in `20260318_harden_operator_rls_and_indexes.sql`; no current RPC or view-on-view dependencies found | only legacy dashboard dependency in draft analysis | Safe to remove now |

## Function Candidates

| Object | App-code / RPC refs | SQL dependencies | External / operational risk | Classification |
|---|---|---|---|---|
| `log_case_status_change()` | none found in app code | live database trigger dependency found during Stage A verification: `trg_cases_log_status_change` on `public.cases` | cannot be removed safely without a separate trigger review | Needs manual review |
| `normalize_case_type(text)` | none in app code | used by `resolve_contact_case_context`, `enrich_case_context`, `ensure_case_work_item_for_case`, rent automation, seeds | removing early breaks multiple unresolved legacy paths | Keep for now |
| `resolve_contact_case_context(...)` | none in app code | used by case/call/message auto-link functions; touches `contractors`, `maintenance_requests`, `viewing_requests` | hidden context-link risk on live `cases` | Needs manual review |
| `enrich_case_context()` | none in app code | trigger target on `public.cases` | fires on live `cases` table | Needs manual review |
| `ensure_case_work_item_for_case(uuid)` | none in app code | called by `ensure_case_work_item()`; writes `maintenance_requests`, `viewing_requests`, and `deposit_claims` | deposit branch touches still-live claim data | Needs manual review |
| `ensure_case_work_item()` | none in app code | trigger wrapper on `public.cases` | fires on live `cases` table | Needs manual review |
| `ingest_inbound_call(...)` both signatures | none in app code | writes `contacts`, `call_sessions`, `cases`; tied to call subsystem | explicit high-risk call surface | Keep for now |
| `enrich_call_session_context()` | none in app code | trigger target on `call_sessions` | explicit high-risk call surface | Keep for now |
| `sync_case_context_from_call_session()` | none in app code | trigger target on `call_sessions` | explicit high-risk call surface | Keep for now |
| `enrich_message_context()` | none in app code | trigger target on `messages` | explicit high-risk messages surface | Keep for now |
| `sync_case_message_activity()` | none in app code | updates `cases` from `messages`; messages-adjacent | explicit high-risk messages surface | Keep for now |
| `rent_due_date_for_month(date, date)` | none in app code | used by `ensure_monthly_rent_charges()` | rent subsystem not yet decommissioned safely | Keep for now |
| `ensure_monthly_rent_charges(date)` | none in app code | called by `run_rent_and_lease_automation()`; writes `rent_ledger_entries` | cron-backed automation | Needs manual review |
| `ensure_rent_arrears_cases(date)` | none in app code | called by `run_rent_and_lease_automation()`; links rent to `cases` | cron-backed automation | Needs manual review |
| `run_rent_and_lease_automation(date)` | none in app code | scheduled via `pg_cron`; calls rent + lifecycle helpers | hidden scheduled side effects | Needs manual review |
| `refresh_lease_lifecycle_events(date)` | none in app code | lifecycle automation feeding `lease_lifecycle_events` | explicit lifecycle high-risk exclusion | Keep for now |
| `sync_rent_ledger_entry_context()` | none in app code | trigger target on `rent_ledger_entries` | tied to rent subsystem still scheduled | Needs manual review |
| `landlord_portal_can_read_quote(uuid)` | none in app code | used by `maintenance_quotes_portal_select` policy and landlord flow | portal quote access control | Needs manual review |
| `landlord_approve_quote(uuid, text)` | none in app code | granted to `authenticated`; depends on maintenance + messages + contractors | portal smoke tests still assert it | Needs manual review |
| `landlord_case_signal(uuid, text, text)` | none in app code | granted to `authenticated`; writes `messages` | portal smoke tests still assert it | Needs manual review |
| `landlord_add_case_update(uuid, text)` | none in app code | granted to `authenticated`; writes `messages` | portal smoke tests still assert it | Needs manual review |
| `contractor_add_case_update(uuid, text)` | none in app code | granted to `authenticated`; writes `messages` | portal/contractor surface still present in SQL | Needs manual review |
| `tenant_add_case_update(uuid, text)` | none in app code | granted to `authenticated`; writes `messages` | portal smoke tests still assert it | Needs manual review |
| `tenant_case_signal(uuid, text)` | none in app code | granted to `authenticated`; writes `messages` | portal smoke tests still assert it | Needs manual review |

## Trigger Candidates

| Object | Trigger target | Current dependency | Classification |
|---|---|---|---|
| `trg_cases_enrich_context` | `public.cases` | calls `enrich_case_context()` on live `cases` writes | Needs manual review |
| `trg_cases_ensure_work_item` | `public.cases` | calls `ensure_case_work_item()` on live `cases` writes | Needs manual review |
| `trg_call_sessions_enrich_context` | `public.call_sessions` | call-session high-risk path | Keep for now |
| `trg_call_sessions_sync_case_context` | `public.call_sessions` | call-session high-risk path | Keep for now |
| `trg_messages_enrich_context` | `public.messages` | messages high-risk path | Keep for now |
| `trg_rent_ledger_entries_sync_context` | `public.rent_ledger_entries` | rent automation path | Needs manual review |
| `trg_rent_ledger_entries_set_updated_at` | `public.rent_ledger_entries` | rent automation path | Needs manual review |
| `trg_lease_lifecycle_events_sync_context` | `public.lease_lifecycle_events` | lifecycle automation path | Keep for now |
| `trg_lease_lifecycle_events_ensure_move_out_tracker` | `public.lease_lifecycle_events` | live move-out tracker dependency | Keep for now |

## Stage Plan

### Stage A — Remove clearly dead view only

Files changed:
- `supabase/migrations/20260324_stage_a_remove_dead_crm_view_and_orphan_function.sql`

Objects in scope:
- `public.v_cases_list`

Rollback plan:
- re-create `public.v_cases_list` from `supabase/migrations/20260318_harden_operator_rls_and_indexes.sql`

Verification SQL:
```sql
select to_regclass('public.v_cases_list') as v_cases_list_exists;
```

Application smoke tests:
- load `/eot`
- open `/cases/[id]`
- upload a case document
- generate an EOT recommendation
- generate claim output

Blocked removal note:
- `public.log_case_status_change()` was removed from Stage A after live verification showed trigger `trg_cases_log_status_change` still exists on `public.cases`
- function cleanup must be handled in a separate audited pass that reviews the trigger and downstream audit-history expectations together

### Stage B — Archive candidate tables only after Stage A cooling period

Files changed:
- `supabase/migrations/20260324_stage_b_archive_legacy_crm_tables.sql`

Archive-first candidate tables:
- `case_assignments`
- `case_tags`
- `tags`
- `resolved_messages`
- `contact_methods`
- `case_events`
- `landlord_statements`
- `tenancy_key_sets`
- `tenancy_utilities`

Archive method:
- rename to `_deprecated_20260324_<table_name>`
- revoke `anon` / `authenticated` table access where appropriate
- do not touch high-risk FK-linked tables in this stage

Rollback plan:
- rename archived tables back to their original names
- restore any revoked grants recorded in the migration comments

Verification SQL:
```sql
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and tablename like '\_deprecated\_20260324\_%' escape '\'
order by tablename;
```

Application smoke tests:
- `/eot`
- `/cases/[id]`
- EOT initialize -> evidence -> recommendation -> claim smoke path
- knowledge search
- confirm no application role can still access archived tables directly

### Stage C — Permanent drop only after cooling period and proven non-use

Files changed:
- `supabase/migrations/20260324_stage_c_drop_archived_legacy_objects.sql`

Prerequisites:
- Stage B archived objects have remained unused through the agreed cooling window
- no app-code, SQL, seed, test, BI, or external automation references remain
- manual sign-off completed for each archived object

Rollback plan:
- restore from database backup or point-in-time recovery
- if needed, recover from archived tables before running Stage C

Verification SQL:
```sql
select schemaname, tablename
from pg_tables
where schemaname = 'public'
  and tablename like '\_deprecated\_20260324\_%' escape '\';
```

Application smoke tests:
- repeat full `/eot` smoke path
- run any remaining manual portal/call validation before dropping those subsystems in a later dedicated pass

Recommended cooling period:
- minimum 14 days after Stage B on production
- longer if portal, call, or support/export dependencies remain uncertain

## Assumptions

- repo search is the source of truth for current app-code references
- SQL migrations, seeds, and tests are treated as real dependencies unless proven obsolete
- no production-only hidden RPCs, BI jobs, or webhooks outside the repo are being assumed safe to remove

## Unresolved Risks

- hidden external callers may still use portal action functions granted to `authenticated`
- `pg_cron` schedule state must be checked in the live database before touching rent automation
- some legacy tables may still matter for historical exports, reporting, or customer support investigations
- call subsystem safety cannot be proven from repo state alone because the current codebase still preserves call schema and helper migrations
