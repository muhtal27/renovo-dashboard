import type { Metadata } from 'next'
import Link from 'next/link'
import HomepageDemo from '@/app/components/HomepageDemo'
import { MarketingShell } from '@/app/components/MarketingShell'

export const metadata: Metadata = {
  title: 'Live Demo | Renovo',
  description:
    'View a read-only Renovo product walkthrough showing how end-of-tenancy evidence becomes reviewable, claim-ready output.',
  alternates: {
    canonical: 'https://renovoai.co.uk/demo',
  },
}

export default function DemoPage() {
  return (
    <MarketingShell currentPath="/demo">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Live demo</p>
          <h1 className="page-title">Read-only product preview</h1>
          <p className="page-copy">
            This preview shows how Renovo moves from check-in and check-out evidence to a
            structured, claim-ready output. Review the case, evidence, issues, recommendation, and
            draft claim output without touching live data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="app-primary-button rounded px-5 py-3 text-sm font-medium">
              Request early access
            </Link>
            <Link href="/" className="app-secondary-button rounded px-5 py-3 text-sm font-medium">
              Back to homepage
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-[#7a7670]">
            Editing, approval, and submission controls are hidden here, but the case structure
            matches the live product.
          </p>
        </section>

        <HomepageDemo />
      </div>
    </MarketingShell>
  )
}
