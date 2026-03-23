import Link from 'next/link'
import { ComparisonCard } from '@/app/components/ComparisonCard'
import { HeroDemoPreview } from '@/app/components/HeroDemoPreview'
import { LandingTrustSection } from '@/app/components/LandingTrustSection'
import { PublicWaitlistForm } from '@/app/public-waitlist-form'

const overviewMetrics = [
  {
    value: '1 workspace',
    label: 'Evidence, issues, review, and claim output in one place',
  },
  {
    value: 'Human reviewed',
    label: 'Managers stay in control of every recommendation',
  },
  {
    value: 'Claim ready',
    label: 'Approved outcomes turn into claim line items with linked evidence',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Gather the full case',
    body: 'Bring the tenancy, deposit, documents, and extracted facts into one workspace before review starts.',
  },
  {
    step: '02',
    title: 'Assess the issues',
    body: 'Turn evidence into specific issues with responsibility, severity, and estimated cost visible side by side.',
  },
  {
    step: '03',
    title: 'Draft the decision',
    body: 'Use AI drafting to structure the recommendation, rationale, and source references without hiding why the amount is suggested.',
  },
  {
    step: '04',
    title: 'Review with control',
    body: 'Managers approve, reject, or adjust the recommendation with a full audit trail.',
  },
  {
    step: '05',
    title: 'Prepare claim output',
    body: 'Approved recommendations become deposit claim line items linked back to the issues and evidence that support them.',
  },
]

const setupItems = [
  'Manual upload — Drag and drop or browse to add documents',
  'Email intake — Forward documents from your inbox',
  'PMS sync — Coming: pull from your existing system',
]

const checkInItems = [
  {
    label: 'Living room — Carpet',
    description: 'Professionally cleaned. No marks or staining.',
  },
  {
    label: 'Master bedroom — Walls',
    description: 'Freshly painted. Neutral white throughout.',
  },
  {
    label: 'Kitchen — Cupboard doors',
    description: 'All intact. Hinges secure. No damage noted.',
  },
]

const checkOutItems = [
  {
    label: 'Living room — Carpet',
    description: 'Large wine stain, approx. 30cm. Right corner near sofa.',
    meta: 'Photo evidence linked',
  },
  {
    label: 'Master bedroom — Walls',
    description: 'Multiple scuff marks. Patch repaint required.',
    meta: 'Photo evidence linked',
  },
  {
    label: 'Kitchen — Cupboard door',
    description: 'Left door hinge broken. Door detached.',
  },
]

const trustPoints = [
  {
    title: 'Managers stay in control',
    body: 'Renovo can draft the recommendation, but a manager still reviews the evidence, checks the reasoning, and approves the outcome.',
  },
  {
    title: 'Every amount stays linked',
    body: 'Issues, source references, and claim line items stay connected in the same workspace, so the reasoning is still visible when the case is reviewed later.',
  },
  {
    title: 'Adoption stays low-friction',
    body: 'Start with manual upload or email intake, keep your current property management system, and bring Renovo into the review step first.',
  },
]

const trustFaqs = [
  {
    question: 'Does Renovo make the final decision?',
    answer: 'No. Renovo helps structure the review, but a manager still decides whether to approve, reject, or adjust the recommendation.',
  },
  {
    question: 'Do we need to replace our current system?',
    answer: 'No. Renovo is designed to sit alongside your current setup, starting with the review workflow rather than forcing a wider system change.',
  },
  {
    question: 'What does a manager actually review?',
    answer: 'The manager reviews the documents, extracted facts, linked issues, recommendation, and claim output together in one workspace.',
  },
  {
    question: 'What happens if a case is challenged?',
    answer: 'The evidence, issue decisions, and reasoning stay attached to the case, so the team is not rebuilding the story from inboxes or memory later.',
  },
]

export function PublicHome({
  productDemo,
}: {
  productDemo?: React.ReactNode
}) {
  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <header className="sticky top-0 z-30">
          <div className="app-surface flex items-center justify-between gap-4 rounded-[1.45rem] border border-stone-200/85 px-4 py-3 backdrop-blur md:px-5">
            <Link href="/" className="app-kicker">
              Renovo
            </Link>

            <nav className="hidden items-center gap-4 md:flex" aria-label="Homepage">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                How it works
              </a>
              <a
                href="#platform"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Demo
              </a>
              <a
                href="#benefits"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Benefits
              </a>
              <a
                href="#waitlist"
                className="text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Early access
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="#platform"
                className="inline-flex text-sm font-medium text-stone-700 hover:text-stone-900 md:hidden"
              >
                Demo
              </a>
              <a
                href="#waitlist"
                className="inline-flex text-sm font-medium text-stone-700 hover:text-stone-900 md:hidden"
              >
                Early access
              </a>
              <Link
                href="/login"
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>

        <section className="app-surface-strong overflow-hidden rounded-[2.45rem] p-4 md:p-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/85 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.62)_38%,rgba(231,246,241,0.82)_70%,rgba(229,237,245,0.78)_100%)] px-6 py-7 md:px-10 md:py-10">
            <div className="pointer-events-none absolute -right-12 top-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="app-kicker">Renovo</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                  Reviewable end-of-tenancy decisions for letting agencies.
                </p>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] xl:items-center">
              <div>
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                  Check in. Check out. Decision trail.
                </div>

                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[4.7rem] md:leading-[0.94]">
                  From check-in to claim decision.
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Renovo gives property managers one workspace for check-in evidence, check-out
                  evidence, issues, recommendations, and claim output.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#waitlist"
                    className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Request Early Access
                  </a>
                  <a
                    href="#platform"
                    className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Try Live Demo
                  </a>
                </div>

                <div className="mt-6 grid gap-2 text-xs font-medium text-stone-600 md:grid-cols-2 md:text-sm">
                  {[
                    'Built for UK letting agencies',
                    'Managers approve every decision',
                    'End-of-tenancy specialist, not a generic CRM',
                    'Evidence linked audit trail',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-[5px]" />
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

        <section className="bg-stone-50/60 rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="app-kicker">Your existing setup</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                No integration required to get started
              </h2>
              <p className="mt-4 text-base leading-8 text-stone-700">
                Open a case when notice is served, upload the check in inventory, check out
                report, and move out photos, and keep working in your current property management
                system. Renovo sits alongside your stack from day one.
              </p>
            </div>

            <Link
              href="/how-it-works"
              className="text-sm font-medium text-stone-700 underline-offset-4 hover:text-stone-900 hover:underline lg:self-start"
            >
              How does data get into Renovo? →
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-700">
            {setupItems.map((item) => (
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
          id="how-it-works"
          className="app-surface scroll-mt-28 rounded-[2rem] p-6 md:scroll-mt-32 md:p-8"
        >
          <div>
            <p className="app-kicker">How the review works</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">
              Check in compared with check out. Renovo highlights what changed.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              The opening inventory, check out report, and photos are cross-referenced in one
              place. Renovo drafts the reasoning. A manager decides the outcome.
            </p>
          </div>

          <div className="mt-8 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <ComparisonCard
              eyebrow="Check in · Sept 2023"
              footer="14 Bruntsfield Place · Signed by tenant"
              items={checkInItems}
              variant="good"
            />

            <div className="hidden items-center justify-center px-1 lg:flex">
              <span className="text-xl text-stone-300">→</span>
            </div>

            <ComparisonCard
              eyebrow="Check out · March 2024"
              footer="Check out report · 8 March 2024"
              items={checkOutItems}
              variant="damage"
            />

            <div className="hidden items-center justify-center px-1 lg:flex">
              <span className="text-xl text-stone-300">→</span>
            </div>

            <div className="flex flex-col rounded-[1.6rem] border border-emerald-200 bg-[linear-gradient(160deg,rgba(240,253,244,0.95),rgba(220,252,231,0.7))] p-5">
              <div className="mb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Renovo review
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  Evidence comparison and draft
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-emerald-100 bg-white/90 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                    Step 1 — Documents read
                  </p>
                  <p className="text-xs leading-5 text-stone-600">
                    5 documents processed. The check in inventory is matched against the check out
                    report and photos.
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Step 2 — Mismatch identified
                  </p>
                  <p className="text-xs leading-5 text-stone-600">
                    Carpet staining, wall scuffs, and a broken cupboard door are flagged against
                    the opening condition record.
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-stone-200 bg-white px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Step 3 — Recommendation drafted
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-stone-600">Partial claim</p>
                    <p className="text-base font-semibold text-stone-900">£640.00</p>
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400">Awaiting manager approval</p>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] font-medium text-emerald-700">
                AI drafts · Manager approves
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 border-t border-stone-100 pt-5">
            <span className="flex items-center gap-1.5 px-3 text-sm">
              <span className="font-semibold text-stone-900">5</span>
              <span className="text-stone-500">documents reviewed</span>
            </span>
            <span className="select-none text-xs text-stone-300">·</span>
            <span className="flex items-center gap-1.5 px-3 text-sm">
              <span className="font-semibold text-stone-900">4</span>
              <span className="text-stone-500">issues identified</span>
            </span>
            <span className="select-none text-xs text-stone-300">·</span>
            <span className="flex items-center gap-1.5 px-3 text-sm">
              <span className="font-semibold text-stone-900">£640</span>
              <span className="text-stone-500">recommended claim</span>
            </span>
            <span className="select-none text-xs text-stone-300">·</span>
            <span className="flex items-center gap-1.5 px-3 text-sm">
              <span className="font-semibold text-amber-700">1</span>
              <span className="text-stone-500">awaiting manager review</span>
            </span>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-28 rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(245,243,240,0.95),rgba(238,235,229,0.9))] p-6 md:scroll-mt-32 md:p-7"
        >
          <div className="max-w-4xl">
            <p className="app-kicker text-stone-500">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Built around the real end-of-tenancy workflow
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Renovo follows the path property managers already work through: gather evidence,
              assess issues, review the recommendation, and prepare claim output with the
              reasoning attached.
            </p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
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
          id="platform"
          className="scroll-mt-28 rounded-[2rem] border border-stone-100 bg-[linear-gradient(180deg,rgba(250,247,242,0.4),rgba(255,255,255,0.7))] p-6 md:scroll-mt-32 md:p-7"
        >
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">Product proof</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Try the product before you sign up
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
                Click through a real end-of-tenancy case to see how evidence becomes a reviewed
                recommendation and claim output.
              </p>
            </div>
            <a
              href="#waitlist"
              className="app-primary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Request Early Access
            </a>
          </div>

          <div className="mt-6 space-y-4">
            {productDemo}
            <p className="text-sm leading-7 text-stone-500">
              This is a live interactive preview. Click through each stage to see how Renovo
              handles a real end-of-tenancy case.
            </p>
          </div>
        </section>

        <section
          id="benefits"
          className="scroll-mt-28 rounded-[2rem] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.9),rgba(255,247,230,0.7))] p-6 md:scroll-mt-32 md:p-7"
        >
          <p className="app-kicker">What changes for your team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Faster decisions, with the reasoning intact
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
            Property managers get one place for evidence, issues, and review. The decision trail
            is built as the case moves forward, not recreated later.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">Faster review cycles</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Open the case and start reviewing immediately. No rebuilding context from inbox
                threads, spreadsheets, and PDFs first.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">
                More consistent decisions
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                The same evidence structure and review states help managers reach steadier outcomes
                across branches and cases.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">
                Defensible when challenged
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                If a landlord or tenant pushes back, the rationale and evidence are already
                attached to the case.
              </p>
            </article>
          </div>
        </section>

        <LandingTrustSection points={trustPoints} faqs={trustFaqs} />

        <section id="waitlist" className="app-surface-strong scroll-mt-28 rounded-[2.2rem] p-6 md:scroll-mt-32 md:p-8">
          <div className="grid gap-6 rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="app-kicker">Early access</p>
              <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
                Request early access
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                Join the rollout list if you want a more reviewable end-of-tenancy workflow for
                your agency. We will follow up when capacity opens.
              </p>
              <div className="mt-6 rounded-[1.45rem] border border-emerald-200 bg-emerald-50/85 p-5">
                <p className="text-sm font-semibold text-emerald-950">What happens next</p>
                <p className="mt-2 text-sm leading-7 text-emerald-950/85">
                  We will use these details for rollout contact only. If you already have access,
                  sign in from the top right.
                </p>
                <div className="mt-4">
                  <a
                    href="#platform"
                    className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
                  >
                    Try Live Demo
                  </a>
                </div>
              </div>
            </div>

            <PublicWaitlistForm />
          </div>
        </section>
      </div>
    </main>
  )
}
