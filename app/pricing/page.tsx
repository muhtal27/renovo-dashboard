import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'

const pricingFactors = [
  {
    title: 'Portfolio size',
    body: 'Pricing scales with the number of active tenancies and end-of-tenancy cases your team handles.',
  },
  {
    title: 'Team shape',
    body: 'We scope around the managers and reviewers who need to work inside the workflow, not generic company-wide seats.',
  },
  {
    title: 'Rollout scope',
    body: 'Single-branch pilots, agency-wide adoption, and multi-branch rollouts are priced differently because the onboarding shape is different.',
  },
]

const includedItems = [
  'Guided onboarding',
  'No integration required to get started',
  'AI-drafted, audit-ready deposit claims',
  'Built-in Deposit Guidance Hub',
  'Human-in-the-loop review and approval',
  'Ongoing product updates',
]

const packageCards = [
  {
    label: 'Single branch',
    title: 'For agencies starting with one operational team',
    body: 'Best for agencies that want to introduce a reviewable end-of-tenancy workflow in one branch before expanding further.',
  },
  {
    label: 'Agency rollout',
    title: 'For agencies standardising decisions across teams',
    body: 'Best for agencies that want a consistent process for evidence review, recommendation drafting, and claim preparation across the business.',
  },
  {
    label: 'Multi-branch',
    title: 'For larger operations with higher case volume',
    body: 'Best for agencies that need broader rollout planning, team alignment, and a pricing model shaped around operational volume.',
  },
]

const faqs = [
  {
    question: 'Do you publish fixed prices?',
    answer:
      'Not yet. Pricing is agreed during rollout discussions so it can reflect portfolio size, team structure, and the scope of adoption.',
  },
  {
    question: 'Do we need to buy an integration package first?',
    answer:
      'No. Renovo is designed to work without a new integration on day one, so pricing does not depend on replacing your current property management system.',
  },
  {
    question: 'What is included in onboarding?',
    answer:
      'Onboarding is guided and focused on getting your team into the end-of-tenancy workflow quickly, with the product configured around how your managers review cases.',
  },
  {
    question: 'Can we start small before a wider rollout?',
    answer:
      'Yes. The rollout can start with one branch or team and expand once the workflow is established internally.',
  },
]

export const metadata: Metadata = {
  title: 'Pricing | Renovo',
  description:
    'See how Renovo pricing is shaped for letting agencies adopting an AI-assisted end-of-tenancy workflow.',
  alternates: {
    canonical: 'https://renovoai.co.uk/pricing',
  },
}

export default function PricingPage() {
  return (
    <MarketingShell currentPath="/pricing">
        <section className="app-surface-strong rounded-[2.45rem] p-4 md:p-6">
          <div className="rounded-[2rem] border border-stone-200/85 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.66)_38%,rgba(231,246,241,0.78)_70%,rgba(229,237,245,0.72)_100%)] px-6 py-8 md:px-10 md:py-10">
            <p className="app-kicker">Pricing</p>
            <h1 className="mt-4 max-w-5xl text-4xl font-semibold tracking-tight md:text-[4rem] md:leading-[0.96]">
              Pricing shaped for letting agencies adopting a serious end-of-tenancy workflow.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
              Pricing depends on portfolio size, team structure, and rollout scope. Every plan is
              built around the same core outcome: faster, more consistent, audit-ready deposit
              claim preparation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#waitlist"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Request Early Access
              </Link>
              <Link
                href="/#platform"
                className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Try Live Demo
              </Link>
            </div>

            <div className="mt-6 grid gap-2 text-xs font-medium text-stone-600 md:grid-cols-3 md:text-sm">
              {[
                'No integration required',
                'Guided onboarding included',
                'Human-in-the-loop review and approval',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="flex-1">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">How pricing is scoped</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Commercials are shaped around operational fit, not generic seat bundles.
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Renovo is priced around the workflow you are adopting, the team using it, and the
              volume you expect to run through it. That keeps the commercial conversation tied to
              operational value rather than generic SaaS packaging.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {pricingFactors.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
              >
                <p className="app-kicker">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-stone-50/60 rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div>
              <p className="app-kicker">What every plan includes</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                The same core workflow, regardless of rollout size.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                The product value does not depend on buying a bigger package to unlock the core
                workflow. Every commercial discussion starts from the same operational foundation.
              </p>
            </div>

            <div className="grid gap-3">
              {includedItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.2rem] border border-stone-200 bg-white/92 px-4 py-3 text-sm font-medium text-stone-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">Typical rollout shapes</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Different agency sizes need different rollout plans.
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {packageCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
              >
                <p className="app-kicker">{card.label}</p>
                <h3 className="mt-3 text-lg font-semibold text-stone-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">Common questions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Pricing questions, answered directly.
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.45rem] border border-stone-200 bg-stone-50/70 p-5"
              >
                <h3 className="text-base font-semibold text-stone-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
          <div className="grid gap-6 rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 md:px-8 md:py-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="app-kicker">Next step</p>
              <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
                Discuss pricing against your portfolio and rollout scope.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                If you want a commercial view shaped around your agency, request early access and
                we can scope the rollout conversation from there.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/#waitlist"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Request Early Access
              </Link>
              <Link
                href="/#platform"
                className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Try Live Demo
              </Link>
            </div>
          </div>
        </section>
    </MarketingShell>
  )
}
