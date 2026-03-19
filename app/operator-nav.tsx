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
  { key: 'queue', label: 'Maintenance', helper: 'Live inbox, follow-up desk, and case triage', href: '/' },
  { key: 'calls', label: 'Phone Support', helper: 'Call review, missed calls, and case linking', href: '/calls' },
  { key: 'crm', label: 'Lease Sign', helper: 'Joined-up tenancy view with inline actions', href: '/records' },
  { key: 'rent', label: 'Accounts', helper: 'Ledger, balances, arrears, and cash posting', href: '/records/rent' },
  { key: 'lease', label: 'End of Tenancy', helper: 'Lease milestones, notices, and move-out workflow', href: '/records/lease-lifecycle' },
  { key: 'knowledge', label: 'Knowledge Base', helper: 'Approved Scotland guidance and answers', href: '/knowledge' },
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
          <p className="app-kicker">Agency Operations</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            One operating layer for maintenance, lease sign, accounts, end of tenancy, and control
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Move across the core agency desks without dropping context. Treat specialist pages as drill-downs, not separate products.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
            Unified desk mode
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
