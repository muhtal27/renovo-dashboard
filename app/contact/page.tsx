import {
  MarketingButton,
  MarketingCard,
  MarketingIntro,
  MarketingSection,
} from '@/app/components/marketing-ui'
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
        <MarketingSection>
          <div className="grid gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
            <div className="space-y-6">
              <MarketingIntro
                titleAs="h1"
                eyebrow="Contact"
                title={
                  <>
                    Talk to Renovo AI about your <em>checkout workflow</em>
                  </>
                }
                description="Use the form for product enquiries, partnerships, investor conversations, or general questions. If you are reviewing deduction letters, liability assessments, or dispute packs, include that context and we&apos;ll reply directly."
              />

              <MarketingCard className="rounded-[1.75rem]">
                <p className="marketing-eyebrow">Best for</p>
                <div className="mt-5 grid gap-3">
                  {[
                    'Product enquiries from UK letting agencies and property operations teams',
                    'Partnership conversations across inventory, CRM, and workflow tooling',
                    'Investor and strategic discussions through the same route',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-black/6 bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-7 text-[var(--text-body)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </MarketingCard>

              <div className="grid gap-5 md:grid-cols-2">
                <MarketingCard className="h-full rounded-[1.75rem]">
                  <p className="marketing-eyebrow">Direct email</p>
                  <p className="mt-4 text-lg leading-7 text-[var(--text-strong)]">
                    Prefer email?
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">
                    Contact{' '}
                    <a
                      href="mailto:hello@renovoai.co.uk"
                      className="underline decoration-zinc-300 underline-offset-4"
                    >
                      hello@renovoai.co.uk
                    </a>
                    .
                  </p>
                  <div className="mt-6">
                    <MarketingButton href="/demo" variant="secondary">
                      View demo
                    </MarketingButton>
                  </div>
                </MarketingCard>

                <MarketingCard className="h-full rounded-[1.75rem]">
                  <p className="marketing-eyebrow">Company details</p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                    <p>Renovo AI Ltd - SC833544 - VAT GB483379648</p>
                    <p>Edinburgh, Scotland</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm">
                    <a
                      href="/compliance"
                      className="underline decoration-zinc-300 underline-offset-4 text-[var(--text-body)]"
                    >
                      Compliance
                    </a>
                    <a
                      href="/privacy"
                      className="underline decoration-zinc-300 underline-offset-4 text-[var(--text-body)]"
                    >
                      Privacy
                    </a>
                    <a
                      href="/bug-bounty"
                      className="underline decoration-zinc-300 underline-offset-4 text-[var(--text-body)]"
                    >
                      Security
                    </a>
                  </div>
                </MarketingCard>
              </div>
            </div>

            <PublicContactForm sourcePage="/contact" />
          </div>
        </MarketingSection>
      </MarketingShell>
    </>
  )
}
