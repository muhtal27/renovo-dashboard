import Image from 'next/image'
import Link from 'next/link'

const whyNow = [
  {
    title: 'Regulation is getting heavier, not lighter',
    body: 'Evidence trails, response standards, safety duties, rent pressure, and compliance dates now take more time to manage properly. That weight lands on the agency first.',
  },
  {
    title: 'Teams are burning time just rebuilding context',
    body: 'One issue can still mean a phone call, an inbox thread, a spreadsheet note, a contractor message, a landlord update, and a second system just to find the tenancy.',
  },
  {
    title: 'When service slips, everybody feels it',
    body: 'Landlords lose confidence, tenants feel ignored, contractors waste visits, and operators start every morning already behind. Annabelle is designed to close those gaps.',
  },
]

const storySteps = [
  {
    step: '01',
    title: 'A real agency day starts before the team is even at the desk',
    body: 'A boiler fails at 06:40. A tenant wants an answer before school run. A landlord asks for an update before the branch opens. That is the kind of day Annabelle is designed for.',
  },
  {
    step: '02',
    title: 'Annabelle keeps the story intact while the work moves',
    body: 'She ties the issue to the right property, tenancy, people, job, and next step so the agency does not start the morning by piecing the situation together from memory.',
  },
  {
    step: '03',
    title: 'People step in where judgement matters most',
    body: 'The team still decides, reassures, approves, and escalates. Annabelle carries the repetitive weight so operators have more energy left for the moments that need a human voice.',
  },
]

const scenarioWins = [
  {
    metric: '30 to 45 mins back',
    title: 'Each time a maintenance issue changes hands',
    body: 'When the tenant report, contractor updates, landlord view, and job notes already sit on one record, the branch stops losing time to retelling the same issue.',
  },
  {
    metric: '2 to 3 hours back a week',
    title: 'Across rent chasing and arrears follow-up',
    body: 'The money work stays with the tenancy, so the agency is not jumping between ledger notes, inbox threads, case updates, and separate reminder lists.',
  },
  {
    metric: 'Hours saved before renewals and move-outs',
    title: 'When dates, people, and next actions already line up',
    body: 'Lease work is easier when notice dates, compliance checkpoints, and communication history are visible together instead of buried across different tools.',
  },
]

const crmNotes = [
  'One tenancy screen with the people, live work, rent position, compliance dates, and next action already connected.',
  'Built for letting agents, but the better experience is felt by landlords, tenants, and contractors as well.',
  'This is how Annabelle gives the team a calmer start to the day instead of another hunt for missing context.',
]

const roleImpact = [
  {
    title: 'Agents get breathing room',
    body: 'Less chasing, less retyping, less bouncing between six systems for one answer.',
  },
  {
    title: 'Landlords get clearer updates',
    body: 'The issue, cost pressure, next step, and current position are easier to understand without another round of chasing.',
  },
  {
    title: 'Tenants get steadier communication',
    body: 'Replies stay tied to the real property and the real issue instead of starting from zero every time.',
  },
  {
    title: 'Contractors get cleaner job context',
    body: 'Access notes, job history, and message trail stay in one place so fewer visits are wasted.',
  },
]

const actions = [
  {
    title: 'Join the waiting list',
    body: 'Commercial licences are not open just yet. We are rolling Annabelle out carefully with a small number of letting agencies first.',
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
    title: 'Read the agency story',
    body: 'Start with the real day-to-day pressure if you want to understand why Annabelle matters now.',
    href: '#story',
    cta: 'Read the story',
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
                <p className="app-kicker">Annabelle by Renovo</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                  Built for letting agents who need the day to feel lighter, steadier, and easier to control.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a href="#story" className="app-secondary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  Read the story first
                </a>
                <a href="#waitlist" className="app-primary-button rounded-full px-5 py-2.5 text-sm font-medium">
                  Join the waiting list
                </a>
              </div>
            </div>

            <div className="relative mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-end">
              <div>
                <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-950/85">
                  One CRM for the whole letting-agency workload
                </div>
                <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-[5rem] md:leading-[0.94]">
                  Annabelle keeps the agency moving when the work does not stop.
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
                  Rules are tighter. Compliance takes longer. Money work is heavier. Landlords, tenants, and contractors still expect quick, clear answers. Annabelle helps a letting agency stay responsive across calls, messages, maintenance, rent, compliance, and landlord updates without asking the team to run on fumes or juggle six tools just to complete one task.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#platform" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    See the CRM proof
                  </a>
                  <a href="#waitlist" className="app-secondary-button rounded-2xl px-5 py-3 text-sm font-medium">
                    Join the waiting list
                  </a>
                </div>
              </div>

              <aside className="rounded-[1.8rem] border border-stone-200 bg-white/88 p-5 shadow-[0_20px_42px_rgba(55,43,27,0.08)] backdrop-blur">
                <p className="app-kicker">Why Agencies Give Her A Chance</p>
                <div className="mt-4 space-y-3">
                  {[
                    'She keeps the communication trail inside one CRM instead of scattered across inboxes and memory.',
                    'She works through the night so the agency does not start every morning blind.',
                    'She helps landlords, tenants, contractors, and operators feel the same joined-up service.',
                    'She gives good teams some energy back instead of asking for more from already stretched people.',
                  ].map((item) => (
                    <div key={item} className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700">
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
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

        <section id="story" className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="app-surface rounded-[2rem] p-6 md:p-7">
            <p className="app-kicker">The real story</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for the moments when a good team is already carrying too much
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-stone-700">
              This is not a theory about property software. It is a response to the real pressure inside a letting agency day.
            </p>
            <div className="mt-6 space-y-3">
              {storySteps.map((item) => (
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
                <p className="app-kicker">Where hours come back</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                  Show what the day feels like when the work is joined up
                </h2>
              </div>
              <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
                Realistic time wins from less chasing and less retelling
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {scenarioWins.map((item) => (
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
              <p className="app-kicker">Real CRM proof</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                A real Annabelle screen, shaped around one tenancy and one live day
              </h2>
            </div>
            <Link href="/login" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
              Open the live sign-in
            </Link>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px] xl:items-start">
            <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white shadow-[0_18px_44px_rgba(55,43,27,0.1)]">
              <Image
                src="/annabelle-crm-snapshot.png"
                alt="Annabelle tenancy CRM screen showing maintenance, rent, people, and next actions on one record"
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
                  This screen shows one Edinburgh tenancy where Annabelle has already tied together a heating issue, contractor booking, landlord update, rent position, compliance date, and next action.
                </p>
              </div>

              {crmNotes.map((item) => (
                <article key={item} className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5 text-sm leading-7 text-stone-700">
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
                If this feels like the right direction, here is the next step
              </h2>
            </div>
            <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
              Built for letting agents, not another generic system
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
              Commercial licences are not open just yet. The waiting list is.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
              We are shaping Annabelle carefully with real operational pressure in mind. If you want early access when more agency slots open, join the waiting list now and we will keep you close to the rollout.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="mailto:hello@renovoai.co.uk?subject=Annabelle%20waiting%20list" className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium">
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
