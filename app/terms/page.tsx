import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const termsSections = [
  {
    title: 'Use of the website',
    body: 'The Renovo website is provided for general information about the product, the live demo, and the early access programme. You may browse and use the site for lawful business purposes only.',
  },
  {
    title: 'Early access and product availability',
    body: 'Access to the live product is managed through onboarding. Nothing on this website guarantees access, availability, or a particular product feature unless agreed separately in writing.',
  },
  {
    title: 'Intellectual property',
    body: 'Unless stated otherwise, the content, branding, interface, and materials on this website belong to Renovo or its licensors. You may not copy, republish, or reuse them beyond normal business evaluation without permission.',
  },
  {
    title: 'Accuracy and changes',
    body: 'We aim to keep the website accurate and up to date, but product details may change as Renovo develops. We may update or remove content, routes, or features at any time.',
  },
  {
    title: 'Liability',
    body: 'The website is provided on an as-is basis for general information. To the extent permitted by law, Renovo is not liable for loss arising from reliance on website content alone. Any live customer use of the product is governed by separate commercial terms.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about these terms, contact hello@renovoai.co.uk.',
  },
] as const

export const metadata: Metadata = {
  title: 'Terms | Renovo',
  description: 'Website terms for the Renovo marketing site, demo, and early access enquiries.',
  alternates: {
    canonical: 'https://renovoai.co.uk/terms',
  },
}

export default function TermsPage() {
  return (
    <MarketingShell currentPath="/terms">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Terms</p>
          <h1 className="page-title">Website terms</h1>
          <p className="page-copy max-w-4xl">
            These terms apply to your use of the Renovo marketing site, live demo, and early
            access enquiry routes. They do not replace any separate customer agreement for use of
            the live product.
          </p>
        </section>

        <section className="page-card">
          <div className="space-y-6">
            {termsSections.map((section, index) => (
              <div
                key={section.title}
                className={index === termsSections.length - 1 ? '' : 'border-b border-[rgba(15,14,13,0.08)] pb-6'}
              >
                <h2 className="text-base">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#3d3b37]">
                  {section.title === 'Contact' ? (
                    <>
                      If you have questions about these terms, contact{' '}
                      <a href="mailto:hello@renovoai.co.uk">hello@renovoai.co.uk</a>.
                    </>
                  ) : (
                    section.body
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="app-secondary-button inline-flex rounded px-4 py-2 text-sm font-medium">
              Back to homepage
            </Link>
            <Link href="/privacy" className="app-primary-button inline-flex rounded px-4 py-2 text-sm font-medium">
              View privacy notice
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
