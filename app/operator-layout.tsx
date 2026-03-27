'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { BarChart3, BookOpenText, Menu, Search, Settings as SettingsIcon } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel, type CurrentOperator } from '@/lib/operator-types'
import { hasPermission, OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'
import { cn } from '@/lib/ui'

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

const DEFAULT_ACTIONS: HeaderAction[] = [
  {
    label: 'Open checkouts',
    href: '/eot',
    icon: <BarChart3 className="h-4 w-4" strokeWidth={2} />,
    tone: 'primary',
  },
  {
    label: 'Guidance',
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

const DEFAULT_ROUTE_CONFIG: ShellRouteConfig = {
  searchPlaceholder: 'Search checkouts, tenancy, disputes, and guidance',
}

const OPERATOR_ROUTE_CONFIG: Array<{
  matches: (pathname: string) => boolean
  config: ShellRouteConfig
}> = [
  {
    matches: (pathname) => pathname.startsWith('/overview'),
    config: {
      pageTitle: 'Overview',
      pageDescription:
        'Executive summary of the live end-of-tenancy portfolio, workflow pressure, and operator attention queue.',
      searchPlaceholder: 'Search portfolio activity, properties, tenants, or workflow states',
      searchTargetPath: '/overview',
      breadcrumbs: [{ label: 'Overview' }],
    },
  },
  {
    matches: (pathname) => pathname === '/eot',
    config: {
      pageTitle: 'Checkouts',
      pageDescription:
        'Operational checkout queue with live end-of-tenancy workflow state, dispute signals, and fast access into the workspace.',
      searchPlaceholder: 'Search live checkouts by property, tenant, status, priority, or checkout ID',
      searchTargetPath: '/eot',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Checkouts' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/eot/'),
    config: {
      pageTitle: 'Checkout workspace',
      pageDescription:
        'Review live evidence, issues, recommendations, claim structure, and communication in a single operator workspace.',
      searchPlaceholder: 'Filter this checkout by issue, evidence, recommendation, or message',
      breadcrumbs: [
        { label: 'Overview', href: '/overview' },
        { label: 'Checkouts', href: '/eot' },
        { label: 'Checkout workspace' },
      ],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/tenancy'),
    config: {
      pageTitle: 'Tenancy',
      pageDescription:
        'Cross-checkout tenancy view covering residents, deposits, property references, and checkout readiness.',
      searchPlaceholder: 'Search tenancy records by property, tenant, reference, or checkout state',
      searchTargetPath: '/tenancy',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Tenancy' }],
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
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Disputes' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/recommendations'),
    config: {
      pageTitle: 'Recommendations',
      pageDescription:
        'Review charge decisions, rationale, and estimated cost across the live checkout portfolio.',
      searchPlaceholder: 'Search recommendation rationale, issue titles, properties, or tenants',
      searchTargetPath: '/recommendations',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Recommendations' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/claims'),
    config: {
      pageTitle: 'Submissions',
      pageDescription:
        'Monitor claim pack generation, pending submissions, and the final operator review queue.',
      searchPlaceholder: 'Search submissions, property, tenant, or readiness state',
      searchTargetPath: '/claims',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Submissions' }],
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
      breadcrumbs: [
        { label: 'Overview', href: '/overview' },
        { label: 'Reports / Analytics' },
      ],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/calls'),
    config: {
      pageTitle: 'Inbox',
      pageDescription:
        'Central queue for case notes, outbound communication, and operator follow-up.',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Inbox' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/knowledge'),
    config: {
      pageTitle: 'Guidance',
      pageDescription:
        'Authoritative scheme, evidence, and deduction guidance for end-of-tenancy operators.',
      searchPlaceholder: 'Search the guidance library',
      searchTargetPath: '/knowledge',
      breadcrumbs: [{ label: 'Overview', href: '/overview' }, { label: 'Guidance' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/settings'),
    config: {
      pageTitle: 'Settings',
      pageDescription:
        'Review operator workspace defaults, access controls, and outbound communication readiness.',
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
  )
}

export function OperatorLayout({ children, operator }: OperatorLayoutProps) {
  const pathname = usePathname() ?? '/overview'
  const searchParams = useSearchParams()
  const routeConfig = useMemo(() => getRouteConfig(pathname), [pathname])
  const breadcrumbs = routeConfig.breadcrumbs ?? []
  const searchParamValue = searchParams.get('search') ?? ''
  const searchTargetPath = routeConfig.searchTargetPath ?? pathname
  const operatorLabel = getOperatorLabel(operator)
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/operator/session', {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)
    window.location.href = '/login'
  }

  const displayName = operatorLabel?.trim() || operator.authUser?.email?.trim() || ''
  const operatorRole = operator.membership?.role ?? null
  const headerActions = DEFAULT_ACTIONS.filter((action) => {
    if (action.href === '/settings') {
      return hasPermission(operatorRole, OPERATOR_PERMISSIONS.MANAGE_SETTINGS)
    }

    return true
  })

  return (
    <main className="operator-app min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <OperatorNav
          role={operatorRole}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="min-w-0 flex-1">
          <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-4 py-4 md:px-6 md:py-6 xl:px-8">
            <header className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:px-6">
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
                      {breadcrumbs.length ? (
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

                      {routeConfig.pageTitle ? (
                        <h1 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
                          {routeConfig.pageTitle}
                        </h1>
                      ) : null}
                      {routeConfig.pageDescription ? (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {routeConfig.pageDescription}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden items-center gap-3 md:flex">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950">{displayName || 'Operator'}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        End of tenancy
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
                      {getInitials(displayName)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_auto_auto] xl:items-center">
                  <OperatorSearchForm
                    key={`${pathname}?${searchParamValue}`}
                    searchTargetPath={searchTargetPath}
                    searchPlaceholder={
                      routeConfig.searchPlaceholder ?? DEFAULT_ROUTE_CONFIG.searchPlaceholder ?? ''
                    }
                    initialSearchValue={searchParamValue}
                  />

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
