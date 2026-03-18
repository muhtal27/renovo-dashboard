import Link from 'next/link'

type OperatorNavKey = 'queue' | 'calls' | 'crm' | 'rent' | 'lease' | 'knowledge' | 'reporting'

const items: Array<{ key: OperatorNavKey; label: string; helper: string; href: string }> = [
  { key: 'queue', label: 'Queue', helper: 'Live inbound and case triage', href: '/' },
  { key: 'calls', label: 'Calls', helper: 'Voice sessions and review', href: '/calls' },
  { key: 'crm', label: 'CRM', helper: 'Tenancy control centre', href: '/records' },
  { key: 'rent', label: 'Rent', helper: 'Ledger and arrears', href: '/records/rent' },
  { key: 'lease', label: 'Lease', helper: 'Renewals and lifecycle', href: '/records/lease-lifecycle' },
  { key: 'knowledge', label: 'Knowledge', helper: 'Scotland guidance base', href: '/knowledge' },
  { key: 'reporting', label: 'Reporting', helper: 'Portfolio and leadership view', href: '/records/reporting' },
]

export function OperatorNav({ current }: { current: OperatorNavKey }) {
  return (
    <nav className="app-surface rounded-[1.7rem] p-4" aria-label="Operator navigation">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">Operator Navigation</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Move between the core Annabelle workspaces without hunting for hidden buttons.
          </p>
        </div>
        <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
          One joined-up operator flow
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {items.map((item) => {
          const active = item.key === current

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-[1.25rem] border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${
                active
                  ? 'app-selected-card'
                  : 'border-stone-200 bg-white/92 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              <p className="text-sm font-semibold text-stone-900">{item.label}</p>
              <p className="mt-2 text-xs leading-5 text-stone-600">{item.helper}</p>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
