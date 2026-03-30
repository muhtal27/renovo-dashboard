import {
  MarketingButton,
  MarketingCard,
  MarketingFinalCta,
  MarketingIntro,
  MarketingRuleList,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'

const steps = [
  {
    number: '01',
    label: 'Automated intake',
    heading: 'Case opened, checkout report ingested',
    body: 'When a checkout is booked, Renovo opens a case file and pulls in the checkout report, schedule of condition, move-out photographs, and supporting documents. One record from the start.',
  },
  {
    number: '02',
    label: 'AI comparison',
    heading: 'Check-in inventory vs checkout report',
    body: 'Both reports are compared room by room. Condition changes are flagged against the original schedule of condition. Missing evidence is highlighted before a deduction position is drafted.',
  },
  {
    number: '03',
    label: 'AI draft',
    heading: 'Liability assessment with proportionate reasoning',
    body: 'A structured assessment covering fair wear and tear, betterment, tenancy length, evidence references, and a recommended deduction position per item, all tied back to the source documents.',
  },
  {
    number: '04',
    label: 'Manager review',
    heading: 'Reviewed, amended, and approved',
    body: 'The property manager reads the draft, adjusts positions, adds case notes, and approves or rejects. Every edit is logged with a name and timestamp.',
  },
  {
    number: '05',
    label: 'Resolution',
    heading: 'Deposit released through the scheme',
    body: 'Once the position is agreed by all parties, the case closes with a full decision trail. Deposit released via TDS, DPS, mydeposits, or SafeDeposits Scotland.',
  },
  {
    number: '06',
    label: 'If disputed',
    heading: 'Adjudication-ready evidence pack',
    body: 'If the tenant refers the dispute, Renovo generates the evidence bundle with timeline, liability assessment, photographs, and supporting references already assembled.',
  },
] as const

const controls = [
  {
    heading: 'Human approval at every stage',
    body: 'Renovo drafts the liability assessment and deduction position. Your team decides what is sent, changed, or rejected. The AI never acts without sign-off.',
  },
  {
    heading: 'Case-level audit trail',
    body: 'Notes, edits, evidence references, approvals, and rejections stay attached to the case file. The trail is immutable and supports scheme-level scrutiny.',
  },
  {
    heading: 'Operational consistency',
    body: 'Fair wear and tear guidance, betterment calculations, evidence referencing, and scheme-ready wording are handled through one structured process across all managers.',
  },
] as const

const integrations = [
  {
    heading: 'Inventory and inspection systems',
    body: 'Bring check-in inventories and checkout reports, photographs, and supporting evidence into one review workflow.',
  },
  {
    heading: 'Property management software',
    body: 'Keep tenancy operations, checkout scheduling, and case preparation connected to the CRM record.',
  },
  {
    heading: 'Claim and dispute preparation',
    body: 'Move from liability assessment to adjudication-ready evidence pack without rebuilding the file for the deposit scheme.',
  },
] as const

export default function HowItWorksClient() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          eyebrow="How it works"
          title={
            <>
              From checkout report to <em>deposit decision</em>
            </>
          }
          description="Renovo fits around the way letting agencies already manage end of tenancy. Reports, deduction letters, landlord recommendations, evidence packs, and scheme escalation stay connected to the same case."
          actions={
            <>
              <MarketingButton href="/contact">Talk to us</MarketingButton>
              <MarketingButton href="/demo" variant="secondary">
                View demo
              </MarketingButton>
            </>
          }
        />
      </MarketingSection>

      <MarketingSection variant="tint">
        <MarketingIntro
          eyebrow="Product flow"
          title={
            <>
              Six steps from checkout to <em>deposit release</em>
            </>
          }
          description="Start with the case file, move through evidence review and liability assessment, then close through agreement or scheme escalation."
        />

        <MarketingRuleList className="mt-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="grid gap-4 py-6 md:grid-cols-[64px_150px_minmax(0,1fr)] md:gap-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--accent-emerald-soft)] text-sm font-semibold text-[var(--accent-emerald-strong)]">
                {step.number}
              </div>
              <p className="pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-emerald-strong)]">
                {step.label}
              </p>
              <div>
                <h3 className="text-lg leading-7 text-[var(--text-strong)]">{step.heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">{step.body}</p>
              </div>
            </div>
          ))}
        </MarketingRuleList>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="Decision control"
          title={
            <>
              Renovo drafts. <em>Your team decides.</em>
            </>
          }
          description="Renovo does not remove manager judgement. It structures the evidence, drafts the assessment, and keeps the audit trail readable."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {controls.map((item) => (
            <MarketingCard key={item.heading} className="h-full">
              <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <MarketingIntro
            eyebrow="System handoff"
            title={
              <>
                Built around <em>existing workflows</em>
              </>
            }
            description="Renovo is designed to sit between evidence intake, manager review, and deposit release rather than force teams into another disconnected tool."
          />

          <div className="grid gap-5">
            {integrations.map((item) => (
              <MarketingCard key={item.heading} className="rounded-[1.5rem]">
                <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
              </MarketingCard>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingFinalCta
        eyebrow="Read-only preview"
        title={
          <>
            See the workflow in the <em>read-only demo</em>
          </>
        }
        description="Review how a checkout becomes a liability assessment, deduction letter, and adjudication-ready evidence pack."
        primaryHref="/demo"
        primaryLabel="View demo"
        secondaryHref="/contact"
        secondaryLabel="Talk to us"
      />
    </MarketingShell>
  )
}
