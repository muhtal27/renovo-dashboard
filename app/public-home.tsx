import Image from 'next/image'
import Link from 'next/link'

const whyNow = [
  {
    title: 'Deposits and disputes are harder to manage at scale',
    body: 'Check-out reviews, evidence trails, tenant challenges, and landlord expectations all create manual decision work. The pressure is not just answering messages. It is making fair, consistent decisions quickly.',
  },
  {
    title: 'Property teams lose hours rebuilding context',
    body: 'One issue can still mean inbox threads, phone calls, contractor updates, ledger checks, tenancy records, and scattered notes. Teams waste time piecing the case together before they can even decide what to do.',
  },
  {
    title: 'Inconsistent decisions create delays and mistrust',
    body: 'When teams handle similar cases differently, deposits drag on, tenants push back, landlords lose confidence, and operators spend more time defending decisions than making progress.',
  },
]

const decisionAreas = [
  {
    title: 'Deposit decisions',
    body: 'Review evidence, compare reports, and support fairer deduction outcomes with clear reasoning.',
  },
  {
    title: 'End-of-tenancy workflows',
    body: 'Keep move-out activity, evidence, communication, and next steps connected in one operational flow.',
  },
  {
    title: 'Maintenance and approvals',
    body: 'Bring together issue history, job context, contractor updates, and approval pressure without losing the thread.',
  },
]

const outcomeWins = [
  {
    metric: '30 to 45 mins back',
    title: 'Each time a case changes hands',
    body: 'When the property, tenancy, people, evidence, and next action already sit together, operators stop wasting time retelling and reconstructing the issue.',
  },
  {
    metric: 'Hours back each week',
    title: 'Across deposits, maintenance, and follow-up',
    body: 'Decision work moves faster when teams are not bouncing between inboxes, CRM notes, contractor messages, and separate task lists.',
  },
  {
    metric: 'More consistency across the team',
    title: 'When decisions follow the same logic',
    body: 'Renovo helps agencies standardise how they review cases, justify outcomes, and move work forward.',
  },
]

const platformNotes = [
  'One operational record with tenancy context, live work, people, communication, and next actions already connected.',
  'Built for letting agents handling real operational pressure, not generic customer support workflows.',
  'Designed to reduce admin and decision drift, while keeping the team in control where judgement matters most.',
]

const roleImpact = [
  {
    title: 'Agents get breathing room',
    body: 'Less chasing, less retyping, and less context switching before the real work can begin.',
  },
  {
    title: 'Landlords get clearer outcomes',
    body: 'The issue, current position, cost pressure, and next step are easier to understand without another round of chasing.',
  },
  {
    title: 'Tenants get steadier handling',
    body: 'Responses stay tied to the real tenancy record and the real issue instead of starting from zero each time.',
  },
  {
    title: 'Contractors get cleaner context',
    body: 'Access notes, job history, and message trail stay connected so fewer visits are wasted.',
  },
]

const actions = [
  {
    title: 'Join the waiting list',
    body: 'Commercial rollout is still limited. We are opening Renovo carefully with a small number of agencies first.',
    href: '#waitlist',
    cta: 'Join the waiting list',
    tone: 'primary',
  },
  {
    title: 'See the live sign-in',
    body: 'If you already have access, step into the working product from the real entrance.',
    href: '/login',
    cta: 'Open the live sign-in',
    tone: 'secondary',
  },
  {
    title: 'See the product proof',
    body: 'Start with the live workflow view and see how Renovo connects decisions across the tenancy.',
    href: '#platform',
    cta: 'View the platform',
    tone: 'secondary',
  },
]

function ActionLink({
  href,
  cta,
  tone,
}: {
  href: string
  cta: string
  tone: 'primary' | 'secondary'
}) {
  const className =
    tone === 'primary'
      ? 'app-primary-button inline-flex rounded-full px-4 py-2.5 text-sm font-medium'
      : 'app-secondary-button inline-flex rounded-full px-4 py-2.5 text-sm font-medium'

  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {cta}
      </Link>
    )
  }

  return (
    <a href={href} className={className}>
      {cta}
    </a>
  )
}

export function PublicHome() {
  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1380px] space-y-6">
        <section className="app-surface-strong overflow-hidden rounded-[2.4rem] p-4 md:p-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/85 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.58)_35%,rgba(233,244,239,0.75)_67%,rgba(225,235,245,0.68)_100%)] px-6 py-7 md:px-10 md:py-10">
            <div className="pointer-events-none absolute -right-12 top-0 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-64 w-64 rounded-full bg-amber-200/25 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-10 top-24 h-px bg-gradient-to-r from-transparent via-stone-300/60 to-transparent" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="app-kicker">Renovo AI</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                  AI decision engine for letting agencies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href="#platform" className="app-secondary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  See the product
                </a>
                <a href="#waitlist" className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  Join the waiting list
                </a>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-end">
              <div>
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                  While others automate conversations, we automate decisions.
                </div>

                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[5rem] md:leading-[0.94]">
                  Property management AI that makes decisions, not just replies.
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Renovo helps letting agents automate deposit decisions, disputes, maintenance workflows,
                  and end-of-tenancy operations — reducing manual admin, inconsistency, and delays across
                  the tenancy lifecycle.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#platform" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    See the workflow proof
                  </a>
                  <a href="#waitlist" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    Join the waiting list
                  </a>
                </div>
              </div>

              <aside className="rounded-[1.8rem] border border-stone-200 bg-white/88 p-5 shadow-[0_20px_42px_rgba(55,43,27,0.08)] backdrop-blur">
                <p className="app-kicker">Why agencies lean in</p>
                <div className="mt-4 space-y-3">
                  {[
                    'Automates operational decisions, not just tenant communication.',
                    'Reduces time spent reviewing evidence, chasing context, and defending outcomes.',
                    'Standardises decisions across teams and branches.',
                    'Turns messy tenancy data into clear next actions.',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="max-w-4xl">
            <p className="app-kicker">The wedge</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Most AI tools answer questions. Renovo answers: what should happen next?
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              Renovo is built for the hardest part of property management — making consistent, fair
              decisions across deposits, maintenance, and tenancy workflows. It helps teams move from
              scattered evidence to a clear operational next step.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'What damage is tenant-responsible?',
              'What counts as fair wear and tear?',
              'What deduction is reasonable?',
              'What should happen next?',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-stone-200 bg-white/92 px-5 py-4 text-sm leading-7 text-stone-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {whyNow.map((item) => (
            <article key={item.title} className="app-surface rounded-[2rem] p-6 md:p-7">
              <p className="app-kicker">Why now</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {decisionAreas.map((item) => (
            <article key={item.title} className="app-surface rounded-[2rem] p-6 md:p-7">
              <p className="app-kicker">What Renovo does</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Why it matters</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for the decisions that cost the most time, money, and trust
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
              The real pain inside a letting agency is not just communication volume. It is the
              judgement-heavy work that slows cases down: deposits, evidence review, maintenance
              approvals, tenancy coordination, and deciding what should happen next.
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  step: '01',
                  title: 'Gather the full case context',
                  body: 'Bring together the property, tenancy, people, communication, work history, and next action in one operational record.',
                },
                {
                  step: '02',
                  title: 'Support the decision, not just the message',
                  body: 'Help teams understand what the issue is, what evidence matters, and what action should be taken next.',
                },
                {
                  step: '03',
                  title: 'Keep humans in control where judgement matters',
                  body: 'Operators still review, approve, reassure, and escalate. Renovo removes repetitive admin and decision drift around them.',
                },
              ].map((item) => (
                <article key={item.step} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="app-kicker">Where time comes back</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                  The payoff is less chasing, less retelling, and faster case movement
                </h2>
              </div>
              <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
                Realistic gains from better operational flow
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {outcomeWins.map((item) => (
                <article key={item.title} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
                  <p className="app-kicker">{item.metric}</p>
                  <h3 className="mt-3 text-xl font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">Product proof</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                A real Renovo workflow, shaped around one tenancy and one live case
              </h2>
            </div>
            <Link
              href="/login"
              className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Open the live sign-in
            </Link>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-start">
            <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white shadow-[0_18px_44px_rgba(55,43,27,0.1)]">
              <Image
                src="/annabelle-crm-snapshot.png"
                alt="Renovo workflow screen showing tenancy context, maintenance, people, and next actions on one record"
                width={1600}
                height={1200}
                className="h-auto w-full"
                priority
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.55rem] border border-sky-200 bg-sky-50/85 p-5">
                <p className="app-kicker text-sky-950">What you are looking at</p>
                <p className="mt-3 text-sm leading-7 text-sky-950/85">
                  This screen shows how Renovo connects tenancy context, live work, communication,
                  maintenance pressure, and next actions into one operational flow so teams do not have
                  to reconstruct the case manually.
                </p>
              </div>

              {platformNotes.map((item) => (
                <article
                  key={item}
                  className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5 text-sm leading-7 text-stone-700"
                >
                  {item}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="actions" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">What to do next</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Stop using AI just to answer messages
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
                Use AI to make better property decisions — faster, fairer, and at scale.
              </p>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
              Built for letting agencies under real operational pressure
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {actions.map((item) => (
              <article key={item.title} className="rounded-[1.55rem] border border-stone-200 bg-white/92 p-5">
                <p className="app-kicker">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-700">{item.body}</p>
                <div className="mt-5">
                  <ActionLink
                    href={item.href}
                    cta={item.cta}
                    tone={item.tone as 'primary' | 'secondary'}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-4">
          {roleImpact.map((item) => (
            <article key={item.title} className="app-surface rounded-[2rem] p-6">
              <p className="app-kicker">Who feels it</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section id="waitlist" className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
          <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,248,244,0.92))] px-6 py-7 md:px-8 md:py-9">
            <p className="app-kicker">Waiting list</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
              Commercial rollout is limited for now. The waiting list is open.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
              We are shaping Renovo with real tenancy operations in mind. If you want early access as
              more agency slots open, join the waiting list and stay close to the rollout.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="mailto:hello@renovoai.co.uk?subject=Renovo%20waiting%20list"
                className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium"
              >
                Join the waiting list
              </a>
              <Link href="/login" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                Existing users sign in here
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
  }