'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ClipboardCheck,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  MessageSquareMore,
  Settings,
  ShieldCheck,
  Sparkles,
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
        label: 'Overview',
        href: '/overview',
        icon: LayoutDashboard,
        isActive: (pathname) => pathname.startsWith('/overview'),
      },
      {
        label: 'Checkouts',
        href: '/eot',
        icon: FolderKanban,
        isActive: (pathname) => pathname === '/eot' || pathname.startsWith('/eot/'),
      },
      {
        label: 'Tenancy',
        href: '/tenancy',
        icon: FileSearch,
        isActive: (pathname) => pathname.startsWith('/tenancy') || pathname.startsWith('/evidence'),
      },
      {
        label: 'Disputes',
        href: '/disputes',
        icon: ClipboardCheck,
        isActive: (pathname) => pathname.startsWith('/disputes') || pathname.startsWith('/issues'),
      },
      {
        label: 'Recommendations',
        href: '/recommendations',
        icon: Sparkles,
        isActive: (pathname) => pathname.startsWith('/recommendations'),
      },
      {
        label: 'Submissions',
        href: '/claims',
        icon: ShieldCheck,
        isActive: (pathname) => pathname.startsWith('/claims'),
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
        label: 'Guidance',
        href: '/knowledge',
        icon: BookOpenText,
        isActive: (pathname) => pathname.startsWith('/knowledge'),
      },
    ],
  },
  {
    label: 'Workspace',
    items: [
      {
        label: 'Inbox',
        href: '/calls',
        icon: MessageSquareMore,
        isActive: (pathname) => pathname.startsWith('/calls'),
      },
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
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-[18px] border px-3 py-3 text-sm font-medium transition',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950',
        collapsed && 'justify-center px-2'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border transition',
          active
            ? 'border-white/10 bg-white/10 text-white'
            : 'border-slate-200 bg-slate-100 text-slate-500 group-hover:border-slate-300 group-hover:bg-white group-hover:text-slate-700'
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
          href="/overview"
          onClick={onNavigate}
          className={cn(
            'rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
            collapsed && !mobile && 'px-3'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-900 text-sm font-semibold text-white">
              R
            </div>
            {!collapsed || mobile ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Renovo
                </p>
                <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-950">
                  End of tenancy
                </p>
              </div>
            ) : null}
          </div>
        </Link>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:text-slate-950 xl:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-8 space-y-7 pb-6">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {!collapsed || mobile ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </p>
            ) : null}
            <div className={cn('space-y-1.5', (!collapsed || mobile) && 'mt-3')}>
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
          'hidden xl:block xl:border-r xl:border-slate-200/80 xl:bg-[#f7f9fc]',
          collapsed ? 'xl:w-[96px]' : 'xl:w-[308px]'
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
        <div className="fixed inset-0 z-50 bg-slate-950/35 xl:hidden" onClick={onCloseMobile}>
          <aside
            className="absolute inset-y-0 left-0 w-[84vw] max-w-[320px] bg-[#f7f9fc] px-4 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={onCloseMobile}
                className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600"
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
