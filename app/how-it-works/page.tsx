import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const workflowSteps = [
  {
    n: '01',
    tag: 'Automated intake',
    title: 'Case opened, checkout report ingested',
    body: 'When a checkout is booked, Renovo opens a case file and pulls in the checkout report, schedule of condition, move-out photographs, and any supporting documents. One record from the start.',
  },
  {
    n: '02',
    tag: 'AI comparison',
    title: 'Check-in inventory vs checkout report',
    body: 'Both reports compared room by room. Condition changes flagged against the original schedule of condition. Missing evidence highlighted before a deduction position is drafted.',
  },
  {
    n: '03',
    tag: 'AI draft',
    title: 'Liability assessment with proportionate reasoning',
    body: 'A structured assessment covering fair wear and tear, betterment, tenancy length, evidence references, and a recommended deduction position per item. All referenced back to the source documents.',
  },
  {
    n: '04',
    tag: 'Manager review',
    title: 'Reviewed, amended, and approved',
    body: 'The property manager reads the draft, adjusts any positions, adds case notes, and approves or rejects. Every edit logged with a name and timestamp.',
  },
  {
    n: '05',
    tag: 'Resolution',
    title: 'Deposit released through the scheme',
    body: 'Once the position is agreed by all parties, the case closes with a full decision trail. Deposit released via TDS, DPS, mydeposits, or SafeDeposits Scotland.',
  },
  {
    n: '06',
    tag: 'If disputed',
    title: 'Adjudication ready evidence pack',
    body: 'If the tenant refers the dispute, Renovo generates the evidence bundle with timeline, liability assessment, photographs, and supporting references already assembled.',
  },
] as const

const controls = [
  {
    title: 'Human approval at every stage',
    body: 'Renovo drafts the liability assessment and deduction position. Your team decides what is sent, changed, or rejected. The AI never acts without sign-off.',
  },
  {
    title: 'Case-level audit trail',
    body: 'Notes, edits, evidence references, approvals, and rejections stay attached to the case file. The trail is immutable and supports scheme level scrutiny.',
  },
  {
    title: 'Operational consistency',
    body: 'Fair wear and tear guidance, betterment calculations, evidence referencing, and scheme ready wording handled through one structured process across all managers.',
  },
] as const

const integrationAreas = [
  {
    title: 'Inventory and inspection systems',
    body: 'Bring check-in inventories and checkout reports, photographs, and supporting evidence into one review workflow.',
  },
  {
    title: 'Property management software',
    body: 'Keep tenancy operations, checkout scheduling, and case preparation connected to the CRM record.',
  },
  {
    title: 'Claim and dispute preparation',
    body: 'Move from liability assessment to adjudication ready evidence pack without rebuilding the file for the deposit scheme.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'How It Works | Renovo AI',
  description:
    'See how Renovo AI moves a checkout from evidence intake to liability assessment, landlord review, deposit release, and dispute pack generation.',
  path: '/how-it-works',
})

export default function HowItWorksPage() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <div className="page-shell page-stack">

        {/* HERO */}
        <section className="page-hero">
          <p className="app-kicker">How it works</p>
          <h1 className="page-title max-w-[860px]">
            From checkout report to <em className="text-white/45">deposit decision</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo fits around the way letting agencies already manage end of tenancy.
            Reports, deduction letters, landlord recommendations, evidence packs, and
            scheme escalation stay connected to the same case.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book-demo" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
              Book a demo &rarr;
            </Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
              View demo
            </Link>
          </div>
        </section>

        {/* STEPS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Product flow</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Six steps from checkout to <em className="text-white/45">deposit release</em>
            </h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-white/55">
              Start with the case file, move through evidence review and liability
              assessment, then close through agreement or scheme escalation.
            </p>

            <div className="mt-14 divide-y divide-white/10">
              {workflowSteps.map((s) => (
                <div key={s.n} className="grid grid-cols-[52px_1fr] gap-5 py-6 md:grid-cols-[52px_120px_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-emerald-500/[0.18] bg-emerald-500/[0.08] text-sm font-bold text-emerald-500">
                    {s.n}
                  </div>
                  <p className="hidden pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500 md:block">
                    {s.tag}
                  </p>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">{s.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-white/55">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTROL */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">Decision control</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Renovo drafts. <em className="text-white/45">Your team decides.</em>
          </h2>
          <p className="mt-3.5 max-w-[560px] text-base leading-8 text-white/55">
            Renovo does not remove manager judgement. It structures the evidence,
            drafts the assessment, and keeps the audit trail readable.
          </p>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {controls.map((c) => (
              <div key={c.title}>
                <h3 className="text-[15px] font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/55">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">System handoff</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Built around <em className="text-white/45">existing workflows</em>
            </h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-white/55">
              Integration work is focused on the handoff points that matter in
              end of tenancy operations, not on adding another disconnected admin tool.
            </p>

            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {integrationAreas.map((i) => (
                <div key={i.title}>
                  <h3 className="text-[15px] font-semibold text-white">{i.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/55">{i.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>



      </div>
    </MarketingShell>
  )
}
