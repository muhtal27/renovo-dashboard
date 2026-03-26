'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpenText, Menu, Search, Settings as SettingsIcon } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { hasPermission, OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getOperatorLabel } from '@/lib/operator'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'
import { cn } from '@/lib/ui'
import { useOperatorGate } from '@/lib/use-operator-gate'

type HeaderAction = {
  label: string
  href: string
  icon?: ReactNode
  tone?: 'primary' | 'secondary'
}

type Breadcrumb = {
  label: string
  href?: string
}

type OperatorLayoutProps = {
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
  searchPlaceholder?: string
  initialSearchValue?: string
  searchTargetPath?: string
  actions?: HeaderAction[]
  breadcrumbs?: Breadcrumb[]
}

const DEFAULT_ACTIONS: HeaderAction[] = [
  {
    label: 'Open cases',
    href: '/eot',
    icon: <BarChart3 className="h-4 w-4" strokeWidth={2} />,
    tone: 'primary',
  },
  {
    label: 'Knowledge',
    href: '/knowledge',
    icon: <BookOpenText className="h-4 w-4" strokeWidth={2} />,
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
  if (!value) return 'R'

  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'R'

  const first = parts[0]?.[0]?.toUpperCase() ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() ?? '' : ''

  return `${first}${last}` || 'R'
}

export function OperatorLayout({
  children,
  pageTitle,
  pageDescription,
  searchPlaceholder = 'Search cases, tenancy, disputes, and knowledge',
  initialSearchValue = '',
  searchTargetPath = '/eot',
  actions,
  breadcrumbs,
}: OperatorLayoutProps) {
  const { operator } = useOperatorGate()
  const operatorLabel = getOperatorLabel(operator)
  const [searchValue, setSearchValue] = useState(initialSearchValue)
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setSearchValue(initialSearchValue)
  }, [initialSearchValue])

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/operator/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)
    window.location.href = '/login'
  }

  const displayName = operatorLabel?.trim() || operator?.authUser?.email?.trim() || ''
  const operatorRole = operator?.membership?.role ?? null
  const headerActions =
    actions ??
    DEFAULT_ACTIONS.filter((action) => {
      if (action.href === '/settings') {
        return hasPermission(operatorRole, OPERATOR_PERMISSIONS.MANAGE_SETTINGS)
      }

      return true
    })
  const searchAction = useMemo(() => {
    const trimmed = searchValue.trim()
    return trimmed ? `${searchTargetPath}?search=${encodeURIComponent(trimmed)}` : searchTargetPath
  }, [searchTargetPath, searchValue])

  return (
    <main className="operator-app min-h-screen bg-[#eef3f9] text-slate-900">
      <div className="flex min-h-screen">
        <OperatorNav
          viewerName={displayName}
          role={operatorRole}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-4 py-4 md:px-6 md:py-6 xl:px-8">
            <header className="rounded-[28px] border border-[rgba(15,23,42,0.08)] bg-white px-5 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.07)] md:px-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(true)}
                      className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-slate-600 xl:hidden"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-4 w-4" />
                    </button>

                    <div className="min-w-0">
                      {breadcrumbs?.length ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                          {breadcrumbs.map((breadcrumb, index) => (
                            <div key={`${breadcrumb.label}-${index}`} className="flex items-center gap-2">
                              {breadcrumb.href ? (
                                <Link href={breadcrumb.href} className="transition hover:text-slate-900">
                                  {breadcrumb.label}
                                </Link>
                              ) : (
                                <span className="text-slate-700">{breadcrumb.label}</span>
                              )}
                              {index < breadcrumbs.length - 1 ? <span>/</span> : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Renovo operations platform
                        </p>
                      )}

                      {pageTitle ? (
                        <h1 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
                          {pageTitle}
                        </h1>
                      ) : null}
                      {pageDescription ? (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {pageDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 md:flex">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{displayName || 'Operator'}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Property operations
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                      {getInitials(displayName)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_auto_auto] xl:items-center">
                  <form action={searchTargetPath} className="min-w-0">
                    <input type="hidden" name="search" value={searchValue.trim()} />
                    <label className="relative block">
                      <span className="sr-only">Global search</span>
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-12 w-full rounded-[16px] border border-slate-200 bg-[#f8fafc] pl-11 pr-28 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
                      />
                      <Link
                        href={searchAction}
                        className="absolute right-2 top-2 inline-flex h-8 items-center rounded-[12px] bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Search
                      </Link>
                    </label>
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    {headerActions.map((action) => (
                      <Link
                        key={`${action.href}-${action.label}`}
                        href={action.href}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-medium transition',
                          action.tone === 'primary'
                            ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950'
                        )}
                      >
                        {action.icon}
                        {action.label}
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 md:hidden">
                      {getInitials(displayName)}
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="inline-flex h-10 items-center rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
                    >
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className={cn('mt-6 flex-1 space-y-6')}>{children}</div>
          </div>
        </div>
      </div>
    </main>
  )
}
