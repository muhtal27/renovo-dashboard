import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const termsSections = [
  {
    title: 'Use of the website',
    body: 'The Renovo AI website is provided for general information about the product, the live demo, and product enquiries. You may browse and use the site for lawful business purposes only.',
  },
  {
    title: 'Product availability',
    body: 'Access to the live product is managed through onboarding. Nothing on this website guarantees access, availability, or a particular product feature unless agreed separately in writing.',
  },
  {
    title: 'Intellectual property',
    body: 'Unless stated otherwise, the content, branding, interface, and materials on this website belong to Renovo AI or its licensors. You may not copy, republish, or reuse them beyond normal business evaluation without permission.',
  },
  {
    title: 'Accuracy and changes',
    body: 'We aim to keep the website accurate and up to date, but product details may change as Renovo AI develops. We may update or remove content, routes, or features at any time.',
  },
  {
    title: 'Liability',
    body: 'The website is provided on an as-is basis for general information. To the extent permitted by law, Renovo AI is not liable for loss arising from reliance on website content alone. Any live customer use of the product is governed by separate commercial terms.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about these terms, contact hello@renovoai.co.uk.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Terms | Renovo AI',
  description: 'Website terms for the Renovo AI marketing site, demo, and product enquiry routes.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <MarketingShell currentPath="/terms">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Terms</p>
          <h1 className="page-title">Website terms</h1>
          <p className="page-copy max-w-[820px]">
            These terms apply to your use of the Renovo AI marketing site, live demo, and contact
            routes. They do not replace any separate customer agreement for live product use.
          </p>
        </section>

        <section className="page-section">
          <div className="page-rule-list">
            {termsSections.map((section, index) => (
              <div key={section.title} className="grid gap-3 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-zinc-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-base font-semibold text-zinc-950">{section.title}</h2>
                </div>
                <p className="text-sm leading-7 text-zinc-600">
                  {section.title === 'Contact' ? (
                    <>
                      If you have questions about these terms, contact{' '}
                      <a
                        href="mailto:hello@renovoai.co.uk"
                        className="underline decoration-zinc-300 underline-offset-4"
                      >
                        hello@renovoai.co.uk
                      </a>
                      .
                    </>
                  ) : (
                    section.body
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section-compact">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="app-secondary-button rounded-md px-5 py-3 text-sm font-medium"
            >
              Back to homepage
            </Link>
            <Link
              href="/privacy"
              className="app-primary-button rounded-md px-5 py-3 text-sm font-medium"
            >
              View privacy notice
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
