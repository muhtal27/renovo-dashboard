import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicContactForm } from '@/app/public-contact-form'
import {
  createContactPageJsonLd,
  createMarketingMetadata,
  createWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/marketing-metadata'

const title = 'Contact | Renovo AI'
const description =
  'Contact Renovo AI about product enquiries, partnerships, investor discussions, or general questions.'

export const metadata = createMarketingMetadata({
  title,
  description,
  path: '/contact',
})

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
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">

            <section className="page-hero">
              <p className="app-kicker">Contact</p>
              <h1 className="page-title max-w-[720px]">
                Talk to Renovo AI about your <em className="text-white/45">checkout workflow</em>
              </h1>
              <p className="page-copy max-w-[640px]">
                Use the form for product enquiries, partnerships, investor conversations,
                or general questions. Include context about how your team handles deduction
                letters, liability assessments, or dispute packs and we will reply directly.
              </p>

              <div className="mt-8 grid gap-3 text-sm leading-7 text-white/55">
                {[
                  'Product enquiries for UK property managers and letting agencies',
                  'Partnership conversations across inventory, CRM, and workflow tooling',
                  'Investor and strategic discussions through the same route',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <p className="app-kicker">Email</p>
                <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/55">
                  Prefer email? Contact{' '}
                  <a
                    href="mailto:hello@renovoai.co.uk"
                    className="text-emerald-500 hover:underline"
                  >
                    hello@renovoai.co.uk
                  </a>
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

              <div className="mt-10 text-sm text-white/45">
                <p>Renovo AI Ltd &middot; SC833544 &middot; VAT GB483379648 &middot; ICO ZC112030</p>

                <div className="mt-4 flex flex-wrap gap-4">
                  <Link href="/compliance" className="text-emerald-500 hover:underline">Compliance</Link>
                  <Link href="/privacy" className="text-emerald-500 hover:underline">Privacy</Link>
                  <Link href="/security" className="text-emerald-500 hover:underline">Security</Link>
                </div>
              </div>
            </section>

            <PublicContactForm sourcePage="/contact" />

          </div>
        </div>
      </MarketingShell>
    </>
  )
}
