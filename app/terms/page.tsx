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
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <p className="app-kicker">Terms</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Website terms
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
            These terms apply to your use of the Renovo marketing site, live demo, and early
            access enquiry routes. They do not replace any separate customer agreement for use of
            the live product.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {termsSections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
              >
                <h2 className="text-base font-semibold text-stone-900">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {section.title === 'Contact' ? (
                    <>
                      If you have questions about these terms, contact{' '}
                      <a href="mailto:hello@renovoai.co.uk">hello@renovoai.co.uk</a>.
                    </>
                  ) : (
                    section.body
                  )}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
            >
              Back to homepage
            </Link>
            <Link
              href="/privacy"
              className="app-primary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
            >
              View privacy notice
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
