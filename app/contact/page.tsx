import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicContactForm } from '@/app/public-contact-form'

export const metadata: Metadata = {
  title: 'Contact | Renovo',
  description:
    'Contact Renovo about early access, partnerships, investor enquiries, or general questions.',
  alternates: {
    canonical: 'https://renovoai.co.uk/contact',
  },
}

export default function ContactPage() {
  return (
    <MarketingShell currentPath="/contact">
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
            <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,243,0.95))] px-6 py-7 md:px-8 md:py-8">
              <p className="app-kicker">Contact</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
                Talk to Renovo
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
                Get in touch about early access, partnerships, investor enquiries, or general
                questions. We&apos;ll reply as soon as we can.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  'Early access for UK property managers and letting agencies',
                  'Partnership conversations welcome',
                  'Investor and strategic enquiries can use the same form',
                ].map((item) => (
                  <article
                    key={item}
                    className="rounded-[1.35rem] border border-stone-200 bg-white px-4 py-4 text-sm leading-6 text-stone-600"
                  >
                    {item}
                  </article>
                ))}
              </div>

              <div className="mt-8 rounded-[1.45rem] border border-stone-200 bg-white px-5 py-5">
                <p className="app-kicker">Email</p>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  If you prefer, you can also email{' '}
                  <a
                    href="mailto:hello@renovoai.co.uk"
                    className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4"
                  >
                    hello@renovoai.co.uk
                  </a>
                  .
                </p>
                <div className="mt-5">
                  <Link
                    href="/demo"
                    className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
                  >
                    View live demo
                  </Link>
                </div>
              </div>
            </div>

            <PublicContactForm sourcePage="/contact" />
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
