import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const whyItMatters = [
  'Checkout admin is still handled manually in many agencies across reports, photos, email, and memory.',
  'Evidence-heavy review is difficult to standardise when teams are under time pressure and portfolios grow.',
  'Claim quality often depends on how well the audit trail is assembled, not just on whether the evidence exists.',
] as const

const stageItems = [
  'Product built',
  'Early access open',
  'Integrations layer in development',
  'Founder-led growth and pilot conversations underway',
] as const

const companyPoints = [
  'Renovo AI was built from direct operational experience of checkout review, issue assessment, and claim preparation.',
  'The product is focused on one clear problem: turning evidence into structured, reviewable claim work without removing manager judgement.',
  'The company is being built with a practical workflow-first approach rather than a broad horizontal software pitch.',
] as const

export const metadata: Metadata = {
  title: 'Investors | Renovo AI',
  description:
    'Learn how Renovo AI automates end-of-tenancy work for UK property managers and download the company one-pager.',
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
          <h1 className="page-title max-w-4xl">
            Renovo AI automates end-of-tenancy work for UK property managers
          </h1>
          <p className="page-copy max-w-3xl">
            Renovo AI helps property managers review evidence, assess issues, and prepare claim-ready
            output in one structured workflow.
          </p>
        </section>

        <section className="page-card">
          <p className="app-kicker">Why this matters</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-3 text-sm leading-7 text-[#3d3b37]">
              {whyItMatters.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-5">
              <p className="app-kicker">Current stage</p>
              <div className="mt-4 space-y-3">
                {stageItems.map((item) => (
                  <div
                    key={item}
                    className="border-b border-[rgba(15,14,13,0.08)] pb-3 text-sm text-[#3d3b37] last:border-none last:pb-0"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-card">
          <div className="page-grid-2 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div>
              <p className="app-kicker">Founder and company</p>
              <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
                Built from direct operational experience
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-[#3d3b37]">
                Renovo AI is focused on the operational layer between checkout evidence and claim
                preparation. The product is built, early access is open, and the integrations layer
                is being shaped around real handoff points rather than broad software sprawl.
              </p>
            </div>

            <div className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-6">
              <div className="space-y-4">
                {companyPoints.map((item) => (
                  <p key={item} className="text-sm leading-7 text-[#3d3b37] md:text-base md:leading-8">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-hero">
          <p className="app-kicker">Next step</p>
          <h2 className="mt-4 text-[30px] leading-[1.2]">Download the one-pager or contact us directly</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#3d3b37]">
            The one-pager covers the problem, product, market, and stage. For investor or
            strategic discussions, use the contact route and we&apos;ll reply directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/renovo-company-one-pager.pdf"
              download
              className="app-primary-button inline-flex items-center justify-center rounded px-5 py-3 text-sm font-medium"
            >
              Download company one-pager
            </a>
            <Link
              href="/contact"
              className="app-secondary-button inline-flex items-center justify-center rounded px-5 py-3 text-sm font-medium"
            >
              Contact Renovo AI
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
