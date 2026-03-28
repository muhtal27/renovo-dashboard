import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const controls = [
  {
    title: 'UK GDPR',
    body: 'Renovo AI is operated with UK GDPR obligations in mind for the customer, tenancy, and property information handled through the service.',
  },
  {
    title: 'Data hosting',
    body: 'Data is hosted in London and handled through controlled infrastructure and service arrangements.',
  },
  {
    title: 'Role-based access',
    body: 'Platform access is restricted by role and operational need so the right people can review the right case data.',
  },
  {
    title: 'Audit trail',
    body: 'Case actions, notes, review decisions, and supporting evidence stay attached to the file to support accountability and defensibility.',
  },
  {
    title: 'Retention and handling',
    body: 'Retention and handling practices are aligned with operational requirements, customer commitments, and applicable legal obligations.',
  },
  {
    title: 'Subprocessors',
    body: 'Trusted subprocessors may support hosting, infrastructure, communications, and related operational services where needed to deliver the platform.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Compliance | Renovo AI',
  description:
    'Overview of Renovo AI compliance, privacy, hosting, access control, audit trail, and information handling practices.',
  path: '/compliance',
})

export default function CompliancePage() {
  return (
    <MarketingShell currentPath="/compliance">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Compliance</p>
          <h1 className="page-title max-w-[900px]">
            Renovo AI is built for documented, reviewable, and defensible checkout decisions.
          </h1>
          <p className="page-copy max-w-[820px]">
            Renovo AI handles customer, tenancy, and property information with a practical control
            posture that supports letting agency operations, internal review, and external scrutiny
            where a case reaches a deposit scheme.
          </p>
        </section>

        <section className="page-section">
          <div className="max-w-[900px]">
            <p className="app-kicker">Overview</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Controls shaped around the <em>live workflow</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Compliance for Renovo is not a generic checklist. It is about handling evidence,
              liability assessments, deduction letters, and dispute packs in a way that keeps
              access controlled, actions auditable, and customer information appropriately managed.
            </p>
          </div>

          <div className="page-rule-list">
            {controls.map((item) => (
              <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[240px_minmax(0,1fr)]">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_320px]">
            <div>
              <p className="app-kicker">Company details</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Clear information for <em>review and due diligence</em>
              </h2>
              <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
                <p>
                  If you are reviewing Renovo for procurement, onboarding, or internal compliance,
                  contact us directly and we&apos;ll route the enquiry to the appropriate person.
                </p>
                <p>
                  This page is intended as a public overview. Customer-specific diligence and
                  additional documentation are handled through direct review where appropriate.
                </p>
              </div>
            </div>

            <div className="page-sidebar-card h-fit">
              <p className="app-kicker">Renovo AI Ltd</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-600">
                <p>Company No. SC833544</p>
                <p>VAT GB483379648</p>
                <p>Edinburgh, Scotland</p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:hello@renovoai.co.uk"
                    className="underline decoration-zinc-300 underline-offset-4"
                  >
                    hello@renovoai.co.uk
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="app-kicker">Enquiries</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Need more compliance detail for <em>internal review</em>?
              </h2>
              <p className="mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
                Contact us if you need more information about hosting, privacy, access controls,
                retention, or the way Renovo supports defensible checkout decision-making.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started →
              </Link>
              <a
                href="mailto:hello@renovoai.co.uk?subject=Compliance%20enquiry"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Email Renovo AI
              </a>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
