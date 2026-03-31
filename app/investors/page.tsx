import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const whyItMatters = [
  { l: 'Manual administration', d: 'Checkout administration is still handled manually across reports, photos, email, and memory in many agencies.' },
  { l: 'No standard process', d: 'Liability assessments are difficult to standardise when teams are under time pressure and portfolios are growing.' },
  { l: 'Dispute outcomes', d: 'Dispute outcomes often depend on whether the evidence pack and reasoning trail are complete when the file reaches the scheme.' },
] as const

const companyPoints = [
  { l: 'Operational origin', d: 'Renovo AI was built from direct operational experience of checkout review, liability assessment, and claim preparation.' },
  { l: 'Narrow focus', d: 'The product is focused on a specific workflow problem: turning evidence into reviewable, defensible checkout decisions without removing manager judgement.' },
  { l: 'Scope discipline', d: 'The company is being built with a narrow operational scope rather than a broad property software platform pitch.' },
] as const

export const metadata = createMarketingMetadata({
  title: 'Investors | Renovo AI',
  description:
    'Investor overview for Renovo AI, including the workflow problem, product focus, and company one-pager.',
  path: '/investors',
})

export default function InvestorsPage() {
  return (
    <MarketingShell currentPath="/investors">
      <div className="page-shell page-stack">

        <section className="page-hero">
          <p className="app-kicker">Investors</p>
          <h1 className="page-title max-w-[860px]">
            The operating layer between checkout evidence and <em>defensible deduction decisions</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI gives letting agencies a structured route from checkout report to
            liability assessment, deduction letter, landlord review, and dispute pack preparation.
          </p>
        </section>

        {/* WHY IT MATTERS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Why this matters</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              A workflow category with <em className="text-slate-400">high operational drag</em>
            </h2>
            <div className="mt-14 divide-y divide-slate-200">
              {whyItMatters.map((item) => (
                <div key={item.l} className="grid gap-2 py-5 md:grid-cols-[180px_1fr]">
                  <p className="text-sm font-semibold text-zinc-950">{item.l}</p>
                  <p className="text-sm leading-7 text-slate-500">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPANY */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">Company</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Built from direct <em className="text-slate-400">operational exposure</em>
          </h2>
          <div className="mt-14 divide-y divide-slate-200">
            {companyPoints.map((item) => (
              <div key={item.l} className="grid gap-2 py-5 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-semibold text-zinc-950">{item.l}</p>
                <p className="text-sm leading-7 text-slate-500">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-2 gap-y-8 md:grid-cols-3">
            {[
              { l: 'Stage', v: 'Pre-seed' },
              { l: 'Focus', v: 'End-of-tenancy automation' },
              { l: 'Location', v: 'Edinburgh, Scotland' },
            ].map((d) => (
              <div key={d.l}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{d.l}</p>
                <p className="mt-2 text-sm text-slate-700">{d.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Download the one-pager or <em className="text-slate-400">contact us directly</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-base leading-8 text-slate-500">
            The one-pager covers the workflow problem, product scope, and current company
            focus. For investor or strategic discussions, use the contact route.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/renovo-company-one-pager.pdf" download className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">
              Download company one-pager
            </a>
            <Link href="/contact" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">
              Contact Renovo AI
            </Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
