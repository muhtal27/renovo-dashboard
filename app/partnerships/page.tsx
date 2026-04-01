import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const partnerTypes = [
  {
    title: 'Inventory and inspection providers',
    body: 'Bring structured inventory evidence into the same end of tenancy workflow so reports, photos, and follow-up review stay connected.',
  },
  {
    title: 'Property management software platforms',
    body: 'Support teams that need a cleaner handoff between tenancy operations, checkout evidence, and claim preparation work.',
  },
  {
    title: 'Deposit and dispute workflow partners',
    body: 'Explore how Renovo AI could support downstream claim and dispute pathways without forcing teams back into manual file assembly.',
  },
  {
    title: 'Strategic channel partners',
    body: 'Work with Renovo AI where your customers already deal with checkout admin, evidence review, and end of tenancy operations at volume.',
  },
] as const

const handoffAreas = [
  {
    title: 'Where Renovo AI sits',
    body: 'Between evidence collection and claim preparation. Designed to organise the operational work that usually happens across reports, photos, spreadsheets, and email.',
  },
  {
    title: 'What a partner gets',
    body: 'A clearer workflow handoff for shared customers, less manual rework at the checkout stage, and a stronger structure around evidence led review.',
  },
  {
    title: 'How workflow handoff works',
    body: 'Structured document intake, case context, issue level evidence links, reviewed recommendations, and claim ready output.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Partnerships | Renovo AI',
  description:
    'Explore partnership discussions with Renovo AI across inventory systems, property management software, and end of tenancy workflow partners.',
  path: '/partnerships',
})

export default function PartnershipsPage() {
  return (
    <MarketingShell currentPath="/partnerships">
      <div className="page-shell page-stack">

        <section className="page-hero">
          <p className="app-kicker">Partnerships</p>
          <h1 className="page-title max-w-[820px]">
            Work with <em className="text-slate-400">Renovo AI</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI automates end of tenancy work for property managers and letting
            agencies. We are interested in partnerships where workflow handoff, structured
            evidence, and operational review fit together cleanly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Contact Renovo AI</Link>
            <Link href="/demo" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View demo</Link>
          </div>
        </section>

        {/* WHO WE WORK WITH */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Who we work with</p>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {partnerTypes.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW RENOVO CONNECTS */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How Renovo AI connects</p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {handoffAreas.map((item) => (
              <div key={item.title}>
                <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
            Interested in <em className="text-slate-400">working together</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-slate-500">
            If you build for property managers, inventory teams, or end of tenancy
            operations, we would be happy to explore how Renovo AI fits your workflow.
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
