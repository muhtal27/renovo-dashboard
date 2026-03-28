import Link from 'next/link'
import HomepageDemo from '@/app/components/HomepageDemo'
import { MarketingShell } from '@/app/components/MarketingShell'
import {
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Demo | Renovo AI'
const description =
  'View the Renovo AI read-only demo showing how checkout evidence becomes a liability assessment, deduction letter, and dispute-ready pack.'

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
          <p className="app-kicker">Demo</p>
          <h1 className="page-title max-w-[820px]">
            Review the Renovo AI workflow in a <em>read-only case preview</em>
          </h1>
          <p className="page-copy max-w-[760px]">
            This demo shows how Renovo AI moves from checkout evidence to liability assessment,
            deduction letter drafting, manager review, and claim-ready output without touching live
            customer data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get started →
            </Link>
            <Link
              href="/"
              className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Back to homepage
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-zinc-500">
            Editing, approval, and submission controls are hidden in this preview. The case layout
            matches the live product structure.
          </p>
        </section>

        <HomepageDemo />
        </div>
      </MarketingShell>
    </>
  )
}
