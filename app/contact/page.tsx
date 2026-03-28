import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicContactForm } from '@/app/public-contact-form'

export const metadata: Metadata = {
  title: 'Contact | Renovo AI',
  description:
    'Contact Renovo AI about product enquiries, partnerships, investor discussions, or general questions.',
  alternates: {
    canonical: 'https://renovoai.co.uk/contact',
  },
}

export default function ContactPage() {
  return (
    <MarketingShell currentPath="/contact">
      <div className="page-shell page-stack">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <section className="page-hero">
            <p className="app-kicker">Contact</p>
            <h1 className="page-title max-w-[720px]">
              Talk to Renovo AI about your <em>checkout workflow</em>
            </h1>
            <p className="page-copy max-w-[720px]">
              Use the form for product enquiries, partnerships, investor conversations, or general
              questions. If you are reviewing how your team handles deduction letters, liability
              assessments, or dispute packs, include that context and we&apos;ll reply directly.
            </p>

            <div className="mt-8 grid gap-3 text-sm leading-7 text-zinc-600">
              {[
                'Product enquiries for UK property managers and letting agencies',
                'Partnership conversations across inventory, CRM, and workflow tooling',
                'Investor and strategic discussions through the same route',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="page-section-compact mt-8 pb-0">
              <p className="app-kicker">Email</p>
              <p className="mt-3 max-w-[560px] text-sm leading-7 text-zinc-600">
                Prefer email? Contact{' '}
                <a
                  href="mailto:hello@renovoai.co.uk"
                  className="underline decoration-zinc-300 underline-offset-4"
                >
                  hello@renovoai.co.uk
                </a>
                .
              </p>
              <div className="mt-5">
                <Link
                  href="/demo"
                  className="app-secondary-button rounded-md px-4 py-2 text-sm font-medium"
                >
                  View demo
                </Link>
              </div>
            </div>
          </section>

          <PublicContactForm sourcePage="/contact" />
        </div>
      </div>
    </MarketingShell>
  )
}
