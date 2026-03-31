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
      <div className="page-shell page-stack">

        <section className="page-hero">
          <p className="app-kicker">Integrations</p>
          <h1 className="page-title max-w-[820px]">
            Connect your workflow to <em className="text-slate-400">Renovo AI</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI is being built to support structured workflow handoff around
            end-of-tenancy operations. The integration framework is in planning and is
            not yet publicly available.
          </p>
          <div className="renovo-highlight mt-6 inline-block rounded-lg px-5 py-3">
            <p className="text-sm font-semibold text-slate-800">Current status</p>
            <p className="mt-1 text-sm leading-7 text-slate-500">Integration framework in planning. Not yet publicly available.</p>
          </div>
        </section>

        {/* PLANNED AREAS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Planned integration areas</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              End-of-tenancy <em className="text-slate-400">workflow alignment</em>
            </h2>
            <p className="mt-3.5 max-w-[560px] text-base leading-8 text-slate-500">
              Renovo AI sits between evidence intake, manager review, and claim preparation.
              Integration work supports that operational flow.
            </p>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {plannedAreas.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DATA FLOW */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How data moves through Renovo AI</p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {flowItems.map((item) => (
              <div key={item.title}>
                <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FUTURE ACCESS */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Future partner access</p>
            <div className="mt-8 space-y-3">
              {futureAccess.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-500">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Interested in <em className="text-slate-400">integration discussions</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-slate-500">
            We are happy to speak with inventory platforms, PMS providers, and workflow
            partners exploring future integration with Renovo AI.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Contact Renovo AI</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
