export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const tenancyList = [
  {
    name: '28 Warrender Park Road',
    location: 'Edinburgh EH9',
    summary: 'No heating case live · contractor booked 14:00',
    state: 'Active',
    selected: true,
  },
  {
    name: '14 Henderson Row',
    location: 'Edinburgh EH3',
    summary: 'Lease review due in 11 days',
    state: 'Renewal',
    selected: false,
  },
  {
    name: '7 Shoregate',
    location: 'Leith EH6',
    summary: 'Rent received · no open work',
    state: 'Clear',
    selected: false,
  },
  {
    name: '56 King Street',
    location: 'Stirling FK8',
    summary: 'Deposit query waiting on evidence',
    state: 'Deposit',
    selected: false,
  },
]

const timeline = [
  {
    time: '06:40',
    title: 'Tenant reported no heating through the portal',
    detail:
      'Annabelle opened the case, tagged the tenancy, and logged the boiler pressure loss before the office opened.',
  },
  {
    time: '07:05',
    title: 'Acknowledgement sent with the right property context',
    detail:
      'Tenant received a clear update without the team needing to rebuild the story from calls, notes, and inboxes.',
  },
  {
    time: '08:10',
    title: 'Contractor triage and access note captured',
    detail:
      'Site contact, preferred slot, and access details stayed on the job record for the 14:00 visit.',
  },
  {
    time: '08:35',
    title: 'Landlord updated automatically',
    detail:
      'The owner saw the issue, next step, and spend cap position without ringing the branch for a stitched-together answer.',
  },
]

const comms = [
  {
    from: 'Tenant',
    channel: 'Portal message',
    body: 'Heating dropped overnight. Pressure is below 1 bar and the flat is cold this morning.',
  },
  {
    from: 'Annabelle',
    channel: 'Reply',
    body:
      'We have opened the maintenance case, tagged the property, and booked remote triage while the team comes online.',
  },
  {
    from: 'Contractor',
    channel: 'WhatsApp',
    body:
      'Can attend at 14:00. Please confirm tenant access and whether there is any visible leak around the boiler.',
  },
]

const people = [
  { label: 'Tenants', value: 'Aisha Rahman · Yusuf Rahman' },
  { label: 'Landlord', value: 'Fiona McLeod' },
  { label: 'Contractor', value: 'Murray Heating Services' },
  { label: 'Property manager', value: 'Admin User' },
]

const taskList = [
  'Confirm tenant is home for the 14:00 call-out',
  'Keep the landlord updated if parts are needed',
  'Check boiler pressure reading after contractor visit',
  'Review EICR slot before 24 April',
]

export default function CrmShowcasePage() {
  return (
    <main className="min-h-screen bg-[#f4efe7] px-6 py-6 text-stone-900">
      <div className="mx-auto max-w-[1520px] space-y-5">
        <section className="app-surface-strong overflow-hidden rounded-[2rem] p-6">
          <div className="rounded-[1.7rem] border border-stone-200/90 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(255,255,255,0.8)_38%,rgba(233,244,239,0.7)_100%)] px-6 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-4xl">
                <p className="app-kicker">Annabelle CRM</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                  Tenancy control centre for a real letting-agency day
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
                  One screen holds the tenancy, the people, the live maintenance job, rent position,
                  compliance dates, and the next action so the team can answer quickly without stitching
                  six systems together.
                </p>
              </div>

              <div className="grid min-w-[320px] gap-3 sm:grid-cols-2">
                {[
                  'Active tenancy',
                  'Next action 14:00',
                  'Rent clear this month',
                  'EICR due 24 Apr',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] border border-stone-200 bg-white/92 px-4 py-3 text-sm font-medium text-stone-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="app-surface rounded-[1.8rem] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="app-kicker">Tenancies</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Today&apos;s live book</h2>
              </div>
              <div className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
                42 active
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {tenancyList.map((tenancy) => (
                <article
                  key={tenancy.name}
                  className={`rounded-[1.35rem] border p-4 ${
                    tenancy.selected
                      ? 'app-selected-card'
                      : 'border-stone-200 bg-white/90 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{tenancy.name}</p>
                      <p className="text-xs text-stone-500">{tenancy.location}</p>
                    </div>
                    <div className="rounded-full border border-stone-200 bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                      {tenancy.state}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{tenancy.summary}</p>
                </article>
              ))}
            </div>
          </aside>

          <div className="space-y-5">
            <section className="app-surface rounded-[1.8rem] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="app-kicker">Active tenancy</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    28 Warrender Park Road, Edinburgh EH9
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-600">
                    The tenancy is current on rent, the heating issue is live, the contractor is booked,
                    and the next compliance date is already visible on the same record.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900">
                  Case linked · maintenance live · next action owned
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Monthly rent', value: '£1,350', tone: 'border-sky-200 bg-sky-50/90 text-sky-950' },
                  { label: 'Outstanding', value: '£0', tone: 'border-emerald-200 bg-emerald-50/90 text-emerald-950' },
                  { label: 'Deposit held', value: '£1,550', tone: 'border-stone-200 bg-white text-stone-900' },
                  { label: 'Open cases', value: '2', tone: 'border-amber-200 bg-amber-50/90 text-amber-950' },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.35rem] border p-4 ${card.tone}`}>
                    <p className="app-kicker">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
              <article className="app-surface rounded-[1.8rem] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="app-kicker">Live case</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                      No heating reported before opening time
                    </h3>
                  </div>
                  <div className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                    urgent
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Annabelle kept the issue tagged to the right property, tenancy, people, and job before
                  a human operator picked it up. That means the team starts with context instead of a blank page.
                </p>

                <div className="mt-5 space-y-3">
                  {timeline.map((item) => (
                    <div
                      key={item.time}
                      className="grid gap-3 rounded-[1.25rem] border border-stone-200 bg-white/92 p-4 md:grid-cols-[72px_minmax(0,1fr)]"
                    >
                      <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
                        {item.time}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-600">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="app-surface rounded-[1.8rem] p-5">
                <p className="app-kicker">Linked people</p>
                <div className="mt-4 space-y-3">
                  {people.map((person) => (
                    <div key={person.label} className="rounded-[1.2rem] border border-stone-200 bg-white/92 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {person.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-stone-900">{person.value}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="app-surface rounded-[1.8rem] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-kicker">Today&apos;s work</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight">Next actions are already visible</h2>
                </div>
                <div className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600">
                  4 due
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {taskList.map((task) => (
                  <div
                    key={task}
                    className="rounded-[1.2rem] border border-stone-200 bg-white/92 px-4 py-3 text-sm leading-6 text-stone-700"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </section>

            <section className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">Communication trail</p>
              <div className="mt-4 space-y-3">
                {comms.map((item) => (
                  <article
                    key={`${item.from}-${item.channel}`}
                    className="rounded-[1.2rem] border border-stone-200 bg-white/92 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-900">{item.from}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{item.channel}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
