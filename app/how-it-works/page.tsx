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
    body: 'Forward documents from your inbox to a dedicated Renovo AI address. The file is attached to the right case automatically. Useful if documents arrive by email already.',
  },
  {
    title: 'Connect your PMS (coming)',
    body: 'Later, Renovo AI can pull tenancy end dates and documents directly from your property management system. This is on the roadmap — manual upload works in the meantime.',
    badge: 'Coming soon',
  },
]

const walkthroughSteps = [
  {
    step: '01',
    title: 'Case opened and documents uploaded',
    body: 'A tenant gives notice on a 14-month AST. The manager opens a case, adds the move-out date and deposit amount, then uploads the check-in, check-out, and photos. Renovo AI extracts the key facts automatically.',
  },
  {
    step: '02',
    title: 'Issues identified',
    body: 'The manager reviews the extracted facts and logs the issues that matter, including amount, responsibility, severity, and the evidence behind each line item.',
  },
  {
    step: '03',
    title: 'Recommendation drafted',
    body: 'Renovo AI drafts a recommendation using the documents, issues, and evidence links, then writes a rationale for each proposed amount and flags any fair wear and tear judgement calls.',
  },
  {
    step: '04',
    title: 'Manager reviews and approves',
    body: 'A manager reviews the draft, changes anything they disagree with, adds notes where needed, and approves or rejects it. Every edit and approval is logged automatically.',
  },
  {
    step: '05',
    title: 'Claim submitted',
    body: 'Renovo AI turns the approved recommendation into claim-ready output. If the tenant challenges, the evidence and decision trail are already assembled.',
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
  title: 'How Renovo AI Works | End-of-Tenancy Decision Tool',
  description:
    'See exactly how Renovo AI fits into your letting agency — no software replacement required. Manual upload, email intake, and step-by-step decision workflow explained.',
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
          <h1 className="page-title max-w-5xl">
            You don&apos;t need to change your current system. Here&apos;s how Renovo AI fits in.
          </h1>
          <p className="page-copy max-w-3xl">
            Renovo AI sits alongside your existing property management software. Documents come in via
            manual upload or email. Nothing in your current setup changes in week one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="app-primary-button rounded px-5 py-3 text-sm font-medium">
              See the demo
            </Link>
            <Link href="/contact" className="app-secondary-button rounded px-5 py-3 text-sm font-medium">
              Join the rollout list
            </Link>
          </div>
        </section>

        <section className="page-card">
          <div className="max-w-4xl">
            <p className="app-kicker">Getting data in</p>
            <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
              How does Renovo AI get the documents and information it needs?
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {dataCards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#faf8f5] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg">{card.title}</h3>
                  {card.badge ? (
                    <span className="rounded-full border border-[rgba(15,14,13,0.1)] bg-white px-3 py-1 text-xs font-medium text-[#7a7670]">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-[#3d3b37]">{card.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm leading-7 text-[#7a7670]">
            For now, property managers open cases manually when a notice is served. That is
            intentional - it keeps your team in control.
          </p>
        </section>

        <section className="page-card">
          <div className="max-w-4xl">
            <p className="app-kicker">A real scenario</p>
            <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
              What a typical end-of-tenancy review looks like in Renovo AI
            </h2>
            <p className="mt-4 text-base leading-8 text-[#3d3b37]">
              This is not a case study. It is a realistic walkthrough of the same five steps shown
              above - applied to a real scenario.
            </p>
          </div>

          <div className="relative mt-6 space-y-4 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-[rgba(15,14,13,0.1)]">
            {walkthroughSteps.map((item) => (
              <article
                key={item.step}
                className="relative rounded-xl border border-[rgba(15,14,13,0.1)] border-l-4 border-l-[#0f6e56] bg-[#faf8f5] p-5 pl-8"
              >
                <div className="absolute left-[0.7rem] top-6 h-3 w-3 rounded-full bg-[#0f6e56]" />
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7a7670]">
                  Step {item.step}
                </p>
                <h3 className="mt-2 text-lg">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#3d3b37]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-card">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div>
              <p className="app-kicker">Control and compliance</p>
              <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
                The AI never makes a decision. Your managers do.
              </h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-[#3d3b37]">
                <p>
                  Renovo AI drafts a recommendation with reasoning. A manager reads it, changes what
                  they disagree with, and approves or rejects it. The audit trail records exactly
                  what changed and why, including every edit, note, and approval.
                </p>
                <p>
                  If a tenant or landlord challenges a decision, the evidence trail is already
                  documented. You are not recreating the reasoning from memory or inbox threads.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-6">
              <div className="space-y-5">
                {trustCards.map((card, index) => (
                  <div
                    key={card.label}
                    className={index === trustCards.length - 1 ? '' : 'border-b border-[rgba(15,14,13,0.08)] pb-5'}
                  >
                    <p className="app-kicker">{card.label}</p>
                    <p className="mt-3 text-sm leading-7 text-[#3d3b37]">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-card">
          <p className="app-kicker">Your data</p>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">
            Built for UK letting agencies
          </h2>

          <div className="mt-6 flex flex-col gap-3 text-sm text-[#3d3b37] md:flex-row md:flex-wrap md:items-center">
            {dataSignals.map((item) => (
              <div key={item} className="inline-flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0f6e56]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="page-hero text-center">
          <h2 className="text-[clamp(1.9rem,4vw,2.6rem)] leading-[1.12]">Ready to try it with a real case?</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-[#3d3b37]">
            Join the rollout list. We are opening Renovo AI carefully with agencies that want a more
            reviewable end-of-tenancy workflow. No commitment required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="app-primary-button rounded px-5 py-3 text-sm font-medium">
              Join the rollout list
            </Link>
            <Link href="/demo" className="app-secondary-button rounded px-5 py-3 text-sm font-medium">
              See the interactive demo
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}
