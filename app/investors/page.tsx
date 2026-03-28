import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const whyItMatters = [
  'Checkout administration is still handled manually across reports, photos, email, and memory in many agencies.',
  'Liability assessments are difficult to standardise when teams are under time pressure and portfolios are growing.',
  'Dispute outcomes often depend on whether the evidence pack and reasoning trail are complete when the file reaches the scheme.',
] as const

const companyPoints = [
  'Renovo AI was built from direct operational experience of checkout review, liability assessment, and claim preparation.',
  'The product is focused on a specific workflow problem: turning evidence into reviewable, defensible checkout decisions without removing manager judgement.',
  'The company is being built with a narrow operational scope rather than a broad property software platform pitch.',
] as const

export const metadata: Metadata = {
  title: 'Investors | Renovo AI',
  description:
    'Investor overview for Renovo AI, including the workflow problem, product focus, and company one-pager.',
  alternates: {
    canonical: 'https://renovoai.co.uk/investors',
  },
}

export default function InvestorsPage() {
  return (
    <MarketingShell currentPath="/investors">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Investors</p>
          <h1 className="page-title max-w-[920px]">
            Renovo AI is building the operating layer between checkout evidence and defensible
            deduction decisions.
          </h1>
          <p className="page-copy max-w-[820px]">
            Renovo AI gives letting agencies a structured route from checkout report to liability
            assessment, deduction letter, landlord review, and dispute pack preparation.
          </p>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <div>
              <p className="app-kicker">Why this matters</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                A workflow category with <em>high operational drag</em>
              </h2>
              <div className="page-rule-list">
                {whyItMatters.map((item) => (
                  <p key={item} className="py-5 text-sm leading-7 text-zinc-600">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="page-sidebar-card h-fit">
              <p className="app-kicker">Current focus</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-600">
                <p>Product built around the live end-of-tenancy workflow.</p>
                <p>Founder-led commercial discussions with agencies and workflow partners.</p>
                <p>
                  Integration planning shaped by operational handoff points rather than generic
                  platform breadth.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="max-w-[920px]">
            <p className="app-kicker">Company</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Built from direct <em>operational exposure</em>
            </h2>
          </div>

          <div className="page-rule-list">
            {companyPoints.map((item) => (
              <p key={item} className="py-5 text-sm leading-7 text-zinc-600">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="app-kicker">Next step</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Download the one-pager or <em>contact us directly</em>
              </h2>
              <p className="mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
                The one-pager covers the workflow problem, product scope, and current company
                focus. For investor or strategic discussions, use the contact route and we&apos;ll
                reply directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/renovo-company-one-pager.pdf"
                download
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Download company one-pager
              </a>
              <Link
                href="/contact"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Contact Renovo AI
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
