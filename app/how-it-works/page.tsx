import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const workflowSteps = [
  {
    step: '01',
    title: 'Checkout scheduled and report fetched',
    body: 'Renovo AI opens the case around the tenancy end event, then pulls in the checkout report, inventories, photos, and supporting records so the team starts from one complete file.',
  },
  {
    step: '02',
    title: 'AI compares and validates',
    body: 'Renovo compares check-in and checkout evidence, checks whether the supporting records are complete, and flags gaps before a deduction position is drafted.',
  },
  {
    step: '03',
    title: 'Liability assessment drafted and reviewed',
    body: 'Renovo prepares the liability assessment, fair wear and tear reasoning, betterment context, and landlord recommendations, then the tenant and landlord review the proposed position before it moves forward.',
  },
  {
    step: '04',
    title: 'Manager negotiates if needed',
    body: 'If the parties disagree, the manager negotiates from a documented case file rather than rebuilding the deduction letter and evidence pack from scratch.',
  },
  {
    step: '05',
    title: 'Deposit released',
    body: 'Once the position is agreed, the deposit can be released through the relevant scheme and the full audit trail stays attached to the case.',
  },
  {
    step: '06',
    title: 'Dispute pack generated if escalated',
    body: 'If the matter proceeds to TDS, DPS, or mydeposits, Renovo generates the evidence pack with the timeline, liability assessment, supporting records, and decision history already assembled.',
  },
] as const

const reviewControls = [
  {
    title: 'Human approval',
    body: 'Renovo drafts the liability assessment. Your team decides what is sent, what is changed, and what is rejected.',
  },
  {
    title: 'Case-level audit trail',
    body: 'Notes, changes, evidence references, and decisions stay on the case so deduction letters and dispute packs are traceable.',
  },
  {
    title: 'Operational consistency',
    body: 'Fair wear and tear, betterment, evidence references, and scheme-ready wording are handled in one structured process.',
  },
] as const

const integrationAreas = [
  {
    title: 'Inventory and inspection systems',
    body: 'Bring check-in and checkout reports, photos, and supporting evidence into one review workflow.',
  },
  {
    title: 'Property management software',
    body: 'Keep tenancy operations, checkout scheduling, and case preparation tied together.',
  },
  {
    title: 'Claim and dispute preparation',
    body: 'Move from liability assessment to evidence pack output without rebuilding the file for TDS, DPS, or mydeposits.',
  },
] as const

export const metadata: Metadata = {
  title: 'How It Works | Renovo AI',
  description:
    'See how Renovo AI moves a checkout from evidence intake to liability assessment, landlord review, deposit release, and dispute pack generation.',
  alternates: {
    canonical: 'https://renovoai.co.uk/how-it-works',
  },
}

export default function HowItWorksPage() {
  return (
    <MarketingShell currentPath="/how-it-works">
      <div className="page-shell page-stack">
        <section className="page-hero">
          <p className="app-kicker">How it works</p>
          <h1 className="page-title max-w-[860px]">
            Renovo AI keeps the checkout, liability assessment, and dispute workflow in one place.
          </h1>
          <p className="page-copy max-w-[760px]">
            Renovo fits around the way letting agencies already manage end of tenancy. Reports,
            deduction letters, landlord recommendations, evidence packs, and scheme escalation all
            stay connected to the same case.
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
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50 py-16">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="app-kicker">Product flow</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Six steps from checkout to <em>deposit release</em>
              </h2>
              <p className="mt-4 max-w-[520px] text-base leading-8 text-zinc-600">
                Start with the case file, move through evidence review and liability assessment,
                then close through agreement or scheme escalation. The workflow is shorter to read
                because the related review stages sit together where they belong.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {workflowSteps.map((item, index) => (
                <details
                  key={item.step}
                  className="group rounded-xl border border-zinc-200 bg-white open:border-zinc-300"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        Step {item.step}
                      </p>
                      <h3 className="mt-2 text-left text-lg font-semibold text-zinc-950">
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <span className="hidden text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 sm:inline">
                        Expand
                      </span>
                      <span className="text-sm text-zinc-400">⌄</span>
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

        <section className="page-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div>
              <p className="app-kicker">Decision control</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
                Renovo drafts. <em>Your team decides.</em>
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-600">
                Renovo does not remove manager judgement. It structures the evidence, drafts the
                liability assessment, and keeps the audit trail readable so managers can make and
                defend the final decision.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {reviewControls.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-50 py-16">
          <div className="max-w-[720px]">
            <p className="app-kicker">System handoff</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
              Built around <em>existing workflows</em>
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-600">
              Integration work is focused on the handoff points that matter in end-of-tenancy
              operations, not on adding another disconnected admin tool.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {integrationAreas.map((item) => (
              <article key={item.title} className="rounded-xl border border-zinc-200 bg-white p-6">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-hero text-center">
          <p className="app-kicker">Next step</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] text-zinc-950">
            See the workflow in the <em>read-only demo</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[760px] text-base leading-8 text-zinc-600">
            Review how a checkout becomes a liability assessment, deduction letter, and dispute
            evidence pack before you speak to us about your own agency workflow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
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
        </section>
      </div>
    </MarketingShell>
  )
}
