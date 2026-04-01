'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ClipboardCheck,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  Settings,
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
  signingOut?: boolean
  onSignOut?: () => void
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
        label: 'Checkouts',
        href: '/eot',
        icon: FolderKanban,
        isActive: (pathname) => pathname === '/eot' || pathname.startsWith('/eot/'),
      },
      {
        label: 'Disputes',
        href: '/disputes',
        icon: ClipboardCheck,
        isActive: (pathname) => pathname.startsWith('/disputes') || pathname.startsWith('/issues'),
      },
      {
        label: 'Inventory feedback',
        href: '/inventory-feedback',
        icon: MessageSquareMore,
        isActive: (pathname) => pathname.startsWith('/inventory-feedback'),
      },
      {
        label: 'Deposit Scheme',
        href: '/claims',
        icon: Landmark,
        isActive: (pathname) => pathname.startsWith('/claims'),
      },
      {
        label: 'Guidance',
        href: '/knowledge',
        icon: BookOpenText,
        isActive: (pathname) => pathname.startsWith('/knowledge'),
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        label: 'Reports / Analytics',
        href: '/reports',
        icon: BarChart3,
        isActive: (pathname) => pathname.startsWith('/reports'),
        requiredPermission: OPERATOR_PERMISSIONS.VIEW_REPORTING,
      },
      {
        label: 'Admin',
        href: '/overview',
        icon: LayoutDashboard,
        isActive: (pathname) => pathname.startsWith('/overview'),
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        isActive: (pathname) => pathname.startsWith('/settings'),
        requiredPermission: OPERATOR_PERMISSIONS.MANAGE_SETTINGS,
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
        'group relative flex items-center gap-3 border px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'border-zinc-200 bg-white text-zinc-950'
          : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-zinc-950',
        collapsed && 'justify-center px-2'
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
      ) : null}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center transition',
          active
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-zinc-400 group-hover:text-zinc-600'
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
}

function NavActionButton({
  label,
  icon: Icon,
  collapsed,
  pending = false,
  onClick,
}: {
  label: string
  icon: typeof LayoutDashboard
  collapsed: boolean
  pending?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-white hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60',
        collapsed && 'justify-center px-2'
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-400 transition group-hover:text-zinc-600">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      {!collapsed ? <span className="truncate">{pending ? 'Signing out...' : label}</span> : null}
    </button>
  )
}

function SidebarContent({
  pathname,
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobile,
  signingOut,
  onSignOut,
}: {
  pathname: string
  role?: OperatorRole | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
  mobile?: boolean
  signingOut?: boolean
  onSignOut?: () => void
}) {
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.requiredPermission || hasPermission(role, item.requiredPermission)
    ),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3', collapsed && !mobile ? 'justify-center' : 'justify-between')}>
        <Link
          href="/eot"
          prefetch={false}
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-zinc-900 text-sm font-semibold text-white">
              R
            </div>
            {!collapsed || mobile ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Renovo AI
                </p>
                <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-zinc-950">
                  End of tenancy
                </p>
              </div>
            ) : null}
          </div>
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-8 w-8 items-center justify-center text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 xl:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-8 space-y-6 pb-6">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {!collapsed || mobile ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600/70">
                {group.label}
              </p>
            ) : null}
            <div className={cn('space-y-0.5', (!collapsed || mobile) && 'mt-3')}>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={item.isActive(pathname)}
                  collapsed={collapsed && !mobile}
                  onNavigate={onNavigate}
                />
              ))}
              {group.label === 'Workspace' && onSignOut ? (
                <NavActionButton
                  label="Sign out"
                  icon={LogOut}
                  collapsed={collapsed && !mobile}
                  pending={signingOut}
                  onClick={onSignOut}
                />
              ) : null}
            </div>
          </div>
        ))}
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
  signingOut,
  onSignOut,
}: OperatorNavProps) {
  const pathname = usePathname()

  return (
    <>
      <aside
        className={cn(
          'hidden xl:block xl:border-r xl:border-zinc-200/80 xl:bg-zinc-50/80',
          collapsed ? 'xl:w-[80px]' : 'xl:w-[264px]'
        )}
      >
        <div className="sticky top-0 h-screen overflow-y-auto px-4 py-4">
          <SidebarContent
            pathname={pathname}
            role={role}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            signingOut={signingOut}
            onSignOut={onSignOut}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 xl:hidden" onClick={onCloseMobile}>
          <aside
            className="absolute inset-y-0 left-0 w-[84vw] max-w-[320px] bg-zinc-50 px-4 py-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-8 w-8 items-center justify-center text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
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
              signingOut={signingOut}
              onSignOut={onSignOut}
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
