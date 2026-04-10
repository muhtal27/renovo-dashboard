'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpenText, ChevronDown, LogOut, Menu, Search, Settings, CreditCard, Sparkles } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel, type CurrentOperator } from '@/lib/operator-types'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'
import { CommandPalette } from '@/app/components/CommandPalette'
import { NotificationCenter } from '@/app/components/NotificationCenter'

type Breadcrumb = {
  label: string
  href?: string
}

type ShellRouteConfig = {
  pageTitle?: string
  pageDescription?: string
  searchPlaceholder?: string
  searchTargetPath?: string
  breadcrumbs?: Breadcrumb[]
}

type OperatorLayoutProps = {
  children: ReactNode
  operator: CurrentOperator
  latestRelease: { version: string; title: string } | null
}

const DEFAULT_ROUTE_CONFIG: ShellRouteConfig = {
  searchPlaceholder: 'Search tenancies, disputes, and guidance',
}

const OPERATOR_ROUTE_CONFIG: Array<{
  matches: (pathname: string) => boolean
  config: ShellRouteConfig
}> = [
  {
    matches: (pathname) => pathname.startsWith('/operator/cases/'),
    config: {
      pageTitle: 'Case workspace',
      pageDescription:
        'Single-case operator review across evidence, issues, decision rationale, and submission readiness.',
      searchPlaceholder: 'Search this case by issue, evidence, recommendation, or message',
      breadcrumbs: [
        { label: 'Tenancies', href: '/tenancies' },
        { label: 'Case workspace' },
      ],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/admin'),
    config: {
      pageTitle: 'Admin',
      pageDescription:
        'Manage checkout intake from inventory software and case allocation to property managers.',
      searchPlaceholder: 'Search integrations, allocations, or property managers',
      searchTargetPath: '/admin',
      breadcrumbs: [{ label: 'Management', href: '/reports' }, { label: 'Admin' }],
    },
  },
  {
    matches: (pathname) => pathname === '/dashboard',
    config: {
      pageTitle: 'Dashboard',
      pageDescription:
        'Portfolio overview across tenancies, cases, deposits, and upcoming end dates.',
      searchPlaceholder: 'Search tenancies, cases, or properties',
      searchTargetPath: '/tenancies',
      breadcrumbs: [{ label: 'Dashboard' }],
    },
  },
  {
    matches: (pathname) =>
      pathname === '/tenancies' || pathname.startsWith('/tenancies'),
    config: {
      pageTitle: 'Tenancies',
      pageDescription:
        'View all tenancy records across your portfolio. Filter by active or archived status.',
      searchPlaceholder: 'Search tenancies by property, tenant, or reference',
      searchTargetPath: '/tenancies',
      breadcrumbs: [{ label: 'Tenancies' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/dashboard/'),
    config: {
      pageTitle: 'Tenancy detail',
      pageDescription:
        'Full tenancy record with property, residents, deposit, period, and linked checkout case.',
      breadcrumbs: [
        { label: 'Tenancies', href: '/tenancies' },
        { label: 'Tenancy detail' },
      ],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/disputes'),
    config: {
      pageTitle: 'Disputes',
      pageDescription:
        'Review disputed checkouts, contested issues, and the evidence-backed narratives needed for resolution.',
      searchPlaceholder: 'Search disputes by property, tenant, issue, severity, or dispute state',
      searchTargetPath: '/disputes',
      breadcrumbs: [{ label: 'Tenancies', href: '/tenancies' }, { label: 'Disputes' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/reports'),
    config: {
      pageTitle: 'Reports',
      pageDescription:
        'Portfolio analytics for workflow mix, issue severity, evidence composition, and generated claim value.',
      searchPlaceholder: 'Search reports by property, tenant, workflow state, or recommendation',
      searchTargetPath: '/reports',
      breadcrumbs: [{ label: 'Management' }, { label: 'Reports' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/guidance'),
    config: {
      pageTitle: 'Guidance',
      pageDescription:
        'Authoritative scheme, evidence, and deduction guidance for end-of-tenancy operators.',
      searchPlaceholder: 'Search the guidance library',
      searchTargetPath: '/guidance',
      breadcrumbs: [{ label: 'Guidance' }],
    },
  },
  {
    matches: (pathname) =>
      pathname.startsWith('/teams/members') || pathname.startsWith('/teams/teams'),
    config: {
      pageTitle: 'Teams',
      pageDescription: 'Manage workspace members, roles, and team structure.',
      breadcrumbs: [
        { label: 'Management', href: '/admin' },
        { label: 'Teams' },
      ],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/settings'),
    config: {
      pageTitle: 'Settings',
      pageDescription:
        'Review operator workspace defaults, access controls, and outbound communication readiness.',
      breadcrumbs: [{ label: 'Account', href: '/account/billing' }, { label: 'Settings' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/account/billing'),
    config: {
      pageTitle: 'Billing',
      pageDescription:
        'Manage your subscription, payment methods, and billing history.',
      breadcrumbs: [{ label: 'Account' }, { label: 'Billing' }],
    },
  },
]

function getRouteConfig(pathname: string) {
  const matchedRoute = OPERATOR_ROUTE_CONFIG.find((route) => route.matches(pathname))
  return matchedRoute?.config ?? DEFAULT_ROUTE_CONFIG
}

function getInitials(value: string | null | undefined) {
  if (!value) return 'R'

  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'R'

  const first = parts[0]?.[0]?.toUpperCase() ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() ?? '' : ''

  return `${first}${last}` || 'R'
}

function OperatorSearchForm({
  searchTargetPath,
  searchPlaceholder,
  initialSearchValue,
}: {
  searchTargetPath: string
  searchPlaceholder: string
  initialSearchValue: string
}) {
  const [searchValue, setSearchValue] = useState(initialSearchValue)
  const searchAction = useMemo(() => {
    const trimmed = searchValue.trim()
    return trimmed ? `${searchTargetPath}?search=${encodeURIComponent(trimmed)}` : searchTargetPath
  }, [searchTargetPath, searchValue])

  return (
    <form action={searchTargetPath} className="min-w-0">
      <input type="hidden" name="search" value={searchValue.trim()} />
      <label className="relative block">
        <span className="sr-only">Global search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full max-w-[520px] rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-20 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
        <Link
          href={searchAction}
          prefetch={false}
          className="absolute right-1.5 top-1.5 inline-flex h-7 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white transition hover:bg-emerald-700"
        >
          Search
        </Link>
      </label>
    </form>
  )
}

/**
 * Wrapper that isolates useSearchParams() so the parent OperatorLayout
 * does not re-render when URL search params change.
 */
function OperatorSearchFormBridge({
  pathname,
  searchPlaceholder,
  searchTargetPath,
}: {
  pathname: string
  searchPlaceholder: string
  searchTargetPath: string
}) {
  const searchParams = useSearchParams()
  const searchParamValue = searchParams.get('search') ?? ''

  return (
    <OperatorSearchForm
      key={`${pathname}?${searchParamValue}`}
      searchTargetPath={searchTargetPath}
      searchPlaceholder={searchPlaceholder}
      initialSearchValue={searchParamValue}
    />
  )
}

export function OperatorLayout({ children, operator, latestRelease }: OperatorLayoutProps) {
  const pathname = usePathname() ?? '/admin'
  const routeConfig = useMemo(() => getRouteConfig(pathname), [pathname])
  const breadcrumbs = routeConfig.breadcrumbs ?? []
  const searchTargetPath = routeConfig.searchTargetPath ?? pathname
  const operatorLabel = getOperatorLabel(operator)
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileMenuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    await fetch('/api/operator/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)
    window.location.href = '/login'
  }, [])

  const displayName = operatorLabel?.trim() || operator.authUser?.email?.trim() || ''
  const operatorRole = operator.membership?.role ?? null

  const hasNestedBreadcrumbs = breadcrumbs.length > 1

  const handleToggleCollapse = useCallback(() => setSidebarCollapsed((current) => !current), [])
  const handleCloseMobile = useCallback(() => setMobileNavOpen(false), [])
  const handleOpenMobile = useCallback(() => setMobileNavOpen(true), [])

  return (
    <main className="operator-app min-h-screen text-zinc-900">
      <div className="flex min-h-screen">
        <OperatorNav
          role={operatorRole}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapse={handleToggleCollapse}
          onCloseMobile={handleCloseMobile}
        />

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-3 md:px-6 xl:px-8">
            <header className="border-b border-zinc-200 pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenMobile}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 xl:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-3.5 w-3.5" />
                  </button>

                  <div className="flex min-w-0 items-center gap-2">
                    {hasNestedBreadcrumbs ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-500">
                        {breadcrumbs.map((breadcrumb, index) => (
                          <div key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1.5">
                            {breadcrumb.href ? (
                              <Link
                                href={breadcrumb.href}
                                prefetch={false}
                                className="transition hover:text-zinc-700"
                              >
                                {breadcrumb.label}
                              </Link>
                            ) : (
                              <span className="text-zinc-700">{breadcrumb.label}</span>
                            )}
                            {index < breadcrumbs.length - 1 ? <span className="text-zinc-300">/</span> : null}
                          </div>
                        ))}
                      </div>
                    ) : routeConfig.pageTitle ? (
                      <h1 className="text-sm font-semibold text-zinc-950">
                        {routeConfig.pageTitle}
                      </h1>
                    ) : null}
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="hidden min-w-0 flex-1 xl:block">
                    <Suspense fallback={null}>
                      <OperatorSearchFormBridge
                        pathname={pathname}
                        searchTargetPath={searchTargetPath}
                        searchPlaceholder={
                          routeConfig.searchPlaceholder ?? DEFAULT_ROUTE_CONFIG.searchPlaceholder ?? ''
                        }
                      />
                    </Suspense>
                  </div>

                  <button
                    type="button"
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                    className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-600 lg:flex xl:hidden"
                    title="Quick search (⌘K)"
                  >
                    <Search className="h-3 w-3" />
                    <span>Search...</span>
                    <kbd className="ml-2 rounded border border-zinc-200 bg-white px-1 py-0.5 text-[10px] font-medium">⌘K</kbd>
                  </button>

                  <NotificationCenter />

                  <Link
                    href="/whats-new"
                    prefetch={false}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                    title={latestRelease ? `v${latestRelease.version} — ${latestRelease.title}` : 'Changelog'}
                  >
                    <Sparkles className="h-4 w-4" strokeWidth={2} />
                    <span className="hidden lg:inline">What&apos;s new</span>
                  </Link>

                  <Link
                    href="/guidance"
                    prefetch={false}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      pathname.startsWith('/guidance')
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                    }`}
                  >
                    <BookOpenText className="h-4 w-4" strokeWidth={2} />
                    Guidance
                  </Link>

                  <div className="relative" ref={profileMenuRef}>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((prev) => !prev)}
                      className="hidden items-center gap-2 border-l border-zinc-200 pl-3 transition hover:opacity-80 md:flex"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {getInitials(displayName)}
                      </div>
                      <span className="text-xs font-medium text-zinc-600">{displayName || 'Operator'}</span>
                      <ChevronDown className="h-3 w-3 text-zinc-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((prev) => !prev)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 md:hidden"
                    >
                      {getInitials(displayName)}
                    </button>

                    {profileMenuOpen ? (
                      <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                        <Link
                          href="/settings"
                          prefetch={false}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <Settings className="h-4 w-4 text-zinc-400" />
                          Settings
                        </Link>
                        <Link
                          href="/account/billing"
                          prefetch={false}
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                        >
                          <CreditCard className="h-4 w-4 text-zinc-400" />
                          Billing
                        </Link>
                        <div className="my-1 border-t border-zinc-100" />
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                        >
                          <LogOut className="h-4 w-4 text-zinc-400" />
                          {signingOut ? 'Signing out...' : 'Sign out'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-4 flex-1 space-y-4">{children}</div>
          </div>
        </div>
      </div>
      <CommandPalette />
    </main>
  )
}
