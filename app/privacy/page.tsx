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
    location: 'EU',
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
      <section className="app-surface rounded-[2rem] p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <p className="app-kicker">Privacy</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Privacy notice
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
            Renovo automates end-of-tenancy work for property managers and letting agencies. This
            notice explains what personal data we collect, how we use it, where it is processed,
            and the choices available to you.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Who we are</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Renovo is operated in the United Kingdom. For privacy questions, contact{' '}
                <a href="mailto:hello@renovoai.co.uk">hello@renovoai.co.uk</a>.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Core storage and processing</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Your core customer data, including account information, uploaded documents, and
                processed results, is stored in the EU via Supabase. Some technical data may be
                processed through Vercel&apos;s global infrastructure, and specific checkout
                content is sent to OpenAI when analysis features are used.
              </p>
            </article>
          </div>

          <section className="mt-8">
            <p className="app-kicker">What we collect</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {dataCategories.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <h2 className="text-base font-semibold text-stone-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <p className="app-kicker">Why we use it</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {lawfulBases.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <h2 className="text-base font-semibold text-stone-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
            <p className="app-kicker">Processors and infrastructure</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50/90">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {processorRows.map((row) => (
                    <tr key={row.name} className="text-sm text-stone-700">
                      <td className="px-4 py-4 font-medium text-stone-900">{row.name}</td>
                      <td className="px-4 py-4">{row.role}</td>
                      <td className="px-4 py-4">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">International transfers</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Where data is processed outside the UK or EEA, we rely on appropriate transfer
                safeguards where required, such as contractual protections and equivalent provider
                commitments.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Retention</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                We keep data only for as long as needed to provide the service, maintain security,
                meet legal obligations, resolve disputes, and manage onboarding or customer
                relationships. Retention periods depend on the type of data and the purpose for
                which it was collected.
              </p>
            </article>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Your rights</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-600">
                {rights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Cookies</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                We use cookies and similar technologies where needed for sign-in, session handling,
                security, and service operation. We may also use limited analytics tooling,
                including PostHog, to understand product usage and improve the service.
              </p>
            </article>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
            >
              Back to homepage
            </Link>
            <a
              href="mailto:hello@renovoai.co.uk"
              className="app-primary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
            >
              Contact Renovo
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
