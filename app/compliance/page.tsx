import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const securityPrinciples = [
  {
    title: 'Data protection',
    body: 'We handle customer and operational data with care and apply appropriate safeguards to protect its confidentiality, integrity, and availability.',
  },
  {
    title: 'Access control',
    body: 'Access to systems and data is restricted to authorised users based on role and operational need, helping ensure that sensitive information is only available to the right people.',
  },
  {
    title: 'Encryption',
    body: 'We use appropriate encryption measures to protect data in transit and, where applicable, at rest.',
  },
  {
    title: 'Secure development',
    body: 'Security is considered throughout the product development lifecycle, including implementation decisions, access management, and change control.',
  },
  {
    title: 'Monitoring and resilience',
    body: 'We aim to maintain reliable systems through monitoring, controlled infrastructure, and operational practices that support continuity and recovery.',
  },
  {
    title: 'Operational controls',
    body: 'We continue to improve our internal processes, documentation, and accountability to support secure day-to-day operations.',
  },
] as const

const customerExpectations = [
  'Role-based access controls for relevant platform functions',
  'Principle-of-least-privilege access decisions across systems and operational workflows',
  'Secure cloud infrastructure and controlled access management practices',
  'Auditability and operational accountability in how key actions are handled',
  'Ongoing security improvements, review, and control refinement as the platform matures',
] as const

const privacyHandling = [
  'Customer, tenancy, and property-related information is handled with care and only used where required to operate and support the service.',
  'Access is restricted to authorised personnel and service providers where needed to deliver, maintain, or support the platform.',
  'Retention and handling practices are aligned with operational requirements and applicable legal obligations.',
] as const

export const metadata: Metadata = {
  title: 'Compliance & Security | Renovo AI',
  description:
    "Learn about Renovo AI's approach to security, data protection, and compliance, including our work towards ISO/IEC 27001 and Cyber Essentials Plus.",
  alternates: {
    canonical: 'https://renovoai.co.uk/compliance',
  },
}

export default function CompliancePage() {
  return (
    <MarketingShell currentPath="/compliance">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Compliance &amp; Security</p>
          <h1 className="page-title">Compliance &amp; Security</h1>
          <p className="page-copy max-w-4xl">
            Renovo AI is built with security, privacy, and operational trust in mind. We are
            committed to protecting customer data and strengthening our controls as the platform
            grows.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#7a7670]">
            Renovo AI Ltd · Company No. SC833544
          </p>
        </section>

        <section className="page-card">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] lg:items-start">
            <div>
              <p className="app-kicker">Overview</p>
              <h2 className="mt-3 text-[28px] leading-[1.15]">A practical approach to trust</h2>
              <p className="mt-4 max-w-4xl text-[15px] leading-8 text-[#3d3b37]">
                At Renovo AI, we take information security and responsible data handling seriously.
                Our approach combines practical technical safeguards, controlled access, and
                ongoing process improvement to support a secure and reliable service for
                end-of-tenancy operations.
              </p>
            </div>

            <aside className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-5">
              <p className="app-kicker">Built around</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[#3d3b37]">
                {['Security', 'Privacy', 'Operational trust'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section aria-labelledby="security-principles" className="page-stack">
          <div className="px-1">
            <p className="app-kicker">Security principles</p>
            <h2 id="security-principles" className="mt-3 text-[30px] leading-[1.15]">
              Controls shaped around how the platform operates
            </h2>
          </div>

          <div className="page-grid-3">
            {securityPrinciples.map((item, index) => (
              <article
                key={item.title}
                className="page-card h-full border-[rgba(15,14,13,0.1)] bg-white"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-xl leading-[1.2]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="compliance-posture"
          className="rounded-[18px] border border-[rgba(15,14,13,0.12)] bg-[#f4f0e8] px-6 py-7 shadow-[0_10px_28px_rgba(0,0,0,0.04)] md:px-8 md:py-8"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.85fr)] lg:items-start">
            <div>
              <p className="app-kicker">Compliance posture</p>
              <h2 id="compliance-posture" className="mt-3 text-[30px] leading-[1.15]">
                Building a stronger compliance baseline
              </h2>
              <div className="mt-4 space-y-4 text-[15px] leading-8 text-[#3d3b37]">
                <p>
                  We are currently working towards ISO/IEC 27001 and Cyber Essentials Plus as
                  part of our broader commitment to information security maturity.
                </p>
                <p>
                  These efforts reflect our focus on strengthening policies, controls, risk
                  management, and operational discipline as we continue to develop the Renovo AI
                  platform.
                </p>
                <p>
                  We are continuously improving our policies, controls, and processes as the
                  platform matures.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(15,14,13,0.1)] bg-[rgba(255,255,255,0.82)] p-5">
              <p className="text-sm font-medium text-[#0f0e0d]">Current focus</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(15,14,13,0.08)] bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0f0e0d]">ISO/IEC 27001</p>
                    <p className="mt-1 text-sm leading-6 text-[#5a554f]">
                      Working towards certification readiness
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e1f5ee] px-3 py-1 text-xs font-medium text-[#0f6e56]">
                    In progress
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl border border-[rgba(15,14,13,0.08)] bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#0f0e0d]">Cyber Essentials Plus</p>
                    <p className="mt-1 text-sm leading-6 text-[#5a554f]">
                      Working towards assessment readiness
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e1f5ee] px-3 py-1 text-xs font-medium text-[#0f6e56]">
                    In progress
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-grid-2">
          <article className="page-card">
            <p className="app-kicker">What customers can expect</p>
            <h2 className="mt-3 text-[28px] leading-[1.15]">Clear controls, not vague claims</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#3d3b37]">
              {customerExpectations.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f6e56]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="page-card">
            <p className="app-kicker">Privacy and responsible handling</p>
            <h2 className="mt-3 text-[28px] leading-[1.15]">Handled with care</h2>
            <p className="mt-4 text-[15px] leading-8 text-[#3d3b37]">
              We understand the importance of handling customer, tenancy, and property-related
              information responsibly. We restrict access where appropriate, work to maintain
              secure systems and processes, and continue to evolve our controls in line with
              business needs and customer expectations.
            </p>
            <div className="mt-5 space-y-3">
              {privacyHandling.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[rgba(15,14,13,0.08)] bg-[#fcfbf9] px-4 py-3 text-sm leading-7 text-[#3d3b37]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="page-hero text-center">
          <p className="app-kicker">Security and compliance enquiries</p>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.7rem)] leading-[1.12]">
            Need more information for review?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-8 text-[#3d3b37]">
            If you have questions about our security approach or compliance roadmap, please get in
            touch and we will direct your enquiry to the appropriate team.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
              Contact us
            </Link>
            <a
              href="mailto:hello@renovoai.co.uk?subject=Security%20and%20compliance%20enquiry"
              className="app-secondary-button rounded px-6 py-3 text-sm font-medium"
            >
              Email Renovo AI
            </a>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
