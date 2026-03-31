import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

export default function AboutClient() {
  return (
    <MarketingShell currentPath="/about">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">About</p>
          <h1 className="page-title max-w-[820px]">
            Enterprise software for <em className="text-slate-400">end-of-tenancy operations</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI automates the operational layer between checkout evidence
            and documented deposit decisions for UK letting agencies.
          </p>
        </section>

        {/* THE COMPANY */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">The company</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Built from direct <em className="text-slate-400">operational experience</em>
          </h2>
          <p className="mt-4 max-w-[640px] text-base leading-8 text-slate-500">
            Renovo AI was founded by a practising end-of-tenancy property manager
            who saw the same problem across every agency: checkout evidence
            scattered across six tools, deduction reasoning rebuilt from memory,
            and dispute outcomes determined by whether the file was complete when
            it reached a deposit scheme.
          </p>
          <p className="mt-4 max-w-[640px] text-base leading-8 text-slate-500">
            The company is not a broad property platform. It is focused on one
            workflow category — turning checkout evidence into reviewable,
            defensible deposit decisions — with human approval at every stage.
          </p>

          <div className="mt-14 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {[
              { l: "Company", v: "Renovo AI Ltd" },
              { l: "Registered", v: "Edinburgh, Scotland" },
              { l: "Company number", v: "SC833544" },
              { l: "VAT", v: "GB483379648" },
            ].map((d) => (
              <div key={d.l}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{d.l}</p>
                <p className="mt-2 text-sm text-slate-700">{d.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCT FOCUS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Product focus</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              One workflow. <em className="text-slate-400">Done properly.</em>
            </h2>

            <div className="mt-14 divide-y divide-slate-200">
              {[
                { label: "Liability comparison", desc: "AI compares check-in and checkout evidence room by room, flags discrepancies, and prepares a structured assessment against the schedule of condition." },
                { label: "Deduction drafting", desc: "Fair wear and tear reasoning, betterment context, evidence references, and recommended deduction positions drafted automatically for manager review." },
                { label: "Evidence assembly", desc: "Photos, reports, notes, and timeline linked to a single case record throughout the checkout lifecycle." },
                { label: "Dispute preparation", desc: "If a tenant escalates to TDS, DPS, mydeposits, or SafeDeposits Scotland, the adjudication-ready evidence pack is already assembled." },
                { label: "Human approval", desc: "Every recommendation requires manager sign-off. Nothing is sent without explicit approval from a named property manager." },
              ].map((item) => (
                <div key={item.label} className="grid gap-2 py-5 md:grid-cols-[180px_1fr]">
                  <p className="text-sm font-semibold text-zinc-950">{item.label}</p>
                  <p className="text-sm leading-7 text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">Principles</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            How we <em className="text-slate-400">operate</em>
          </h2>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { h: "AI assists, humans decide", p: "Renovo drafts. Property managers approve, amend, or reject." },
              { h: "Built for operational use", p: "Shaped around live portfolio pressure, not theoretical workflows." },
              { h: "Defensible output matters", p: "Evidence, proportionality, and a reviewable trail at every step." },
            ].map((c) => (
              <div key={c.h}>
                <h3 className="text-[15px] font-semibold text-zinc-950">{c.h}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{c.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Review the product and discuss your <em className="text-slate-400">checkout operation</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-slate-500">
            Start with the demo, then speak to us about how Renovo fits your agency.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Get started →</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
