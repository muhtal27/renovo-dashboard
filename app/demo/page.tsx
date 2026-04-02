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
            <h1 className="page-title max-w-[820px]">
              Explore the full operator dashboard with{' '}
              <em className="text-slate-400">live mock data</em>
            </h1>
            <p className="page-copy max-w-[640px]">
              Click through the end-of-tenancy workflow from checkout intake to AI
              analysis, review, draft report delivery, and claim submission. Every
              page in the sidebar is fully interactive.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/demo.html"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Launch interactive demo &rarr;
              </a>
              <Link
                href="/contact"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started
              </Link>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              This demo uses mock Edinburgh properties and tenants. No real
              customer data is shown.
            </p>
          </section>

          <section className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Full workflow
              </p>
              <h3 className="mt-3 text-base font-semibold text-zinc-950">
                Draft to resolved
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Walk through every step of the checkout process including document
                upload, AI analysis, review, draft delivery, and claim submission.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Every page
              </p>
              <h3 className="mt-3 text-base font-semibold text-zinc-950">
                Sidebar navigation
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Explore Checkouts, Disputes, Guidance, Reports, Admin, Teams, and
                Settings pages exactly as operators see them.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                Mock data
              </p>
              <h3 className="mt-3 text-base font-semibold text-zinc-950">
                Realistic scenarios
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Nine Edinburgh properties with tenants, landlords, deposits, and
                AI-generated liability assessments across every workflow state.
              </p>
            </div>
          </section>

          <section className="page-hero">
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1] tracking-[-0.03em]">
              Ready to automate your checkouts?
            </h2>
            <p className="page-copy max-w-[540px]">
              See how Renovo AI handles your real portfolio. Book a walkthrough
              with your own property data.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started &rarr;
              </Link>
              <Link
                href="/"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Back to homepage
              </Link>
            </div>
          </section>
        </div>
      </MarketingShell>
    </>
  )
}
