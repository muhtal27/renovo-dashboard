import Link from "next/link"
import Image from "next/image"
import { MarketingShell } from "@/app/components/MarketingShell"

/* ────────────────────────────────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────────────────────────────────── */

const toolGrid = [
  { tool: "Email", role: "Chasing" },
  { tool: "Spreadsheets", role: "Tracking" },
  { tool: "Inventory app", role: "Reports" },
  { tool: "Word / Docs", role: "Letters" },
  { tool: "Cloud storage", role: "Evidence" },
  { tool: "TDS / DPS", role: "Disputes" },
] as const

const stats = [
  { value: "6+", label: "Tools per checkout" },
  { value: "2\u20133 hrs", label: "Admin per case" },
  { value: "0", label: "Audit trail" },
] as const

const problems = [
  {
    num: "01",
    title: "Every checkout starts from zero",
    body: "Reports arrive by email. Photos sit in cloud storage. Notes live in a spreadsheet. There is no single view of the case, the deduction position, or what still needs doing.",
  },
  {
    num: "02",
    title: "Deduction letters are retyped every time",
    body: "Managers pull photos from folders, cross-check fair wear and tear guidance, and draft a deduction letter from scratch for every case. The same work, repeated thirty times a month.",
  },
  {
    num: "03",
    title: "Disputes are won or lost on pack quality",
    body: "When a tenant escalates to TDS, DPS, mydeposits, or SafeDeposits Scotland, the outcome depends on whether the evidence pack is complete, ordered, and defensible. Most agencies assemble it under deadline pressure.",
  },
] as const

const steps = [
  {
    num: "1",
    tag: "Automated intake",
    title: "Case opened and report fetched",
    body: "When a checkout is scheduled, Renovo AI opens the case and pulls in the checkout report, photos, and supporting evidence. The team starts from one file, not an inbox.",
  },
  {
    num: "2",
    tag: "AI review",
    title: "AI compares check-in and checkout evidence",
    body: "Renovo compares both reports room by room, flags discrepancies, checks for missing evidence, and highlights the issues that need a manager decision.",
  },
  {
    num: "3",
    tag: "AI drafting",
    title: "Liability assessment drafted with reasoning",
    body: "A structured liability assessment is prepared with fair wear and tear reasoning, betterment context, evidence references, and a recommended deduction position for each issue.",
  },
  {
    num: "4",
    tag: "Human decision",
    title: "Manager reviews, edits, and approves",
    body: "The manager reads the draft, changes anything they disagree with, adds notes, and approves or rejects. Every edit is logged automatically.",
  },
  {
    num: "5",
    tag: "Resolution",
    title: "Deposit released",
    body: "Once the position is agreed, the case is closed with the full decision trail intact and the deposit is released through the relevant scheme.",
  },
  {
    num: "6",
    tag: "One-click pack",
    title: "Dispute pack generated if escalated",
    body: "If a tenant escalates, Renovo produces the evidence pack with the timeline, reasoning, references, and supporting files already assembled.",
  },
] as const

const beforeAfter = [
  {
    label: "Deduction letters",
    before: { title: "30\u201345 minutes per letter", body: "Retype summaries, pull photos from folders, check fair wear and tear guidance, and draft the deduction letter manually for each case." },
    after: { title: "Structured draft in under 2 minutes", body: "Charges, rationale, and evidence references are assembled from the case file for manager review and approval." },
  },
  {
    label: "Evidence management",
    before: { title: "Evidence across five systems", body: "Photos in cloud storage, reports in email, notes in spreadsheets, and the letter in Word. No single record of the case." },
    after: { title: "One workspace with linked records", body: "Timeline, evidence, issue history, and dispute preparation stay connected in one operational case file." },
  },
  {
    label: "Audit trail",
    before: { title: "Reasoning rebuilt after the fact", body: "When a deduction is challenged, teams reconstruct the logic from memory, inboxes, and old files." },
    after: { title: "Every decision already documented", body: "Notes, edits, approvals, and rejections are logged against the case before the position is challenged." },
  },
  {
    label: "Dispute preparation",
    before: { title: "Built under scheme deadline pressure", body: "Managers scramble across tools to assemble an evidence pack. Incomplete packs lose otherwise winnable deductions." },
    after: { title: "Dispute pack ready from day one", body: "Evidence references and the decision trail are assembled during the checkout workflow, not after escalation." },
  },
  {
    label: "Team consistency",
    before: { title: "Different judgement every time", body: "The same issue is handled differently across managers, with no shared structure around betterment or proportionate charging." },
    after: { title: "Consistent, explainable logic", body: "Renovo applies a structured recommendation process so teams stay aligned on fair wear and tear and evidence-backed positions." },
  },
] as const

const platformFeatures = [
  {
    title: "Portfolio command view",
    body: "Active checkouts, draft deduction letters, disputes, and evidence status in one place.",
  },
  {
    title: "Attention queue",
    body: "Stalled, disputed, or incomplete cases surface automatically so managers know what needs action first.",
  },
  {
    title: "Reports and analytics",
    body: "Track checkout volume, dispute rates, resolution times, and operator workload across the team.",
  },
  {
    title: "Guidance hub",
    body: "Fair wear and tear, betterment, and scheme-ready wording built into the review workflow.",
  },
] as const

const integrations = [
  { name: "Reapit", role: "Property CRM" },
  { name: "Arthur Online", role: "Property management" },
  { name: "SME Professional", role: "Property CRM" },
  { name: "Fixflo", role: "Repairs and maintenance" },
  { name: "InventoryBase", role: "Inventory software" },
  { name: "No Letting Go", role: "Inventory software" },
  { name: "HelloReport", role: "Inventory software" },
] as const

/* ────────────────────────────────────────────────────────────────────────────
   PAGE
   ──────────────────────────────────────────────────────────────────────────── */

export default function HomePageClient() {
  return (
    <MarketingShell currentPath="/">
      <div className="page-shell page-stack">

        {/* ── 1. HERO ── */}
        <section className="page-hero text-center">
          <p className="app-kicker">End-of-tenancy automation</p>
          <h1 className="page-title mx-auto max-w-[820px]">
            Checkout reports in. <em>Deposit decisions out.</em>
          </h1>
          <p className="page-copy mx-auto max-w-[760px]">
            Renovo AI handles the liability comparison, deduction drafting,
            evidence assembly, and dispute preparation. Your team reviews and
            approves every decision. Nothing goes out without sign-off.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get started →
            </Link>
            <Link
              href="/demo"
              className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              View demo
            </Link>
          </div>
        </section>

        {/* Dashboard preview */}
        <section className="page-card -mt-4">
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <Image
              src="/dashboard-preview.png"
              alt="Renovo AI dashboard showing active checkout cases"
              width={1920}
              height={1080}
              className="w-full"
              priority
            />
          </div>
        </section>

        {/* ── 2. PROBLEM ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">The problem</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              One checkout. <em>Six tools. Zero trail.</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              End-of-tenancy is still split across email, spreadsheets, inventory
              apps, Word, cloud storage, and deposit portals. Every case starts
              from scratch. Every deduction letter is retyped. And when a tenant
              disputes, the evidence is scattered across all of them.
            </p>
          </div>

          {/* Tool grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {toolGrid.map((t) => (
              <div
                key={t.tool}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center"
              >
                <p className="text-sm font-semibold text-zinc-950">{t.tool}</p>
                <p className="mt-1 text-xs text-zinc-500">{t.role}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center"
              >
                <p className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Pain points */}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.num}>
                <p className="text-xs font-semibold text-zinc-400">{p.num}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. HOW IT WORKS ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">How it works</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              From checkout date to <em>deposit released</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              The actual Renovo workflow. Automated where possible, reviewed
              where it matters.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <article
                key={s.num}
                className="rounded-xl border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-600">
                    {s.num}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-400">
                    {s.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-950">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{s.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
            >
              See the full workflow walkthrough →
            </Link>
          </div>
        </section>

        {/* ── 4. BEFORE AND AFTER ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">Before and after</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              What actually <em>changes</em>
            </h2>
          </div>

          <div className="mt-8 divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {beforeAfter.map((item, i) => (
              <details
                key={item.label}
                className="group bg-white px-5 py-4 first:rounded-t-xl last:rounded-b-xl"
                {...(i === 0 ? { open: true } : {})}
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-zinc-950">
                  <span className="mr-3 text-xs text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Before
                    </p>
                    <h4 className="mt-2 text-sm font-semibold text-zinc-950">
                      {item.before.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">
                      {item.before.body}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      After
                    </p>
                    <h4 className="mt-2 text-sm font-semibold text-zinc-950">
                      {item.after.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">
                      {item.after.body}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── 5. HUMAN CONTROL ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">Human control</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              AI drafts. Your team <em>decides.</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              Every recommendation requires manager approval. Nothing is sent to
              a tenant or submitted to a deposit scheme without human sign-off.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-950">
                Manager approval required
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                No liability position or claim output is progressed without
                explicit sign-off from a named manager.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-950">
                Full audit trail
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                Every edit, note, approval, and rejection is logged with a
                timestamp and the person who made it.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-semibold text-zinc-950">
                Defensible at scheme level
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                When TDS, DPS, mydeposits, or SafeDeposits Scotland reviews the
                file, the reasoning and evidence are already assembled.
              </p>
            </div>
          </div>

          {/* Workflow sequence */}
          <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="space-y-4">
              {[
                { tag: "AI", text: "AI drafts liability assessment and landlord recommendations" },
                { tag: "PM", text: "Tenant accepts or disputes the proposed position" },
                { tag: "PM", text: "Landlord accepts full, partial, or declines" },
                { tag: "PM", text: "Manager negotiates from a documented case file" },
                { tag: "OK", text: "Deposit released or dispute pack generated" },
              ].map((row) => (
                <div key={row.text} className="flex items-start gap-3">
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-xs font-semibold text-zinc-600">
                    {row.tag}
                  </span>
                  <p className="text-sm leading-7 text-zinc-700">{row.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "GDPR compliant", sub: "Data hosted in London, UK" },
              { label: "Role-based access", sub: "Scoped to your team" },
              { label: "Audit trail by default", sub: "Decisions stay traceable" },
              { label: "UK registered", sub: "SC833544 · VAT GB483379648" },
            ].map((b) => (
              <div key={b.label} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center">
                <p className="text-xs font-semibold text-zinc-950">{b.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{b.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. REGULATORY CHANGE ── */}
        <section className="page-card border-y border-zinc-200 bg-zinc-50">
          <div className="max-w-[760px]">
            <p className="app-kicker">Regulatory change</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              The Renters' Rights Act is <em>live from 1 May 2026</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              Section 21 is abolished. All assured shorthold tenancies become
              periodic. Evidence standards and dispute scrutiny are increasing
              across the sector. Agents in England who fail to provide the
              required tenancy information by 31 May 2026 risk civil penalties of
              up to £7,000.
            </p>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              Documented, defensible checkout decisions matter more than ever.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-zinc-950">
                Stronger evidence requirements
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                Every deduction needs documented reasoning, timestamped evidence,
                and a clear audit trail.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-zinc-950">
                Built-in guidance
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                Fair wear and tear guidance, betterment calculations, and
                tenancy-length adjustments are built into the review workflow.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-zinc-950">
                Consistent output
              </h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600">
                Liability assessments follow a structured logic every time,
                regardless of who handles the case.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
            >
              See how Renovo helps →
            </Link>
          </div>
        </section>

        {/* ── 7. THE PLATFORM ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">The platform</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Built for how agencies <em>actually work</em>
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {platformFeatures.map((f) => (
              <article
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-white p-6"
              >
                <h3 className="text-sm font-semibold text-zinc-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{f.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/demo"
              className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
            >
              View demo →
            </Link>
          </div>
        </section>

        {/* ── 8. INTEGRATIONS ── */}
        <section className="page-card">
          <div className="max-w-[760px]">
            <p className="app-kicker">Integrations</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Works with your <em>existing software</em>
            </h2>
            <p className="mt-3 text-base leading-8 text-zinc-600">
              Designed for the systems UK letting agencies already use across
              property management, inventory, maintenance, and deposit schemes.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {integrations.map((i) => (
              <div
                key={i.name}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-center"
              >
                <p className="text-sm font-semibold text-zinc-950">{i.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{i.role}</p>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-center">
              <p className="text-sm font-semibold text-zinc-500">+ More</p>
              <p className="mt-1 text-xs text-zinc-400">Custom integrations</p>
            </div>
          </div>
        </section>

        {/* ── 9. CTA ── */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
            See it with a <em>real case</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
            Tell us how your team currently handles checkouts, deduction letters,
            and dispute packs. We will show you how Renovo fits.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get started →
            </Link>
            <Link
              href="/demo"
              className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              View demo
            </Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
