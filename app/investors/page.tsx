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
  'Renovo was built from direct operational experience of checkout review, issue assessment, and claim preparation.',
  'The product is focused on one clear problem: turning evidence into structured, reviewable claim work without removing manager judgement.',
  'The company is being built with a practical workflow-first approach rather than a broad horizontal software pitch.',
] as const

export const metadata: Metadata = {
  title: 'Investors | Renovo',
  description:
    'Learn how Renovo automates end-of-tenancy work for UK property managers and download the company one-pager.',
  alternates: {
    canonical: 'https://renovoai.co.uk/investors',
  },
}

export default function InvestorsPage() {
  return (
    <MarketingShell currentPath="/investors">
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <section className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.95))] px-6 py-7 md:px-8 md:py-8">
            <p className="app-kicker">Investors</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Renovo automates end-of-tenancy work for UK property managers
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
              Renovo helps property managers review evidence, assess issues, and prepare
              claim-ready output in one structured workflow.
            </p>
          </section>

          <section>
            <p className="app-kicker">Why this matters</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {whyItMatters.map((item) => (
                <article
                  key={item}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <p className="text-sm leading-7 text-stone-600">{item}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-start">
              <div>
                <p className="app-kicker">Where we are</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                  Early-stage, product-led, and focused on a specific operational problem
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
                  Renovo is focused on the operational layer between checkout evidence and claim
                  preparation. The product is built, early access is open, and the integration
                  framework is being shaped around real workflow handoff rather than speculative
                  platform breadth.
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <div className="space-y-3">
                  {stageItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm font-medium text-stone-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
              <div>
                <p className="app-kicker">Founder and company</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                  Built from direct operational experience
                </h2>
              </div>

              <div className="rounded-[1.8rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
                <div className="space-y-4">
                  {companyPoints.map((item) => (
                    <p key={item} className="text-sm leading-7 text-stone-600 md:text-base md:leading-8">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
              <p className="app-kicker">Download</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                Download the company one-pager
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">
                A short overview of the problem, product, market, and current stage.
              </p>
              <a
                href="/renovo-company-one-pager.pdf"
                download
                className="app-primary-button mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Download company one-pager
              </a>
            </article>

            <article className="rounded-3xl border border-stone-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))] px-6 py-7 shadow-[0_18px_40px_rgba(55,43,27,0.08)]">
              <p className="app-kicker">Contact</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                Investor or strategic enquiry
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">
                We&apos;re happy to speak with investors and strategic partners who understand the
                operational challenges around end-of-tenancy work.
              </p>
              <Link
                href="/contact"
                className="app-secondary-button mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Contact Renovo
              </Link>
            </article>
          </section>
        </div>
      </section>
    </MarketingShell>
  )
}
