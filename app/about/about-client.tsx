import {
  MarketingCard,
  MarketingFinalCta,
  MarketingIntro,
  MarketingRuleList,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'

const companyFacts = [
  { label: 'Company', value: 'Renovo AI Ltd' },
  { label: 'Registered', value: 'Edinburgh, Scotland' },
  { label: 'Company number', value: 'SC833544' },
  { label: 'VAT', value: 'GB483379648' },
] as const

const workflowFocus = [
  {
    label: 'Liability comparison',
    detail:
      'AI compares check-in and checkout evidence room by room, flags discrepancies, and prepares a structured assessment against the schedule of condition.',
  },
  {
    label: 'Deduction drafting',
    detail:
      'Fair wear and tear reasoning, betterment context, evidence references, and recommended deduction positions drafted automatically for manager review.',
  },
  {
    label: 'Evidence assembly',
    detail:
      'Photos, reports, notes, and timeline linked to a single case record throughout the checkout lifecycle.',
  },
  {
    label: 'Dispute preparation',
    detail:
      'If a tenant escalates to TDS, DPS, mydeposits, or SafeDeposits Scotland, the adjudication-ready evidence pack is already assembled.',
  },
  {
    label: 'Human approval',
    detail:
      'Every recommendation requires manager sign-off. Nothing is sent without explicit approval from a named property manager.',
  },
] as const

const principles = [
  {
    heading: 'AI assists, humans decide',
    body: 'Renovo drafts. Property managers approve, amend, or reject.',
  },
  {
    heading: 'Built for operational use',
    body: 'Shaped around live portfolio pressure, not theoretical workflows.',
  },
  {
    heading: 'Defensible output matters',
    body: 'Evidence, proportionality, and a reviewable trail at every step.',
  },
] as const

export default function AboutClient() {
  return (
    <MarketingShell currentPath="/about">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          eyebrow="About"
          title={
            <>
              Enterprise software for <em>end-of-tenancy operations</em>
            </>
          }
          description="Renovo AI automates the operational layer between checkout evidence and documented deposit decisions for UK letting agencies."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="space-y-5 text-[1.02rem] leading-8 text-[var(--text-body)]">
            <p>
              Renovo AI was founded by a practising end-of-tenancy property manager who saw the
              same problem across every agency: checkout evidence scattered across six tools,
              deduction reasoning rebuilt from memory, and dispute outcomes decided by whether the
              file was complete when it reached the deposit scheme.
            </p>
            <p>
              The company is focused on one workflow category, turning checkout evidence into
              reviewable, defensible deposit decisions, with human approval at every stage.
            </p>
          </div>

          <MarketingCard className="rounded-[1.75rem]">
            <div className="grid gap-5 sm:grid-cols-2">
              {companyFacts.map((item) => (
                <div key={item.label}>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-strong)]">{item.value}</p>
                </div>
              ))}
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <MarketingIntro
          eyebrow="Product focus"
          title={
            <>
              One workflow. <em>Done properly.</em>
            </>
          }
          description="Renovo is deliberately narrow: a serious operational product for the handoff between checkout evidence, deduction reasoning, and dispute readiness."
        />

        <MarketingRuleList className="mt-12">
          {workflowFocus.map((item) => (
            <div
              key={item.label}
              className="grid gap-3 py-5 md:grid-cols-[190px_minmax(0,1fr)] md:gap-6"
            >
              <p className="text-sm font-semibold text-[var(--text-strong)]">{item.label}</p>
              <p className="text-sm leading-7 text-[var(--text-body)]">{item.detail}</p>
            </div>
          ))}
        </MarketingRuleList>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="Principles"
          title={
            <>
              How we <em>operate</em>
            </>
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {principles.map((item) => (
            <MarketingCard key={item.heading} className="h-full">
              <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingFinalCta
        eyebrow="Next step"
        title={
          <>
            Review the product and discuss your <em>checkout operation</em>
          </>
        }
        description="Start with the demo, then speak to us about how Renovo fits your agency."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="/demo"
        secondaryLabel="View demo"
      />
    </MarketingShell>
  )
}
