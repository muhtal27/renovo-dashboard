import Link from 'next/link'

const pressurePoints = [
  {
    title: 'The inbox never really sleeps',
    body: 'Voicemails, maintenance chasers, rent pressure, compliance reminders, and viewing follow-ups tend to arrive in waves. Annabelle keeps the trail intact when the team cannot keep absorbing context-switching.',
  },
  {
    title: 'Every answer needs the right property context',
    body: 'A message only matters if it stays tied to the right tenancy, job, property, and case. Annabelle is designed around shared records so teams stop rebuilding the story from scratch.',
  },
  {
    title: 'Human energy should go on judgement, not chasing',
    body: 'Lettings teams still need empathy, approvals, and decisions. Annabelle is there to hold the queue, capture updates, keep people informed, and prevent the important work from slipping overnight.',
  },
]

const operatingLayers = [
  {
    label: 'Annabelle Desk',
    title: 'A live operator space for the hard days',
    body: 'The queue, cases, messages, calls, recordings, follow-ups, and operational pulse already live in one surface so the team can act from facts instead of scattered inboxes.',
    href: '/login',
    cta: 'See the operator entrance',
  },
  {
    label: 'Linked Records',
    title: 'Property, tenancy, job, rent, and compliance stay connected',
    body: 'This reality is built so communication is never left floating on its own. Annabelle keeps the operational record tied back to the property and the live work around it.',
    href: '/login',
    cta: 'Go to the live workspace',
  },
  {
    label: 'Role Portals',
    title: 'Landlords, tenants, and contractors see the right slice',
    body: 'Instead of forwarding long email chains, each audience can be routed into a focused experience that reflects their role and the case state already held in the platform.',
    href: '/portal',
    cta: 'Open the portal entrance',
  },
]

const storySteps = [
  {
    step: '01',
    title: 'A real agency day starts before anyone is ready for it',
    body: 'A boiler fails at 06:40. A landlord asks for an update at 07:10. A contractor replies while the team is already handling viewings, arrears, and inbox spillover. That is the operating reality Annabelle is built for.',
  },
  {
    step: '02',
    title: 'Annabelle holds the line while the team catches breath',
    body: 'She keeps conversations tagged, keeps the next step visible, and keeps the property story intact across calls, messages, maintenance, rent, and lease events so nothing gets lost between shifts.',
  },
  {
    step: '03',
    title: 'People step in where people add the most value',
    body: 'Operators still decide, reassure, approve, and escalate. Annabelle removes the repetitive drag so the team can sound calmer, move faster, and finish the day with less damage to their energy.',
  },
]

const roleCards = [
  {
    role: 'Lettings Operators',
    body: 'See the queue, urgency, follow-ups, unowned work, and recent communication in one place. Annabelle is there so operators are not forced to remember everything manually.',
  },
  {
    role: 'Landlords',
    body: 'Get clearer visibility on maintenance, rent pressure, approvals, and portfolio movement without chasing the team for a stitched-together answer.',
  },
  {
    role: 'Tenants',
    body: 'Receive updates that stay connected to the real issue and the real property, rather than feeling like each message starts from zero again.',
  },
  {
    role: 'Contractors',
    body: 'Work from cleaner job context, notes, approvals, and message history so fewer site visits are wasted and fewer updates go missing.',
  },
]

const practicalProof = [
  'Runs against one shared operational record instead of isolated inboxes.',
  'Built around live case context, not just chatbot answers.',
  'Supports operator, landlord, tenant, and contractor journeys from the same working foundation.',
  'Designed for 24/7 service continuity without pretending humans are replaceable.',
  'Useful for agency leadership because the work is visible, measurable, and traceable.',
]

const workingAreas = [
  'Calls, messages, email, tenancy activity, maintenance, and reporting linked back to the same live case context.',
  'Maintenance, rent, lease lifecycle, and compliance living in the same operational story.',
  'Scotland-specific knowledge to ground answers before widening scope.',
  'Portal routing that sends each signed-in user to the right destination automatically.',
]

const actions = [
  {
    title: 'Speak to Annabelle',
    body: 'Start a conversation with Annabelle and hear how she handles real property questions in a way that feels calm, informed, and useful.',
    href: 'tel:01313812887',
    cta: 'Start a conversation',
    tone: 'primary',
  },
  {
    title: 'Try the live entry points',
    body: 'Use the real login and portal routes already connected to the working system. That lets you explore the journey from the front door rather than from a slide deck.',
    href: '/login',
    cta: 'Open the live sign-in',
    tone: 'secondary',
  },
  {
    title: 'Start with the story',
    body: 'If you want to understand why Annabelle matters, read the operating story first. The rest of the site will make more sense once the pressure behind it is clear.',
    href: '#story',
    cta: 'Read the agency story',
    tone: 'secondary',
  },
]

function ActionLink({ href, cta, tone }: { href: string; cta: string; tone: 'primary' | 'secondary' }) {
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
                <p className="app-kicker">Annabelle By Renovo</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                  The all-in-one CRM and always-on operational story for modern letting agencies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href="#story" className="app-secondary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  Read the story first
                </a>
                <a href="tel:01313812887" className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  Speak to Annabelle
                </a>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-end">
              <div>
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                  24/7 cover for the operational reality agencies actually live with
                </div>
                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[5rem] md:leading-[0.94]">
                  Annabelle keeps the agency moving when the work does not politely wait.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  She does not clock off, call in sick, or lose the thread. Annabelle is the living operational reality that helps a letting agency stay responsive across calls, messages, maintenance, rent, compliance, landlord updates, and day-to-day coordination while the human team protects its time and energy for judgement, reassurance, and decisions. It means no juggling six different systems just to complete one task.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="tel:01313812887" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    Start with Annabelle
                  </a>
                  <Link href="/login" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    Enter the live workspace
                  </Link>
                </div>
              </div>

              <aside className="rounded-[1.8rem] border border-stone-200 bg-white/88 p-5 shadow-[0_20px_42px_rgba(55,43,27,0.08)] backdrop-blur">
                <p className="app-kicker">Why Agencies Give Her A Chance</p>
                <div className="mt-4 space-y-3">
                  {[
                    'She keeps the communication trail intact inside one joined-up CRM.',
                    'She reduces overnight and out-of-hours drift.',
                    'She gives operators a calmer start to the day.',
                    'She makes leadership visibility less dependent on heroic effort.',
                  ].map((item) => (
                    <div key={item} className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[1.35rem] border border-sky-200 bg-sky-50/90 px-4 py-4 text-sm leading-6 text-sky-950/80">
                  Annabelle is not presented as a gimmick. She earns trust by holding operational context together so the agency can deliver a steadier service.
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="story" className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">The Real Story</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for the moments when a good team is already carrying too much
            </h2>
            <div className="mt-6 space-y-4">
              {pressurePoints.map((item) => (
                <article key={item.title} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Why Annabelle Exists</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">A working story told from the agency floor</h2>
            <div className="mt-6 space-y-3">
              {storySteps.map((item) => (
                <article key={item.step} className="rounded-[1.45rem] border border-stone-200 bg-white/88 p-5">
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
        </section>

        <section id="actions" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">What To Do Next</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                If the story feels true, here is how to step into it
              </h2>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
              One joined-up place to work, respond, and stay in control
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {actions.map((item) => (
              <article key={item.title} className="rounded-[1.55rem] border border-stone-200 bg-white/92 p-5">
                <p className="app-kicker">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-stone-700">{item.body}</p>
                <div className="mt-5">
                  <ActionLink href={item.href} cta={item.cta} tone={item.tone as 'primary' | 'secondary'} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="platform" className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 border-b app-divider pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker">How Annabelle Works In Practice</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Not a brochure promise. A working operational reality.
              </h2>
            </div>
            <Link href="/login" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
              See the live entrances
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {operatingLayers.map((item) => (
              <article key={item.title} className="rounded-[1.55rem] border border-stone-200 bg-white/92 p-5">
                <p className="app-kicker">{item.label}</p>
                <h3 className="mt-3 text-xl font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-700">{item.body}</p>
                <Link href={item.href} className="app-primary-button mt-5 inline-flex rounded-full px-4 py-2.5 text-sm font-medium">
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Why The CRM Matters</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Annabelle brings relief because everything sits in one place, not across six disconnected tools
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {practicalProof.map((item) => (
                <article key={item} className="rounded-[1.3rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                  {item}
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-[1.55rem] border border-emerald-200 bg-emerald-50/90 p-5">
              <p className="app-kicker text-emerald-900">The Value To The Team</p>
              <p className="mt-3 text-base leading-8 text-emerald-950/85">
                Annabelle gives the agency a better chance of staying organised, responsive, and humane. The value is not only speed. It is the ability to keep service quality up without draining the people carrying the business.
              </p>
            </div>
          </div>

          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">Who Feels The Benefit</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Every role gets a clearer experience</h2>
            <div className="mt-6 space-y-3">
              {roleCards.map((item) => (
                <article key={item.role} className="rounded-[1.35rem] border border-stone-200 bg-white/90 p-4">
                  <h3 className="text-base font-semibold text-stone-900">{item.role}</h3>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-6 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)]">
            <div>
              <p className="app-kicker">Already Inside Annabelle</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                The showcase is connected to a working reality that already has operational depth
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                This is not a blank marketing shell. The world behind Annabelle already includes operator queue handling, linked records, maintenance, rent, lease lifecycle, reporting, portals, and a Scotland knowledge layer inside one joined-up CRM That matters because the story on this page is supported by a real structure underneath it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
                  Access the live sign-in
                </Link>
                <Link href="/portal" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                  Open the portal entrance
                </Link>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-stone-200 bg-white/92 p-5">
              <p className="app-kicker">Working Areas</p>
              <div className="mt-4 space-y-3">
                {workingAreas.map((item) => (
                  <div key={item} className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="app-surface-strong rounded-[2.2rem] p-6 md:p-8">
          <div className="rounded-[1.8rem] border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,248,244,0.92))] px-6 py-7 md:px-8 md:py-9">
            <p className="app-kicker">Final Thought</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-4xl">
              Give Annabelle a chance if your agency needs steadier service without asking your people to run on fumes.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
              She brings value because she holds the operational thread together around the clock, helps the team recover breathing room, and turns messy letting agency work into a clearer system that can actually be managed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="tel:01313812887" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
                Speak to Annabelle now
              </a>
              <Link href="/login" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                Try the live journey
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
