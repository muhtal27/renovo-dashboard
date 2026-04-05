'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpenText,
  Building2,
  ChevronLeft,
  ClipboardCheck,
  CreditCard,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  MessageSquareMore,
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
        icon: Building2,
        isActive: (pathname) => pathname === '/dashboard' || pathname.startsWith('/dashboard/'),
      },
      {
        label: 'Tenancies',
        href: '/tenancies',
        icon: FolderKanban,
        isActive: (pathname) => pathname === '/tenancies' || pathname.startsWith('/tenancies/'),
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
        href: '/deposit-scheme',
        icon: Landmark,
        isActive: (pathname) => pathname.startsWith('/deposit-scheme'),
      },
      {
        label: 'Guidance',
        href: '/guidance',
        icon: BookOpenText,
        isActive: (pathname) => pathname.startsWith('/guidance'),
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Admin',
        href: '/admin',
        icon: LayoutDashboard,
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
        label: 'Reports / Analytics',
        href: '/reports',
        icon: BarChart3,
        isActive: (pathname) => pathname.startsWith('/reports'),
        requiredPermission: OPERATOR_PERMISSIONS.VIEW_REPORTING,
      },
    ],
  },
  {
    label: 'Account',
    items: [
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
        'group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'border-zinc-200 bg-white text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
          : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-zinc-950',
        collapsed && 'justify-center px-2'
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-500" />
      ) : null}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition',
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

function SidebarContent({
  pathname,
  role,
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobile,
}: {
  pathname: string
  role?: OperatorRole | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
  mobile?: boolean
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
          href="/tenancies"
          prefetch={false}
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-3"
        >
          <div className="flex items-center gap-3">
            {collapsed && !mobile ? (
              <Image src="/logo-new.svg" alt="Renovo AI" width={28} height={28} className="h-7 w-7 object-contain" />
            ) : null}
            {!collapsed || mobile ? (
              <div>
                <Image src="/logo-new.svg" alt="Renovo AI" width={108} height={22} className="h-[18px] w-auto" />
                <p className="mt-1 text-[13px] font-medium tracking-[-0.01em] text-zinc-500">
                  End of Tenancy
                </p>
              </div>
            ) : null}
          </div>
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 xl:flex"
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
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 xl:hidden" onClick={onCloseMobile}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[84vw] max-w-[320px] flex-col overflow-y-auto bg-zinc-50 px-4 py-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
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
            />
          </aside>
        </div>
      ) : null}
    </>
  )
}
