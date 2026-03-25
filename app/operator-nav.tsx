'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookCheck,
  LayoutDashboard,
  Phone,
  Settings,
  ClipboardList,
} from 'lucide-react'

type OperatorNavProps = {
  viewerName?: string | null
}

const PRIMARY_ITEMS = [
  {
    label: 'Cases',
    href: '/eot',
    icon: ClipboardList,
    isActive: (pathname: string) => pathname === '/eot' || pathname.startsWith('/eot/'),
  },
  {
    label: 'Knowledge',
    href: '/knowledge',
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname.startsWith('/knowledge'),
  },
  {
    label: 'Guidance',
    href: '/knowledge',
    icon: BookCheck,
    isActive: (pathname: string) => pathname.startsWith('/knowledge'),
  },
] as const

const SECONDARY_ITEMS = [
  {
    label: 'Calls',
    href: '/calls',
    icon: Phone,
    isActive: (pathname: string) => pathname.startsWith('/calls'),
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith('/settings'),
  },
] as const

function NavGroup({
  items,
  pathname,
}: {
  items: ReadonlyArray<{
    label: string
    href: string
    icon: typeof LayoutDashboard
    isActive: (pathname: string) => boolean
  }>
  pathname: string
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const active = item.isActive(pathname)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-[1rem] border px-3 py-3 text-sm font-medium transition ${
              active
                ? 'border-stone-900 bg-stone-900 text-white shadow-[0_14px_30px_rgba(28,25,23,0.18)]'
                : 'border-transparent text-stone-600 hover:border-stone-200 hover:bg-white hover:text-stone-900'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-[0.85rem] border transition ${
                active
                  ? 'border-white/10 bg-white/10 text-white'
                  : 'border-stone-200 bg-stone-100 text-stone-500 group-hover:border-stone-300 group-hover:bg-stone-50 group-hover:text-stone-700'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function OperatorNav({ viewerName }: OperatorNavProps) {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden xl:flex xl:w-[288px] xl:flex-col xl:border-r xl:border-stone-200/80 xl:bg-[#f4efe7]">
        <div className="sticky top-0 flex min-h-screen flex-col px-5 py-6">
          <Link
            href="/knowledge"
            className="rounded-[1.1rem] border border-stone-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="app-kicker !mb-0 !text-stone-500">Renovo AI</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-stone-900">Operations</p>
            <p className="mt-1 text-sm text-stone-500">Clean-slate operator workspace</p>
          </Link>

          <div className="mt-8">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Core modules
            </p>
            <div className="mt-3">
              <NavGroup items={PRIMARY_ITEMS} pathname={pathname} />
            </div>
          </div>

          <div className="mt-7">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Workspace
            </p>
            <div className="mt-3">
              <NavGroup items={SECONDARY_ITEMS} pathname={pathname} />
            </div>
          </div>

          <div className="mt-auto rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Workspace mode
            </p>
            <p className="mt-2 text-sm font-medium text-stone-900">Property manager operations</p>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              {viewerName?.trim()
                ? `${viewerName} is signed into the live operator workspace.`
                : 'Knowledge, operator tooling, and clean-slate backend rollout.'}
            </p>
          </div>
        </div>
      </aside>

      <div className="border-b border-stone-200/80 bg-[#f4efe7] px-4 py-3 xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/knowledge"
            className="rounded-[0.95rem] border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold tracking-[0.18em] text-stone-900"
          >
            Renovo
          </Link>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2">
              {PRIMARY_ITEMS.map((item) => {
                const active = item.isActive(pathname)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                      active
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
