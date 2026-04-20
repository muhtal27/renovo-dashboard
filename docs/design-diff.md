# Design diff — prototype vs live operator dashboard

**Source of truth:** [`public/demo.html`](../public/demo.html).
**Rule:** every PR that touches operator UI must close one or more items below and reference them by ID in the commit body.

Item IDs are stable: **do not renumber**. Mark done by changing `[ ]` → `[x]` and linking the closing commit/PR.

---

## Phase 0 — Tokens

- [x] **T1** Port layout tokens `--sidebar-w: 260px`, `--sidebar-cw: 72px`, `--header-h: 56px` into [globals.css](../app/globals.css) under `:root`. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **T2** Port full color ramps (zinc 50–950, emerald 50–700, sky/indigo/amber/orange/rose/violet/cyan 50/500/700) as CSS custom properties. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **T3** 5px zinc-300 webkit scrollbars scoped to `.operator-app`. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [ ] **T4** `body` scroll model: operator shell scrolls inside `.page-scroll`, not the body. Prototype ref: [demo.html:50, 78](../public/demo.html#L50). _Deferred — structural; revisit once Phase 3 workspace work lands._

## Phase 1 — Shell

- [x] **S1** Sidebar footer shows operator's **organisation name**, not "Property Manager". Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S2** Header search: replace read-only button with inline type-ahead dropdown grouped by section. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S3** Header: drop duplicate mobile-only search icon; single `⌘K` hint serves all viewports. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S4** Notifications dropdown: add **"Mark all read"** action in header. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S5** Notifications: unread rows tinted `sky-50`; unread vs read visually distinct. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S6** Notifications: show **icon glyph** per tone (alert-triangle / shield-alert / check-circle / info), not a plain colored dot. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S7** Notifications: `info` tone uses sky, not neutral zinc. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S8** Command palette: add **Intelligence**, **Deposit Schemes**, **What's New** entries. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S9** Command palette: rename "Guidance Library" → "Guidance". Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S10** Command palette: highlighted row uses `zinc-50` background (neutral), not emerald. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).
- [x] **S11** Command palette: drop footer hint row. Closed by [bf23ef2](https://github.com/muhtal27/renovo-dashboard/commit/bf23ef2).

## Phase 2 — Shared primitives

- [x] **P1** Response modal (`dispute` / `counter` / `query` / `reject`) as a shared component. See [app/components/ResponseModal.tsx](../app/components/ResponseModal.tsx).
- [x] **P2** Final Claim Statement overlay (5 sections + Print / Done footer). See [app/components/FinalClaimStatement.tsx](../app/components/FinalClaimStatement.tsx).
- [x] **P3** Toast container + success / error / default variants (+ `useToast()` hook, wired to `ToastProvider` in the operator shell). See [app/components/Toast.tsx](../app/components/Toast.tsx).

## Phase 3 — High-impact pages

### Dashboard

- [x] **D1** Open Cases KPI switched to `stats.totalCases` (all cases including resolved) to match the prototype count. Closed in Phase 3b.
- [x] **D2** "Next: {n}d" rose badge renders in the Open Cases footer when the nearest tenancy-end deadline is ≤14 days away. Closed in Phase 3b.
- [x] **D3** Active Tenancies and Total Deposits footers now report `trendPct` computed from the sparkline series (with sign / color), not hardcoded copy. Closed in Phase 3b.
- [ ] **D4** Recent Activity reads from curated `ACTIVITY_FEED` in the shape prototype defines. _Deferred — the live feed is already derived from real case activity; prototype curation would replace real data._
- [x] **D5** Refresh button on the greeting row and "Full report" CTA on Monthly Throughput removed. Closed in Phase 3b.

### Tenancies

- [x] **TN1** Added **Assigned** and **Deadline** columns (with days-until badge). Compliance + Type (HMO) columns **deferred** — live workspace payload doesn't expose compliance score or HMO flag at the list level. Closed partially in Phase 3d.
- [ ] **TN2** Bulk-select checkbox column + contextual banner. _Deferred — requires bulk-assign / bulk-export API support._
- [x] **TN3** Pagination: 10 rows per page with Prev/Next. Closed in Phase 3d.
- [x] **TN4** Case ID shows full ID (not 8-char slice), monospaced. Closed in Phase 3d.
- [x] **TN5** Filter pills always render every status; count chip still reflects live counts. Closed in Phase 3d.
- [x] **TN6** Table/Board toggle already uses `pill` style (matches prototype). Verified.
- [ ] **TN7** Kanban drag-and-drop. _Deferred — requires a case status-transition API call from the client; substantial change._

### Workspace

- [x] **W1** Collapse steps 4+5 back to single merged **"Analysis & Review"**. Closed in Phase 3a-1 — review content renders inline beneath analysis summary via dynamic import of `StepReview`.
- [x] **W2** Rename step 3 **"Readings"** → **"Handover"** (step key stays `readings` for URL backwards-compat). Closed in Phase 3a-1.
- [x] **W3** Step-locking: future steps show a lock icon, `disabled` + `aria-disabled`, and tooltip "Complete previous steps first". Keyboard nav (Ctrl+←/→) honours the same lock. Closed in Phase 3a-1.
- [x] **W4** Header meta line: now shows region (derived from `property.country_code`) and Custodial / Insurance-backed pill (reads `checkoutCase.depositType`, optional until the backend populates). Closed in Phase 3a-2.
- [x] **W5** Sidebar Case Overview: restored **Deadline** row with `WorkspaceDeadlineBadge` (rose ≤7d / amber ≤14d / neutral otherwise). Closed in Phase 3a-2.
- [x] **W6** Documents list now driven by the full `data.documents` array (with a synthetic "AI Analysis Report" entry once analysis has completed). Closed in Phase 3a-2.
- [x] **W7** Activity Log card in the sidebar reads from `data.timeline` (backend-persisted audit events). Closed in Phase 3a-2.
- [x] **W8** Inventory step: **PI compliance banner** renders (emerald / amber / rose) based on the compliance record flagged `prescribed_information`; the rose variant includes a "Resolve now" button. Closed in Phase 3a-3.
- [ ] **W9** Inventory step: **prior-dispute risk banner** with Risk Heatmap link. Data not yet in the workspace payload (property-level risk score). _Deferred — revisit with Phase 3 Disputes work._
- [x] **W10** Inventory step: **Inventory & Evidence card** (signed check-in/out rows with Upload / View actions, items + photos count). Closed in Phase 3a-3. Clerk avatar + quality / win-rate chips are data-gated — show when backend exposes the clerk record.
- [x] **W11** Inventory step: **Compliance Pack card** with Tenancy agreement / Deposit cert / PI / Gas Safety / EICR / EPC / Legionella / Alarms rows (Scottish landlord reg appears only when `country_code` resolves to Scotland). Closed in Phase 3a-3.
- [x] **W12** Inventory step: **readiness footer** — "N of M complete · ready to proceed" with an inline Continue to Checkout button (default StepNavigation hidden for this step to avoid duplicating the CTA). Closed in Phase 3a-3.
- [x] **W13** Inventory step Setup card: Property / Tenancy / People / Financial sections matching prototype, with deposit type (Custodial / Insurance-backed) row and a Scottish landlord-reg placeholder when region resolves to Scotland. HMO indicator is data-gated. Closed in Phase 3a-3.
- [ ] **W14** Response modal wiring — **moved to portal scope**: the prototype invokes `openResponseModal()` only from the tenant portal (dispute / counter) and the landlord portal (query / reject), not the operator Negotiation step. Tracked under **TP3** and **LP5** instead.
- [x] **W15** Final Claim Statement overlay on resolution — wired into the Refund step's Resolved block via a "View Final Claim Statement" button. Agreed / disputed / countered stats fall back to totals until per-item response tracking is wired in. Closed in Phase 3a-4.

### Disputes

- [x] **DI1** Adjudication Bundle tab added (4th tab). Closed in Phase 3c; bundle detail placeholder links to DI2–DI5 backlog.
- [ ] **DI2** Adjudication Bundle — list view stat cards, bundle table. _Deferred — requires bundle data model (readiness %, checklist status, predicted award)._ 
- [x] **DI3** 5-stage strip (Draft → Internal Review → Submitted → Adjudicator Assigned → Decision) rendered inside the Adjudication Bundle tab. Closed in Phase 3c.
- [ ] **DI4** 11-item checklist with ok/weak/missing tiles. _Deferred — needs bundle checklist state in the payload._
- [ ] **DI5** Adjudicator Lens + Statement of Case + Evidence Index + Compile / Submit. _Deferred — needs bundle API endpoints._
- [x] **DI6** Active filter pool now includes `status==='disputed' || priority==='high'`. Closed in Phase 3c.
- [x] **DI7** Active dispute card now shows case ID (short), Assigned operator (or Unassigned chip), and Scheme. "Cert Missing" badge deferred — no certificate-served flag in the payload yet.
- [x] **DI8** Avg Resolution stat shows "25d" placeholder until the analytics endpoint exposes a real figure. Closed in Phase 3c.
- [ ] **DI9** Dispute Timeline curated narrative. _Deferred — per-case rows are informationally correct for live data; the curated narrative in the prototype is mock._
- [ ] **DI10** Scheme Correspondence grouped by scheme ref. _Deferred — needs scheme correspondence records in the payload._
- [x] **DI11** Dropped the icon tiles inside stat cards and the Refresh button. Closed in Phase 3c.

## Phase 4 — Medium-impact pages

### Communications

- [ ] **C1** Register **Tenant Portal** and **Landlord Portal** as tabs. Prototype ref: [demo.html:3934](../public/demo.html#L3934).
- [ ] **C2** Inbox tab shows unread count badge. Prototype ref: [demo.html:3934](../public/demo.html#L3934).
- [ ] **C3** Inbox rows show **subject line**, not property address; unread rows tinted. Prototype ref: [demo.html:3942-3948](../public/demo.html#L3942).
- [ ] **C4** Inbox: drop channel pills / search / message count / refresh / Compose toolbar (not in prototype).
- [ ] **C5** Conversations: per-message rows with case-ID badge, not grouped-by-case threads. Prototype ref: [demo.html:3950-3960](../public/demo.html#L3950).
- [ ] **C6** Conversations: drop the 5-tile StatCard row and Awaiting-Reply filters (not in prototype).
- [ ] **C7** Convo Detail sidebar: restore **Deposit** field. Prototype ref: [demo.html:3966-4004](../public/demo.html#L3966).
- [ ] **C8** Templates: read-only cards with single "Use Template" CTA. Drop edit/duplicate/delete, forms, variable picker, category filters, "New Template". Prototype ref: [demo.html:4006-4010](../public/demo.html#L4006).

### Reports

- [x] **R1** Date-range select now matches the prototype option order (Last 6 months / Last quarter / Last month / Year to date / Last 12 months). Closed in Phase 4.
- [ ] **R2** Resolution Time stages: Evidence 3d / Analysis 1d / Review 2d / Draft Sent 5d / Submitted 14d. Prototype ref: [demo.html:4029](../public/demo.html#L4029).
- [ ] **R3** Recovery Analytics: standalone Legend card + "Recovery by Deposit Scheme" section. Prototype ref: [demo.html:4033-4066](../public/demo.html#L4033).
- [ ] **R4** AI Accuracy: sky insight callout about damage-type defects and tenant→shared overrides. Prototype ref: [demo.html:4104-4108](../public/demo.html#L4104).
- [ ] **R5** SLA Metrics: Financial Forecast card (Pipeline Value / Historical Success Rate / Projected Recovery). Prototype ref: [demo.html:4110-4132](../public/demo.html#L4110).

### Inventory Feedback

- [x] **IF1** Download Report / View Dispute / Send Reminder buttons now dispatch `useToast` feedback so they're no longer inert. Closed in Phase 4.
- [x] **IF2** Empty state rendered with icon + secondary copy when no items match. Closed in Phase 4.

### Admin

- [ ] **A1** System Audit Log card. _Deferred — requires a backend audit-log endpoint; session-local log doesn't fit a multi-tab operator workflow._
- [x] **A2** "Active Operators" now counts members who currently have at least one assigned non-resolved case (best available proxy for an `active` status since membership records don't expose activity state). Closed in Phase 4.
- [ ] **A3** Assignee dropdown filter excludes viewer role. _Deferred — current Assignee type doesn't carry role; needs backend enrichment._
- [x] **A4** Case column shows the full case ID, monospaced. Closed in Phase 4.

### Settings

- [ ] **SE1** Integrations: iterate shared `INTEGRATIONS` list with three states (Connected / Invalid Credentials / Not configured) and Configure / Edit Config button. Prototype ref: [demo.html:4276-4284](../public/demo.html#L4276).
- [ ] **SE2** Integration config modal (API Key + Endpoint URL + Connection Status + Disconnect / Cancel / Save & Test). Prototype ref: [demo.html:4318-4345](../public/demo.html#L4318).
- [ ] **SE3** Data & Privacy: heading "Data Retention Policy"; year-based retention options; "Auto-delete tenant photos" toggle; buttons "Export All Tenant Data (SAR)" / "Process Deletion Request". Prototype ref: [demo.html:4299-4311](../public/demo.html#L4299).

### Billing

- [x] **B1** Amber usage banner renders above "Choose Your Plan" when `usagePct >= 80`, with "Add Block" CTA. Closed in Phase 4.
- [x] **B2** All non-current plan CTAs read **Select Plan** — Contact Sales / Downgrade variants removed. Closed in Phase 4.
- [ ] **B3** Invoice row expansion with line items. _Deferred — needs line-item data on invoices._
- [ ] **B4** Payment-method form error state. _Deferred — form validation is intentionally thin until Stripe Elements wiring._

## Phase 5 — Polish

### Teams

- [ ] **TE1** Cases column shows `m.cases` count (not "—"). Prototype ref: [demo.html:4244](../public/demo.html#L4244).
- [ ] **TE2** Merge `/teams/teams` back into `/teams` with "Members" + "Team Groups" tabs. Prototype ref: [demo.html:4242](../public/demo.html#L4242).
- [ ] **TE3** Role badge is read-only (admin=violet, else=zinc). Prototype ref: [demo.html:4244](../public/demo.html#L4244).
- [ ] **TE4** Team-group card shows `{members} members · {cases} active cases`. Prototype ref: [demo.html:4251](../public/demo.html#L4251).
- [ ] **TE5** Drop inline invite-member and create-team forms; single top-level "Invite Member" button.

### Tenant Portal

- [ ] **TP1** Stat cards = Case Status / Deposit Held / Proposed Return. Prototype ref: [demo.html:4561-4565](../public/demo.html#L4561).
- [ ] **TP2** Response Summary section (accepted / disputed / countered / unresponded). Prototype ref: [demo.html:4566-4572](../public/demo.html#L4566).
- [ ] **TP3** Deductions tab: per-defect cards with Accept/Dispute/Counter + Submit Response + totals. Prototype ref: [demo.html:4591-4616](../public/demo.html#L4591).
- [ ] **TP4** Evidence tab: wire dropzone + uploads list + Agent Evidence section. Prototype ref: [demo.html:4622-4629](../public/demo.html#L4622).
- [ ] **TP5** Messages tab: wire Send button. Prototype ref: [demo.html:4632-4641](../public/demo.html#L4632).
- [ ] **TP6** Timeline: "Tenancy ended" row; "6 days remaining" copy. Prototype ref: [demo.html:4579](../public/demo.html#L4579).
- [ ] **TP7** Drop "Demo Preview" chip, extra stats bar, case selector (not in prototype).

### Landlord Portal

- [ ] **LP1** Profile card uses real landlord initials + name (not "LL" / "Landlord"). Prototype ref: [demo.html:4682-4686](../public/demo.html#L4682).
- [ ] **LP2** Stat cards = Case Status / Deposit Protected / Proposed Claim. Prototype ref: [demo.html:4699-4703](../public/demo.html#L4699).
- [ ] **LP3** Review Summary section (approved / queried / rejected). Prototype ref: [demo.html:4704-4709](../public/demo.html#L4704).
- [ ] **LP4** Property Summary: Property / Tenant / Tenancy Period / Deposit Scheme / Deposit Type / Reference. Prototype ref: [demo.html:4710-4715](../public/demo.html#L4710).
- [ ] **LP5** Deductions tab: Approve/Query/Reject + Submit Review. Prototype ref: [demo.html:4725-4749](../public/demo.html#L4725).
- [ ] **LP6** Evidence tab heading "Upload Contractor Quotes & Evidence" + wired dropzone. Prototype ref: [demo.html:4756-4763](../public/demo.html#L4756).
- [ ] **LP7** Messages tab: wire Send button.
- [ ] **LP8** Drop "Demo Preview" chip, extra stats bar, case selector (not in prototype).

### Guidance

- [x] **G1** Empty state now includes the book-open icon + "Try adjusting your search or filters." copy. Closed in Phase 4.
- [ ] **G2** Related articles computed from category/region. _Deferred — current article data uses explicit `related` lists; revisit when guidance content migrates to DB-driven taxonomy._

### Deposit Schemes

- [x] **DS1** Each scheme now has a real `url`; "Visit Website" renders as an `<a target="_blank">`. Closed in Phase 4.

---

## PR process

Every PR must:

1. Reference item IDs in the commit message: `Closes D2, D3`.
2. Tick the items in this file in the same PR.
3. Include a side-by-side screenshot vs the prototype section.
4. Use tokens and primitives from Phases 0–2 only — no inline hex, no bespoke CSS.
