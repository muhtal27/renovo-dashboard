'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/ui'
import { relativeTime } from '@/lib/relative-time'

type Notification = {
  id: string
  title: string
  body: string
  href?: string
  tone: 'default' | 'warning' | 'danger' | 'success'
  createdAt: string
  read: boolean
}

function useCaseNotifications(
  cases: Array<{
    id: string
    status: string
    priority: string
    assigned_to: string | null
    property: { name: string; address_line_1: string | null }
    tenant_name: string
    last_activity_at: string
  }>
): Notification[] {
  const [dismissed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('renovo:dismissed-notifications')
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  const notifications: Notification[] = []

  for (const c of cases) {
    const addr = c.property.address_line_1 || c.property.name

    if (c.status === 'review') {
      const id = `review-${c.id}`
      if (!dismissed.has(id)) {
        notifications.push({
          id,
          title: 'Case ready for review',
          body: `${addr} — ${c.tenant_name}`,
          href: `/operator/cases/${c.id}`,
          tone: 'warning',
          createdAt: c.last_activity_at,
          read: false,
        })
      }
    }

    if (c.status === 'disputed') {
      const id = `disputed-${c.id}`
      if (!dismissed.has(id)) {
        notifications.push({
          id,
          title: 'Case disputed',
          body: `${addr} — ${c.tenant_name}`,
          href: `/operator/cases/${c.id}?step=resolved`,
          tone: 'danger',
          createdAt: c.last_activity_at,
          read: false,
        })
      }
    }

    if (!c.assigned_to) {
      const id = `unassigned-${c.id}`
      if (!dismissed.has(id)) {
        notifications.push({
          id,
          title: 'Unassigned case',
          body: `${addr} — ${c.tenant_name}`,
          href: '/admin',
          tone: 'default',
          createdAt: c.last_activity_at,
          read: false,
        })
      }
    }
  }

  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return notifications
}

const TONE_DOT: Record<string, string> = {
  default: 'bg-zinc-400',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  success: 'bg-emerald-500',
}

export function NotificationCenter({
  cases,
}: {
  cases: Array<{
    id: string
    status: string
    priority: string
    assigned_to: string | null
    property: { name: string; address_line_1: string | null }
    tenant_name: string
    last_activity_at: string
  }>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const notifications = useCaseNotifications(cases)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleDismiss = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem('renovo:dismissed-notifications')
      const current: string[] = raw ? (JSON.parse(raw) as string[]) : []
      current.push(id)
      localStorage.setItem('renovo:dismissed-notifications', JSON.stringify(current))
    } catch {
      // localStorage unavailable
    }
    window.location.reload()
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-950">Notifications</h3>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                {unreadCount} new
              </span>
            ) : null}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                No notifications right now.
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 border-b border-zinc-100 px-4 py-3 transition last:border-b-0',
                      n.href ? 'hover:bg-zinc-50/60' : ''
                    )}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE_DOT[n.tone])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">{relativeTime(n.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDismiss(n.id)
                      }}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                      aria-label="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )

                return n.href ? (
                  <Link
                    key={n.id}
                    href={n.href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
