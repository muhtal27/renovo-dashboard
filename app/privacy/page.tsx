import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const informationCategories = [
  {
    title: 'Account and contact information',
    body: 'We may handle basic account, user, and contact information needed to provide access to the platform and support customer relationships.',
  },
  {
    title: 'Property and tenancy information',
    body: 'We may handle information related to properties, tenancies, inventories, checkouts, and end-of-tenancy workflows where required to deliver the service.',
  },
  {
    title: 'Operational case information',
    body: 'We may handle case-related information, supporting records, issue tracking, and workflow data used to manage tenancy-related processes.',
  },
  {
    title: 'Support and communications data',
    body: 'We may keep records of enquiries, service communications, and support interactions to help operate and improve the service.',
  },
  {
    title: 'Technical and usage information',
    body: 'We may process technical and usage information to maintain system performance, reliability, and security.',
  },
] as const

const usageCategories = [
  {
    title: 'Delivering and operating the service',
    body: 'We use information to run the platform, support tenancy-related workflows, and provide the core functionality customers rely on.',
  },
  {
    title: 'Customer relationships and support',
    body: 'We use information to respond to enquiries, manage onboarding and customer relationships, and provide support where needed.',
  },
  {
    title: 'Reliability, security, and improvement',
    body: 'We use information to maintain platform functionality, improve reliability, strengthen security, and refine how the service operates over time.',
  },
  {
    title: 'Operational, legal, and contractual needs',
    body: 'We may use information where needed to meet applicable legal, contractual, or operational requirements connected to running the service responsibly.',
  },
] as const

const handlingPrinciples = [
  {
    title: 'Access restriction',
    body: 'Access to information is limited to authorised users and appropriate personnel or service providers with a legitimate operational need.',
  },
  {
    title: 'Data minimisation',
    body: 'We aim to limit the information we handle to what is relevant for delivering and supporting the service.',
  },
  {
    title: 'Retention',
    body: 'We retain information in line with operational needs, customer relationships, and applicable legal or contractual considerations.',
  },
  {
    title: 'Security and controlled processing',
    body: 'We apply appropriate technical and organisational measures to help protect information and support responsible processing.',
  },
  {
    title: 'Ongoing improvement',
    body: 'We continue to review and improve our privacy, security, and operational practices as the platform matures.',
  },
] as const

export const metadata: Metadata = {
  title: 'Privacy | Renovo AI',
  description:
    'Learn how Renovo AI approaches privacy, responsible information handling, and the protection of customer and operational data.',
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
          <h1 className="page-title">Privacy</h1>
          <p className="page-copy max-w-[820px]">
            Renovo AI is committed to handling personal and operational information responsibly. We
            aim to use data carefully, securely, and only where it supports the delivery and
            improvement of the service.
          </p>
        </section>

        <section className="page-section">
          <div className="max-w-[900px]">
            <p className="app-kicker">Information we handle</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              The main categories of information used to <em>operate the service</em>
            </h2>
          </div>
          <div className="page-rule-list">
            {informationCategories.map((item) => (
              <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
                <h2 className="text-base font-semibold text-zinc-950">{item.title}</h2>
                <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="max-w-[900px]">
            <p className="app-kicker">How information is used</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Information use is tied to <em>service delivery and support</em>
            </h2>
          </div>
          <div className="page-rule-list">
            {usageCategories.map((item) => (
              <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
                <h2 className="text-base font-semibold text-zinc-950">{item.title}</h2>
                <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="max-w-[900px]">
            <p className="app-kicker">Data handling principles</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              The privacy posture is designed to stay <em>practical and reviewable</em>
            </h2>
          </div>
          <div className="page-rule-list">
            {handlingPrinciples.map((item) => (
              <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
                <h2 className="text-base font-semibold text-zinc-950">{item.title}</h2>
                <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="app-kicker">Privacy enquiries</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Need more detail on privacy or the wider <em>control posture</em>?
              </h2>
              <p className="mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
                Privacy is supported by the wider approach Renovo takes to compliance, access
                control, hosting, audit trail design, and responsible information handling. Contact
                us directly or review the compliance overview.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started →
              </Link>
              <Link
                href="/compliance"
                className="app-secondary-button rounded-md px-5 py-3 text-sm font-medium"
              >
                View compliance
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
