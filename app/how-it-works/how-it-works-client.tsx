import Link from "next/link"
import { MarketingShell } from "@/app/components/MarketingShell"

const steps = [
  { n: "01", t: "Automated intake", h: "Case opened, checkout report ingested", p: "When a checkout is booked, Renovo opens a case file and pulls in the checkout report, schedule of condition, move-out photographs, and any supporting documents. One record from the start." },
  { n: "02", t: "AI comparison", h: "Check-in inventory vs checkout report", p: "Both reports compared room by room. Condition changes flagged against the original schedule of condition. Missing evidence highlighted before a deduction position is drafted." },
  { n: "03", t: "AI draft", h: "Liability assessment with proportionate reasoning", p: "A structured assessment covering fair wear and tear, betterment, tenancy length, evidence references, and a recommended deduction position per item. All referenced back to the source documents." },
  { n: "04", t: "Manager review", h: "Reviewed, amended, and approved", p: "The property manager reads the draft, adjusts any positions, adds case notes, and approves or rejects. Every edit logged with a name and timestamp." },
  { n: "05", t: "Resolution", h: "Deposit released through the scheme", p: "Once the position is agreed by all parties, the case closes with a full decision trail. Deposit released via TDS, DPS, mydeposits, or SafeDeposits Scotland." },
  { n: "06", t: "If disputed", h: "Adjudication-ready evidence pack", p: "If the tenant refers the dispute, Renovo generates the evidence bundle with timeline, liability assessment, photographs, and supporting references already assembled." },
] as const

const controls = [
  { h: "Human approval at every stage", p: "Renovo drafts the liability assessment and deduction position. Your team decides what is sent, changed, or rejected. The AI never acts without sign-off." },
  { h: "Case-level audit trail", p: "Notes, edits, evidence references, approvals, and rejections stay attached to the case file. The trail is immutable and supports scheme-level scrutiny." },
  { h: "Operational consistency", p: "Fair wear and tear guidance, betterment calculations, evidence referencing, and scheme-ready wording handled through one structured process across all managers." },
] as const

const integrations = [
  { h: "Inventory and inspection systems", p: "Bring check-in inventories and checkout reports, photographs, and supporting evidence into one review workflow." },
  { h: "Property management software", p: "Keep tenancy operations, checkout scheduling, and case preparation connected to the CRM record." },
  { h: "Claim and dispute preparation", p: "Move from liability assessment to adjudication-ready evidence pack without rebuilding the file for the deposit scheme." },
] as const

export default function HowItWorksClient() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">How it works</p>
          <h1 className="page-title mt-4 max-w-[860px]">
            From checkout report to <em>deposit decision</em>
          </h1>
          <p className="page-copy mt-4 max-w-[640px]">
            Renovo fits around the way letting agencies already manage end of tenancy. Reports, deduction letters, landlord recommendations, evidence packs, and scheme escalation stay connected to the same case.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Get started &rarr;</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

        {/* STEPS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Product flow</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Six steps from checkout to <em className="text-zinc-400">deposit release</em></h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-zinc-500">Start with the case file, move through evidence review and liability assessment, then close through agreement or scheme escalation.</p>

            <div className="mt-14 divide-y divide-zinc-200">
              {steps.map((s) => (
                <div key={s.n} className="grid grid-cols-[52px_1fr] gap-5 py-6 md:grid-cols-[52px_120px_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-500/[0.18] bg-emerald-500/[0.08] text-sm font-bold text-emerald-500">{s.n}</div>
                  <p className="hidden pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500 md:block">{s.t}</p>
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-950">{s.h}</h3>
                    <p className="mt-1 text-sm leading-7 text-zinc-500">{s.p}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTROL */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">Decision control</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Renovo drafts. <em className="text-zinc-400">Your team decides.</em></h2>
          <p className="mt-3.5 max-w-[560px] text-base leading-8 text-zinc-500">Renovo does not remove manager judgement. It structures the evidence, drafts the assessment, and keeps the audit trail readable.</p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {controls.map((c) => (
              <div key={c.h}>
                <h3 className="text-[15px] font-semibold text-zinc-950">{c.h}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-500">{c.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-emerald-500">System handoff</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">Built around <em className="text-zinc-400">existing workflows</em></h2>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {integrations.map((i) => (
                <div key={i.h}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{i.h}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-500">{i.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">See the workflow in the <em className="text-zinc-400">read-only demo</em></h2>
          <p className="mx-auto mt-4 max-w-[560px] text-base leading-8 text-zinc-500">Review how a checkout becomes a liability assessment, deduction letter, and adjudication-ready evidence pack.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Get started &rarr;</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
