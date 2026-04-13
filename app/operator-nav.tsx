'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpenText,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  hasPermission,
  OPERATOR_PERMISSIONS,
  type OperatorRole,
} from '@/lib/operator-rbac'
import { cn } from '@/lib/ui'

type OperatorNavProps = {
  role?: OperatorRole | null
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
  displayName?: string
  initials?: string
}

type NavItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  isActive: (pathname: string) => boolean
  requiredPermission?: (typeof OPERATOR_PERMISSIONS)[keyof typeof OPERATOR_PERMISSIONS]
}

const NAV_GROUPS: Array<{
  label: string
  items: NavItem[]
}> = [
  {
    label: 'Operations',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        isActive: (pathname) => pathname === '/dashboard',
      },
      {
        label: 'Tenancies',
        href: '/tenancies',
        icon: Building2,
        isActive: (pathname) =>
          pathname === '/tenancies' ||
          pathname.startsWith('/tenancies/') ||
          pathname.startsWith('/dashboard/'),
      },
      {
        label: 'Communications',
        href: '/communications',
        icon: MessageSquare,
        isActive: (pathname) => pathname.startsWith('/communications'),
      },
      {
        label: 'Disputes',
        href: '/disputes',
        icon: ShieldAlert,
        isActive: (pathname) => pathname.startsWith('/disputes') || pathname.startsWith('/issues'),
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Admin',
        href: '/admin',
        icon: SlidersHorizontal,
        isActive: (pathname) => pathname.startsWith('/admin'),
      },
      {
        label: 'Teams',
        href: '/teams/members',
        icon: Users,
        isActive: (pathname) =>
          pathname.startsWith('/teams/members') || pathname.startsWith('/teams/teams'),
        requiredPermission: OPERATOR_PERMISSIONS.MANAGE_USERS,
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        isActive: (pathname) => pathname.startsWith('/reports'),
        requiredPermission: OPERATOR_PERMISSIONS.VIEW_REPORTING,
      },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        label: 'Guidance',
        href: '/guidance',
        icon: BookOpenText,
        isActive: (pathname) => pathname.startsWith('/guidance'),
      },
      {
        label: 'Deposit Schemes',
        href: '/deposit-scheme',
        icon: Landmark,
        isActive: (pathname) => pathname.startsWith('/deposit-scheme'),
      },
      {
        label: 'Inventory Feedback',
        href: '/inventory-feedback',
        icon: ClipboardList,
        isActive: (pathname) => pathname.startsWith('/inventory-feedback'),
      },
      {
        label: "What's New",
        href: '/whats-new',
        icon: Sparkles,
        isActive: (pathname) => pathname.startsWith('/whats-new'),
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        isActive: (pathname) => pathname.startsWith('/settings'),
      },
      {
        label: 'Billing',
        href: '/account/billing',
        icon: CreditCard,
        isActive: (pathname) => pathname.startsWith('/account'),
      },
    ],
  },
]

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
        active
          ? 'border-zinc-200 bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
          : 'border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
        collapsed && 'justify-center px-2'
      )}
    >
      {active ? (
        <span className="absolute -left-px top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
      ) : null}
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
          active
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-zinc-400 group-hover:text-zinc-600'
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
}

function SidebarContent({
  pathname,
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobile,
  displayName,
  initials,
}: {
  pathname: string
  role?: OperatorRole | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
  mobile?: boolean
  displayName?: string
  initials?: string
}) {
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requiredPermission || hasPermission(role, item.requiredPermission)
    ),
  })).filter((group) => group.items.length > 0)

  const isCollapsed = collapsed && !mobile

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn('flex items-center', isCollapsed ? 'justify-center px-2 pt-4' : 'justify-between px-4 pt-4')}>
        <Link
          href="/dashboard"
          prefetch={false}
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 36" fill="none" className="h-7 w-7 shrink-0">
              <rect x="0" y="2" width="26" height="6.5" rx="3.25" fill="#d4d4d8" />
              <rect x="3" y="13" width="26" height="6.5" rx="3.25" fill="#a1a1aa" />
              <rect x="6" y="24" width="26" height="6.5" rx="3.25" fill="#0a0a0a" />
            </svg>
          ) : (
            <div>
              <img src="/logo-new.svg" alt="Renovo AI" className="h-7" />
              <p className="mt-0.5 text-[11px] font-medium text-zinc-400">End of Tenancy</p>
            </div>
          )}
        </Link>

        {!mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 xl:flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      {/* Nav groups */}
      <div className={cn('mt-7 flex-1 overflow-y-auto pb-4', isCollapsed ? 'px-2' : 'px-2.5')}>
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {groupIndex > 0 ? (
              <div className={cn('my-3', isCollapsed ? 'mx-1' : 'mx-2')}>
                <div className="border-t border-zinc-100" />
              </div>
            ) : null}
            {!isCollapsed ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600/70">
                {group.label}
              </p>
            ) : null}
            <div className={cn('space-y-0.5', !isCollapsed && 'mt-1.5')}>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={item.isActive(pathname)}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer — user info */}
      <div className={cn(
        'border-t border-zinc-100 py-3',
        isCollapsed ? 'flex justify-center px-2' : 'flex items-center gap-2.5 px-4'
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
          {initials || 'R'}
        </div>
        {!isCollapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-zinc-900">{displayName || 'Operator'}</p>
            <p className="truncate text-[11px] text-zinc-400">Property Manager</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function OperatorNav({
  role,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  displayName,
  initials,
}: OperatorNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden xl:block xl:border-r xl:border-zinc-200 xl:bg-white',
          collapsed ? 'xl:w-[72px]' : 'xl:w-[260px]'
        )}
        style={{ transition: 'width 0.2s ease' }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <SidebarContent
            pathname={pathname}
            role={role}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            displayName={displayName}
            initials={initials}
          />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 xl:hidden" onClick={onCloseMobile}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[84vw] max-w-[300px] flex-col overflow-y-auto bg-white shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              role={role}
              collapsed={false}
              onToggleCollapse={onCloseMobile}
              onNavigate={onCloseMobile}
              mobile
              displayName={displayName}
              initials={initials}
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
