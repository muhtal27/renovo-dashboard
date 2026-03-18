import Link from 'next/link'

const proofPoints = [
  {
    title: 'One operational record',
    body: 'Calls, emails, messages, tenancy events, rent activity, and maintenance decisions all stay tied to the same property and case context.',
  },
  {
    title: 'Designed for fast triage',
    body: 'Operators work from a live queue, while landlords, tenants, and contractors each get a focused portal without internal clutter.',
  },
  {
    title: 'Board-ready visibility',
    body: 'Portfolio health, arrears pressure, maintenance approvals, and lease lifecycle risk can all be read from the same operating layer.',
  },
]

const workflow = [
  'Inbound call, message, or portal update arrives',
  'Renovo tags it to the right case, tenancy, and property',
  'Operators act from one queue instead of scattered inboxes',
  'Landlords and contractors stay updated in their own portals',
]

const audienceCards = [
  {
    label: 'Operators',
    summary: 'Run the queue, manage follow-ups, and keep service levels steady when multiple workflows hit at once.',
  },
  {
    label: 'Landlords',
    summary: 'See approvals, active jobs, tenancy signals, and rent visibility without needing a separate update thread.',
  },
  {
    label: 'Tenants and Contractors',
    summary: 'Get the right status, next step, and communication trail from role-based portals already linked to live case data.',
  },
]

const statCards = [
  { value: 'Unified', label: 'Ops layer' },
  { value: 'Role-based', label: 'Portal access' },
  { value: 'Live', label: 'Case context' },
  { value: 'Practical', label: 'Workflow design' },
]

export function PublicHome() {
  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <section className="app-surface-strong overflow-hidden rounded-[2.25rem] p-4 md:p-6">
          <div className="relative overflow-hidden rounded-[1.9rem] border border-stone-200/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(255,255,255,0.55)_42%,rgba(234,243,238,0.65)_72%,rgba(224,236,245,0.55)_100%)] px-6 py-7 md:px-8 md:py-9">
            <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald-200/35 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-10 top-24 h-px bg-gradient-to-r from-transparent via-stone-300/60 to-transparent" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="app-kicker">Renovo AI</p>
                <p className="mt-2 text-sm text-stone-600">Lettings operations platform for high-friction residential workflows</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/login"
                  className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/portal"
                  className="app-secondary-button rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Portal access
                </Link>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px] xl:items-end">
              <div>
                <h1 className="max-w-5xl text-4xl font-semibold tracking-tight md:text-[4.5rem] md:leading-[0.98]">
                  Beautiful operations for messy property reality
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Renovo brings communication, tenancy context, maintenance work, and reporting into
                  one coherent operating system so teams move faster and investors can see a platform
                  with real workflow depth.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Open workspace
                  </Link>
                  <Link
                    href="/login"
                    className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    See operator flow
                  </Link>
                </div>
              </div>

              <aside className="rounded-[1.7rem] border border-stone-200 bg-white/84 p-5 shadow-[0_18px_40px_rgba(55,43,27,0.08)] backdrop-blur">
                <p className="app-kicker">At A Glance</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {statCards.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                      <p className="text-xl font-semibold text-stone-900">{item.value}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-4 rounded-[1.35rem] border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm leading-6 text-emerald-950/80">
                  Built to feel credible in front of operators, landlords, and investors at the same time.
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Why It Lands</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">A practical system, not just another inbox wrapper</h2>
            <div className="mt-6 grid gap-4">
              {proofPoints.map((item) => (
                <article key={item.title} className="rounded-[1.45rem] border border-stone-200 bg-white/90 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Workflow Shape</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">What Renovo actually does</h2>
            <div className="mt-6 space-y-3">
              {workflow.map((item, index) => (
                <article key={item} className="flex gap-4 rounded-[1.45rem] border border-stone-200 bg-white/88 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700">
                    0{index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-7 text-stone-700">{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">Already Connected To The Product</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">The public site now matches the portal language</h2>
            </div>
            <Link
              href="/login"
              className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Enter the platform
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {audienceCards.map((card) => (
              <article key={card.label} className="rounded-[1.55rem] border border-stone-200 bg-white/92 p-5">
                <p className="app-kicker">{card.label}</p>
                <p className="mt-3 text-sm leading-7 text-stone-700">{card.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
