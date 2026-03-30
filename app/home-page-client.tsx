"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { DASHBOARD_SIGN_IN_EXTERNAL, DASHBOARD_SIGN_IN_URL } from "@/lib/marketing-links"

function SignInLink({ className, children }: { className: string; children: React.ReactNode }) {
  if (DASHBOARD_SIGN_IN_EXTERNAL) {
    return <a href={DASHBOARD_SIGN_IN_URL} className={className}>{children}</a>
  }
  return <Link href={DASHBOARD_SIGN_IN_URL} className={className}>{children}</Link>
}

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
  { href: "/about", label: "About" },
] as const

const mobileNavLinks = [
  ...navLinks,
  { href: "/contact", label: "Contact" },
  { href: "/investors", label: "Investors" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const

const footerCols = {
  Product: [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Demo" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/investors", label: "Investors" },
  ],
  Legal: [
    { href: "/compliance", label: "Compliance" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const

export default function HomePageClient() {
  useEffect(() => {
    const nav = document.getElementById("rn-nav")
    if (!nav) return
    const handler = () => nav.classList.toggle("scrolled", window.scrollY > 40)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* ── DARK NAV ── */}
      <nav
        id="rn-nav"
        className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all duration-300 [&.scrolled]:border-[#1e293b] [&.scrolled]:bg-[#0a0e1a]/95 [&.scrolled]:backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-8 lg:px-10">
          <Link href="/" aria-label="Renovo AI home" className="inline-flex shrink-0 items-center">
            <Image src="/logo-new.svg" alt="Renovo AI" width={112} height={22} priority className="h-auto w-[108px] brightness-0 invert lg:w-[112px]" />
          </Link>
          <div className="hidden gap-9 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-white/50 transition-colors hover:text-white">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SignInLink className="hidden text-sm font-medium text-white/50 transition-colors hover:text-white lg:inline-flex">
              Sign in
            </SignInLink>
            <Link href="/contact" className="app-accent-button rounded-lg px-5 py-2.5 text-sm">Get started</Link>
          </div>
          <details className="group relative lg:hidden">
            <summary className="inline-flex min-h-10 list-none items-center rounded-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <nav className="grid gap-1" aria-label="Mobile navigation">
                {mobileNavLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950">{item.label}</Link>
                ))}
              </nav>
              <div className="mt-3 grid gap-2 border-t border-zinc-200 pt-3">
                <SignInLink className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950">Sign in</SignInLink>
                <Link href="/contact" className="app-primary-button rounded-md px-4 py-2 text-center text-sm font-medium">Get started</Link>
              </div>
            </div>
          </details>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1}>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#0a0e1a] px-8 pb-20 pt-[140px] lg:px-10">
          <div className="renovo-glow pointer-events-none absolute -right-[100px] -top-[300px] h-[900px] w-[900px]" />
          <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1e293b] bg-white/[0.025] px-4 py-1.5 text-[13px] font-medium text-emerald-500">
                <span className="renovo-pulse h-1.5 w-1.5 rounded-full bg-emerald-500" />
                End-of-tenancy automation
              </div>
              <h1 className="text-[clamp(32px,4.5vw,52px)] font-bold leading-[1.08] tracking-[-0.035em] text-white">
                Checkout reports in.<br />
                <span className="bg-gradient-to-br from-emerald-500 to-emerald-300 bg-clip-text text-transparent">Deposit decisions out.</span>
              </h1>
              <p className="mt-5 max-w-[460px] text-[17px] leading-[1.75] text-slate-400">
                AI-powered liability comparison, deduction drafting, evidence management, and dispute pack preparation. Manager-approved at every stage.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/contact" className="app-accent-button rounded-lg px-6 py-3 text-sm">Get started &rarr;</Link>
                <Link href="/demo" className="app-outline-white rounded-lg px-6 py-3 text-sm">View demo</Link>
              </div>
            </div>
            <div className="relative max-lg:mx-auto max-lg:max-w-[540px]">
              <div className="absolute -inset-0.5 z-0 rounded-[14px] bg-gradient-to-b from-emerald-500/20 to-transparent" />
              <div className="relative z-10 overflow-hidden rounded-xl bg-[#111827] shadow-[0_24px_64px_rgba(0,0,0,.45)]">
                <Image src="/dashboard-preview.png" alt="Renovo AI checkout case workspace" width={1920} height={1080} className="block w-full" priority />
              </div>
            </div>
          </div>
        </section>

        {/* ── PROBLEM ── */}
        <section className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">The problem</p>
          <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">One checkout. <em className="not-italic text-slate-400">Six tools. No audit trail.</em></h2>
          <p className="mt-3.5 max-w-[560px] text-base leading-[1.85] text-slate-500">Letting agents still manage end-of-tenancy across email threads, inventory apps, shared drives, Word documents, spreadsheets, and deposit portals. Nothing links together.</p>
          <div className="mt-12 flex flex-wrap gap-14">
            {([["6+", "Tools per checkout"], ["2-3h", "Admin per case"], ["0", "Audit trail"]] as const).map(([v, l]) => (
              <div key={l}><p className="text-5xl font-bold tracking-tight text-emerald-500">{v}</p><p className="mt-1 text-[13px] font-medium text-slate-500">{l}</p></div>
            ))}
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { n: "01", h: "No single case record", p: "The checkout report sits in one system, move-out photos in another, and the schedule of condition buried in an inbox. No single source of truth." },
              { n: "02", h: "Deduction letters written from scratch", p: "Every case means reopening the inventory, pulling photos from folders, checking fair wear and tear, and manually drafting a letter." },
              { n: "03", h: "Dispute outcomes depend on the file", p: "When a tenant refers the case to TDS, DPS, mydeposits, or SafeDeposits Scotland, the adjudicator decides based on the evidence pack." },
            ].map((i) => (
              <div key={i.n}>
                <p className="text-xs font-bold tracking-wider text-emerald-500">{i.n}</p>
                <h3 className="mt-2 text-[15px] font-semibold">{i.h}</h3>
                <p className="mt-1.5 text-sm leading-[1.8] text-slate-500">{i.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">How it works</p>
            <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">Checkout scheduled to <em className="not-italic text-slate-400">deposit released</em></h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-[1.85] text-slate-500">The Renovo workflow. Automated where the task is repeatable. Manager-reviewed where judgement matters.</p>
            <div className="mt-14 divide-y divide-slate-200">
              {[
                { n: "1", t: "Automated", h: "Case opened, checkout report ingested", p: "When a checkout is booked, Renovo opens a case file and pulls in the checkout report, move-out photographs, and any supporting documents." },
                { n: "2", t: "AI comparison", h: "Check-in inventory vs checkout report", p: "Both reports compared room by room. Condition changes flagged. Missing evidence highlighted. Each item mapped against the schedule of condition." },
                { n: "3", t: "AI draft", h: "Liability assessment with reasoning", p: "Fair wear and tear reasoning, betterment context, evidence references, and a proportionate deduction recommendation per item." },
                { n: "4", t: "Manager review", h: "Reviewed, amended, and approved", p: "The property manager reads the draft, adjusts positions, adds notes, and approves. Every edit logged with a name and timestamp." },
                { n: "5", t: "Resolution", h: "Deposit released through the scheme", p: "Case closed with a full decision trail. Deposit released via TDS, DPS, mydeposits, or SafeDeposits Scotland." },
                { n: "6", t: "If disputed", h: "Adjudication-ready evidence pack", p: "Evidence bundle with timeline, reasoning, photographs, and supporting references assembled during the workflow, not after escalation." },
              ].map((s) => (
                <div key={s.n} className="grid grid-cols-[52px_1fr] gap-5 py-6 md:grid-cols-[52px_120px_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-500/[0.18] bg-emerald-500/[0.08] text-sm font-bold text-emerald-500">{s.n}</div>
                  <p className="hidden pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500 md:block">{s.t}</p>
                  <div>
                    <h3 className="text-[15px] font-semibold">{s.h}</h3>
                    <p className="mt-1 text-sm leading-[1.8] text-slate-500">{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7"><Link href="/how-it-works" className="text-sm font-medium text-emerald-500 hover:underline">Full workflow walkthrough &rarr;</Link></div>
          </div>
        </section>

        {/* ── BEFORE AND AFTER ── */}
        <section className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Before and after</p>
          <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">What changes on <em className="not-italic text-slate-400">day one</em></h2>
          <div className="mt-14 divide-y divide-slate-200">
            {[
              { l: "Deduction letters", b: "30-45 min each, retyped from the inventory every time", a: "Structured draft with evidence references in under 2 minutes" },
              { l: "Evidence trail", b: "Photos, reports, and notes scattered across five systems", a: "Linked case record from checkout through to deposit release" },
              { l: "Audit", b: "Reasoning rebuilt from memory when challenged", a: "Every decision documented before the position is disputed" },
              { l: "Dispute packs", b: "Assembled under scheme deadline pressure", a: "Adjudication-ready pack built during the checkout workflow" },
              { l: "Consistency", b: "Different property manager, different judgement", a: "Structured logic and proportionate reasoning on every case" },
            ].map((r) => (
              <div key={r.l} className="grid gap-2 py-5 md:grid-cols-[130px_1fr_1fr] md:gap-5">
                <p className="text-sm font-semibold">{r.l}</p>
                <p className="text-sm leading-[1.8] text-slate-400 line-through decoration-slate-300">{r.b}</p>
                <p className="border-l-2 border-emerald-500 pl-4 text-sm leading-[1.8] text-slate-800">{r.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HUMAN CONTROL ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Human control</p>
            <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">AI drafts. Your team <em className="not-italic text-slate-400">decides.</em></h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-[1.85] text-slate-500">Every liability assessment, deduction letter, and landlord recommendation requires manager approval. Nothing is sent without sign-off.</p>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                { h: "Manager sign-off required", p: "No claim output leaves the platform without explicit approval from a named property manager." },
                { h: "Immutable audit trail", p: "Every edit, note, approval, and rejection logged with a timestamp. The trail cannot be altered after the fact." },
                { h: "Scheme-ready output", p: "When an adjudicator at TDS, DPS, or mydeposits opens the file, the reasoning and evidence are already there." },
              ].map((c) => (
                <div key={c.h}><h3 className="text-[15px] font-semibold">{c.h}</h3><p className="mt-2 text-sm leading-[1.8] text-slate-500">{c.p}</p></div>
              ))}
            </div>
            <div className="mt-12 rounded-xl bg-[#0a0e1a] p-7">
              {[
                { t: "AI", d: "Drafts liability assessment and landlord recommendation" },
                { t: "PM", d: "Tenant reviews the proposed deduction position" },
                { t: "PM", d: "Landlord approves full claim, partial, or waives" },
                { t: "PM", d: "Manager negotiates from the documented case file" },
                { t: "OK", d: "Deposit released or dispute evidence pack generated" },
              ].map((w) => (
                <div key={w.d} className="flex items-center gap-4 py-2">
                  <span className="w-8 shrink-0 text-center text-[11px] font-bold text-emerald-500">{w.t}</span>
                  <p className="text-sm text-white/60">{w.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REGULATORY ── */}
        <section className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Regulatory change</p>
          <h2 className="mt-3.5 max-w-[700px] text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">{"Renters' Rights Act"} <em className="not-italic text-slate-400">live from 1 May 2026</em></h2>
          <div className="renovo-highlight mt-7 rounded-xl p-7">
            <p className="text-[15px] leading-[1.85] text-slate-500">Section 21 is abolished. All assured shorthold tenancies become periodic. Prescribed information obligations are tightening. Agents in England who fail to comply risk <strong className="font-semibold text-slate-800">civil penalties up to &pound;7,000</strong>. Evidence standards for deposit deductions are rising across all four schemes.</p>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              { h: "Higher evidence thresholds", p: "Every proposed deduction must be backed by documented reasoning, timestamped evidence, and a clear audit trail." },
              { h: "Fair wear and tear built in", p: "Guidance on fair wear and tear, betterment, and tenancy-length-adjusted charges embedded in the review workflow." },
              { h: "Repeatable, defensible output", p: "Structured assessment logic applied to every case, regardless of which property manager handles it." },
            ].map((c) => (
              <div key={c.h}><h3 className="text-[15px] font-semibold">{c.h}</h3><p className="mt-2 text-sm leading-[1.8] text-slate-500">{c.p}</p></div>
            ))}
          </div>
        </section>

        {/* ── PLATFORM ── */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">The platform</p>
            <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">Built for how letting agencies <em className="not-italic text-slate-400">actually operate</em></h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {[
                { h: "Portfolio command view", p: "Live status across active checkouts, pending deduction letters, open disputes, and evidence gaps." },
                { h: "Attention queue", p: "Stalled cases, overdue responses, and incomplete evidence flagged automatically." },
                { h: "Operational reporting", p: "Checkout volumes, average resolution times, dispute referral rates, and team workload." },
                { h: "Guidance hub", p: "Fair wear and tear tables, betterment calculations, and scheme-ready wording inside the workflow." },
              ].map((f) => (
                <div key={f.h}><h3 className="text-[15px] font-semibold">{f.h}</h3><p className="mt-2 text-sm leading-[1.8] text-slate-500">{f.p}</p></div>
              ))}
            </div>
            <div className="mt-7"><Link href="/demo" className="text-sm font-medium text-emerald-500 hover:underline">View demo &rarr;</Link></div>
          </div>
        </section>

        {/* ── INTEGRATIONS ── */}
        <section className="mx-auto max-w-[1080px] px-8 py-24 lg:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Integrations</p>
          <h2 className="mt-3.5 text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em]">Connects to your <em className="not-italic text-slate-400">existing agency software</em></h2>
          <p className="mt-3.5 max-w-[560px] text-base leading-[1.85] text-slate-500">Designed around the CRM, inventory, and maintenance systems UK letting agents already use.</p>
          <div className="mt-12 flex flex-wrap gap-2.5">
            {["Reapit", "Arthur Online", "SME Professional", "Fixflo", "InventoryBase", "No Letting Go", "HelloReport"].map((n) => (
              <span key={n} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium transition-all hover:border-emerald-500 hover:bg-emerald-500/[0.08] hover:text-emerald-600">{n}</span>
            ))}
            <span className="rounded-full border border-dashed border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-400">+ Custom integrations</span>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-[#0a0e1a] px-8 py-24 text-center lg:px-10">
          <div className="renovo-glow pointer-events-none absolute -bottom-[120px] left-1/2 h-[700px] w-[700px] -translate-x-1/2" />
          <div className="relative z-10 mx-auto max-w-[560px]">
            <h2 className="text-[clamp(26px,3.5vw,42px)] font-bold leading-[1.1] tracking-[-0.03em] text-white">See it with a <span className="text-emerald-500">real case</span></h2>
            <p className="mx-auto mt-4 max-w-[420px] text-base leading-[1.85] text-slate-400">Tell us how your team handles checkouts, deduction letters, and disputes today. We will show you how Renovo fits your operation.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="app-accent-button rounded-lg px-6 py-3 text-sm">Get started &rarr;</Link>
              <Link href="/demo" className="app-outline-white rounded-lg px-6 py-3 text-sm">View demo</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── DARK FOOTER ── */}
      <footer className="border-t border-[#1e293b] bg-[#0a0e1a] px-8 py-14 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="text-lg font-bold tracking-tight text-white">Renovo AI</Link>
              <p className="mt-3 max-w-[260px] text-[13px] leading-[1.7] text-slate-400">End-of-tenancy automation for UK letting agencies. Checkouts, claims, and disputes in one workflow.</p>
            </div>
            {Object.entries(footerCols).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{title}</h4>
                <nav className="mt-4 grid gap-0.5">
                  {links.map((l) => (
                    <Link key={l.href} href={l.href} className="text-[13px] leading-[2.3] text-white/35 transition-colors hover:text-white">{l.label}</Link>
                  ))}
                  {title === "Company" && (
                    <SignInLink className="text-[13px] leading-[2.3] text-white/35 transition-colors hover:text-white">Sign in</SignInLink>
                  )}
                </nav>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-[#1e293b] pt-6 text-xs text-white/20 md:flex-row md:justify-between">
            <span>Renovo AI Ltd &middot; SC833544 &middot; VAT GB483379648</span>
            <span>&copy; 2026 Renovo AI Ltd &mdash; Edinburgh, Scotland</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
