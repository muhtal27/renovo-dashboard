'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { BookCheck, Search, Settings as SettingsIcon, Phone } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'

type HeaderAction = {
  label: string
  href: string
  icon?: ReactNode
  tone?: 'primary' | 'secondary'
}

type OperatorLayoutProps = {
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
  searchPlaceholder?: string
  initialSearchValue?: string
  searchTargetPath?: string
  actions?: HeaderAction[]
}

const DEFAULT_ACTIONS: HeaderAction[] = [
  {
    label: 'Open guidance',
    href: '/knowledge',
    icon: <BookCheck className="h-4 w-4" strokeWidth={2} />,
    tone: 'primary',
  },
  {
    label: 'Call workspace',
    href: '/calls',
    icon: <Phone className="h-4 w-4" strokeWidth={2} />,
    tone: 'secondary',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon className="h-4 w-4" strokeWidth={2} />,
    tone: 'secondary',
  },
]

function getInitials(value: string | null | undefined) {
  if (!value) return ''

  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''

  const first = parts[0]?.[0]?.toUpperCase() ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() ?? '' : ''

  return `${first}${last}`
}

export function OperatorLayout({
  children,
  pageTitle,
  pageDescription,
  searchPlaceholder = 'Search guidance and operator resources',
  initialSearchValue = '',
  searchTargetPath = '/knowledge',
  actions,
}: OperatorLayoutProps) {
  const { operator } = useOperatorGate()
  const operatorLabel = getOperatorLabel(operator)
  const [searchValue, setSearchValue] = useState(initialSearchValue)
  const [fallbackViewerLabel, setFallbackViewerLabel] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setSearchValue(initialSearchValue)
  }, [initialSearchValue])

  useEffect(() => {
    if (operatorLabel?.trim()) return

    let cancelled = false

    async function loadViewer() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      setFallbackViewerLabel(session?.user?.email?.trim() || '')
    }

    void loadViewer()

    return () => {
      cancelled = true
    }
  }, [operatorLabel])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const displayName = operatorLabel?.trim() || fallbackViewerLabel
  const headerActions = actions ?? DEFAULT_ACTIONS
  const searchAction = useMemo(() => {
    const trimmed = searchValue.trim()
    return trimmed ? `${searchTargetPath}?search=${encodeURIComponent(trimmed)}` : searchTargetPath
  }, [searchTargetPath, searchValue])

  return (
    <main className="app-grid min-h-screen bg-[#efe7dc] text-stone-900">
      <div className="flex min-h-screen flex-col xl:flex-row">
        <OperatorNav viewerName={displayName} />

        <div className="min-w-0 flex-1">
          <div className="px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-7">
            <div className="mx-auto flex max-w-[1680px] flex-col gap-6">
              <header className="app-surface-strong rounded-[1.75rem] px-5 py-5 md:px-6">
                <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(220px,0.9fr)_minmax(420px,1.6fr)_minmax(280px,1fr)] xl:items-center">
                  <div className="min-w-0">
                    {pageTitle ? (
                      <p className="app-kicker">Renovo AI workspace</p>
                    ) : null}
                    {pageTitle ? (
                      <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-stone-900">
                        {pageTitle}
                      </h1>
                    ) : null}
                    {pageDescription ? (
                      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
                        {pageDescription}
                      </p>
                    ) : null}
                  </div>

                  <form action={searchTargetPath} className="min-w-0">
                    <input type="hidden" name="search" value={searchValue.trim()} />
                    <label className="relative block">
                      <span className="sr-only">Global search</span>
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                      <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-14 w-full rounded-[1.15rem] border border-stone-300 bg-white pl-12 pr-28 text-sm text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] placeholder:text-stone-400 focus:border-stone-400"
                      />
                      <Link
                        href={searchAction}
                        className="absolute right-2 top-2 inline-flex h-10 items-center rounded-[0.95rem] border border-stone-900 bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
                      >
                        Search
                      </Link>
                    </label>
                  </form>

                  <div className="flex flex-col gap-4 xl:items-end">
                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      {headerActions.map((action) => (
                        <Link
                          key={`${action.href}-${action.label}`}
                          href={action.href}
                          className={`inline-flex items-center gap-2 rounded-[0.95rem] border px-4 py-2.5 text-sm font-medium transition ${
                            action.tone === 'primary'
                              ? 'border-stone-900 bg-stone-900 text-white hover:bg-stone-800'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:text-stone-900'
                          }`}
                        >
                          {action.icon}
                          {action.label}
                        </Link>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 rounded-[1rem] border border-stone-200 bg-white px-3 py-3 shadow-sm">
                      <div className="hidden text-right md:block">
                        <p className="text-sm font-semibold text-stone-900">{displayName}</p>
                        <p className="text-xs text-stone-500">Property manager workspace</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-700">
                        {getInitials(displayName)}
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="inline-flex items-center rounded-[0.95rem] border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900 disabled:opacity-60"
                      >
                        {signingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                </div>
              </header>

              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
