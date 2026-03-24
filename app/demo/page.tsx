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
      <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
        <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 md:px-8 md:py-9">
          <div className="max-w-4xl">
            <p className="app-kicker">Live demo</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Read-only product preview
            </h1>
            <p className="mt-4 text-base leading-8 text-stone-700">
              This read-only preview shows how Renovo moves from check-in and check-out evidence to
              a structured, claim-ready output. Use the tabs to review the case, evidence, issues,
              recommendation, and draft claim output.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#waitlist"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Request early access
              </Link>
              <Link
                href="/"
                className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Back to homepage
              </Link>
            </div>
            <p className="mt-5 text-sm leading-7 text-stone-500">
              Editing, approval, and submission controls are hidden here, but the workflow and case
              structure match the live product.
            </p>
          </div>
        </div>
      </section>

      <HomepageDemo />
    </MarketingShell>
  )
}
