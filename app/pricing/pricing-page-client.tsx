import {
  MarketingButton,
  MarketingCard,
  MarketingChecklist,
  MarketingFinalCta,
  MarketingIntro,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'

const payg = [
  'Active case workspace',
  'Evidence upload and management',
  'AI-drafted liability assessments',
  'Manager approval workflow',
  'Audit trail and claim output',
  'Priority case tagging',
  'Fair wear and tear guidance hub',
  'Custom claim templates',
  'Dispute pack generation',
  'Multi-user access',
  'Branch-level reporting',
  'Email and chat support',
] as const

const enterprise = [
  'Unlimited users across branches',
  'Unlimited portfolio capacity',
  'Custom audit trail retention',
  'Dedicated account manager',
  'Priority phone support',
  'SLA and compliance review',
  'Multi-branch rollout support',
  'Bespoke onboarding programme',
  'API access for internal tooling',
  'Custom CRM and inventory integrations',
] as const

const addons = [
  {
    heading: 'SSO (Single Sign-On)',
    body: 'Sign in via your existing identity provider. Supports Microsoft Entra ID and SAML-based providers.',
  },
  {
    heading: 'On-site technical support',
    body: 'Hands-on assistance during rollout. Staff training, workflow configuration, and live troubleshooting.',
  },
  {
    heading: 'Custom integrations',
    body: 'Connect Renovo AI to CRM, inventory software, or internal systems beyond standard integrations.',
  },
  {
    heading: 'Extended audit retention',
    body: 'Retain case records and evidence trails beyond the standard period. Configurable to compliance needs.',
  },
  {
    heading: 'Dedicated onboarding',
    body: 'Structured implementation programme with workspace setup, data migration, and team walkthroughs.',
  },
  {
    heading: 'Analytics and reporting',
    body: 'Checkout volume, dispute rates, resolution times, and operator workload across your portfolio.',
  },
] as const

const compare: ({ section: string } | { feature: string; payg: string; enterprise: string })[] = [
  { section: 'Core platform' },
  { feature: 'Active case workspace', payg: 'Included', enterprise: 'Included' },
  { feature: 'Evidence upload and management', payg: 'Included', enterprise: 'Included' },
  { feature: 'AI-drafted liability assessments', payg: 'Included', enterprise: 'Included' },
  { feature: 'Manager approval workflow', payg: 'Included', enterprise: 'Included' },
  { feature: 'Audit trail and claim output', payg: 'Included', enterprise: 'Included' },
  { feature: 'Fair wear and tear guidance hub', payg: 'Included', enterprise: 'Included' },
  { feature: 'Dispute pack generation', payg: 'Included', enterprise: 'Included' },
  { section: 'Scale and access' },
  { feature: 'Portfolio capacity', payg: 'Usage-based', enterprise: 'Unlimited' },
  { feature: 'Team users', payg: 'Multi-user', enterprise: 'Unlimited' },
  { feature: 'Audit trail retention', payg: 'Standard', enterprise: 'Custom' },
  { feature: 'API access', payg: 'Not included', enterprise: 'Included' },
  { section: 'Support' },
  { feature: 'Email and chat support', payg: 'Included', enterprise: 'Included' },
  { feature: 'Dedicated account manager', payg: 'Not included', enterprise: 'Included' },
  { feature: 'Priority phone support', payg: 'Not included', enterprise: 'Included' },
  { feature: 'Bespoke onboarding', payg: 'Not included', enterprise: 'Included' },
  { feature: 'SLA and compliance review', payg: 'Not included', enterprise: 'Included' },
  { section: 'Integrations' },
  { feature: 'Standard integrations', payg: 'Included', enterprise: 'Included' },
  { feature: 'Custom integrations', payg: 'Not included', enterprise: 'Included' },
  { feature: 'SSO (Single Sign-On)', payg: 'Add-on', enterprise: 'Add-on' },
] as const

export const pricingFaqs = [
  {
    question: 'How does Pay As You Go billing work?',
    answer:
      'You are billed per completed checkout. There is no monthly subscription, no minimum spend, and no contract. Use Renovo AI when you need it and only pay for what you process.',
  },
  {
    question: 'What counts as a completed checkout?',
    answer:
      'A completed checkout is one case processed through the Renovo AI workflow, from report intake through to deposit release or dispute pack generation. Drafts and incomplete cases are not billed.',
  },
  {
    question: 'Can I move from Pay As You Go to Enterprise?',
    answer:
      'Yes. You can upgrade at any time. Your existing case history and evidence trails carry over. We will work with you on the transition and onboarding.',
  },
  {
    question: 'Is VAT included?',
    answer:
      'No. All pricing is exclusive of VAT. UK VAT at the applicable rate, currently 20%, is added to invoices.',
  },
  {
    question: 'Where is data hosted?',
    answer:
      'All data is hosted in London, UK. Renovo AI complies with UK GDPR requirements. Role-based access and a full audit trail are enabled by default.',
  },
  {
    question: 'What integrations are supported?',
    answer:
      'Standard integrations include Reapit, Arthur Online, SME Professional, Fixflo, InventoryBase, No Letting Go, and HelloReport. Enterprise customers can request custom integrations.',
  },
] as const

function formatCompareValue(value: string) {
  if (value === 'Included') {
    return <span className="font-semibold text-[var(--accent-emerald-strong)]">Included</span>
  }

  if (value === 'Not included') {
    return <span className="text-[var(--text-soft)]">Not included</span>
  }

  return <span className="text-[var(--text-body)]">{value}</span>
}

export default function PricingPageClient() {
  return (
    <MarketingShell currentPath="/pricing">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          align="center"
          eyebrow="Pricing"
          title={
            <>
              Pay per checkout, or <em>roll out across the portfolio.</em>
            </>
          }
          description="The pricing model stays simple: Pay As You Go for live case volume, or Enterprise for larger agencies that need a dedicated rollout."
        />

        <div className="mt-14 grid gap-5 xl:grid-cols-2">
          <MarketingCard className="rounded-[2rem] border-[rgba(23,143,105,0.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="marketing-eyebrow">Pay As You Go</p>
                <h2 className="mt-4 text-3xl tracking-[-0.05em] text-[var(--text-strong)]">
                  Flexible usage for live checkouts
                </h2>
              </div>
              <div className="rounded-[1.1rem] bg-[var(--accent-emerald-soft)] px-4 py-3 text-right">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-emerald-strong)]">
                  Setup
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-strong)]">GBP 500 + VAT</p>
              </div>
            </div>

            <p className="mt-5 max-w-[38rem] text-base leading-8 text-[var(--text-body)]">
              Full platform access with usage-based billing. No contracts, no minimum commitment.
            </p>

            <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-black/6 bg-[var(--surface-subtle)] p-5 md:grid-cols-2">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  One-off setup
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">
                  Workspace configuration, onboarding, and operational setup for your team.
                </p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  Ongoing billing
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">
                  Billed per completed checkout. Drafts and incomplete cases are not charged.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <MarketingChecklist items={payg} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MarketingButton href="/contact" size="lg">
                Talk to us
              </MarketingButton>
              <p className="text-sm text-[var(--text-muted)]">Billed per completed checkout.</p>
            </div>
          </MarketingCard>

          <MarketingCard tone="muted" className="rounded-[2rem]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="marketing-eyebrow">Enterprise</p>
                <h2 className="mt-4 text-3xl tracking-[-0.05em] text-[var(--text-strong)]">
                  Dedicated rollout for scale
                </h2>
              </div>
              <div className="rounded-[1.1rem] border border-black/6 bg-white px-4 py-3 text-right">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  Commercial model
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--text-strong)]">
                  Annual agreement
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-[38rem] text-base leading-8 text-[var(--text-body)]">
              For multi-branch agencies and portfolios above 5,000 tenancies. Dedicated onboarding,
              custom integrations, and SLA-backed support.
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-black/6 bg-white/80 p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Everything in Pay As You Go, plus
              </p>
              <div className="mt-4">
                <MarketingChecklist items={enterprise} />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MarketingButton href="/contact" size="lg">
                Talk to us
              </MarketingButton>
              <p className="text-sm text-[var(--text-muted)]">
                Priced around your portfolio and rollout needs.
              </p>
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <MarketingIntro
          eyebrow="Add-ons"
          title={
            <>
              Optional add-ons for <em>rollout, security, and reporting.</em>
            </>
          }
          description="Available on any plan. Add what your team needs without changing the core pricing model."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {addons.map((item) => (
            <MarketingCard key={item.heading} className="h-full">
              <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="Compare"
          title={
            <>
              Compare plans <em>without the clutter.</em>
            </>
          }
          description="The same workflow foundation sits underneath both plans. The difference is commercial model, rollout support, and scale."
        />

        <div className="mt-10 grid gap-4 md:hidden">
          {(['Pay As You Go', 'Enterprise'] as const).map((plan) => (
            <MarketingCard key={plan} className="rounded-[1.5rem]">
              <p className="text-sm font-semibold text-[var(--text-strong)]">{plan}</p>
              <div className="mt-4 space-y-4">
                {compare.map((row, index) =>
                  'section' in row ? (
                    <p
                      key={`${plan}-${index}`}
                      className="pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"
                    >
                      {row.section}
                    </p>
                  ) : (
                    <div
                      key={`${plan}-${row.feature}`}
                      className="flex items-start justify-between gap-4 border-t border-black/6 pt-4"
                    >
                      <span className="text-sm text-[var(--text-body)]">{row.feature}</span>
                      <span className="shrink-0 text-right text-sm">
                        {formatCompareValue(plan === 'Pay As You Go' ? row.payg : row.enterprise)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </MarketingCard>
          ))}
        </div>

        <div className="mt-10 hidden overflow-hidden rounded-[1.75rem] border border-black/8 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white text-sm">
              <thead className="bg-[var(--surface-subtle)]">
                <tr>
                  <th className="w-[44%] px-6 py-4 text-left text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    Pay As You Go
                  </th>
                  <th className="px-6 py-4 text-center text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {compare.map((row, index) =>
                  'section' in row ? (
                    <tr key={index} className="bg-[rgba(238,245,241,0.6)]">
                      <td
                        colSpan={3}
                        className="px-6 pb-3 pt-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"
                      >
                        {row.section}
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.feature} className="border-t border-black/6">
                      <td className="px-6 py-4 text-[var(--text-body)]">{row.feature}</td>
                      <td className="px-6 py-4 text-center">{formatCompareValue(row.payg)}</td>
                      <td className="px-6 py-4 text-center">
                        {formatCompareValue(row.enterprise)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <MarketingIntro
            eyebrow="FAQ"
            title={
              <>
                Common questions, <em>kept readable.</em>
              </>
            }
            description="The pricing logic is straightforward, but these are the points teams usually ask us to clarify before rollout."
          />

          <div className="space-y-4">
            {pricingFaqs.map((faq) => (
              <MarketingCard key={faq.question} className="rounded-[1.5rem]">
                <details className="group relative">
                  <summary className="cursor-pointer list-none pr-9 text-base font-semibold leading-7 text-[var(--text-strong)] [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="absolute right-0 top-0 text-xl leading-none text-[var(--text-soft)] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">{faq.answer}</p>
                </details>
              </MarketingCard>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingFinalCta
        eyebrow="Next step"
        title={
          <>
            Ready to simplify your <em>checkout workflow?</em>
          </>
        }
        description="Tell us about your team and portfolio. We'll help you work out whether Pay As You Go or Enterprise is the right fit."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="/demo"
        secondaryLabel="View demo"
      />
    </MarketingShell>
  )
}
