import Link from 'next/link'
import { PublicWaitlistForm } from '@/app/public-waitlist-form'

const overviewMetrics = [
  {
    value: '1 workspace',
    label: 'for evidence, issues, review, and claim output',
  },
  {
    value: 'Human reviewed',
    label: 'AI can draft, but property managers still approve every decision',
  },
  {
    value: 'Claim ready',
    label: 'Recommendations convert into line items with traceable evidence',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Collect the full case',
    body: 'Bring the tenancy, property, deposit claim, documents, and extracted facts into one reviewable workspace.',
  },
  {
    step: '02',
    title: 'Assess the issues',
    body: 'Turn evidence into specific issues with responsibility, severity, and amount pressure visible in one place.',
  },
  {
    step: '03',
    title: 'Draft the decision',
    body: 'Use AI drafting to help frame the recommendation, rationale, and source references without hiding the reasoning.',
  },
  {
    step: '04',
    title: 'Review with control',
    body: 'Property managers submit, approve, reject, or send back recommendations with a full audit trail.',
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

const operatorOutcomes = [
  {
    title: 'Faster review cycles',
    body: 'Property managers stop bouncing between tenancy records, message history, and claim spreadsheets before they can even begin assessing the case.',
  },
  {
    title: 'More consistent decisions',
    body: 'The same workflow, evidence structure, and review states help teams reach steadier outcomes across branches and property managers.',
  },
  {
    title: 'Clearer challenge handling',
    body: 'When a landlord or tenant pushes back, the rationale and evidence trail are already visible instead of needing to be recreated.',
  },
]

const supportingAreas = [
  {
    title: 'Deposit claims',
    body: 'Keep disputed amounts, claim totals, and line-item output close to the EOT decision.',
  },
  {
    title: 'Tenancies',
    body: 'Ground every recommendation in tenancy dates, occupant context, and linked documents.',
  },
  {
    title: 'Properties',
    body: 'Use property history and address context without leaving the main decision flow.',
  },
  {
    title: 'Knowledge',
    body: 'Support review with approved guidance that can be cited when it is useful, not forced.',
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
          <div className="app-surface flex items-center justify-between rounded-[1.45rem] border border-stone-200/85 px-4 py-3 md:px-5">
            <Link href="/" className="app-kicker">
              Renovo
            </Link>

            <nav className="flex items-center gap-2 md:gap-3" aria-label="Homepage">
              <a
                href="#workflow"
                className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 md:inline-flex"
              >
                Workflow
              </a>
              <a
                href="#platform"
                className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 md:inline-flex"
              >
                Product
              </a>
              <a
                href="#waitlist"
                className="inline-flex text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                Early access
              </a>
              <Link
                href="/login"
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                Sign in
              </Link>
            </nav>
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
                  The end-of-tenancy decision engine for letting agencies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#workflow"
                  className="app-secondary-button rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  See the workflow
                </a>
                <a
                  href="#waitlist"
                  className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Join the list
                </a>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.14fr)_360px] xl:items-end">
              <div>
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                  Evidence in. Reviewable decision out.
                </div>

                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[4.7rem] md:leading-[0.94]">
                  From messy move out to claim ready — in one flow.
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Renovo brings together documents, extracted facts, issues, and recommendations so
                  property managers can make fairer end-of-tenancy decisions faster — without
                  losing the reasoning behind them.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Open the live sign-in
                  </Link>
                  <a
                    href="#waitlist"
                    className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Request early access
                  </a>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-stone-600 md:text-sm">
                  {[
                    'Built for UK letting agencies',
                    'Human reviewed decisions only',
                    'End-of-tenancy specialist — not a generic CRM',
                    'Deposit scheme compliant audit trail',
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-stone-200 bg-white/85 px-3 py-2"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.85rem] border border-stone-200 bg-white/90 p-5 shadow-[0_20px_42px_rgba(55,43,27,0.08)] backdrop-blur">
                <p className="app-kicker">Why it lands</p>
                <div className="mt-4 space-y-3">
                  {overviewMetrics.map((item) => (
                    <article
                      key={item.value}
                      className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-stone-900">{item.value}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{item.label}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="app-kicker">Your existing setup</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                No integration required to get started
              </h2>
              <p className="mt-4 text-base leading-8 text-stone-700">
                Property managers open a case when notice is served and upload documents directly
                — check in inventory, check out report, move out photos. Renovo works alongside
                your current property management software. Nothing in your existing stack changes.
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

        <section id="workflow" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Purpose-built around the real end-of-tenancy review path
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Renovo is not a generic assistant bolted onto a property dashboard. It is structured
              around the property manager journey from evidence intake to reviewed recommendation and claim
              output.
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

        <section id="platform" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">Product proof</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Try the product before you sign up — click through a real end-of-tenancy case.
              </h2>
            </div>
            <Link
              href="/login"
              className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Open the live sign-in
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {productDemo}
            <p className="text-sm leading-7 text-stone-500">
              This is a live interactive preview. Click through each stage to see how Renovo
              handles a real end-of-tenancy case.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Property manager outcome</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Stronger decisions without hiding the reasoning
            </h2>

            <div className="mt-6 space-y-4">
              {operatorOutcomes.map((item) => (
                <article key={item.title} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Supporting areas</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Everything around the decision stays close, but secondary
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Deposit claims, tenancies, properties, and knowledge support the end-of-tenancy
              engine. They no longer compete with it.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {supportingAreas.map((item) => (
                <article key={item.title} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="waitlist" className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
          <div className="grid gap-6 rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(240,247,243,0.94))] px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <p className="app-kicker">Early access</p>
              <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
                Join the Renovo rollout list without leaving the page
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                We are opening Renovo carefully with agencies that want a more reviewable,
                specialist end-of-tenancy workflow. Leave your details and we will follow up when
                rollout capacity opens.
              </p>
              <div className="mt-6 rounded-[1.45rem] border border-emerald-200 bg-emerald-50/85 p-5">
                <p className="text-sm font-semibold text-emerald-950">What happens next</p>
                <p className="mt-2 text-sm leading-7 text-emerald-950/85">
                  We will use these details for rollout contact only. Existing users can sign in
                  immediately from the live entrance.
                </p>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium"
                  >
                    Existing users sign in here
                  </Link>
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
