import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import {
  createContactPageJsonLd,
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Contact | Renovo AI'
const description =
  'Contact Renovo AI directly. Dedicated inboxes for product, investors, compliance, security, complaints, and careers.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/contact',
})

type ContactEntry = {
  kicker: string
  email: string
  detail: string
}

const CONTACTS: ContactEntry[] = [
  {
    kicker: 'General',
    email: 'hello@renovoai.co.uk',
    detail: 'Product, partnerships, enquiries',
  },
  {
    kicker: 'Investors',
    email: 'investors@renovoai.co.uk',
    detail: 'Pre-seed stage',
  },
  {
    kicker: 'Compliance',
    email: 'compliance@renovoai.co.uk',
    detail: 'Data protection, DPA, DPIA',
  },
  {
    kicker: 'Security',
    email: 'security@renovoai.co.uk',
    detail: 'Responsible disclosure',
  },
  {
    kicker: 'Complaints',
    email: 'complaints@renovoai.co.uk',
    detail: 'Formal complaints procedure',
  },
  {
    kicker: 'Careers',
    email: 'careers@renovoai.co.uk',
    detail: 'Get in touch even without an open role',
  },
]

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            createContactPageJsonLd(),
            createWebPageJsonLd({
              path: '/contact',
              title,
              description,
            }),
          ]),
        }}
      />
      <MarketingShell currentPath="/contact">
        <div className="page-shell page-stack">

          {/* HERO */}
          <section className="page-hero">
            <p className="app-kicker">Contact</p>
            <h1 className="page-title max-w-[820px]">
              Get in touch. <em className="text-white/45">We reply directly.</em>
            </h1>
            <p className="page-copy max-w-[720px]">
              No ticket systems, no round robin. Messages go straight to the relevant team member and we reply inside one working day.
            </p>
          </section>

          {/* CONTACT DIRECTORY */}
          <section className="mx-auto w-full max-w-[1200px] px-6">
            <div className="grid gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-8">
              {CONTACTS.map((c) => (
                <div key={c.email} className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {c.kicker}
                  </p>
                  <a
                    href={`mailto:${c.email}`}
                    className="text-[14px] font-semibold text-white transition-colors hover:text-emerald-300"
                  >
                    {c.email}
                  </a>
                  <p className="text-[11px] leading-relaxed text-white/45">{c.detail}</p>
                </div>
              ))}
            </div>

            {/* REGISTERED ADDRESS */}
            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:px-8 lg:py-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Registered address
              </p>
              <p className="mt-3 text-[14px] leading-[1.8] text-white/85">
                Renovo AI Ltd · Edinburgh, Scotland
                <br />
                Company no. SC833544 · VAT GB483379648 · ICO ZC112030
              </p>
            </div>
          </section>

          {/* CTA-LITE */}
          <section className="mx-auto w-full max-w-[1200px] px-6 pb-24">
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-[17px] font-semibold leading-tight text-white">
                  Prefer a live demo?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  Book a 30 minute walkthrough. Confirmation inside one working day.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/book-demo"
                  className="app-accent-button rounded-lg px-5 py-2.5 text-sm"
                >
                  Book a demo &rarr;
                </Link>
                <a
                  href="mailto:hello@renovoai.co.uk"
                  className="inline-flex items-center rounded-lg border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/75 transition-colors hover:border-white/30 hover:bg-white/[0.03]"
                >
                  Email direct
                </a>
              </div>
            </div>
          </section>

        </div>
      </MarketingShell>
    </>
  )
}
