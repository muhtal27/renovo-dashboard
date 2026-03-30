import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

export default function AboutClient() {
  return (
    <MarketingShell currentPath="/about">
      <div className="page-shell page-stack">

        {/* ── HERO ── */}
        <section className="page-hero">
          <p className="app-kicker">About</p>
          <h1 className="page-title max-w-[820px]">
            Enterprise software for <em>end-of-tenancy operations</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI automates the operational layer between checkout evidence
            and documented deposit decisions for UK letting agencies.
          </p>
        </section>

        {/* ── COMPANY ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">The company</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Built from direct <em className="text-zinc-500">operational experience</em>
          </h2>
          <p className="mt-4 max-w-[640px] text-base leading-8 text-zinc-500">
            Renovo AI was founded by a practising end-of-tenancy property manager
            who saw the same problem across every agency: checkout evidence
            scattered across six tools, deduction reasoning rebuilt from memory,
            and dispute outcomes determined by whether the file was complete when
            it reached a deposit scheme.
          </p>
          <p className="mt-4 max-w-[640px] text-base leading-8 text-zinc-500">
            The company is not a broad property platform. It is focused on one
            workflow category — turning checkout evidence into reviewable,
            defensible deposit decisions — with human approval at every stage.
          </p>

          {/* Company details */}
          <div className="mt-14 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Company</p>
              <p className="mt-2 text-sm text-zinc-700">Renovo AI Ltd</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Registered</p>
              <p className="mt-2 text-sm text-zinc-700">Edinburgh, Scotland</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Company number</p>
              <p className="mt-2 text-sm text-zinc-700">SC833544</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">VAT</p>
              <p className="mt-2 text-sm text-zinc-700">GB483379648</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── FOCUS ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Product focus</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            One workflow. <em className="text-zinc-500">Done properly.</em>
          </h2>

          <div className="mt-14 space-y-10">
            {[
              { label: "Liability comparison", desc: "AI compares check-in and checkout evidence room by room, flags discrepancies, and prepares a structured assessment." },
              { label: "Deduction drafting", desc: "Fair wear and tear reasoning, betterment context, evidence references, and recommended deduction positions drafted automatically." },
              { label: "Evidence assembly", desc: "Photos, reports, notes, and timeline linked to a single case record throughout the checkout lifecycle." },
              { label: "Dispute preparation", desc: "If a tenant escalates to TDS, DPS, mydeposits, or SafeDeposits Scotland, the evidence pack is already assembled." },
              { label: "Human approval", desc: "Every recommendation requires manager sign-off. Nothing is sent without explicit approval from a named person." },
            ].map((item) => (
              <div key={item.label} className="grid gap-2 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950 md:pt-0.5">{item.label}</p>
                <p className="text-sm leading-7 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-[960px] px-6"><hr className="border-zinc-200" /></div>

        {/* ── PRINCIPLES ── */}
        <section className="mx-auto max-w-[960px] px-6 py-24">
          <p className="app-kicker">Principles</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            How we <em className="text-zinc-500">operate</em>
          </h2>

          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">AI assists, humans decide</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Renovo drafts. Property managers approve, amend, or reject.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Built for operational use</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Shaped around live portfolio pressure, not theoretical workflows.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">Defensible output matters</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Evidence, proportionality, and a reviewable trail at every step.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-zinc-950">
            Review the product and discuss your <em className="text-zinc-500">checkout operation</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-zinc-500">
            Start with the demo, then speak to us about how Renovo fits your
            agency.
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
