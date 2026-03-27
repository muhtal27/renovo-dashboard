import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicContactForm } from '@/app/public-contact-form'

export const metadata: Metadata = {
  title: 'Contact | Renovo AI',
  description:
    'Contact Renovo AI about early access, partnerships, investor enquiries, or general questions.',
  alternates: {
    canonical: 'https://renovoai.co.uk/contact',
  },
}

export default function ContactPage() {
  return (
    <MarketingShell currentPath="/contact">
      <div className="page-shell page-stack">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <section className="page-hero">
            <p className="app-kicker">Contact</p>
            <h1 className="page-title">Talk to Renovo AI</h1>
            <p className="page-copy">
              Get in touch about early access, partnerships, investor enquiries, or general
              questions. We will reply as soon as we can.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#7a7670]">
              Renovo AI Ltd · Company No. SC833544
            </p>

            <div className="mt-8 grid gap-3 text-sm leading-7 text-[#3d3b37]">
              {[
                'Early access for UK property managers and letting agencies',
                'Partnership conversations welcome',
                'Investor and strategic enquiries can use the same form',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] px-5 py-5">
              <p className="app-kicker">Email</p>
              <p className="mt-3 text-sm leading-7 text-[#3d3b37]">
                If you prefer, you can also email{' '}
                <a
                  href="mailto:hello@renovoai.co.uk"
                  className="underline decoration-[rgba(15,14,13,0.18)] underline-offset-4"
                >
                  hello@renovoai.co.uk
                </a>
                .
              </p>
              <div className="mt-5">
                <Link href="/demo" className="app-secondary-button rounded px-4 py-2 text-sm font-medium">
                  View live demo
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
