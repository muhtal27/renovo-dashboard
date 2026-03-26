import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const dataCategories = [
  {
    title: 'Account and contact details',
    body: 'This can include names, email addresses, organisation details, and the information you submit when requesting early access or using the product.',
  },
  {
    title: 'Case and property records',
    body: 'This can include tenancy details, uploaded documents, photos, notes, issue assessments, claim preparation records, and processed results.',
  },
  {
    title: 'Technical and usage data',
    body: 'This can include device, browser, log, session, and product usage information needed to run, secure, and improve the service.',
  },
] as const

const lawfulBases = [
  {
    title: 'Contract and pre-contract steps',
    body: 'We process data where needed to provide the service, respond to onboarding enquiries, and manage access to Renovo.',
  },
  {
    title: 'Legitimate interests',
    body: 'We process data to run the service, keep it secure, investigate issues, improve the product, and communicate with customers about operational matters.',
  },
  {
    title: 'Consent',
    body: 'Where you ask us to contact you about early access or similar updates, we rely on your consent where that is the appropriate basis.',
  },
  {
    title: 'Legal obligations',
    body: 'We may process data where needed to comply with applicable law, regulatory requirements, or lawful requests.',
  },
] as const

const processorRows = [
  {
    name: 'Supabase',
    role: 'Core application database, authentication, and document storage',
    location: 'London, United Kingdom',
  },
  {
    name: 'PostHog',
    role: 'Product analytics',
    location: 'EU',
  },
  {
    name: 'OpenAI',
    role: 'Analysis features for specific checkout content when those features are used',
    location: 'United States',
  },
  {
    name: 'Vercel',
    role: 'Application hosting and request handling',
    location: 'Global infrastructure',
  },
] as const

const rights = [
  'access to the personal data we hold about you',
  'correction of inaccurate or incomplete data',
  'erasure where there is no valid reason for us to keep it',
  'restriction or objection in certain circumstances',
  'data portability where applicable',
  'withdrawal of consent where processing relies on consent',
] as const

export const metadata: Metadata = {
  title: 'Privacy | Renovo',
  description:
    'Privacy notice for Renovo, covering data collection, storage, processors, transfers, retention, and your rights.',
  alternates: {
    canonical: 'https://renovoai.co.uk/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <MarketingShell currentPath="/privacy">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Privacy</p>
          <h1 className="page-title">Privacy notice</h1>
          <p className="page-copy max-w-4xl">
            Renovo automates end-of-tenancy work for property managers and letting agencies. This
            notice explains what personal data we collect, how we use it, where it is processed,
            and the choices available to you.
          </p>
          <p className="mt-6 text-sm leading-7 text-[#3d3b37]">
            Renovo is operated in the United Kingdom. For privacy questions, contact{' '}
            <a href="mailto:hello@renovoai.co.uk">hello@renovoai.co.uk</a>.
          </p>
        </section>

        <section className="page-grid-2">
          <article className="page-card">
            <p className="app-kicker">What we collect</p>
            <div className="mt-5 space-y-5">
              {dataCategories.map((item, index) => (
                <div
                  key={item.title}
                  className={index === dataCategories.length - 1 ? '' : 'border-b border-[rgba(15,14,13,0.08)] pb-5'}
                >
                  <h2 className="text-base">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card">
            <p className="app-kicker">Why we use it</p>
            <div className="mt-5 space-y-5">
              {lawfulBases.map((item, index) => (
                <div
                  key={item.title}
                  className={index === lawfulBases.length - 1 ? '' : 'border-b border-[rgba(15,14,13,0.08)] pb-5'}
                >
                  <h2 className="text-base">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="page-card">
          <p className="app-kicker">Core storage and processing</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[#3d3b37]">
            Your core customer data, including account information, uploaded documents, and
            processed results, is stored in the United Kingdom via our Supabase infrastructure in
            London. Some technical data may be processed through Vercel&apos;s global
            infrastructure, and specific checkout content is sent to OpenAI when analysis features
            are used.
          </p>
        </section>

        <section className="page-card">
          <p className="app-kicker">Processors and infrastructure</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgba(15,14,13,0.1)]">
              <thead className="bg-[#fcfbf9]">
                <tr className="text-left text-xs font-medium uppercase tracking-[0.16em] text-[#7a7670]">
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,14,13,0.1)] bg-white">
                {processorRows.map((row) => (
                  <tr key={row.name} className="text-sm text-[#3d3b37]">
                    <td className="px-4 py-4 font-medium text-[#0f0e0d]">{row.name}</td>
                    <td className="px-4 py-4">{row.role}</td>
                    <td className="px-4 py-4">{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-grid-2">
          <article className="page-card">
            <p className="app-kicker">Retention and transfers</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[#3d3b37]">
              <p>
                We keep data only for as long as needed to provide the service, maintain security,
                meet legal obligations, resolve disputes, and manage onboarding or customer
                relationships.
              </p>
              <p>
                Our primary application database is hosted in London, United Kingdom. Where data
                is processed outside the UK or EEA, we rely on appropriate transfer safeguards
                where required, such as contractual protections and equivalent provider
                commitments.
              </p>
            </div>
          </article>

          <article className="page-card">
            <p className="app-kicker">Your rights and cookies</p>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-[#3d3b37]">
              {rights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-7 text-[#3d3b37]">
              We use cookies and similar technologies where needed for sign-in, session handling,
              security, and service operation. We may also use limited analytics tooling,
              including PostHog, to understand product usage and improve the service.
            </p>
          </article>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="app-secondary-button inline-flex rounded px-4 py-2 text-sm font-medium">
            Back to homepage
          </Link>
          <a href="mailto:hello@renovoai.co.uk" className="app-primary-button inline-flex rounded px-4 py-2 text-sm font-medium">
            Contact Renovo
          </a>
        </div>
      </div>
    </MarketingShell>
  )
}
