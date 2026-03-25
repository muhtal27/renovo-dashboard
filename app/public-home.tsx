import Link from 'next/link'
import { HeroDemoPreview } from '@/app/components/HeroDemoPreview'
import HomepageDemo from '@/app/components/HomepageDemo'
import { LandingTrustSection } from '@/app/components/LandingTrustSection'
import { MarketingShell } from '@/app/components/MarketingShell'
import { PublicWaitlistForm } from '@/app/public-waitlist-form'

const overviewMetrics = [
  {
    value: 'Evidence organised',
    label: 'Check-in, check-out, photos, and notes are kept together by room and item.',
  },
  {
    value: 'Manager sign-off',
    label: 'Nothing leaves Renovo until someone on your team reviews and approves it.',
  },
  {
    value: 'Claim ready',
    label: 'Approved issues are compiled into structured output with the evidence already linked.',
  },
] as const

const problemCards = [
  {
    title: 'Manual comparison',
    body: 'Check-in reports, check-out reports, photos, and notes all need to be cross-checked before anything can be claimed.',
  },
  {
    title: 'Inconsistent decisions',
    body: 'Different team members assess damage differently, which creates avoidable disputes and uneven claim quality.',
  },
  {
    title: 'Weak claim preparation',
    body: 'Good evidence is often lost in a messy write-up, especially when the file has to be assembled quickly.',
  },
  {
    title: 'No clear audit trail',
    body: 'Claims are harder to defend when the reasoning behind each deduction is not documented.',
  },
] as const

const workflowSteps = [
  {
    step: '01',
    title: 'Upload your reports',
    body: 'Add the check-in report, check-out report, photos, and supporting documents. Renovo organises the evidence by room and item.',
  },
  {
    step: '02',
    title: 'Compare check-in to check-out',
    body: 'Changes in condition are flagged against the original record, with the relevant evidence attached to each issue.',
  },
  {
    step: '03',
    title: 'Review recommendations',
    body: 'Each issue is prepared for review with supporting context, so you can decide what to claim, what to ignore, and what needs a closer look.',
  },
  {
    step: '04',
    title: 'Prepare your claim',
    body: 'Approved items are compiled into a structured, claim-ready output with the evidence already linked and organised.',
  },
] as const

const featureCards = [
  {
    title: 'Linked evidence on every finding',
    body: 'Each issue stays tied to the relevant photos, report entries, and supporting documents, so the trail is already there when a claim is challenged.',
  },
  {
    title: 'Fair wear and tear guidance',
    body: 'Assessments consider the starting condition, tenancy context, and what needs human judgement rather than pretending every case is clear-cut.',
  },
  {
    title: 'Structured for UK deposit claim workflows',
    body: 'Claim output is organised in a way that supports UK deposit claim submission, with the evidence prepared alongside each item.',
  },
  {
    title: 'Room-by-room review',
    body: 'Findings are grouped by room and item, making the file quicker to review and easier to sense-check before anything is sent.',
  },
  {
    title: 'Full editorial control',
    body: 'Edit recommendations, change amounts, add context, or remove items entirely. Renovo does the preparation; your team makes the final call.',
  },
  {
    title: 'Claim-ready output',
    body: 'Once issues are approved, Renovo compiles them into a structured output so less time is spent assembling paperwork at the end.',
  },
] as const

const audienceCards = [
  {
    title: 'Solo property managers',
    body: 'Reduce admin and protect claim quality when one person is handling the whole checkout process from evidence review to final write-up.',
  },
  {
    title: 'Small letting agencies',
    body: 'Give the team one consistent review workflow, so claims are prepared the same way even when different people pick up the case.',
  },
  {
    title: 'Mid-size agencies',
    body: 'Standardise end-of-tenancy work across a growing portfolio and reduce avoidable claim loss when volume starts to stretch the team.',
  },
] as const

const trustPoints = [
  {
    title: 'Nothing leaves without sign-off',
    body: 'Recommendations stay in review until someone on your team approves them. Renovo prepares the work; your managers decide what is sent.',
  },
  {
    title: 'Reasoning stays visible',
    body: 'Each item keeps its evidence, context, and review notes together, so the basis for a deduction is still visible when the file is revisited later.',
  },
  {
    title: 'Override anything',
    body: 'Amounts, notes, and recommendations can all be edited before output is prepared. The workflow is there to support judgement, not replace it.',
  },
] as const

const trustFaqs = [
  {
    question: 'Does Renovo make the final decision?',
    answer: 'No. Renovo prepares the review, but your team decides what to claim, what to change, and what to leave out.',
  },
  {
    question: 'What happens if a claim is challenged?',
    answer: 'The evidence, reasoning, and review history stay attached to each item, so the case is easier to explain without rebuilding it from email and memory.',
  },
  {
    question: 'Can we adjust or remove recommendations?',
    answer: 'Yes. Managers can change amounts, rewrite context, remove items, or hold something back for a closer look before claim output is prepared.',
  },
  {
    question: 'Who owns the case data?',
    answer: 'Your team does. Renovo is there to organise and prepare the work, while the documents, notes, and decisions remain part of your operating record.',
  },
] as const

export function PublicHome() {
  return (
    <MarketingShell currentPath="/" navAriaLabel="Homepage">
      <section className="overflow-hidden rounded-[2.45rem] border border-stone-200 bg-white p-4 shadow-[0_20px_48px_rgba(55,43,27,0.08)] md:p-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/85 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.99),rgba(255,255,255,0.95)_40%,rgba(243,247,244,0.92)_72%,rgba(245,242,237,0.9)_100%)] px-6 py-7 md:px-10 md:py-10">
          <div className="pointer-events-none absolute -right-12 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Renovo</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                End-of-tenancy automation for UK property managers and letting agencies.
              </p>
            </div>
          </div>

          <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] xl:items-center">
            <div>
              <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                End-of-tenancy automation
              </div>

              <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[4.7rem] md:leading-[0.94]">
                Automate end-of-tenancy work from evidence to claim
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                Renovo reviews check-in and check-out evidence, highlights issues, and prepares
                claim-ready output for your review. You stay in control of every decision.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                >
                  View live demo
                </Link>
                <a
                  href="#waitlist"
                  className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                >
                  Request Early Access
                </a>
              </div>

              <div className="mt-6 grid gap-2 text-xs font-medium text-stone-600 md:grid-cols-2 md:text-sm">
                {[
                  'Built for UK property managers and letting agencies',
                  'Managers approve every decision',
                  'Evidence review to claim-ready output',
                  'Structured for end-of-tenancy work, not generic automation',
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

            <HeroDemoPreview highlights={overviewMetrics} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-[#F9F9F9] px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="app-kicker">Trust bar</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for UK property managers and letting agencies
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Start with the end-of-tenancy workflow and keep your current systems around it.
            </p>
          </div>

          <Link
            href="/about"
            className="text-sm font-medium text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline lg:self-start"
          >
            Meet the team behind Renovo →
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-700">
          {[
            'Built for UK workflows',
            'Evidence-led review',
            'Works alongside your current setup',
          ].map((item) => (
            <div
              key={item}
              className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        id="platform"
        className="scroll-mt-28 rounded-[2rem] border border-emerald-200 bg-[linear-gradient(140deg,rgba(255,255,255,0.99),rgba(243,251,247,0.97)_50%,rgba(233,246,240,0.96)_100%)] p-6 shadow-[0_24px_54px_rgba(47,87,75,0.12)] md:scroll-mt-32 md:p-7"
      >
        <div className="flex flex-col gap-4 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-4xl">
            <p className="app-kicker">Live demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              See the workflow before you sign up
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
              Explore a read-only Renovo case to see how evidence, issues, recommendations, and
              claim-ready output are organised in one end-of-tenancy workflow.
            </p>
          </div>
          <Link
            href="/demo"
            className="app-primary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
          >
            View full live demo
          </Link>
        </div>

        <div className="mt-6">
          <HomepageDemo variant="compact" />
        </div>
      </section>

      <section
        id="problem"
        className="app-surface scroll-mt-28 rounded-[2rem] p-6 md:scroll-mt-32 md:p-8"
      >
        <div className="max-w-4xl">
          <p className="app-kicker">Problem</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">
            Checkout admin is where time and money quietly disappear
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 md:text-base md:leading-8">
            Every end of tenancy means cross-referencing reports, reviewing photos room by room,
            judging fair wear and tear, writing up issues, and building a claim that can stand up
            if challenged. Most property managers still handle this manually across spreadsheets,
            email, and memory. It works at low volume. It breaks when portfolios grow.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {problemCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
            >
              <h3 className="text-base font-semibold text-stone-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-28 rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(245,243,240,0.95),rgba(238,235,229,0.9))] p-6 md:scroll-mt-32 md:p-7"
      >
        <div className="max-w-4xl">
          <p className="app-kicker text-stone-500">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Four steps from checkout to claim
          </h2>
          <p className="mt-4 text-base leading-8 text-stone-700">
            Renovo follows the same process an experienced property manager would, with the
            evidence and reasoning kept together from start to finish.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((item) => (
            <article key={item.step} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Step {item.step}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-stone-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 rounded-[2rem] border border-stone-100 bg-[linear-gradient(180deg,rgba(250,247,242,0.4),rgba(255,255,255,0.7))] p-6 md:scroll-mt-32 md:p-7"
      >
        <div className="max-w-4xl border-b app-divider pb-5">
          <p className="app-kicker">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Built for the operational work behind every claim
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
            Renovo keeps the evidence, reasoning, and claim preparation connected, so your team is
            not rebuilding the same file in different places.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
            >
              <h3 className="text-base font-semibold text-stone-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        id="who-its-for"
        className="scroll-mt-28 rounded-[2rem] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.9),rgba(255,247,230,0.7))] p-6 md:scroll-mt-32 md:p-7"
      >
        <p className="app-kicker">Who it&apos;s for</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Built for teams doing real end-of-tenancy volume
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
          Whether one person handles every checkout or a wider team is working through volume, the
          goal is the same: less admin, better consistency, and stronger claim preparation.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {audienceCards.map((card) => (
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5" key={card.title}>
              <h3 className="text-base font-semibold text-stone-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <LandingTrustSection points={trustPoints} faqs={trustFaqs} />

      <section className="rounded-[1.9rem] border border-stone-200 bg-white/92 px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="app-kicker">Contact</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
              Need to talk through your process first?
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600 md:text-base">
              Use the contact form for early access, partnerships, investor enquiries, or general
              questions.
            </p>
          </div>
          <Link
            href="/contact"
            className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
          >
            Talk to us
          </Link>
        </div>
      </section>

      <section
        id="waitlist"
        className="app-surface-strong scroll-mt-28 rounded-[2.2rem] p-6 md:scroll-mt-32 md:p-8"
      >
        <div className="grid gap-6 rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <p className="app-kicker">Get started</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
              Spend less time on checkout admin. Prepare stronger claims with less manual work.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
              Renovo is onboarding UK property managers and letting agencies who want a more
              consistent end-of-tenancy workflow. Request early access to see how it fits your
              process.
            </p>
            <div className="mt-6 rounded-[1.45rem] border border-emerald-200 bg-emerald-50/85 p-5">
              <p className="text-sm font-semibold text-emerald-950">What happens next</p>
              <p className="mt-2 text-sm leading-7 text-emerald-950/85">
                We use these details to arrange early access and onboarding conversations. If you
                already have access, sign in from the top right.
              </p>
              <div className="mt-4">
                <Link
                  href="/demo"
                  className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
                >
                  View live demo
                </Link>
              </div>
            </div>
          </div>

          <PublicWaitlistForm />
        </div>
      </section>
    </MarketingShell>
  )
}
