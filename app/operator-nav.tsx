'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type OperatorNavKey =
  | 'queue'
  | 'calls'
  | 'crm'
  | 'rent'
  | 'lease'
  | 'knowledge'
  | 'reporting'
  | 'onboarding'

const items: Array<{ key: OperatorNavKey; label: string; helper: string; href: string }> = [
  { key: 'queue', label: 'Queue', helper: 'Live inbox and response desk', href: '/' },
  { key: 'calls', label: 'Calls', helper: 'Voice review and linking console', href: '/calls' },
  { key: 'crm', label: 'CRM', helper: 'Tenancy cockpit and inline actions', href: '/records' },
  { key: 'rent', label: 'Rent', helper: 'Deep ledger and arrears drill-down', href: '/records/rent' },
  { key: 'lease', label: 'Lease', helper: 'Renewals and lifecycle drill-down', href: '/records/lease-lifecycle' },
  { key: 'knowledge', label: 'Knowledge', helper: 'Approved Scotland answers desk', href: '/knowledge' },
  { key: 'reporting', label: 'Reporting', helper: 'Portfolio pressure and leadership view', href: '/records/reporting' },
  { key: 'onboarding', label: 'New Business', helper: 'Access, invite, and setup console', href: '/records/onboarding' },
]

export function OperatorNav({ current }: { current: OperatorNavKey }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setSigningOut(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <nav className="app-surface rounded-[1.9rem] p-4 md:p-5" aria-label="Operator navigation">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="app-kicker">Operator Cockpit</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            One operating layer for queue, CRM, calls, knowledge, and control
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Move across the core desks without dropping context. Treat specialist pages as drill-downs, not separate products.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
            Power CRM mode
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-600 disabled:opacity-60"
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {items.map((item) => {
          const active = item.key === current

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-[1.35rem] border p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm ${
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
