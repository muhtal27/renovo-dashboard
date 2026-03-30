import Link from "next/link"
import Image from "next/image"
import { MarketingShell } from "@/app/components/MarketingShell"

export default function HomePageClient() {
  return (
    <MarketingShell currentPath="/">
      <div className="page-shell page-stack">

        {/* ── HERO ── */}
        <section className="page-hero text-center">
          <p className="app-kicker">End-of-tenancy automation</p>
          <h1 className="page-title mx-auto max-w-[820px]">
            Checkout reports in. <em>Deposit decisions out.</em>
          </h1>
          <p className="page-copy mx-auto max-w-[600px]">
            Liability comparison, deduction drafting, evidence assembly, and
            dispute packs. Your team approves every decision.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
              Get started →
            </Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
              View demo
            </Link>
          </div>
        </section>

        {/* ── DASHBOARD ── */}
        <section className="mx-auto max-w-[960px] px-6">
          <div className="overflow-hidden rounded-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <Image
              src="/dashboard-preview.png"
              alt="Renovo AI dashboard"
              width={1920}
              height={1080}
              className="w-full block"
              priority
            />
          </div>
        </section>

        {/* ── THE PROBLEM ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">The problem</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            One checkout. <em className="text-zinc-500">Six tools. Zero trail.</em>
          </h2>
          <p className="mt-4 max-w-[600px] text-base leading-8 text-zinc-500">
            End-of-tenancy admin is split across email, spreadsheets, inventory
            apps, Word, cloud storage, and deposit portals.
          </p>

          <div className="mt-12 flex flex-wrap gap-16">
            <div>
              <p className="text-4xl font-bold tracking-tight text-zinc-950">6+</p>
              <p className="mt-1 text-sm text-zinc-500">Tools per checkout</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight text-zinc-950">2-3 hrs</p>
              <p className="mt-1 text-sm text-zinc-500">Admin per case</p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight text-zinc-950">0</p>
              <p className="mt-1 text-sm text-zinc-500">Audit trail</p>
            </div>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Every checkout starts from zero</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Reports arrive by email. Photos in cloud storage. Notes in a
                spreadsheet. No single view of the case.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Deduction letters retyped every time</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Managers pull photos, cross-check fair wear and tear, and draft
                from scratch. Thirty times a month.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Disputes won or lost on pack quality</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                When a tenant escalates to TDS, DPS, or mydeposits, the outcome
                depends on whether the evidence pack is complete.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── HOW IT WORKS ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">How it works</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            From checkout date to <em className="text-zinc-500">deposit released</em>
          </h2>

          <div className="mt-14 space-y-12">
            {[
              { num: "01", tag: "Automated", title: "Case opened and report fetched", body: "Renovo opens the case and pulls in the checkout report, photos, and evidence. The team starts from one file." },
              { num: "02", tag: "AI review", title: "Check-in vs checkout compared", body: "Reports compared room by room. Discrepancies flagged. Missing evidence highlighted for manager decision." },
              { num: "03", tag: "AI draft", title: "Liability assessment drafted", body: "Fair wear and tear reasoning, betterment context, evidence references, and a recommended position for each issue." },
              { num: "04", tag: "Human", title: "Manager reviews and approves", body: "The manager edits anything they disagree with, adds notes, and approves or rejects. Every change logged." },
              { num: "05", tag: "Resolution", title: "Deposit released", body: "Case closed with the decision trail intact. Deposit released through the relevant scheme." },
              { num: "06", tag: "If needed", title: "Dispute pack generated", body: "Evidence pack with timeline, reasoning, and supporting files assembled during the workflow, not after escalation." },
            ].map((s) => (
              <div key={s.num} className="grid grid-cols-[48px_1fr] gap-4 md:grid-cols-[48px_120px_1fr]">
                <p className="text-sm font-semibold text-zinc-300">{s.num}</p>
                <p className="hidden text-xs font-medium uppercase tracking-[0.08em] text-zinc-400 pt-0.5 md:block">{s.tag}</p>
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{s.title}</p>
                  <p className="mt-1 text-sm leading-7 text-zinc-500">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/how-it-works" className="text-sm font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
              Full workflow walkthrough →
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── BEFORE AND AFTER ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Before and after</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            What actually <em className="text-zinc-500">changes</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Deduction letters", before: "30-45 min per letter, retyped from scratch", after: "Structured draft in under 2 minutes" },
              { label: "Evidence", before: "Scattered across five systems with no linked record", after: "One workspace with timeline, evidence, and history connected" },
              { label: "Audit trail", before: "Reasoning rebuilt from memory and inboxes", after: "Every decision documented before it is challenged" },
              { label: "Dispute prep", before: "Assembled under deadline pressure, often incomplete", after: "Pack ready from day one of the checkout workflow" },
              { label: "Consistency", before: "Different judgement from different managers", after: "Structured logic applied to every case" },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[140px_1fr_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-400 line-through decoration-zinc-300">{item.before}</p>
                <p className="text-sm leading-7 text-zinc-700">{item.after}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── HUMAN CONTROL ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Human control</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            AI drafts. Your team <em className="text-zinc-500">decides.</em>
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Manager approval required</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                No output is sent without explicit sign-off from a named manager.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Full audit trail</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Every edit, note, and approval logged with a timestamp and name.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Defensible at scheme level</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                When TDS, DPS, or mydeposits reviews the file, reasoning and
                evidence are already assembled.
              </p>
            </div>
          </div>

          <div className="mt-14 space-y-3">
            {[
              { tag: "AI", text: "Drafts liability assessment and landlord recommendations" },
              { tag: "PM", text: "Tenant accepts or disputes the proposed position" },
              { tag: "PM", text: "Landlord accepts full, partial, or declines" },
              { tag: "PM", text: "Manager negotiates from a documented case file" },
              { tag: "OK", text: "Deposit released or dispute pack generated" },
            ].map((row) => (
              <div key={row.text} className="flex items-center gap-4">
                <span className="w-8 shrink-0 text-center text-xs font-semibold text-zinc-400">{row.tag}</span>
                <p className="text-sm text-zinc-600">{row.text}</p>
              </div>
            ))}
          </div>


        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── REGULATORY ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Regulatory change</p>
          <h2 className="mt-4 max-w-[700px] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            {"Renters' Rights Act is"} <em className="text-zinc-500">live from 1 May 2026</em>
          </h2>
          <p className="mt-4 max-w-[600px] text-base leading-8 text-zinc-500">
            Section 21 abolished. All ASTs become periodic. Evidence standards
            increasing. Agents who fail to provide required information risk
            penalties up to £7,000.
          </p>

          <div className="mt-12 grid gap-12 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Stronger evidence requirements</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Every deduction needs documented reasoning and a clear audit trail.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Built-in guidance</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Fair wear and tear, betterment, and tenancy-length adjustments in the review workflow.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Consistent output</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Structured logic every time, regardless of who handles the case.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── PLATFORM ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">The platform</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Built for how agencies <em className="text-zinc-500">actually work</em>
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Portfolio command view</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Active checkouts, deduction letters, disputes, and evidence status in one view.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Attention queue</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Stalled or incomplete cases surface automatically.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Reports and analytics</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Checkout volume, dispute rates, resolution times, operator workload.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Guidance hub</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">Fair wear and tear, betterment, and scheme-ready wording built in.</p>
            </div>
          </div>

          <div className="mt-10">
            <Link href="/demo" className="text-sm font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
              View demo →
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── INTEGRATIONS ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Integrations</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Works with your <em className="text-zinc-500">existing software</em>
          </h2>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6">
            {[
              { name: "Reapit", role: "Property CRM" },
              { name: "Arthur Online", role: "Property management" },
              { name: "SME Professional", role: "Property CRM" },
              { name: "Fixflo", role: "Repairs and maintenance" },
              { name: "InventoryBase", role: "Inventory" },
              { name: "No Letting Go", role: "Inventory" },
              { name: "HelloReport", role: "Inventory" },
            ].map((i) => (
              <div key={i.name}>
                <p className="text-sm font-semibold text-zinc-950">{i.name}</p>
                <p className="text-xs text-zinc-400">{i.role}</p>
              </div>
            ))}
            <div>
              <p className="text-sm font-semibold text-zinc-400">+ Custom</p>
              <p className="text-xs text-zinc-300">On request</p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            See it with a <em className="text-zinc-500">real case</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-zinc-500">
            Tell us how your team handles checkouts today. We will show you how
            Renovo fits.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
              Get started →
            </Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
              View demo
            </Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
