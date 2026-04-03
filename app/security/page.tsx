import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const securityPrinciples = [
  {
    title: 'Data isolation',
    body: 'Every workspace is fully isolated at the database level. Tenant data, evidence, and case records are scoped and access-controlled throughout the stack.',
  },
  {
    title: 'Encryption',
    body: 'All data is encrypted in transit via TLS and at rest using AES-256. Authentication tokens, session credentials, and API keys follow least-privilege principles.',
  },
  {
    title: 'Access control',
    body: 'Role-based permissions govern every operator action. Manager sign-off, audit trails, and scoped API access are built into the workflow — not bolted on.',
  },
  {
    title: 'Infrastructure',
    body: 'Renovo AI runs on hardened cloud infrastructure with automated patching, monitoring, and incident response. We do not self-host customer data on shared hardware.',
  },
] as const

const reportItems = [
  'A clear summary of the issue and the affected area',
  'Steps to reproduce, including any required account state',
  'The security impact and what data or function is exposed',
  'Screenshots, requests, or proof-of-concept details where useful',
] as const

const scopeItems = [
  'The Renovo AI web application and public website routes we operate',
  'Authentication and authorization weaknesses, including access control bypass',
  'Data exposure affecting customer, tenancy, property, or operational records',
  'API endpoints that expose sensitive actions, data, or trust boundaries',
] as const

const outOfScopeItems = [
  'Social engineering, phishing, or attempts to target staff, users, or partners',
  'Physical attacks against offices, devices, or network infrastructure',
  'Denial-of-service or distributed denial-of-service testing',
  'Automated scanner output sent without proof of impact or a reproducible finding',
  'Vulnerabilities in third-party products, integrations, or platforms we do not control',
] as const

const disclosureGuidelines = [
  'Act in good faith and avoid privacy violations, service disruption, or data destruction.',
  'Do not access, modify, or retain more data than needed to demonstrate the issue.',
  'Do not publicly disclose a finding until Renovo has had a reasonable opportunity to investigate and remediate it.',
  'Stop testing and contact us immediately if you believe you have reached sensitive live data.',
] as const

export const metadata = createMarketingMetadata({
  title: 'Security | Renovo AI',
  description:
    'How Renovo AI protects customer data, infrastructure security practices, and responsible disclosure policy.',
  path: '/security',
})

export default function SecurityPage() {
  return (
    <MarketingShell currentPath="/security">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">Security</p>
          <h1 className="page-title max-w-[820px]">
            Built for trust from <em className="text-slate-400">day one</em>
          </h1>
          <p className="page-copy max-w-[640px]">
            Renovo AI handles sensitive property, tenancy, and financial data on behalf of
            letting agencies and property managers. Security is a core requirement of the
            platform — not an afterthought.
          </p>
        </section>

        {/* Security principles */}
        <section className="section-tinted">
          <div className="mx-auto max-w-[1080px] px-6 py-24">
            <p className="app-kicker">How we protect your data</p>
            <h2 className="mt-3.5 text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-zinc-950">
              Security <em className="text-slate-400">principles</em>
            </h2>
            <div className="mt-14 grid gap-10 md:grid-cols-2">
              {securityPrinciples.map((item) => (
                <div key={item.title}>
                  <h3 className="text-[15px] font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsible disclosure */}
        <div className="mx-auto w-full max-w-[780px]">
          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              Responsible disclosure
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                We welcome responsible disclosure and good-faith security research. If you
                identify a vulnerability in systems we control, we want to hear about it quickly
                and clearly so we can investigate and respond appropriately.
              </p>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              How to report
            </h2>
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-semibold text-zinc-950">Email</p>
              <a
                href="mailto:security@renovoai.co.uk"
                className="mt-2 inline-block text-base font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4"
              >
                security@renovoai.co.uk
              </a>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                Please include enough detail for the report to be triaged without follow-up guesswork.
              </p>
              <ul className="mt-4 space-y-3">
                {reportItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                    <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Scope</h2>
            <ul className="mt-6 space-y-4">
              {scopeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              Out of scope
            </h2>
            <ul className="mt-6 space-y-4">
              {outOfScopeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              Compensation
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                Renovo may offer compensation for qualifying reports where the finding is original,
                actionable, and materially improves the security of the platform.
              </p>
              <p>
                Compensation is discretionary and based on severity, impact, report quality, and
                the clarity of the supporting evidence. Submission of a report does not create an
                automatic right to payment.
              </p>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              Disclosure guidelines
            </h2>
            <ul className="mt-6 space-y-4">
              {disclosureGuidelines.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-600">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-950" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="page-section-compact pb-0">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="app-kicker">Report a security issue</p>
              <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
                Send responsible disclosure reports to <em>security@renovoai.co.uk</em>
              </h2>
              <p className="mt-4 max-w-[640px] text-sm leading-7 text-zinc-600">
                Please include reproduction steps, affected endpoints or routes, and the security
                impact. Compensation, where offered, is discretionary and based on severity,
                impact, and report quality.
              </p>
              <div className="mt-6">
                <a
                  href="mailto:security@renovoai.co.uk"
                  className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
                >
                  Email security@renovoai.co.uk
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  )
}
