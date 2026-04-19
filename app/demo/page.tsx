import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Interactive Demo | Renovo AI'
const description =
  'Explore the full Renovo AI operator dashboard with mock data. Click through the end-of-tenancy workflow from checkout intake to claim submission.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/demo',
})

export default function DemoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createWebPageJsonLd({
              path: '/demo',
              title,
              description,
            }),
          ]),
        }}
      />
      <MarketingShell currentPath="/demo">
        <div className="page-shell page-stack">
          <section className="page-hero">
            <p className="app-kicker">Interactive demo</p>
            <h1 className="page-title max-w-[860px]">
              Explore the full operator dashboard{' '}
              <em className="text-white/45">with live mock data.</em>
            </h1>
            <p className="page-copy max-w-[760px]">
              Walk the end of tenancy workflow from checkout intake through AI analysis, manager review, draft delivery, and claim submission. Every sidebar page is fully interactive. Nine mock Edinburgh properties, no real customer data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/demo.html"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Launch interactive demo &rarr;
              </a>
              <Link
                href="/book-demo"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Book a guided walkthrough
              </Link>
            </div>
          </section>

          {/* Three content cards */}
          <section className="mx-auto max-w-[1200px] px-6">
            <p className="app-kicker">Full workflow</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Draft to resolved, <em className="text-white/45">in one workspace.</em>
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  kicker: 'Draft to resolved',
                  h3: 'Every step, end to end.',
                  body: 'Document upload, AI defect detection, manager review, draft delivery, scheme submission, and dispute pack generation. Complete a case start to finish.',
                },
                {
                  kicker: 'Every page',
                  h3: "The operator's actual view.",
                  body: 'Checkouts, Disputes, Guidance, Reports, Admin, Teams, and Settings — exactly how a property manager sees them in the live workspace. Nothing mocked at the UI level.',
                },
                {
                  kicker: 'Mock data',
                  h3: 'Nine Edinburgh tenancies.',
                  body: 'Properties, tenants, landlords, deposits, and AI-generated liability assessments across every workflow state — intake, review, draft, sent, paid, and disputed.',
                },
              ].map((c) => (
                <div key={c.kicker} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                    {c.kicker}
                  </p>
                  <h3 className="mt-3 text-[15px] font-semibold text-white">{c.h3}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/65">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA-lite */}
          <section className="mx-auto max-w-[1200px] px-6">
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="text-[17px] font-semibold leading-tight text-white">
                  Prefer a live walkthrough?
                </h3>
                <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-white/65">
                  Bring an anonymised checkout from a live tenancy. We&rsquo;ll process it on the call with someone who has managed a UK letting portfolio.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/book-demo"
                  className="app-primary-button rounded-md px-5 py-2.5 text-sm font-medium"
                >
                  Book a demo &rarr;
                </Link>
                <a
                  href="/demo.html"
                  className="app-secondary-button rounded-md px-5 py-2.5 text-sm font-medium"
                >
                  Launch interactive demo
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-4 max-w-4xl text-center">
            <Link
              href="/demo/calculator"
              className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              Estimate your savings with our calculator →
            </Link>
          </section>

        </div>
      </MarketingShell>
    </>
  )
}
