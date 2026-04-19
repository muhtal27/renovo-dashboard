import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const informationCategories = [
  { l: 'Account and contact information', d: 'We may handle basic account, user, and contact information needed to provide access to the platform and support customer relationships.' },
  { l: 'Property and tenancy information', d: 'We may handle information related to properties, tenancies, inventories, checkouts, and end of tenancy workflows where required to deliver the service.' },
  { l: 'Operational case information', d: 'We may handle case related information, supporting records, issue tracking, and workflow data used to manage tenancy related processes.' },
  { l: 'Support and communications data', d: 'We may keep records of enquiries, service communications, and support interactions to help operate and improve the service.' },
  { l: 'Technical and usage information', d: 'We may process technical and usage information to maintain system performance, reliability, and security.' },
] as const

const usageCategories = [
  { l: 'Delivering and operating the service', d: 'We use information to run the platform, support tenancy related workflows, and provide the core functionality customers rely on.' },
  { l: 'Customer relationships and support', d: 'We use information to respond to enquiries, manage onboarding and customer relationships, and provide support where needed.' },
  { l: 'Reliability, security, and improvement', d: 'We use information to maintain platform functionality, improve reliability, strengthen security, and refine how the service operates over time.' },
  { l: 'Operational, legal, and contractual needs', d: 'We may use information where needed to meet applicable legal, contractual, or operational requirements connected to running the service responsibly.' },
] as const

const handlingPrinciples = [
  { l: 'Access restriction', d: 'Access to information is limited to authorised users and appropriate personnel or service providers with a legitimate operational need.' },
  { l: 'Data minimisation', d: 'We aim to limit the information we handle to what is relevant for delivering and supporting the service.' },
  { l: 'Retention', d: 'We retain information in line with operational needs, customer relationships, and applicable legal or contractual considerations.' },
  { l: 'Security and controlled processing', d: 'We apply appropriate technical and organisational measures to help protect information and support responsible processing.' },
  { l: 'Ongoing improvement', d: 'We continue to review and improve our privacy, security, and operational practices as the platform matures.' },
] as const

export const metadata = createMarketingMetadata({
  title: 'Privacy | Renovo AI',
  description:
    'Learn how Renovo AI approaches privacy, responsible information handling, and the protection of customer and operational data.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <MarketingShell currentPath="/privacy">
      <div className="page-shell page-stack">

        <section className="page-hero">
          <p className="app-kicker">Privacy</p>
          <h1 className="page-title max-w-[820px]">
            How we look after <em className="text-white/45">your tenancy data.</em>
          </h1>
          <p className="page-copy max-w-[720px]">
            Renovo AI Ltd is registered with the ICO (ZC112030). We act as your data processor under the UK GDPR and the Data Protection Act 2018. You stay the data controller for all tenancy, landlord, and tenant information in your workspace.
          </p>
          <p className="mt-4 text-sm text-white/55">
            Renovo AI Ltd is registered with the Information Commissioner&apos;s Office (ICO). Registration reference: ZC112030.
          </p>
        </section>

        {/* INFORMATION WE HANDLE */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Information we handle</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Categories of information used to <em className="text-white/45">operate the service</em>
            </h2>
            <div className="mt-14 divide-y divide-white/10">
              {informationCategories.map((item) => (
                <div key={item.l} className="grid gap-2 py-5 md:grid-cols-[240px_1fr]">
                  <p className="text-sm font-semibold text-white">{item.l}</p>
                  <p className="text-sm leading-7 text-white/55">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW INFORMATION IS USED */}
        <section className="mx-auto max-w-[1080px] px-6 py-24">
          <p className="app-kicker">How information is used</p>
          <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Information use is tied to <em className="text-white/45">service delivery and support</em>
          </h2>
          <div className="mt-14 divide-y divide-white/10">
            {usageCategories.map((item) => (
              <div key={item.l} className="grid gap-2 py-5 md:grid-cols-[280px_1fr]">
                <p className="text-sm font-semibold text-white">{item.l}</p>
                <p className="text-sm leading-7 text-white/55">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HANDLING PRINCIPLES */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">Data handling principles</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
              Designed to stay <em className="text-white/45">practical and reviewable</em>
            </h2>
            <div className="mt-14 divide-y divide-white/10">
              {handlingPrinciples.map((item) => (
                <div key={item.l} className="grid gap-2 py-5 md:grid-cols-[240px_1fr]">
                  <p className="text-sm font-semibold text-white">{item.l}</p>
                  <p className="text-sm leading-7 text-white/55">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="page-hero text-center">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-white">
            Need more detail on <em className="text-white/45">privacy or compliance</em>?
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base leading-8 text-white/55">
            Contact us directly or review the compliance overview for hosting, access
            control, audit trail, and retention detail.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/book-demo" className="app-primary-button rounded-md px-6 py-3 text-sm font-medium">Book a demo &rarr;</Link>
            <Link href="/compliance" className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium">View compliance</Link>
          </div>
        </section>

      </div>
    </MarketingShell>
  )
}
