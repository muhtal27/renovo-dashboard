'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel, type CurrentOperator } from '@/lib/operator-types'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'

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
}

const DEFAULT_ROUTE_CONFIG: ShellRouteConfig = {
  searchPlaceholder: 'Search checkouts, tenancy, disputes, and guidance',
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
        { label: 'Checkouts', href: '/checkouts' },
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
    matches: (pathname) => pathname === '/checkouts',
    config: {
      pageTitle: 'Checkouts',
      pageDescription:
        'Operational checkout queue with live end-of-tenancy workflow state, dispute signals, and fast access into the workspace.',
      searchPlaceholder: 'Search live checkouts by property, tenant, status, priority, or checkout ID',
      searchTargetPath: '/checkouts',
      breadcrumbs: [{ label: 'Checkouts' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/checkouts/'),
    config: {
      pageTitle: 'Checkout workspace',
      pageDescription:
        'Review live evidence, issues, recommendations, claim structure, and communication in a single operator workspace.',
      searchPlaceholder: 'Filter this checkout by issue, evidence, recommendation, or message',
      breadcrumbs: [
        { label: 'Checkouts', href: '/checkouts' },
        { label: 'Checkout workspace' },
      ],
    },
  },
  {
    matches: (pathname) => pathname === '/tenancies',
    config: {
      pageTitle: 'Tenancies',
      pageDescription:
        'Cross-checkout tenancy view covering residents, deposits, property references, and checkout readiness.',
      searchPlaceholder: 'Search tenancy records by property, tenant, reference, or checkout state',
      searchTargetPath: '/tenancies',
      breadcrumbs: [{ label: 'Tenancies' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/tenancies/'),
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
    matches: (pathname) => pathname.startsWith('/inventory-feedback'),
    config: {
      pageTitle: 'Inventory feedback',
      pageDescription:
        'Review issues identified across all checkout cases. Filter by severity, recommendation, and status to manage your inventory feedback queue.',
      breadcrumbs: [{ label: 'Inventory feedback' }],
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
      breadcrumbs: [{ label: 'Checkouts', href: '/checkouts' }, { label: 'Disputes' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/deposit-scheme'),
    config: {
      pageTitle: 'Deposit Scheme',
      pageDescription:
        'Reference guide to government-approved tenancy deposit protection schemes across the UK.',
      breadcrumbs: [{ label: 'Deposit Scheme' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/reports'),
    config: {
      pageTitle: 'Reports / Analytics',
      pageDescription:
        'Portfolio analytics for workflow mix, issue severity, evidence composition, and generated claim value.',
      searchPlaceholder: 'Search reports by property, tenant, workflow state, or recommendation',
      searchTargetPath: '/reports',
      breadcrumbs: [{ label: 'Management' }, { label: 'Reports / Analytics' }],
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
      breadcrumbs: [{ label: 'Account' }, { label: 'Settings' }],
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
          className="h-10 w-[520px] rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-20 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
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

export function OperatorLayout({ children, operator }: OperatorLayoutProps) {
  const pathname = usePathname() ?? '/admin'
  const routeConfig = useMemo(() => getRouteConfig(pathname), [pathname])
  const breadcrumbs = routeConfig.breadcrumbs ?? []
  const searchTargetPath = routeConfig.searchTargetPath ?? pathname
  const operatorLabel = getOperatorLabel(operator)
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
          signingOut={signingOut}
          onSignOut={handleSignOut}
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

                <div className="flex items-center gap-3">
                  <div className="hidden xl:block">
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

                  <div className="hidden items-center gap-2 border-l border-zinc-200 pl-3 md:flex">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                      {getInitials(displayName)}
                    </div>
                    <span className="text-xs font-medium text-zinc-600">{displayName || 'Operator'}</span>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 md:hidden">
                    {getInitials(displayName)}
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-4 flex-1 space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </main>
  )
}
