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
    body: 'We may handle information related to properties, tenancies, inventories, check-outs, and end-of-tenancy workflows where required to deliver the service.',
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
    'Learn how Renovo AI approaches privacy, responsible data handling, and the protection of customer and operational information.',
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
          <p className="page-copy max-w-4xl">
            Renovo AI is committed to handling personal and operational information responsibly. We
            aim to use data carefully, securely, and only where it supports the delivery and
            improvement of our service.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#7a7670]">
            Renovo AI Ltd · Company No. SC833544
          </p>
        </section>

        <section className="page-card">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:items-start">
            <div>
              <p className="app-kicker">Overview</p>
              <h2 className="mt-3 text-[28px] leading-[1.15]">Responsible handling, practical controls</h2>
              <p className="mt-4 max-w-4xl text-[15px] leading-8 text-[#3d3b37]">
                We recognise the importance of privacy in the handling of customer, tenancy,
                property, and operational information. Our approach is to process information
                responsibly, restrict access appropriately, and continue improving our practices as
                the platform evolves.
              </p>
            </div>

            <aside className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-5">
              <p className="app-kicker">Guided by</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#3d3b37]">
                {['Careful use', 'Restricted access', 'Continuous improvement'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section aria-labelledby="information-we-handle" className="page-stack">
          <div className="px-1">
            <p className="app-kicker">Information we handle</p>
            <h2 id="information-we-handle" className="mt-3 text-[30px] leading-[1.15]">
              Categories aligned to how the platform is used
            </h2>
          </div>

          <div className="page-grid-3">
            {informationCategories.map((item, index) => (
              <article key={item.title} className="page-card h-full border-[rgba(15,14,13,0.1)] bg-white">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-xl leading-[1.2]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-information-is-used" className="page-stack">
          <div className="px-1">
            <p className="app-kicker">How information is used</p>
            <h2 id="how-information-is-used" className="mt-3 text-[30px] leading-[1.15]">
              Used to support delivery, service quality, and responsible operations
            </h2>
          </div>

          <div className="page-grid-2">
            {usageCategories.map((item) => (
              <article key={item.title} className="page-card">
                <h3 className="text-[24px] leading-[1.2]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="data-handling-principles" className="page-stack">
          <div className="px-1">
            <p className="app-kicker">Data handling principles</p>
            <h2 id="data-handling-principles" className="mt-3 text-[30px] leading-[1.15]">
              Principles that shape how information is managed
            </h2>
          </div>

          <div className="page-grid-3">
            {handlingPrinciples.map((item, index) => (
              <article key={item.title} className="page-card h-full">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-xl leading-[1.2]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[18px] border border-[rgba(15,14,13,0.12)] bg-[#f4f0e8] px-6 py-7 shadow-[0_10px_28px_rgba(0,0,0,0.04)] md:px-8 md:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
            <div>
              <p className="app-kicker">Third parties and service providers</p>
              <h2 className="mt-3 text-[30px] leading-[1.15]">Controlled use of trusted support services</h2>
              <p className="mt-4 text-[15px] leading-8 text-[#3d3b37]">
                We may rely on trusted service providers to support areas such as hosting,
                infrastructure, communications, and related operational services. Where we do so,
                we aim to use appropriate safeguards and controlled access arrangements.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgba(15,14,13,0.1)] bg-[rgba(255,255,255,0.82)] p-5">
              <p className="text-sm font-medium text-[#0f0e0d]">Supported by</p>
              <div className="mt-4 space-y-3">
                {[
                  'Hosting and infrastructure services',
                  'Communications and support tooling',
                  'Operational delivery services where required',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[rgba(15,14,13,0.08)] bg-white px-4 py-3 text-sm leading-7 text-[#3d3b37]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-center">
            <div>
              <p className="app-kicker">Compliance &amp; security</p>
              <h2 className="mt-3 text-[28px] leading-[1.15]">Privacy sits within a broader control posture</h2>
              <p className="mt-4 max-w-4xl text-[15px] leading-8 text-[#3d3b37]">
                Privacy is supported by our broader approach to security and operational controls.
                For more information, see our Compliance &amp; Security page.
              </p>
            </div>

            <div>
              <Link href="/compliance" className="app-secondary-button rounded px-5 py-3 text-sm font-medium">
                View Compliance &amp; Security
              </Link>
            </div>
          </div>
        </section>

        <section className="page-hero text-center">
          <p className="app-kicker">Privacy enquiries</p>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.12]">
            Questions about information handling?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-8 text-[#3d3b37]">
            If you have questions about how Renovo AI handles information, please get in touch and we
            will direct your enquiry to the appropriate team.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
              Contact us
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
