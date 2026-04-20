"use client"

import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

const THREADS = [
  {
    kicker: "Market research",
    title: "Benchmarks across UK schemes.",
    body: "Dispute rates, adjudication award patterns, and time to resolve across TDS, DPS, mydeposits, and SafeDeposits Scotland.",
  },
  {
    kicker: "Product updates",
    title: "Every release, tagged and dated.",
    body: "New connectors, workflow steps, and model improvements shipped in the previous quarter — with breaking changes called out.",
  },
  {
    kicker: "Operational analysis",
    title: "Playbooks for property managers.",
    body: "Fair wear tables, evidence standards, deduction reasoning, and the kind of practical detail that rarely makes it into scheme guidance.",
  },
] as const

export default function InsightsClient() {
  return (
    <MarketingShell currentPath="/insights">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">Insights</p>
          <h1 className="page-title max-w-[820px]">
            Coming soon. <em className="text-white/45">The UK end of tenancy landscape.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            We are preparing our first set of insights. Market research, product updates, and practical analysis for operations teams. Check back shortly, or join the short list to hear when the first piece goes out.
          </p>
        </section>

        {/* THREE CONTENT THREADS */}
        <section className="mx-auto w-full max-w-[1200px] px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {THREADS.map((t) => (
              <div
                key={t.kicker}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                  {t.kicker}
                </p>
                <h3 className="mt-3 text-[15px] font-semibold leading-tight text-white">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-white/65">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-[1200px] px-6 pb-24">
          <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-[17px] font-semibold leading-tight text-white">
                Want an early copy?
              </h2>
              <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-white/65">
                Book a demo (even a short one) and we&rsquo;ll add you to the pre-release list. The first insight piece ships shortly with embargoed access for early subscribers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book-demo"
                className="app-accent-button rounded-lg px-5 py-2.5 text-sm"
              >
                Book a demo &rarr;
              </Link>
              <a
                href="mailto:hello@renovoai.co.uk?subject=Insights%20list"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/75 transition-colors hover:border-white/30 hover:bg-white/[0.03]"
              >
                Email to subscribe
              </a>
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
