import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

type WorkflowStep = {
  step: string
  title: string
  body: string
  badge?: string
}

const workflowSteps: readonly WorkflowStep[] = [
  {
    step: '1',
    title: 'Checkout scheduled and report fetched',
    body: 'When the tenancy end date or checkout is scheduled, Renovo AI opens the case and pulls in the checkout report, photos, and supporting evidence so the team starts from one file.',
    badge: 'Automated intake',
  },
  {
    step: '2',
    title: 'AI compares and validates',
    body: 'Renovo compares check-in and checkout evidence, checks for missing support, and highlights the issues that need a manager decision.',
    badge: 'AI review',
  },
  {
    step: '3',
    title: 'Liability assessment drafted and reviewed',
    body: 'A structured liability assessment, fair wear and tear reasoning, betterment context, and landlord recommendation are prepared, then the tenant and landlord review the proposed position.',
    badge: 'AI drafting',
  },
  {
    step: '4',
    title: 'Manager negotiates if needed',
    body: 'Where there is pushback, the manager works from one documented case file rather than rebuilding reasoning from email and attachments.',
    badge: 'Human decision',
  },
  {
    step: '5',
    title: 'Deposit released',
    body: 'Once the position is agreed, the case is closed with the decision trail intact and the deposit can be released through the relevant scheme.',
  },
  {
    step: '6',
    title: 'Dispute pack generated',
    body: 'If escalated to TDS, DPS, or mydeposits, Renovo produces the evidence pack with the timeline, reasoning, references, and supporting files already assembled.',
    badge: 'One-click pack',
  },
]

const integrationItems = [
  { name: 'Reapit', type: 'Property CRM' },
  { name: 'Arthur Online', type: 'Property management' },
  { name: 'SME Professional', type: 'Property CRM' },
  { name: 'Fixflo', type: 'Repairs and maintenance' },
  { name: 'InventoryBase', type: 'Inventory software' },
  { name: 'No Letting Go', type: 'Inventory software' },
  { name: 'HelloReport', type: 'Inventory software' },
  { name: '+ More', type: 'Custom integrations available' },
] as const

const platformFeatures = [
  {
    title: 'Portfolio command view',
    body: 'Active checkouts, draft deduction letters, disputes, and evidence status in one place.',
  },
  {
    title: 'Attention queue',
    body: 'Stalled, disputed, or incomplete cases surface automatically so managers know what needs action first.',
  },
  {
    title: 'Reports and analytics',
    body: 'Track checkout volume, dispute rates, resolution times, and operator workload across the team.',
  },
  {
    title: 'Guidance hub',
    body: 'Fair wear and tear, betterment, and scheme-ready wording built into the review workflow.',
  },
] as const

const problemCards = [
  {
    number: '01',
    title: 'Checkout data disappears into inboxes',
    body: 'Reports are completed in one system, then buried in email. Teams lose a single view of the checkout, the deduction position, and what still needs action.',
  },
  {
    number: '02',
    title: 'Every deduction letter starts from scratch',
    body: 'Managers retype issue summaries, pull photos, cross-check fair wear and tear, and draft deduction letters manually for every case.',
  },
  {
    number: '03',
    title: 'Disputes are decided by pack quality',
    body: 'When a tenant escalates to TDS, DPS, or mydeposits, the outcome often depends on whether the evidence pack is complete, ordered, and defensible.',
  },
] as const

const beforeAfterItems = [
  {
    number: '01',
    title: 'Deduction letters',
    beforeTitle: '30-45 min per letter',
    beforeBody:
      'Retype summaries, pull photos from folders, check fair wear and tear guidance, and draft the deduction letter manually for each case.',
    afterTitle: 'Structured draft in under 2 minutes',
    afterBody:
      'Charges, rationale, and evidence references are assembled from the case file for manager review and approval.',
  },
  {
    number: '02',
    title: 'Evidence management',
    beforeTitle: 'Evidence across five systems',
    beforeBody:
      'Photos sit in cloud storage, reports arrive by email, notes live in spreadsheets, and the deduction letter ends up in Word.',
    afterTitle: 'One workspace with linked records',
    afterBody:
      'Timeline, evidence, issue history, and dispute preparation stay connected in one operational case file.',
  },
  {
    number: '03',
    title: 'Audit trail',
    beforeTitle: 'Reasoning rebuilt after the fact',
    beforeBody:
      'When a tenant or landlord challenges a position, teams often reconstruct the logic from memory, inboxes, and old files.',
    afterTitle: 'Every decision already documented',
    afterBody:
      'Notes, edits, approvals, and rejections are logged against the case before the position is challenged.',
  },
  {
    number: '04',
    title: 'Dispute preparation',
    beforeTitle: 'Built under scheme deadline pressure',
    beforeBody:
      'Managers scramble across tools to assemble an evidence pack, and incomplete files lose otherwise winnable deductions.',
    afterTitle: 'Dispute pack ready from day one',
    afterBody:
      'Evidence references and the decision trail are assembled during the checkout workflow, not after escalation.',
  },
  {
    number: '05',
    title: 'Team consistency',
    beforeTitle: 'Different judgement every time',
    beforeBody:
      'The same issue can be handled differently across managers, with no shared structure around betterment or proportionate charging.',
    afterTitle: 'Consistent, explainable logic',
    afterBody:
      'Renovo applies a structured recommendation process so teams stay aligned on fair wear and tear and evidence-backed decisions.',
  },
] as const

const controlPoints = [
  {
    title: 'Manager approval required',
    body: 'No liability position or claim output is progressed without explicit sign-off.',
  },
  {
    title: 'Full audit trail',
    body: 'Every edit, note, and decision stays logged against the case record.',
  },
  {
    title: 'Defensible at scheme level',
    body: 'When TDS, DPS, or mydeposits reviews the file, the reasoning and evidence are already assembled.',
  },
] as const

const controlFlow = [
  {
    tone: 'ai',
    title: 'AI drafts liability assessment and landlord recommendations',
    body: 'Deductions, reasoning, evidence references, and remedial work proposals.',
  },
  {
    tone: 'human',
    title: 'Tenant accepts or disputes liability',
    body: 'A structured response path rather than email back-and-forth.',
  },
  {
    tone: 'human',
    title: 'Landlord accepts full, partial, or skips',
    body: 'The decision is recorded directly against the case.',
  },
  {
    tone: 'human',
    title: 'Manager negotiates if needed',
    body: 'The evidence trail is already assembled before negotiation starts.',
  },
  {
    tone: 'done',
    title: 'Deposit released or dispute pack generated',
    body: 'Resolved or escalated from the same documented workflow.',
  },
] as const

const trustItems = [
  {
    title: 'GDPR compliance',
    body: 'Data hosted in London, UK',
  },
  {
    title: 'Role-based access',
    body: 'Scoped to your team',
  },
  {
    title: 'Audit trail by default',
    body: 'Changes and decisions stay traceable',
  },
  {
    title: 'VAT GB483379648',
    body: 'Company SC833544',
  },
] as const

export function PublicHome() {
  return (
    <MarketingShell currentPath="/" navAriaLabel="Homepage">
      <section className="py-14 md:py-16 xl:py-20">
        <div className="marketing-frame grid gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-center">
          <div className="max-w-[680px]">
            <p className="app-kicker">End-of-tenancy automation</p>
            <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.1rem)] leading-[1.03] tracking-[-0.04em] text-zinc-950">
              Checkouts, claims, and disputes. <em>One workflow.</em>
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-zinc-600">
              Renovo AI automates liability assessments, landlord recommendations, tenant
              negotiations, and dispute packs. Your team reviews and approves. The AI handles the
              admin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                Get started →
              </Link>
              <Link
                href="/demo"
                className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                View demo
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs text-zinc-600">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 font-medium">
                GDPR Compliance
              </span>
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1">
                Renovo AI Ltd · SC833544 · VAT GB483379648
              </span>
              <Link
                href="/compliance"
                className="underline decoration-zinc-300 underline-offset-4"
              >
                Compliance
              </Link>
              <Link
                href="/bug-bounty"
                className="underline decoration-zinc-300 underline-offset-4"
              >
                Security
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.08)]">
            <div
              className="relative w-full overflow-hidden rounded-[1.5rem]"
              style={{ aspectRatio: '1920 / 1022' }}
            >
              <iframe
                src="https://www.loom.com/embed/0f57f8bf75a248dfb7762a4556988bd2"
                title="Renovo product demo"
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="marketing-frame grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <p className="app-kicker">Regulatory change</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              The Renters&apos; Rights Act is <em>live from 1 May 2026</em>
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-zinc-600">
              <p>
                Section 21 is abolished. All ASTs become periodic tenancies. Evidence standards and
                dispute scrutiny are increasing across the sector.
              </p>
              <p>
                Agents face stricter accountability on deposit deductions, evidence collection, and
                tenant communication throughout end of tenancy.
              </p>
            </div>
            <div className="mt-6 rounded-xl border-l-[3px] border-amber-400 bg-amber-50 px-5 py-4 text-sm leading-7 text-zinc-700">
              Landlords and agents in England who fail to provide the required tenancy information
              by 31 May 2026 risk civil penalties of up to £7,000. With higher regulatory scrutiny
              across the sector, documented and defensible checkout decisions matter more than ever.
            </div>
            <div className="mt-6">
              <Link
                href="/how-it-works"
                className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
              >
                See how Renovo helps →
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'Stronger evidence requirements',
                body: 'Every deduction needs documented reasoning, timestamped evidence, and a clear audit trail.',
              },
              {
                title: 'Built-in guidance hub',
                body: 'Fair wear and tear guidance, betterment calculations, and tenancy-length-adjusted recommendations reduce avoidable errors.',
              },
              {
                title: 'Consistent, defensible output',
                body: 'Liability assessments follow a structured logic every time, regardless of who handles the case.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5"
              >
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 py-14 md:py-16">
        <div className="marketing-frame">
          <div className="mx-auto max-w-[620px] text-center">
            <p className="app-kicker">The problem</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              One checkout. <em>Six tools. Zero trail.</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              End of tenancy is still split across email, spreadsheets, inventory apps, Word,
              cloud storage, and deposit portals.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Email', 'Chasing'],
              ['Spreadsheet', 'Tracking'],
              ['Inventory app', 'Reports'],
              ['Word / Docs', 'Letters'],
              ['Cloud storage', 'Evidence'],
              ['TDS / DPS', 'Disputes'],
            ].map(([title, detail], index) => (
              <div key={`tool-${index}`} className="rounded-lg border border-zinc-200 bg-white px-4 py-5 text-center">
                <p className="text-sm font-semibold text-zinc-950">{title}</p>
                <p className="mt-1 text-xs text-zinc-500">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ['6+', 'Tools per checkout'],
              ['2-3 hrs', 'Admin per case'],
              ['0', 'Audit trail'],
            ].map(([value, label], index) => (
              <div key={`stat-${index}`} className="rounded-lg border border-zinc-200 bg-white px-5 py-5 text-center">
                <p className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</p>
                <p className="mt-1 text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {problemCards.map((item) => (
              <article key={item.number} className="rounded-xl border border-zinc-200 bg-white p-6">
                <p className="font-serif text-4xl italic text-zinc-300">{item.number}</p>
                <h3 className="mt-4 text-lg font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="marketing-frame">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="app-kicker">How it works</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              From checkout date to <em>deposit released</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              The actual Renovo workflow, shortened into the main product stages. Automated where
              possible, reviewed where it matters.
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-[780px] flex-col gap-3">
            {workflowSteps.map((item, index) => (
              <details
                key={item.step}
                className="group rounded-xl border border-zinc-200 bg-white open:border-zinc-300"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 marker:content-none">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white">
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-left text-base font-semibold leading-6 text-zinc-950">
                        {item.title}
                      </h3>
                      {item.badge ? (
                        <span className="mt-2 inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2 self-center sm:self-start">
                    <span className="hidden text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 group-open:!hidden sm:inline">
                      Expand
                    </span>
                    <span className="hidden text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 group-open:sm:inline">
                      Collapse
                    </span>
                    <span className="text-sm text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
                  </div>
                </summary>
                <div className="border-t border-zinc-200 px-5 py-4">
                  <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="marketing-frame">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="app-kicker">Integrations</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Works with your <em>existing software</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Renovo AI is designed for the systems UK letting agencies already use across property
              management, inventory, maintenance, and dispute preparation.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-[860px] gap-3 md:grid-cols-2 xl:grid-cols-4">
            {integrationItems.map((item) => (
              <article
                key={item.name}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-5 text-center"
              >
                <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.type}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t see your software? We can discuss custom integration requirements.
          </p>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50 py-14 md:py-16">
        <div className="marketing-frame">
          <div className="text-center">
            <p className="app-kicker">The platform</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Built for how agencies <em>actually work</em>
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {platformFeatures.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{feature.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/demo"
              className="app-secondary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              View demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="marketing-frame">
          <div className="mx-auto max-w-[620px] text-center">
            <p className="app-kicker">Before and after</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              What actually <em>changes</em>
            </h2>
          </div>

          <div className="mx-auto mt-10 flex max-w-[820px] flex-col gap-3">
            {beforeAfterItems.map((item, index) => (
              <details
                key={item.number}
                className="group rounded-xl border border-zinc-200 bg-white open:border-zinc-300"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 marker:content-none">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="font-serif text-3xl italic leading-none text-zinc-300">
                      {item.number}
                    </span>
                    <span className="min-w-0 text-base font-semibold leading-6 text-zinc-950">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex flex-none items-center gap-2 self-center sm:self-start">
                    <span className="hidden text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 group-open:!hidden sm:inline">
                      Expand
                    </span>
                    <span className="hidden text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 group-open:sm:inline">
                      Collapse
                    </span>
                    <span className="text-sm text-zinc-400 transition-transform group-open:rotate-180">⌄</span>
                  </div>
                </summary>
                <div className="grid gap-3 px-6 pb-6 md:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] md:items-stretch">
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">
                      Before
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-zinc-950">{item.beforeTitle}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{item.beforeBody}</p>
                  </div>
                  <div className="hidden items-center justify-center text-zinc-300 md:flex">→</div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                      After
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-zinc-950">{item.afterTitle}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600">{item.afterBody}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-14 md:py-16">
        <div className="marketing-frame grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <p className="app-kicker">Human control</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              AI drafts. Your team <em>decides.</em>
            </h2>
            <p className="mt-5 max-w-[520px] text-base leading-8 text-zinc-600">
              Every recommendation requires manager approval. Nothing is sent to a tenant or
              submitted to a deposit scheme without human sign-off.
            </p>

            <div className="mt-8 space-y-5">
              {controlPoints.map((item) => (
                <article key={item.title} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-zinc-950 text-xs font-semibold text-white">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-zinc-600">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            {controlFlow.map((item, index) => (
              <div key={item.title}>
                <div className="flex gap-3">
                  <div
                    className={[
                      'mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-md text-xs font-semibold',
                      item.tone === 'ai'
                        ? 'bg-zinc-200 text-zinc-700'
                        : item.tone === 'done'
                          ? 'bg-zinc-100 text-zinc-700'
                          : 'bg-zinc-950 text-white',
                    ].join(' ')}
                  >
                    {item.tone === 'ai' ? 'AI' : item.tone === 'done' ? 'OK' : 'PM'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-zinc-500">{item.body}</p>
                  </div>
                </div>
                {index < controlFlow.length - 1 ? (
                  <div className="ml-4 mt-3 h-4 w-px bg-zinc-200" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-12 md:py-14">
        <div className="marketing-frame">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 xl:gap-x-10">
            {trustItems.map((item) => (
              <article key={item.title} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-500">
                  •
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-950">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="get-started" className="py-14 md:py-16">
        <div className="marketing-frame">
          <div className="mx-auto max-w-[560px] text-center">
            <p className="app-kicker">Get started</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Bring your checkout workflow into <em>one defensible system</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Tell us how your team currently handles checkouts, deduction letters, and dispute
              packs. We&apos;ll get back to you about the right setup.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-6 py-3 text-sm font-medium"
            >
              Get started →
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/compliance"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-4"
            >
              Compliance
            </Link>
            <Link
              href="/privacy"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-4"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-zinc-600 underline decoration-zinc-300 underline-offset-4"
            >
              Contact Renovo AI
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Branch from £4,188/year + VAT · Regional from £9,588/year + VAT · Group annual
            pricing available on request
          </p>
        </div>
      </section>
    </MarketingShell>
  )
}
