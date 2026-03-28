import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const principles = [
  {
    title: 'AI assists, humans decide',
    body: 'Renovo drafts liability assessments and supporting reasoning. Property managers decide what is approved, amended, or rejected.',
  },
  {
    title: 'Built for operational use',
    body: 'The product is shaped around checkouts, deduction letters, evidence review, and dispute preparation under live portfolio pressure.',
  },
  {
    title: 'Defensible output matters',
    body: 'A workable checkout decision needs evidence, proportionality, fair wear and tear reasoning, and a trail that can be reviewed later.',
  },
] as const

const companyFacts = [
  ['Head office', 'Edinburgh, Scotland'],
  ['Company', 'Renovo AI Ltd'],
  ['Company number', 'SC833544'],
  ['VAT', 'GB483379648'],
] as const

export const metadata: Metadata = {
  title: 'About | Renovo AI',
  description:
    'Corporate overview of Renovo AI, the company focus, operating principles, and product approach for UK letting agencies.',
  alternates: {
    canonical: 'https://renovoai.co.uk/about',
  },
}

export default function AboutPage() {
  return (
    <MarketingShell currentPath="/about">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">About</p>
          <h1 className="page-title max-w-[920px]">
            Renovo AI is building enterprise software for structured end-of-tenancy operations.
          </h1>
          <p className="page-copy max-w-[820px]">
            Renovo AI is based in Edinburgh and focused on a narrow operational problem inside UK
            letting agencies: turning checkout evidence into reviewable liability assessments,
            deduction letters, landlord decisions, tenant responses, and dispute packs.
          </p>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <p className="app-kicker">Company profile</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Built around a specific <em>workflow category</em>
              </h2>
              <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
                <p>
                  Renovo was shaped by direct experience in end-of-tenancy property management,
                  where evidence is often fragmented, deduction reasoning is manually rebuilt, and
                  dispute outcomes depend on whether the file is complete when it reaches a deposit
                  scheme.
                </p>
                <p>
                  The company is not positioning itself as a broad property platform. Renovo is
                  focused on the operational layer between checkout evidence and documented
                  decisions, with human approval remaining central to the process.
                </p>
                <p>
                  That focus informs the product, the commercial model, and the way the company
                  engages with agencies, integration partners, and internal compliance teams.
                </p>
              </div>
            </div>

            <div className="page-sidebar-card h-fit">
              <p className="app-kicker">Company details</p>
              <dl className="mt-4 space-y-4">
                {companyFacts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-zinc-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="max-w-[900px]">
            <p className="app-kicker">Principles</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Principles, not <em>buzzwords</em>
            </h2>
          </div>

          <div className="page-rule-list">
            {principles.map((item) => (
              <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="app-kicker">Next step</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Review the product and discuss your <em>checkout operation</em>
              </h2>
              <p className="mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
                Start with the demo, then speak to us about evidence handling, liability
                assessments, deduction letters, and dispute preparation inside your agency.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started →
              </Link>
              <Link
                href="/demo"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                View demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
