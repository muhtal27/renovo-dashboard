'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { Bot, ChevronDown, LogOut, Menu, Settings, CreditCard } from 'lucide-react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel, type CurrentOperator } from '@/lib/operator-types'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'
import { CommandPalette } from '@/app/components/CommandPalette'
import { NotificationCenter } from '@/app/components/NotificationCenter'
import { AiPanel } from '@/app/components/AiPanel'
import { TelemetryIdentify } from '@/app/components/TelemetryIdentify'
import { OperatorHeaderSearch } from '@/app/components/OperatorHeaderSearch'
import { ToastProvider } from '@/app/components/Toast'

type Breadcrumb = {
  label: string
  href?: string
}

type ShellRouteConfig = {
  pageTitle?: string
  searchPlaceholder?: string
  breadcrumbs?: Breadcrumb[]
}

type OperatorLayoutProps = {
  children: ReactNode
  operator: CurrentOperator
  latestRelease: { version: string; title: string } | null
}

const DEFAULT_ROUTE_CONFIG: ShellRouteConfig = {
  searchPlaceholder: 'Search...',
}

const OPERATOR_ROUTE_CONFIG: Array<{
  matches: (pathname: string) => boolean
  config: ShellRouteConfig
}> = [
  {
    matches: (pathname) => pathname.startsWith('/operator/cases/'),
    config: {
      pageTitle: 'Case workspace',
      searchPlaceholder: 'Search this case...',
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
      searchPlaceholder: 'Search integrations...',
      breadcrumbs: [{ label: 'Management', href: '/reports' }, { label: 'Admin' }],
    },
  },
  {
    matches: (pathname) => pathname === '/dashboard',
    config: {
      pageTitle: 'Dashboard',
      searchPlaceholder: 'Search tenancies, cases...',
      breadcrumbs: [{ label: 'Dashboard' }],
    },
  },
  {
    matches: (pathname) =>
      pathname === '/tenancies' || pathname.startsWith('/tenancies'),
    config: {
      pageTitle: 'Tenancies',
      searchPlaceholder: 'Search tenancies...',
      breadcrumbs: [{ label: 'Tenancies' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/dashboard/'),
    config: {
      pageTitle: 'Tenancy detail',
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
      searchPlaceholder: 'Search disputes...',
      breadcrumbs: [{ label: 'Tenancies', href: '/tenancies' }, { label: 'Disputes' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/reports'),
    config: {
      pageTitle: 'Reports',
      searchPlaceholder: 'Search reports...',
      breadcrumbs: [{ label: 'Management' }, { label: 'Reports' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/guidance'),
    config: {
      pageTitle: 'Guidance',
      searchPlaceholder: 'Search guidance...',
      breadcrumbs: [{ label: 'Resources' }, { label: 'Guidance' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/communications'),
    config: {
      pageTitle: 'Communications',
      searchPlaceholder: 'Search messages...',
      breadcrumbs: [{ label: 'Communications' }],
    },
  },
  {
    matches: (pathname) =>
      pathname.startsWith('/teams/members') || pathname.startsWith('/teams/teams'),
    config: {
      pageTitle: 'Teams',
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
      breadcrumbs: [{ label: 'Account' }, { label: 'Settings' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/account/billing'),
    config: {
      pageTitle: 'Billing',
      breadcrumbs: [{ label: 'Account' }, { label: 'Billing' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/deposit-scheme'),
    config: {
      pageTitle: 'Deposit Schemes',
      breadcrumbs: [{ label: 'Resources' }, { label: 'Deposit Schemes' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/inventory-feedback'),
    config: {
      pageTitle: 'Inventory Feedback',
      breadcrumbs: [{ label: 'Resources' }, { label: 'Inventory Feedback' }],
    },
  },
  {
    matches: (pathname) => pathname.startsWith('/whats-new'),
    config: {
      pageTitle: "What's New",
      breadcrumbs: [{ label: 'Resources' }, { label: "What's New" }],
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

export function OperatorLayout({ children, operator, latestRelease }: OperatorLayoutProps) {
  const pathname = usePathname() ?? '/dashboard'
  const routeConfig = useMemo(() => getRouteConfig(pathname), [pathname])
  const breadcrumbs = routeConfig.breadcrumbs ?? []
  const searchPlaceholder =
    routeConfig.searchPlaceholder ?? DEFAULT_ROUTE_CONFIG.searchPlaceholder ?? 'Search...'
  const operatorLabel = getOperatorLabel(operator)
  const [signingOut, setSigningOut] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
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
    posthog.capture('logout')
    posthog.reset()
    Sentry.setUser(null)
    window.location.href = '/login'
  }, [])

  const displayName = operatorLabel?.trim() || operator.authUser?.email?.trim() || ''
  const initials = getInitials(displayName)
  const operatorRole = operator.membership?.role ?? null

  const handleToggleCollapse = useCallback(() => setSidebarCollapsed((current) => !current), [])
  const handleCloseMobile = useCallback(() => setMobileNavOpen(false), [])
  const handleOpenMobile = useCallback(() => setMobileNavOpen(true), [])

  return (
    <ToastProvider>
    <main className="operator-app min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen">
        <OperatorNav
          role={operatorRole}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          onToggleCollapse={handleToggleCollapse}
          onCloseMobile={handleCloseMobile}
          displayName={displayName}
          initials={initials}
          tenantName={operator.tenantName ?? null}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header — 56px */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 md:px-6">
            {/* Left: hamburger + breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenMobile}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 xl:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1.5 text-[13px] text-zinc-400">
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
                      <span className="font-medium text-zinc-900">{breadcrumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 ? <span className="text-zinc-300">/</span> : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Inline header search — prototype: demo.html:1966-1970 */}
            <div className="hidden min-w-0 flex-1 xl:flex">
              <OperatorHeaderSearch placeholder={searchPlaceholder} />
            </div>

            {/* Right: action buttons */}
            <div className="ml-auto flex items-center gap-1">
              {/* Cmd+K hint button — prototype: demo.html:1972 */}
              <button
                type="button"
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="flex h-9 items-center justify-center rounded-[10px] px-2.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                title="Command Palette"
                aria-label="Open command palette"
              >
                <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">⌘K</kbd>
              </button>

              {/* Notifications */}
              <NotificationCenter />

              {/* AI Assistant */}
              <button
                type="button"
                onClick={() => setAiPanelOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                title="AI Assistant"
              >
                <Bot className="h-[18px] w-[18px]" />
              </button>

              {/* Profile */}
              <div className="relative ml-1" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-[10px] px-2 py-1 transition hover:bg-zinc-100"
                >
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                    {initials}
                  </div>
                  <span className="hidden text-[13px] font-medium text-zinc-700 md:inline">
                    {displayName?.split(' ')[0] || 'Operator'}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 md:block" />
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[220px] animate-fade-in rounded-[10px] border border-zinc-200 bg-white p-1 shadow-lg">
                    <Link
                      href="/settings"
                      prefetch={false}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <Settings className="h-4 w-4 text-zinc-400" />
                      Settings
                    </Link>
                    <Link
                      href="/account/billing"
                      prefetch={false}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <CreditCard className="h-4 w-4 text-zinc-400" />
                      Billing
                    </Link>
                    <div className="my-1 h-px bg-zinc-100" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4 text-zinc-400" />
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-5 py-7 pb-16 md:px-8">
            {children}
          </div>
        </div>
      </div>
      <CommandPalette />
      <AiPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      <TelemetryIdentify operator={operator} />
    </main>
    </ToastProvider>
  )
}
