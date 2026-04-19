"use client"

import { MarketingShell } from "@/app/components/MarketingShell"

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

        {/* COMING SOON */}
        <section className="mx-auto max-w-[1080px] px-6 py-24 text-center">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-8 py-16">
            <p className="text-4xl font-bold tracking-tight text-white">Coming soon</p>
            <p className="mx-auto mt-4 max-w-[480px] text-base leading-7 text-white/55">
              We are preparing our first insights on the UK end of tenancy landscape.
              Check back shortly for market research, product updates, and practical analysis.
            </p>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
