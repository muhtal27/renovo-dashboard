import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const dataCards = [
  {
    title: 'Upload directly',
    body: 'A property manager opens a case when notice is served and uploads the check in inventory, check out report, and move out photos. Takes two minutes. No integration needed.',
  },
  {
    title: 'Forward from email',
    body: 'Forward documents from your inbox to a dedicated Renovo address. The file is attached to the right case automatically. Useful if documents arrive by email already.',
  },
  {
    title: 'Connect your PMS (coming)',
    body: 'Later, Renovo can pull tenancy end dates and documents directly from your property management system. This is on the roadmap — manual upload works in the meantime.',
    badge: 'Coming soon',
  },
]

const walkthroughSteps = [
  {
    step: '01',
    title: 'Case opened and documents uploaded',
    body: 'A tenant gives notice on a 14-month assured shorthold tenancy. The property manager opens a new case in Renovo, enters the move out date, deposit amount (£1,350 held with MyDeposits), and uploads the check in inventory, check out inspection report, and move out photos. Renovo extracts key facts from each document — room condition, item status, meter readings.',
  },
  {
    step: '02',
    title: 'Issues identified',
    body: 'The property manager reviews the extracted facts and adds four issues: carpet staining in the living room (£280), a broken kitchen cupboard door (£160), scuff marks on the bedroom wall (£120, shared responsibility), and missing picture hooks (£80). Each issue is tagged with responsibility, severity, and the evidence that supports it.',
  },
  {
    step: '03',
    title: 'Recommendation drafted',
    body: 'The property manager clicks Generate recommendation. Renovo reviews the documents, the issues, and the evidence links, then drafts a partial claim recommendation of £640 with a written rationale explaining each amount and flagging the bedroom wall as a fair wear and tear judgement call.',
  },
  {
    step: '04',
    title: 'Manager reviews and approves',
    body: 'The manager reads the rationale, adjusts the bedroom wall amount down to £90 based on their judgement, adds a note explaining the change, and approves the recommendation. The full review history — including the edit and the note — is logged automatically.',
  },
  {
    step: '05',
    title: 'Claim submitted',
    body: 'Renovo generates the deposit claim line items from the approved recommendation. The manager submits to MyDeposits with the rationale and evidence already documented. If the tenant challenges, the full decision trail is already there.',
  },
]

const trustCards = [
  {
    label: 'Human approved',
    body: 'Every recommendation requires explicit manager approval before a claim is generated.',
  },
  {
    label: 'Full audit trail',
    body: 'Every edit, note, rejection, and approval is logged with a timestamp and the name of the person who made it.',
  },
  {
    label: 'Defensible decisions',
    body: 'When a case is challenged, the rationale and evidence are already attached — not something you have to reconstruct later.',
  },
]

const dataSignals = [
  'UK GDPR compliant — data stored in EU West (Ireland)',
  'Tenancy data is never used to train AI models',
  'Role-based access — managers only see what they need',
]

export const metadata: Metadata = {
  title: 'How Renovo Works | End-of-Tenancy Decision Tool',
  description:
    'See exactly how Renovo fits into your letting agency — no software replacement required. Manual upload, email intake, and step-by-step decision workflow explained.',
  alternates: {
    canonical: 'https://renovoai.co.uk/how-it-works',
  },
}

export default function HowItWorksPage() {
  return (
    <MarketingShell currentPath="/how-it-works">
        <section className="app-surface-strong rounded-[2.45rem] p-4 md:p-6">
          <div className="rounded-[2rem] border border-stone-200/85 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.66)_38%,rgba(231,246,241,0.78)_70%,rgba(229,237,245,0.72)_100%)] px-6 py-8 md:px-10 md:py-10">
            <p className="app-kicker">How it works</p>
            <h1 className="mt-4 max-w-5xl text-4xl font-semibold tracking-tight md:text-[4rem] md:leading-[0.96]">
              You don&apos;t need to change your current system. Here&apos;s how Renovo fits in.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
              Renovo sits alongside your existing property management software. Documents come in
              via manual upload or email. Nothing in your current setup changes in week one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#platform"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                See the demo
              </Link>
              <Link
                href="/#waitlist"
                className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Join the rollout list
              </Link>
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">Getting data in</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              How does Renovo get the documents and information it needs?
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {dataCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-stone-900">{card.title}</h3>
                  {card.badge ? (
                    <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">{card.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm leading-7 text-stone-500">
            For now, property managers open cases manually when a notice is served. That is
            intentional — it keeps your team in control.
          </p>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">A real scenario</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              What a typical end-of-tenancy review looks like in Renovo
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              This is not a case study. It is a realistic walkthrough of the same five steps shown
              above — applied to a real scenario.
            </p>
          </div>

          <div className="mt-6 relative space-y-4 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-stone-200">
            {walkthroughSteps.map((item) => (
              <article
                key={item.step}
                className="relative rounded-[1.45rem] border border-stone-200 border-l-4 border-l-emerald-400 bg-white/92 p-5 pl-8"
              >
                <div className="absolute left-[0.7rem] top-6 h-3 w-3 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Step {item.step}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div>
              <p className="app-kicker">Control and compliance</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                The AI never makes a decision. Your managers do.
              </h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-stone-700">
                <p>
                  Renovo drafts a recommendation with reasoning. A manager reads it, changes what
                  they disagree with, and approves or rejects it. The audit trail records exactly
                  what changed and why — including every edit, note, and approval.
                </p>
                <p>
                  If a tenant or landlord challenges a decision, the evidence trail is already
                  documented. You are not recreating the reasoning from memory or inbox threads.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {trustCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
                >
                  <p className="app-kicker">{card.label}</p>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <p className="app-kicker">Your data</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for UK letting agencies
          </h2>

          <div className="mt-6 flex flex-col gap-3 text-sm text-stone-700 md:flex-row md:flex-wrap md:items-center">
            {dataSignals.map((item) => (
              <div key={item} className="inline-flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
          <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 text-center md:px-8 md:py-9">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to try it with a real case?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-stone-700">
              Join the rollout list. We are opening Renovo carefully with agencies that want a
              more reviewable end-of-tenancy workflow. No commitment required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/#waitlist"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Join the rollout list
              </Link>
              <Link
                href="/#platform"
                className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                See the interactive demo
              </Link>
            </div>
          </div>
        </section>
    </MarketingShell>
  )
}
