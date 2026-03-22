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
              <Link
                href="/how-it-works"
                className="hidden text-sm font-medium text-stone-600 hover:text-stone-900 md:inline-flex"
              >
                How it works
              </Link>
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

                <div className="mt-6 grid gap-2 text-xs font-medium text-stone-600 md:grid-cols-2 md:text-sm">
                  {[
                    'Built for UK letting agencies',
                    'Human reviewed decisions only',
                    'End-of-tenancy specialist — not a generic CRM',
                    'Deposit scheme compliant audit trail',
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

        <section className="bg-stone-50/60 rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
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

        <section className="app-surface rounded-[2rem] p-6 md:p-8">
          <div>
            <p className="app-kicker">How the review works</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900 md:text-3xl">
              Check in meets check out. Renovo finds what changed.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              Every issue is cross-referenced against the opening inventory. The AI drafts a
              rationale for each one. Your manager decides.
            </p>
          </div>

          <div className="mt-8 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <div className="rounded-[1.6rem] border border-emerald-100 bg-[linear-gradient(180deg,rgba(249,250,251,0.95),rgba(240,253,244,0.7))] p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Check in · Sept 2023
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-emerald-100/80 bg-white/90 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">Living room — Carpet</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    Professionally cleaned. No marks or staining.
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-emerald-100/80 bg-white/90 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">Master bedroom — Walls</p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    Freshly painted. Neutral white throughout.
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-emerald-100/80 bg-white/90 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">
                    Kitchen — Cupboard doors
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    All intact. Hinges secure. No damage noted.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-stone-400">
                14 Bruntsfield Place · Signed by tenant
              </p>
            </div>

            <div className="hidden items-center justify-center px-1 lg:flex">
              <span className="text-xl text-stone-300">→</span>
            </div>

            <div className="rounded-[1.6rem] border border-amber-100 bg-[linear-gradient(180deg,rgba(250,250,249,0.95),rgba(255,251,235,0.75))] p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Check out · March 2024
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-amber-100/80 bg-amber-50/55 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">Living room — Carpet</p>
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    Large wine stain, approx. 30cm. Right corner near sofa.
                  </p>
                  <p className="mt-1 text-[10px] text-stone-400">📷 Photo evidence attached</p>
                </div>

                <div className="rounded-[1.1rem] border border-amber-100/80 bg-amber-50/55 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">Master bedroom — Walls</p>
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    Multiple scuff marks. Patch repaint required.
                  </p>
                  <p className="mt-1 text-[10px] text-stone-400">📷 Photo evidence attached</p>
                </div>

                <div className="rounded-[1.1rem] border border-amber-100/80 bg-amber-50/55 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">
                    Kitchen — Cupboard door
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-700">
                    Left door hinge broken. Door detached.
                  </p>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-stone-400">
                Check out report · 8 March 2024
              </p>
            </div>

            <div className="hidden items-center justify-center px-1 lg:flex">
              <span className="text-xl text-stone-300">→</span>
            </div>

            <div className="flex flex-col rounded-[1.6rem] border border-emerald-200 bg-[linear-gradient(160deg,rgba(240,253,244,0.95),rgba(220,252,231,0.7))] p-5">
              <div className="mb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Renovo review
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  Cross-referencing evidence
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.1rem] border border-emerald-100 bg-white/90 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                    Step 1 — Documents read
                  </p>
                  <p className="text-xs leading-5 text-stone-600">
                    5 documents processed. Check in inventory matched against check out report and
                    check out photographs.
                  </p>
                </div>

                <div className="rounded-[1.1rem] border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Step 2 — Mismatch identified
                  </p>
                  <p className="text-xs leading-5 text-stone-600">
                    Carpet staining not present at check in. Bedroom wall scuffs exceed fair wear
                    and tear threshold. Cupboard door broken.
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
                AI drafted · Manager decides
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

        <section id="workflow" className="bg-[linear-gradient(135deg,rgba(245,243,240,0.95),rgba(238,235,229,0.9))] rounded-[2rem] border border-stone-200 p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker text-stone-500">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
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

        <section id="platform" className="bg-[linear-gradient(180deg,rgba(250,247,242,0.4),rgba(255,255,255,0.7))] rounded-[2rem] border border-stone-100 p-6 md:p-7">
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

        <section className="bg-[linear-gradient(135deg,rgba(255,251,235,0.9),rgba(255,247,230,0.7))] rounded-[2rem] border border-amber-100 p-6 md:p-7">
          <p className="app-kicker">What changes for your team</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Stronger decisions without hiding the reasoning
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
            Property managers get one place for evidence, issues, and review. Decisions are
            documented as they are made. Challenges are answered with a trail that already exists.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">Faster review cycles</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                No more rebuilding context from inbox threads, spreadsheets, and PDFs before you
                can even begin assessing the case. Everything is already in one place when you open
                it.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">
                More consistent decisions
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                The same evidence structure, issue categories, and review states mean different
                managers reach steadier outcomes — across branches and across cases.
              </p>
            </article>
            <article className="rounded-[1.45rem] border border-amber-100/80 bg-white/80 p-5">
              <h3 className="text-base font-semibold text-stone-900">
                Defensible when challenged
              </h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                When a landlord or tenant pushes back, the rationale and evidence trail are already
                there. You are not recreating the reasoning from memory.
              </p>
            </article>
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
