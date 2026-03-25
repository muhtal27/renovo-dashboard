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
import { cn } from '@/lib/ui'

type OperatorNavProps = {
  viewerName?: string | null
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
        label: 'Cases',
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
        label: 'Claims / Outputs',
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
      },
      {
        label: 'Knowledge',
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
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.24)]'
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
  viewerName,
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobile,
}: {
  pathname: string
  viewerName?: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
  mobile?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex items-center gap-3', collapsed && !mobile ? 'justify-center' : 'justify-between')}>
        <Link
          href="/overview"
          onClick={onNavigate}
          className={cn(
            'rounded-[22px] border border-white/70 bg-white px-4 py-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)]',
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
                  Case Operations
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

      <div className="mt-8 space-y-7">
        {NAV_GROUPS.map((group) => (
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

      <div
        className={cn(
          'mt-auto rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]',
          collapsed && !mobile && 'px-3'
        )}
      >
        {!collapsed || mobile ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace mode
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">End-of-tenancy operations</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {viewerName?.trim()
                ? `${viewerName} is working in the live operator workspace.`
                : 'Live cases, evidence review, issue assessment, and claim-ready outputs.'}
            </p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-900 text-sm font-semibold text-white">
              {viewerName?.trim()?.slice(0, 1).toUpperCase() || 'R'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function OperatorNav({
  viewerName,
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
          'hidden xl:block xl:border-r xl:border-[rgba(15,23,42,0.08)] xl:bg-[#f4f7fb]',
          collapsed ? 'xl:w-[96px]' : 'xl:w-[308px]'
        )}
      >
        <div className="sticky top-0 h-screen px-4 py-4">
          <SidebarContent
            pathname={pathname}
            viewerName={viewerName}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 xl:hidden" onClick={onCloseMobile}>
          <aside
            className="absolute inset-y-0 left-0 w-[84vw] max-w-[320px] bg-[#f4f7fb] px-4 py-4 shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
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
              viewerName={viewerName}
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
