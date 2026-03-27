import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicWaitlistForm } from '@/app/public-waitlist-form'

const problemCards = [
  {
    title: 'Checkout data goes into a black hole',
    body: 'Agents complete checkouts in one app, but findings end up buried in email attachments. Nobody has a single view of what was reported, what needs actioning, and what is done.',
    quote: 'I spend half my morning just finding the right checkout report in my inbox.',
  },
  {
    title: 'Deduction letters are written from scratch every time',
    body: 'Managers re-type issue summaries, pull photos from folders, look up fair wear and tear guidance, and draft letters in Word for every single case.',
    quote: 'Each letter takes 30-45 minutes. Multiply that by 20 checkouts a month.',
  },
  {
    title: 'Disputes are lost before they start',
    body: 'When tenants escalate, managers scramble to assemble evidence from five different places. By the time it reaches a scheme, it is incomplete and unstructured.',
    quote: 'We had the evidence, just not in one place when it mattered.',
  },
] as const

const workflowSteps = [
  {
    step: '01',
    title: 'Schedule the checkout',
    body: 'Assign an agent, set the date, and link the tenancy. Everyone gets notified automatically.',
  },
  {
    step: '02',
    title: 'Complete the checkout',
    body: 'Import inventory data, upload findings, and capture evidence in one case workspace.',
  },
  {
    step: '03',
    title: 'Compare check-in and check-out',
    body: 'Renovo AI highlights condition changes and flags potentially chargeable issues.',
  },
  {
    step: '04',
    title: 'Draft liability assessment',
    body: 'Generate a structured recommendation with issue context, proposed amounts, and rationale.',
  },
  {
    step: '05',
    title: 'Manager review and sign-off',
    body: 'Review, edit, approve, or reject before anything is sent. Full audit trail stays attached.',
  },
  {
    step: '06',
    title: 'Dispute handling and archive',
    body: 'If challenged, generate a complete evidence pack quickly and retain outcome history.',
  },
] as const

const platformFeatures = [
  {
    title: 'Unified case workspace',
    body: 'Timeline, evidence, issues, communications, and dispute history stay connected.',
  },
  {
    title: 'AI liability drafting',
    body: 'Generate structured deduction letters with recommended charges and rationale in seconds.',
  },
  {
    title: 'Checkout scheduling',
    body: 'Schedule inspections, assign agents, link tenancies, and track completion in one place.',
  },
  {
    title: 'Human approval workflow',
    body: 'AI drafts, your managers decide. Approval happens before any tenant communication.',
  },
  {
    title: 'Dispute evidence packs',
    body: 'Prepare complete evidence output for deposit scheme disputes without rebuilding files.',
  },
  {
    title: 'Guidance and consistency',
    body: 'Operational guidance and reasoned recommendations help teams handle cases consistently.',
  },
] as const

const caseRows = [
  { address: '14 Marchmont Rd', tenant: 'A. Henderson', status: 'In Review' },
  { address: '7 Bruntsfield Pl', tenant: 'S. Campbell', status: 'Active' },
  { address: '32 Leith Walk', tenant: 'M. Patel', status: 'Dispute' },
  { address: '5 George St', tenant: 'R. Thomson', status: 'Resolved' },
] as const

function statusClass(status: (typeof caseRows)[number]['status']) {
  if (status === 'In Review') return 'bg-[#fdf6e3] text-[#9e7a2a]'
  if (status === 'Active') return 'bg-[#e1f5ee] text-[#0f6e56]'
  if (status === 'Dispute') return 'bg-[#fcebeb] text-[#a32d2d]'
  return 'bg-[#eaf3de] text-[#3b6d11]'
}

export function PublicHome() {
  return (
    <MarketingShell currentPath="/" navAriaLabel="Homepage">
      <section className="bg-[radial-gradient(circle_at_top_left,rgba(241,232,214,0.34),transparent_34%),radial-gradient(circle_at_top_right,rgba(225,245,238,0.18),transparent_24%),linear-gradient(180deg,#fdfcf9_0%,#faf7f1_100%)] py-14 lg:py-20 xl:py-24">
        <div className="marketing-frame grid gap-14 xl:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)] xl:items-center">
          <div className="max-w-[760px]">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#e1f5ee] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0f6e56]" />
              Built for UK property managers
            </p>
            <h1 className="mt-6 max-w-[760px] text-[clamp(2.5rem,5.6vw,5rem)] leading-[0.98] tracking-[-0.04em]">
              End of tenancy,
              <br />
              <em className="not-italic text-[#9e7a2a]">finally automated</em>
            </h1>
            <p className="mt-6 max-w-[620px] text-[1.08rem] font-light leading-8 text-[#3d3b37] md:text-[1.15rem]">
              Renovo AI handles checkouts, liability assessments, deposit disputes, and manager
              approvals so your team spends less time on admin and more time running properties.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="app-primary-button rounded px-7 py-3.5 text-[15px] font-medium"
              >
                Request early access
              </Link>
              <Link
                href="/how-it-works"
                className="app-secondary-button rounded px-7 py-3.5 text-[15px] font-medium"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="relative xl:justify-self-end">
            <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(15,14,13,0.1)] bg-white shadow-[0_18px_56px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between bg-[#0f0e0d] px-5 py-4">
                <span className="text-sm text-[rgba(255,255,255,0.9)]">Renovo AI Dashboard</span>
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.14)]" />
                  <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.14)]" />
                  <span className="h-2 w-2 rounded-full bg-[rgba(255,255,255,0.14)]" />
                </div>
              </div>
              <div className="p-5 md:p-6">
                <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                  {[
                    ['24', 'Active cases'],
                    ['8', 'Checkouts due'],
                    ['5', 'Awaiting approval'],
                    ['2', 'In dispute'],
                  ].map(([value, label]) => (
                    <article
                      key={label}
                      className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[linear-gradient(180deg,#f8f4ed_0%,#f3ede2_100%)] p-3"
                    >
                      <p className="text-[22px] leading-none">{value}</p>
                      <p className="mt-1.5 text-[10px] uppercase tracking-[0.03em] text-[#7a7670]">
                        {label}
                      </p>
                    </article>
                  ))}
                </div>

                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#7a7670]">
                  Recent cases
                </p>
                <div>
                  {caseRows.map((row) => (
                    <div
                      key={row.address}
                      className="flex items-center justify-between gap-3 border-b border-[rgba(15,14,13,0.1)] py-3 last:border-none"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#0f0e0d]">{row.address}</p>
                        <p className="text-xs text-[#7a7670]">{row.tenant}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 right-4 rounded-full border border-[rgba(15,14,13,0.18)] bg-white px-4 py-2 text-sm font-medium text-[#0f0e0d] shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#0f6e56]" />
              AI drafting liability assessment
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[rgba(15,14,13,0.1)] bg-[linear-gradient(180deg,#f3eee3_0%,#f8f4ec_100%)] py-5 text-center">
        <div className="marketing-frame">
          <p className="mx-auto max-w-[840px] text-sm text-[#3d3b37]">
            <span className="mr-2 inline-flex rounded-full bg-[#e1f5ee] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
              Early access
            </span>
            Renovo AI is currently in early access. We are onboarding a small number of property
            managers to shape the product with real workflows.
          </p>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f6f0e6_0%,#fbf7f1_100%)] py-16 md:py-20">
        <div className="marketing-frame">
          <div className="mb-12 grid gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(600px,1.1fr)] xl:gap-20">
            <div className="max-w-[620px]">
              <p className="app-kicker">The problem</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.04]">
                One checkout.
                <br />
                <em className="not-italic text-[#9e7a2a]">Six different tools.</em>
              </h2>
              <p className="mt-5 text-[17px] font-light leading-8 text-[#3d3b37]">
                Many teams still split one end-of-tenancy case across email, spreadsheets,
                inventory apps, docs, and scheme portals. It does not scale, and it weakens
                consistency when volume increases.
              </p>
            </div>

            <article className="relative overflow-hidden rounded-[1.6rem] border border-[rgba(15,14,13,0.1)] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#0f0e0d_0%,#7a7670_35%,#9e7a2a_65%,#0f6e56_100%)]" />
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#7a7670]">
                A typical manager toolkit
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                {[
                  ['Email', 'Comms & chasing'],
                  ['Spreadsheet', 'Case tracking'],
                  ['Inventory app', 'Check-in/out'],
                  ['Word / Docs', 'Deduction letters'],
                  ['File storage', 'Photos & evidence'],
                  ['Deposit portal', 'Scheme dispute'],
                ].map(([title, subtitle]) => (
                  <div
                    key={title}
                    className="rounded-lg border border-[rgba(15,14,13,0.1)] bg-[linear-gradient(180deg,#faf6ef_0%,#f3ede2_100%)] p-3 text-center"
                  >
                    <p className="text-xs font-medium text-[#0f0e0d]">{title}</p>
                    <p className="mt-1 text-[10px] text-[#7a7670]">{subtitle}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 overflow-hidden">
                <svg
                  viewBox="0 0 400 32"
                  fill="none"
                  preserveAspectRatio="none"
                  className="h-8 w-full"
                >
                  <path
                    d="M50 4 C80 28, 140 8, 200 16"
                    stroke="#7a7670"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  <path
                    d="M130 4 C160 24, 240 6, 350 18"
                    stroke="#9e7a2a"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  <path
                    d="M200 8 C230 28, 280 4, 340 12"
                    stroke="#0f6e56"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  <path
                    d="M70 12 C120 30, 280 2, 320 20"
                    stroke="#7a7670"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.35"
                  />
                </svg>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-3">
                {[
                  ['6+', 'Tools per case'],
                  ['2-3h', 'Admin per case'],
                  ['0', 'Audit trail'],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[rgba(15,14,13,0.18)] bg-[linear-gradient(180deg,#faf6ef_0%,#f3ede2_100%)] px-3 py-3 text-center"
                  >
                    <p className="text-[20px] leading-none">{value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.03em] text-[#7a7670]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {problemCards.map((item, index) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-8 shadow-[0_6px_22px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,0,0,0.08)]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-[2px] ${
                    index === 0
                      ? 'bg-[#0f0e0d]'
                      : index === 1
                        ? 'bg-[#9e7a2a]'
                        : 'bg-[#0f6e56]'
                  } opacity-45 transition-opacity group-hover:opacity-100`}
                />
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#7a7670]">
                  Problem {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 text-[18px] leading-7">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#7a7670]">{item.body}</p>
                <p className="mt-4 border-l-2 border-[#e8e3da] pl-3.5 text-sm italic leading-6 text-[#3d3b37]">
                  &quot;{item.quote}&quot;
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#fffdf9_0%,#fbf8f2_100%)] py-16 md:py-20">
        <div className="marketing-frame">
          <div className="max-w-[720px]">
            <p className="app-kicker">How it works</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.04]">
              One workflow,
              <br />
              <em className="not-italic text-[#9e7a2a]">end to end</em>
            </h2>
            <p className="mt-5 text-[17px] font-light leading-8 text-[#3d3b37]">
              Renovo AI sits alongside your current setup and keeps evidence, reasoning, and decision
              output in one routeable workflow.
            </p>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(500px,0.8fr)] xl:gap-20">
            <div className="divide-y divide-[rgba(15,14,13,0.1)]">
              {workflowSteps.map((item) => (
                <article key={item.step} className="flex gap-4 py-5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(15,14,13,0.18)] text-sm font-medium text-[#7a7670]">
                    {Number(item.step)}
                  </span>
                  <div>
                    <h3 className="text-base">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#7a7670]">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <article className="h-fit rounded-[1.6rem] border border-[rgba(15,14,13,0.1)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.07)] xl:sticky xl:top-28">
              <div className="flex items-center justify-between border-b border-[rgba(15,14,13,0.1)] px-5 py-4">
                <p className="text-sm font-medium text-[#0f0e0d]">Checkout - 14 Marchmont Rd</p>
                <span className="rounded-full bg-[#e1f5ee] px-2.5 py-1 text-[11px] font-medium text-[#0f6e56]">
                  Scheduled
                </span>
              </div>
              <div className="space-y-3 p-5">
                {[
                  ['Agent assigned', 'Sarah Reid - 12 Apr 2025'],
                  ['Checkout date set', '18 Apr 2025 - 10:00am'],
                  ['Tenancy linked', 'A. Henderson - 12-month AST'],
                ].map(([title, detail]) => (
                  <div
                    key={title}
                    className="rounded-lg border border-[rgba(15,14,13,0.1)] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f2ea_100%)] px-3.5 py-3"
                  >
                    <p className="text-sm font-medium text-[#0f0e0d]">{title}</p>
                    <p className="mt-1 text-xs text-[#7a7670]">{detail}</p>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#7a7670]">
                    Workflow progress
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#e8e3da]">
                    <div className="h-1.5 w-[34%] rounded-full bg-[#0f6e56]" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[rgba(15,14,13,0.08)] bg-[linear-gradient(180deg,#efe5d8_0%,#f8f2e8_100%)] py-16 md:py-20">
        <div className="marketing-frame">
          <div className="max-w-[760px]">
            <p className="app-kicker">Platform</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.04]">
              Everything in one
              <br />
              <em className="not-italic text-[#9e7a2a]">workspace</em>
            </h2>
            <p className="mt-5 text-[17px] font-light leading-8 text-[#3d3b37]">
              No spreadsheet sidecar. No patchwork handoffs. One routeable product workflow that
              stays readable from first triage through dispute.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[1.6rem] border border-[rgba(15,14,13,0.08)] bg-[rgba(15,14,13,0.08)] xl:grid-cols-3">
            {platformFeatures.map((feature) => (
              <article key={feature.title} className="bg-[linear-gradient(180deg,#fffdf9_0%,#f9f4eb_100%)] p-8">
                <h3 className="text-lg text-[#0f0e0d]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#4b4741]">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="bg-[radial-gradient(circle_at_bottom_right,rgba(225,245,238,0.24),transparent_22%),linear-gradient(180deg,#fffdf9_0%,#faf7f1_100%)] py-16 md:py-20">
        <div className="marketing-frame">
          <div className="mx-auto max-w-3xl text-center">
            <p className="app-kicker">Early access</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.1rem)] leading-[1.04]">
              Want to try it
              <br />
              <em className="not-italic text-[#9e7a2a]">while we build it?</em>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] font-light leading-8 text-[#3d3b37]">
              We are onboarding a small group of UK property managers and agencies for rollout.
              Request access and we will reply by email.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-[520px]">
            <PublicWaitlistForm />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/demo"
              className="app-secondary-button rounded px-5 py-2.5 text-sm font-medium"
            >
              View live demo
            </Link>
            <Link
              href="/contact"
              className="app-primary-button rounded px-5 py-2.5 text-sm font-medium"
            >
              Contact Renovo AI
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
