'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

type NavItem = {
  label: string
  href: string
  matches: (pathname: string) => boolean
  disabled?: boolean
}

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/runway',
    matches: (p) => p === '/runway',
  },
  {
    label: 'Ledger',
    href: '/runway/ledger',
    matches: (p) => p.startsWith('/runway/ledger'),
  },
  {
    label: 'Headcount',
    href: '/runway/headcount',
    matches: (p) => p.startsWith('/runway/headcount'),
  },
  {
    label: 'Scenarios',
    href: '/runway/scenarios',
    matches: (p) => p.startsWith('/runway/scenarios'),
  },
]

export function InternalShell({
  email,
  children,
}: {
  email: string
  children: ReactNode
}) {
  const pathname = usePathname() ?? '/runway'

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-6 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700">
              Internal
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
              Renovo Finance
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-zinc-500">{email}</span>
            <Link
              href="/dashboard"
              className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              Exit to operator →
            </Link>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="mx-auto max-w-[1280px] px-6">
          <nav className="flex gap-1">
            {NAV.map((item) => {
              const isActive = item.matches(pathname)
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    className="inline-flex h-9 items-center border-b-2 border-transparent px-3 text-[13px] font-medium text-zinc-300"
                    title="Coming in phase 2"
                  >
                    {item.label}
                  </span>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex h-9 items-center border-b-2 px-3 text-[13px] font-medium transition ${
                    isActive
                      ? 'border-emerald-600 text-zinc-900'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-6">{children}</main>
    </div>
  )
}
