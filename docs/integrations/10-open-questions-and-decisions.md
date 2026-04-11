# Open Questions and Decisions

## Decisions Already Made

| # | Decision | Source | Implication |
|---|----------|--------|-------------|
| D1 | PMS is source of truth for master data; Renovo caches | Founder confirmation | Properties/tenancies are read-only in Renovo UI |
| D2 | Two-way sync with full case mirror back to PMS | Founder confirmation | Must implement outbound push for all case data |
| D3 | Real-time via webhooks + on-demand pull (no polling) | Founder confirmation | No background scheduler needed for sync in v1 |
| D4 | Multiple systems connected simultaneously per agency | Founder confirmation | `external_refs` must support multiple providers per entity |
| D5 | Configurable rule engine per agency | Founder confirmation | Need rule storage, evaluation, and configuration UI |
| D6 | Public API: OAuth 2.0 (production) + API keys (sandbox) | Founder confirmation | Two auth paths in public API |
| D7 | NLG connects to our API (not PDF scraping) | Founder confirmation | Public API must be ready before NLG can integrate |
| D8 | Deposit schemes: full lifecycle (submit → dispute → outcome) | Founder confirmation | Need bidirectional integration with each scheme |
| D9 | Reapit marketplace app (OpenID Connect) | Founder confirmation | Must complete Reapit developer registration |
| D10 | Developer portal at developers.renovoai.co.uk | Founder confirmation | Need hosted docs site (Mintlify, Readme, or custom) |

## Assumptions Inferred from Repo

| # | Assumption | Evidence | Risk if wrong |
|---|-----------|----------|---------------|
| A1 | No background job infrastructure exists; BackgroundTasks is sufficient for v1 | No celery/arq/taskiq in requirements.txt; no worker config | High — if sync volumes are large, BackgroundTasks will block the request thread |
| A2 | Street.co.uk `api_token_encrypted` is currently plaintext | Code comment: `# TODO: encrypt at rest` | Medium — migration must actually encrypt |
| A3 | One connection per provider per tenant is sufficient for v1 | Agencies typically use one PMS | Low — if wrong, relax the UNIQUE constraint |
| A4 | Existing `properties.reference` field with `street:` prefix is the external ID pattern | Street sync uses `reference = f"street:{street_id}"` | Low — we're formalizing this into `external_refs` table |
| A5 | FastAPI's BackgroundTasks can handle webhook response time requirements (< 5s for Reapit) | BackgroundTasks runs after response is sent | Low — this is how BackgroundTasks works by design |
| A6 | Supabase Storage can host documents pushed via public API | Existing pattern for inspection-files bucket | Low — already proven in codebase |
| A7 | TanStack Query (react-query) is the data fetching pattern for all new UI | Package.json shows @tanstack/react-query | Low — well-established pattern in codebase |
| A8 | Supabase RLS is NOT used for application-level authorization (done in Python) | Backend handles all authz; RLS used only for `can_access_checkout_tenant` | Medium — must ensure public API also goes through Python authz, not just RLS |
| A9 | The `uuid7` library is used for all new IDs | `UUIDPrimaryKeyMixin` uses `uuid7()` | Low — continue the pattern |
| A10 | All API responses use bare objects (no envelope) internally, but public API will use envelope | Internal: `{items, next_offset, has_more}`; Public: `{data, pagination}` | Low — separate schemas handle this |

## Open Questions Requiring Input

### Must answer before coding begins (blockers)

| # | Question | Context | Recommended Default | Blocker? |
|---|----------|---------|-------------------|----------|
| Q1 | **Where to host the developer portal?** Mintlify, Readme.io, custom Next.js site, or Docusaurus? | Need interactive API playground, good DX. Mintlify is fastest to launch; Readme.io has more features. | **Mintlify** — fastest to launch, good OpenAPI integration, reasonable pricing. Can migrate later if needed. | Blocker for Phase 3.4 |
| Q2 | **What is the CREDENTIAL_ENCRYPTION_KEY?** Who generates it, where is it stored (env var, secrets manager)? | Currently no secrets manager. Everything is in env vars. | **Generate via `Fernet.generate_key()`**, store in env var on deployment platform (same as current secrets). Document rotation procedure. | Blocker for Phase 1.2 |
| Q3 | **Reapit developer account — company details needed.** Trading name, company number, registered address, DPO contact. | Reapit requires these for developer registration. | Founder provides company details. Registration can be done same-day. | Blocker for Phase 2.1 |
| Q4 | **Reapit app client_secret — where to store?** Global (one client_secret for all Renovo installations) or per-tenant? | Reapit marketplace apps have one client_id/client_secret pair for all installations. Each agency gets their own access_token via OAuth. | **Global** — one client_secret in env vars (`REAPIT_CLIENT_SECRET`). Per-tenant tokens in `integration_connections`. | Blocker for Phase 2.2 |
| Q5 | **Deposit scheme API access — is there a commercial agreement required?** TDS/DPS may require agent membership or partner agreement. | Unknown. Need to contact schemes. | **Start outreach immediately** (INT-300-303). If commercial agreement needed, factor 4-8 weeks for legal. Phase 4 timeline may slip. | Blocker for Phase 4 |

### Should answer before coding, but have safe defaults (non-blockers)

| # | Question | Context | Recommended Default |
|---|----------|---------|-------------------|
| Q6 | **Should the public API live on a separate subdomain?** `api.renovoai.co.uk/v1/` vs `app.renovoai.co.uk/api/public/v1/` | Separate subdomain is cleaner for partners; same domain is simpler to deploy. | **Separate subdomain** (`api.renovoai.co.uk`). Easier to rate-limit independently, clearer partner DX. Deploy as separate route in same app for v1 (separate deployment in v2). |
| Q7 | **What happens to cached data when an agency disconnects?** Soft-delete immediately, retain for X days, or keep forever? | Cases reference cached properties/tenancies. Deleting breaks those references. | **Soft-delete cached data after 90 days.** Cases retain inline address data (denormalized). Property/tenancy records go to `deleted_at` immediately but are restorable for 90 days. |
| Q8 | **Should the rule engine support "round_robin" assignment?** Requires knowing all operators and their current load. | `assign_case` action currently accepts user_id or special strings. | **Support "round_robin" in v1** — simple rotation through active operators. "least_loaded" deferred to v2 (requires load calculation). |
| Q9 | **What's the maximum file size for public API document uploads?** Inventory reports can be large (10-50MB). | Current Supabase Storage has no enforced limit. | **25MB per file** — covers 99% of inventory reports. Reject with 413 if exceeded. Document this in API spec. |
| Q10 | **Should webhook delivery be synchronous (in-request) or async?** Sync = partner gets event faster; Async = more reliable. | No background worker exists. BackgroundTasks runs after response. | **Async via BackgroundTasks** — webhook delivery happens after the API response. Partner latency doesn't block our response. If delivery volume grows, graduate to ARQ. |
| Q11 | **How many default rule templates should ship?** More templates = more testing + maintenance. | Proposed 4 templates in spec. | **Start with 2 templates** — "Auto-create case on checkout received" and "Notify on claim deadline approaching". Add more based on agency feedback. |
| Q12 | **Should we support file upload via URL reference or require direct upload?** NLG may prefer to send a URL to their CDN rather than uploading the file binary. | Current inspection endpoint proposes accepting `url` field for photos/documents. | **Support both** — direct upload via multipart AND URL reference (we'll download and store). URL reference is simpler for partners. Validate URL accessibility on receipt. |
| Q13 | **V1 outbound write-back: journal entry format for Reapit.** What should the note template say? | Reapit journal entries have `typeId`, `description`, `body`. | **Draft template:** `"[Renovo] Case {reference} — {status_label}"` as description. Body includes summary, key dates, assigned operator. Let agencies customize template in v2. |
| Q14 | **When should "tenancy.ending_soon" fire?** How many days before end_date? | Spec says "configurable." But what's the default threshold? | **Default: 28 days** (4 weeks). Agencies can override in rule conditions. This gives time for checkout scheduling. |

## Recommendations Summary

| Question | Recommendation | Confidence |
|----------|---------------|-----------|
| Q1 (Developer portal) | Mintlify | High — fastest to launch, good OpenAPI support |
| Q2 (Encryption key) | Fernet key in env var | High — matches existing pattern |
| Q3 (Reapit registration) | Founder acts this week | High — critical path |
| Q4 (Reapit client_secret) | Single global secret in env | High — standard for marketplace apps |
| Q5 (Deposit scheme access) | Start outreach now, parallel to build | High — don't wait |
| Q6 (API subdomain) | `api.renovoai.co.uk` | Medium — could go either way |
| Q7 (Data retention on disconnect) | 90-day soft-delete | High — compliance-safe |
| Q8 (Round robin) | Include in v1 | Medium — nice to have, simple to implement |
| Q9 (File size limit) | 25MB | High — industry standard |
| Q10 (Webhook delivery) | Async BackgroundTasks | High — proven pattern |
| Q11 (Rule templates) | Start with 2 | High — reduce scope |
| Q12 (File upload mode) | Both URL + direct | Medium — URL is simpler for partners |
| Q13 (Journal format) | Template in code, customizable later | High — start simple |
| Q14 (Ending soon days) | 28 days default | High — matches industry practice |

## Technical Debt Identified During Research

| Item | Current state | Required action | Phase |
|------|--------------|-----------------|-------|
| `street_connections.api_token_encrypted` is not actually encrypted | Plaintext TEXT column | Encrypt during migration to `integration_connections` | Phase 1 |
| No background job infrastructure | Only FastAPI BackgroundTasks | Acceptable for v1; plan ARQ migration path for v2 | Phase 5 (note) |
| `properties.reference` stores `street:` prefix inline | Works but not formalized | Migrate to `external_refs` table; keep `reference` column for display | Phase 1 |
| No webhook infrastructure (no generic receiver) | Only Resend inbound email webhook | Build generic webhook router in Phase 2 | Phase 2 |
| Settings UI is hardcoded for Street.co.uk | Single provider | Generalize to provider-agnostic cards in Phase 1 | Phase 1 |
| Case service doesn't emit events | Status changes happen silently | Add event emission hooks in Phase 1 | Phase 1 |
| No idempotency on internal API writes | Duplicate requests can create duplicate records | Add idempotency keys to public API; internal API acceptable without (proxy layer is trusted) | Phase 3 |

## Decision Log Format

When a decision is made against an open question, record it here:

```
### Q{N}: {Title}
**Decision:** {what was decided}
**Date:** {when}
**Decided by:** {who}
**Rationale:** {why}
**Impact:** {what changes as a result}
```

---

*Last updated: 2026-04-11*
