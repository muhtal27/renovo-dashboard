import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const partnerTypes = [
  {
    title: 'Inventory and inspection providers',
    body: 'Bring structured inventory evidence into the same end-of-tenancy workflow so reports, photos, and follow-up review stay connected.',
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
    body: 'Work with Renovo AI where your customers already deal with checkout admin, evidence review, and end-of-tenancy operations at volume.',
  },
] as const

const handoffAreas = [
  {
    title: 'Where Renovo AI sits',
    body: 'Renovo AI sits between evidence collection and claim preparation. It is designed to organise the operational work that usually happens across reports, photos, spreadsheets, and email.',
  },
  {
    title: 'What a partner gets',
    body: 'A clearer workflow handoff for shared customers, less manual rework at the checkout stage, and a stronger structure around evidence-led review.',
  },
  {
    title: 'How workflow handoff can work',
    body: 'Structured document intake, case context, issue-level evidence links, reviewed recommendations, and claim-ready output are the main areas where workflow alignment matters.',
  },
] as const

export const metadata: Metadata = {
  title: 'Partnerships | Renovo AI',
  description:
    'Explore partnership discussions with Renovo AI across inventory systems, property management software, and end-of-tenancy workflow partners.',
  alternates: {
    canonical: 'https://renovoai.co.uk/partnerships',
  },
}

export default function PartnershipsPage() {
  return (
    <MarketingShell currentPath="/partnerships">
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <section className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.95))] px-6 py-7 md:px-8 md:py-8">
            <p className="app-kicker">Partnerships</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Work with Renovo AI
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
              Renovo AI automates end-of-tenancy work for property managers and letting agencies. We
              are interested in partnerships where workflow handoff, structured evidence, and
              operational review can fit together cleanly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                Contact Renovo AI
              </Link>
              <Link
                href="/demo"
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                View live demo
              </Link>
            </div>
          </section>

          <section>
            <p className="app-kicker">Who we work with</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {partnerTypes.map((item) => (
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
            <p className="app-kicker">How Renovo AI connects</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {handoffAreas.map((item) => (
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

          <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
            <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 text-center md:px-8 md:py-9">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Let&apos;s talk about working together
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-stone-700">
                If you&apos;re building for property managers, inventory teams, or end-of-tenancy
                operations, we&apos;d be happy to explore how Renovo AI could fit into your workflow.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                >
                  Contact Renovo AI
                </Link>
                <Link
                  href="/demo"
                  className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                >
                  View live demo
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </MarketingShell>
  )
}
