import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

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

export const metadata: Metadata = {
  title: 'Bug Bounty | Renovo AI',
  description:
    'Responsible disclosure policy for Renovo AI, including reporting instructions, scope, disclosure expectations, and discretionary compensation guidance.',
  alternates: {
    canonical: 'https://renovoai.co.uk/bug-bounty',
  },
}

export default function BugBountyPage() {
  return (
    <MarketingShell currentPath="/bug-bounty">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            Back to Home
          </Link>
          <p className="app-kicker mt-8">Security</p>
          <h1 className="page-title">Bug Bounty</h1>
          <p className="page-copy max-w-[760px]">
            Renovo AI welcomes responsible disclosure and good-faith security research. If you
            identify a vulnerability in systems we control, we want to hear about it quickly and
            clearly so we can investigate and respond appropriately.
          </p>
        </section>

        <div className="mx-auto w-full max-w-[780px]">
          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">Overview</h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                This page explains how to report security issues affecting Renovo AI. We value
                precise, responsible reports that help us understand the issue, reproduce it, and
                assess the impact on customers, users, and the platform.
              </p>
              <p>
                We ask researchers to act lawfully, minimise impact, and avoid any activity that
                would compromise service availability, user privacy, or operational integrity.
              </p>
            </div>
          </section>

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              How to Report
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
              Out of Scope
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
              Responsible Disclosure Guidelines
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

          <section className="page-section">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] text-zinc-950">
              Our Commitment
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                We will review credible reports in a timely way, communicate with researchers in
                good faith, and work to validate, prioritise, and remediate legitimate security issues.
              </p>
              <p>
                Where a report is clear and responsibly handled, we will aim to acknowledge receipt,
                keep the reporter updated where practical, and recognise the value of good-faith research.
              </p>
            </div>
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
