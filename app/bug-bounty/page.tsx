import { MarketingButton, MarketingCard, MarketingIntro, MarketingSection } from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

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
  title: 'Bug Bounty | Renovo AI',
  description:
    'Responsible disclosure policy for Renovo AI, including reporting instructions, scope, disclosure expectations, and discretionary compensation guidance.',
  path: '/bug-bounty',
})

function BulletList({
  items,
  muted = false,
}: {
  items: readonly string[]
  muted?: boolean
}) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-7 text-[var(--text-body)]">
          <span
            className={`mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full ${muted ? 'bg-zinc-300' : 'bg-[var(--text-strong)]'}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function BugBountyPage() {
  return (
    <MarketingShell currentPath="/bug-bounty">
      <MarketingSection>
        <MarketingButton href="/" variant="secondary" size="sm">
          Back to Home
        </MarketingButton>
        <MarketingIntro
          titleAs="h1"
          eyebrow="Security"
          title="Bug Bounty"
          description="Renovo AI welcomes responsible disclosure and good-faith security research. If you identify a vulnerability in systems we control, we want to hear about it quickly and clearly so we can investigate and respond appropriately."
          className="mt-8"
        />
      </MarketingSection>

      <MarketingSection>
        <div className="mx-auto w-full max-w-[780px] space-y-12">
          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Overview
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-[var(--text-body)]">
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

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              How to Report
            </h2>
            <MarketingCard className="mt-6 rounded-[1.75rem]">
              <p className="text-sm font-semibold text-[var(--text-strong)]">Email</p>
              <a
                href="mailto:security@renovoai.co.uk"
                className="mt-2 inline-block text-base font-medium text-[var(--text-strong)] underline decoration-zinc-300 underline-offset-4"
              >
                security@renovoai.co.uk
              </a>
              <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                Please include enough detail for the report to be triaged without follow-up guesswork.
              </p>
              <BulletList items={reportItems} />
            </MarketingCard>
          </section>

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Scope
            </h2>
            <BulletList items={scopeItems} />
          </section>

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Out of Scope
            </h2>
            <BulletList items={outOfScopeItems} muted />
          </section>

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Compensation
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-[var(--text-body)]">
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

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Responsible Disclosure Guidelines
            </h2>
            <BulletList items={disclosureGuidelines} />
          </section>

          <section>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Our Commitment
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-[var(--text-body)]">
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

          <MarketingCard className="rounded-[1.75rem]">
            <p className="marketing-eyebrow">Report a security issue</p>
            <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] leading-[1.12] tracking-[-0.04em] text-[var(--text-strong)]">
              Send responsible disclosure reports to <em>security@renovoai.co.uk</em>
            </h2>
            <p className="mt-4 max-w-[40rem] text-sm leading-7 text-[var(--text-body)]">
              Please include reproduction steps, affected endpoints or routes, and the security
              impact. Compensation, where offered, is discretionary and based on severity, impact,
              and report quality.
            </p>
            <div className="mt-6">
              <MarketingButton href="mailto:security@renovoai.co.uk">
                Email security@renovoai.co.uk
              </MarketingButton>
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>
    </MarketingShell>
  )
}
