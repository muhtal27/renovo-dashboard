import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const plannedAreas = [
  {
    title: 'Inventory and inspection systems',
    body: 'Bring check-in and check-out reports, photos, and supporting records into a structured review workflow.',
  },
  {
    title: 'Property management software',
    body: 'Support cleaner handoff between tenancy operations, notice handling, and end-of-tenancy case preparation.',
  },
  {
    title: 'Case and communication workflows',
    body: 'Keep case context, review actions, and communication tied together rather than split across separate tools.',
  },
  {
    title: 'Claim and dispute preparation workflows',
    body: 'Support downstream preparation with structured outputs, evidence links, and review history where workflow alignment makes sense.',
  },
] as const

const flowItems = [
  {
    title: 'Data in',
    body: 'Reports, photos, supporting documents, and case context come into Renovo AI in a structured way.',
  },
  {
    title: 'Processing',
    body: 'Evidence is organised for review, linked to findings, and prepared for manager sign-off inside the end-of-tenancy workflow.',
  },
  {
    title: 'Data out',
    body: 'Structured exports, reviewed claim output, and future workflow notifications are the main areas of planned partner access.',
  },
] as const

const futureAccess = [
  'Pilot integrations with selected workflow partners',
  'Structured exports for downstream systems',
  'Future API support for approved partner use cases',
  'Planned workflow events and notifications',
] as const

export const metadata = createMarketingMetadata({
  title: 'Integrations | Renovo AI',
  description:
    'A forward-looking view of the Renovo AI integrations roadmap for end-of-tenancy workflows.',
  path: '/integrations',
})

export default function IntegrationsPage() {
  return (
    <MarketingShell currentPath="/integrations">
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <section className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.95))] px-6 py-7 md:px-8 md:py-8">
            <p className="marketing-eyebrow">Integrations</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Connect your workflow to Renovo AI
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
              Renovo AI is being built to support structured workflow handoff around end-of-tenancy
              operations. The integration framework is in planning and is not yet publicly
              available.
            </p>
            <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900">Current status</p>
              <p className="mt-2 text-sm leading-7 text-amber-900/85">
                Integration framework in planning. Not yet publicly available.
              </p>
            </div>
          </section>

          <section>
            <p className="marketing-eyebrow">What integrations are being built for</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              End-of-tenancy workflow alignment
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-8 text-stone-700">
              Renovo AI sits between evidence intake, manager review, and claim preparation. Any
              future integration work is intended to support that operational flow rather than add a
              separate developer platform for its own sake.
            </p>
          </section>

          <section>
            <p className="marketing-eyebrow">Planned integration areas</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {plannedAreas.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <h2 className="text-lg font-semibold text-stone-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <p className="marketing-eyebrow">How data is expected to move through Renovo AI</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {flowItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <h2 className="text-base font-semibold text-stone-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <p className="marketing-eyebrow">Future partner access</p>
            <div className="mt-4 rounded-[1.6rem] border border-stone-200 bg-white/92 p-6">
              <ul className="space-y-3 text-sm leading-7 text-stone-600">
                {futureAccess.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
            <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 text-center md:px-8 md:py-9">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Interested in integration discussions?
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-stone-700">
                We&apos;re happy to speak with inventory platforms, PMS providers, and workflow
                partners exploring future integration with Renovo AI.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="app-primary-button rounded-md px-5 py-3 text-sm font-medium"
                >
                  Contact Renovo AI
                </Link>
                <Link
                  href="/demo"
                  className="app-secondary-button rounded-md px-5 py-3 text-sm font-medium"
                >
                  View demo
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </MarketingShell>
  )
}
