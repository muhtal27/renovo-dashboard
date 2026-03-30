'use client'

import Image from 'next/image'
import {
  MarketingButton,
  MarketingCard,
  MarketingChecklist,
  MarketingFinalCta,
  MarketingIntro,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'

const problemPoints = [
  {
    number: '01',
    heading: 'No single case record',
    body: 'The checkout report sits in one system, move-out photos in another, and the schedule of condition buried in an inbox. No single source of truth.',
  },
  {
    number: '02',
    heading: 'Deduction letters written from scratch',
    body: 'Every case means reopening the inventory, pulling photos from folders, checking fair wear and tear, and manually drafting a letter.',
  },
  {
    number: '03',
    heading: 'Dispute outcomes depend on the file',
    body: 'When a tenant refers the case to TDS, DPS, mydeposits, or SafeDeposits Scotland, the adjudicator decides based on the evidence pack.',
  },
] as const

const workflowSteps = [
  {
    number: '1',
    label: 'Automated intake',
    heading: 'Case opened, checkout report ingested',
    body: 'When a checkout is booked, Renovo opens a case file and pulls in the checkout report, move-out photographs, and supporting documents.',
  },
  {
    number: '2',
    label: 'AI comparison',
    heading: 'Check-in inventory vs checkout report',
    body: 'Both reports are compared room by room, condition changes are flagged, and missing evidence is highlighted before a deduction position is drafted.',
  },
  {
    number: '3',
    label: 'AI draft',
    heading: 'Liability assessment with reasoning',
    body: 'Fair wear and tear reasoning, betterment context, evidence references, and a proportionate deduction recommendation are prepared per item.',
  },
  {
    number: '4',
    label: 'Manager review',
    heading: 'Reviewed, amended, and approved',
    body: 'The property manager reads the draft, adjusts positions, adds notes, and approves. Every edit is logged with a name and timestamp.',
  },
  {
    number: '5',
    label: 'Resolution',
    heading: 'Deposit released through the scheme',
    body: 'Case closed with a full decision trail. Deposit released via TDS, DPS, mydeposits, or SafeDeposits Scotland.',
  },
  {
    number: '6',
    label: 'If disputed',
    heading: 'Adjudication-ready evidence pack',
    body: 'Evidence bundle with timeline, reasoning, photographs, and supporting references assembled during the workflow, not after escalation.',
  },
] as const

const improvementRows = [
  {
    label: 'Deduction letters',
    before: '30-45 min each, retyped from the inventory every time',
    after: 'Structured draft with evidence references in under 2 minutes',
  },
  {
    label: 'Evidence trail',
    before: 'Photos, reports, and notes scattered across five systems',
    after: 'Linked case record from checkout through to deposit release',
  },
  {
    label: 'Audit',
    before: 'Reasoning rebuilt from memory when challenged',
    after: 'Every decision documented before the position is disputed',
  },
  {
    label: 'Dispute packs',
    before: 'Assembled under scheme deadline pressure',
    after: 'Adjudication-ready pack built during the checkout workflow',
  },
  {
    label: 'Consistency',
    before: 'Different property manager, different judgement',
    after: 'Structured logic and proportionate reasoning on every case',
  },
] as const

const controlPoints = [
  {
    heading: 'Manager sign-off required',
    body: 'No claim output leaves the platform without explicit approval from a named property manager.',
  },
  {
    heading: 'Immutable audit trail',
    body: 'Every edit, note, approval, and rejection is logged with a timestamp. The trail cannot be altered after the fact.',
  },
  {
    heading: 'Scheme-ready output',
    body: 'When an adjudicator at TDS, DPS, or mydeposits opens the file, the reasoning and evidence are already there.',
  },
] as const

const platformPoints = [
  {
    heading: 'Portfolio command view',
    body: 'Live status across active checkouts, pending deduction letters, open disputes, and evidence gaps.',
  },
  {
    heading: 'Attention queue',
    body: 'Stalled cases, overdue responses, and incomplete evidence flagged automatically.',
  },
  {
    heading: 'Operational reporting',
    body: 'Checkout volumes, average resolution times, dispute referral rates, and team workload.',
  },
  {
    heading: 'Guidance hub',
    body: 'Fair wear and tear tables, betterment calculations, and scheme-ready wording inside the workflow.',
  },
] as const

const integrationNames = [
  'Reapit',
  'Arthur Online',
  'SME Professional',
  'Fixflo',
  'InventoryBase',
  'No Letting Go',
  'HelloReport',
] as const

export default function HomePageClient() {
  return (
    <MarketingShell currentPath="/">
      <MarketingSection variant="dark" bleed className="overflow-hidden pb-20 pt-0">
        <div className="marketing-hero-glow pointer-events-none absolute right-[-8rem] top-[-18rem] h-[44rem] w-[44rem]" />
        <div className="marketing-frame relative grid gap-12 pt-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14 lg:pt-24">
          <div>
            <MarketingIntro
              titleAs="h1"
              eyebrow={
                <>
                  <span className="renovo-pulse inline-block h-2 w-2 rounded-full bg-[var(--accent-emerald)]" />
                  End-of-tenancy automation
                </>
              }
              title={
                <>
                  Checkout reports in.
                  <br />
                  <span className="text-[var(--accent-emerald)]">Deposit decisions out.</span>
                </>
              }
              description="AI-powered liability comparison, deduction drafting, evidence management, and dispute pack preparation, with manager approval at every stage."
              titleClassName="max-w-[12ch] text-white"
              descriptionClassName="max-w-[34rem] text-white/72"
              actions={
                <>
                  <MarketingButton href="/contact" variant="inverse" size="lg">
                    Talk to us
                  </MarketingButton>
                  <MarketingButton href="/demo" variant="ghost" size="lg">
                    View demo
                  </MarketingButton>
                </>
              }
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {([
                ['6+', 'Tools per checkout'],
                ['2-3h', 'Admin per case'],
                ['0', 'Audit trail'],
              ] as const).map(([value, label]) => (
                <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/58">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(38,179,131,0.18),transparent_72%)] blur-2xl" />
            <MarketingCard
              tone="dark"
              className="relative overflow-hidden rounded-[2rem] border-white/10 bg-[rgba(16,24,39,0.9)] p-3 md:p-4"
            >
              <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#0b1220]">
                <Image
                  src="/dashboard-preview.png"
                  alt="Renovo AI checkout case workspace"
                  width={1920}
                  height={1080}
                  priority
                  className="block h-auto w-full"
                />
              </div>
              <div className="grid gap-3 border-t border-white/8 px-2 pb-2 pt-5 sm:grid-cols-3">
                {[
                  'Room-by-room evidence review',
                  'Drafted liability recommendation',
                  'Manager approval before release',
                ].map((item) => (
                  <p key={item} className="text-sm leading-6 text-white/64">
                    {item}
                  </p>
                ))}
              </div>
            </MarketingCard>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="The problem"
          title={
            <>
              One checkout. <em>Six tools. No audit trail.</em>
            </>
          }
          description="Letting agents still manage end-of-tenancy across email threads, inventory apps, shared drives, Word documents, spreadsheets, and deposit portals."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {problemPoints.map((item) => (
            <MarketingCard key={item.number} className="h-full">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-emerald-strong)]">
                {item.number}
              </p>
              <h3 className="mt-4 text-xl leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <MarketingIntro
          eyebrow="How it works"
          title={
            <>
              Checkout scheduled to <em>deposit released</em>
            </>
          }
          description="The Renovo workflow. Automated where the task is repeatable. Manager-reviewed where judgement matters."
          actions={
            <MarketingButton href="/how-it-works" variant="secondary">
              Full workflow walkthrough
            </MarketingButton>
          }
        />

        <div className="marketing-rule-list mt-12">
          {workflowSteps.map((step) => (
            <div
              key={step.number}
              className="grid gap-4 px-1 py-6 md:grid-cols-[56px_140px_minmax(0,1fr)]"
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
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="Before and after"
          title={
            <>
              What changes on <em>day one</em>
            </>
          }
        />

        <div className="marketing-rule-list mt-12">
          {improvementRows.map((row) => (
            <div
              key={row.label}
              className="grid gap-3 py-5 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)] md:gap-6"
            >
              <p className="text-sm font-semibold text-[var(--text-strong)]">{row.label}</p>
              <p className="text-sm leading-7 text-[var(--text-muted)] line-through decoration-[rgba(24,24,27,0.18)]">
                {row.before}
              </p>
              <p className="border-l-2 border-[var(--accent-emerald)] pl-4 text-sm leading-7 text-[var(--text-strong)]">
                {row.after}
              </p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <MarketingIntro
              eyebrow="Human control"
              title={
                <>
                  AI drafts. Your team <em>decides.</em>
                </>
              }
              description="Every liability assessment, deduction letter, and landlord recommendation requires manager approval. Nothing is sent without sign-off."
            />
            <div className="mt-10 grid gap-4">
              {controlPoints.map((item) => (
                <MarketingCard key={item.heading} className="rounded-[1.35rem]">
                  <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
                </MarketingCard>
              ))}
            </div>
          </div>

          <MarketingCard tone="dark" className="rounded-[2rem]">
            <p className="marketing-eyebrow text-white/72">Decision flow</p>
            <div className="mt-6 space-y-3">
              {[
                ['AI', 'Drafts liability assessment and landlord recommendation'],
                ['PM', 'Reviews the proposed deduction position'],
                ['PM', 'Approves full claim, partial settlement, or waiver'],
                ['PM', 'Negotiates from the documented case file'],
                ['OK', 'Deposit released or dispute evidence pack generated'],
              ].map(([tag, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3"
                >
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[rgba(38,179,131,0.15)] px-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-emerald)]">
                    {tag}
                  </span>
                  <p className="text-sm leading-6 text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingSection>
        <MarketingIntro
          eyebrow="Regulatory change"
          title={
            <>
              Renters&apos; Rights Act <em>live from 1 May 2026</em>
            </>
          }
          description="Evidence standards are rising. Agents need a cleaner, more reviewable route from checkout evidence to a defensible decision."
        />

        <div className="renovo-highlight mt-10 rounded-[1.75rem] px-6 py-6 md:px-8">
          <p className="text-[0.96rem] leading-8 text-[var(--text-body)]">
            Section 21 is abolished. All assured shorthold tenancies become periodic. Prescribed
            information obligations are tightening. Agents in England who fail to comply risk{' '}
            <strong className="font-semibold text-[var(--text-strong)]">
              civil penalties up to GBP 7,000
            </strong>
            . Evidence standards for deposit deductions are rising across all four schemes.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              heading: 'Higher evidence thresholds',
              body: 'Every proposed deduction must be backed by documented reasoning, timestamped evidence, and a clear audit trail.',
            },
            {
              heading: 'Fair wear and tear built in',
              body: 'Guidance on fair wear and tear, betterment, and tenancy-length-adjusted charges embedded in the review workflow.',
            },
            {
              heading: 'Repeatable, defensible output',
              body: 'Structured assessment logic applied to every case, regardless of which property manager handles it.',
            },
          ].map((item) => (
            <MarketingCard key={item.heading} className="h-full">
              <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <MarketingIntro
          eyebrow="The platform"
          title={
            <>
              Built for how letting agencies <em>actually operate</em>
            </>
          }
          description="Live portfolio visibility, attention management, reporting, and embedded guidance in the same product surface."
          actions={
            <MarketingButton href="/demo" variant="secondary">
              View demo
            </MarketingButton>
          }
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {platformPoints.map((item) => (
            <MarketingCard key={item.heading} className="h-full">
              <h3 className="text-lg leading-7 text-[var(--text-strong)]">{item.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
            </MarketingCard>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <MarketingIntro
            eyebrow="Integrations"
            title={
              <>
                Connects to your <em>existing agency software</em>
              </>
            }
            description="Designed around the CRM, inventory, and maintenance systems UK letting agents already use."
          />

          <MarketingCard className="rounded-[1.75rem]">
            <MarketingChecklist
              items={[
                ...integrationNames,
                'Custom integrations for larger agencies and enterprise rollouts',
              ]}
              className="grid gap-3 sm:grid-cols-2"
              itemClassName="rounded-[1rem] border border-black/6 bg-[var(--surface-subtle)] px-4 py-3"
              iconClassName="bg-transparent text-[var(--accent-emerald-strong)]"
            />
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingFinalCta
        eyebrow="Next step"
        title={
          <>
            See it with a <em>real case</em>
          </>
        }
        description="Tell us how your team handles checkouts, deduction letters, and disputes today. We'll show you how Renovo fits your operation."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="/demo"
        secondaryLabel="View demo"
      />
    </MarketingShell>
  )
}
