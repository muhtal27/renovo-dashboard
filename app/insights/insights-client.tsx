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
            Research, updates, and <em className="text-slate-400">industry analysis</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Market research, product developments, and thinking on end of tenancy
            operations for UK property managers.
          </p>
        </section>

        {/* COMING SOON */}
        <section className="mx-auto max-w-[1080px] px-6 py-24 text-center">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-8 py-16">
            <p className="text-4xl font-bold tracking-tight text-zinc-950">Coming soon</p>
            <p className="mx-auto mt-4 max-w-[480px] text-base leading-7 text-slate-500">
              We are preparing our first insights on the UK end of tenancy landscape.
              Check back shortly for market research, product updates, and practical analysis.
            </p>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
