import Link from 'next/link'

const trustPoints = [
  {
    title: 'Central Communications',
    body: 'Calls, email, WhatsApp, and SMS stay tagged to the right case so teams stop losing context.',
  },
  {
    title: 'Live Operations Queue',
    body: 'Operators triage urgency, handoffs, and follow-ups from one queue instead of five separate tools.',
  },
  {
    title: 'Role-Based Portals',
    body: 'Landlords, tenants, and contractors each get a focused view without exposing internal ops controls.',
  },
]

const highlightItems = [
  'Auto-link communication to case, property, tenancy, and job context',
  'Maintenance, deposits, compliance, and viewings in one records layer',
  'Invite-only access model with secure role routing',
  'Built for UK lettings operations with Scotland workflow support',
]

const stats = [
  { value: '1', label: 'Unified queue' },
  { value: '4', label: 'Portal roles' },
  { value: '24/7', label: 'Case visibility' },
  { value: 'Real-time', label: 'Ops signal' },
]

export function PublicHome() {
  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1320px] space-y-6">
        <section className="app-surface-strong overflow-hidden rounded-[2.1rem] p-6 md:p-8">
          <div className="relative rounded-[1.8rem] border border-stone-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/60 p-6 md:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-200/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <p className="app-kicker">Renovo AI Lettings</p>
              <div className="flex items-center gap-2">
                <Link
                  href="/portal"
                  className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
                >
                  Portal access
                </Link>
                <Link
                  href="/login"
                  className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="relative mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl md:leading-[1.02]">
                  The operations system for modern lettings teams
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Renovo keeps every conversation, case, tenancy, and maintenance decision in one
                  place so your team can respond faster with less friction.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    Open workspace
                  </Link>
                  <Link
                    href="/records/reporting"
                    className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium"
                  >
                    View live reporting layer
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-stone-200 bg-white/85 p-5 backdrop-blur">
                <p className="app-kicker">Operational Snapshot</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {stats.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-stone-200 bg-white p-3">
                      <p className="text-2xl font-semibold leading-none text-stone-900">{item.value}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-500">{item.label}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="app-surface rounded-[1.9rem] p-6 md:p-7">
            <p className="app-kicker">Why Teams Move To Renovo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Everything stays connected</h2>
            <div className="mt-5 grid gap-4">
              {trustPoints.map((item) => (
                <article key={item.title} className="rounded-[1.4rem] border border-stone-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[1.9rem] p-6 md:p-7">
            <p className="app-kicker">Platform Coverage</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for real-world lettings pressure</h2>
            <ul className="mt-6 space-y-3">
              {highlightItems.map((item) => (
                <li key={item} className="rounded-2xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-6 text-stone-700">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5">
              <p className="text-sm font-semibold text-emerald-900">Ready when you are</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                Operators, landlords, tenants, and contractors can all enter through one secure sign-in
                and land in the right workspace automatically.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
