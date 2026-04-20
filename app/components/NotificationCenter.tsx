'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bell, CheckCircle, Info, ShieldAlert, X } from 'lucide-react'
import { cn } from '@/lib/ui'
import { relativeTime } from '@/lib/relative-time'
import { useEotCases } from '@/lib/queries/eot-queries'

type NotificationTone = 'warning' | 'danger' | 'info' | 'success'

type Notification = {
  id: string
  title: string
  body: string
  href?: string
  tone: NotificationTone
  createdAt: string
  read: boolean
}

const DISMISSED_STORAGE_KEY = 'renovo:dismissed-notifications'
const READ_STORAGE_KEY = 'renovo:read-notifications'

function readStoredIds(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeStoredIds(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]))
  } catch {
    /* localStorage unavailable */
  }
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
): {
  notifications: Notification[]
  dismiss: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
} {
  const [dismissed, setDismissed] = useState<Set<string>>(() => readStoredIds(DISMISSED_STORAGE_KEY))
  const [readIds, setReadIds] = useState<Set<string>>(() => readStoredIds(READ_STORAGE_KEY))

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      writeStoredIds(DISMISSED_STORAGE_KEY, next)
      return next
    })
  }, [])

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      writeStoredIds(READ_STORAGE_KEY, next)
      return next
    })
  }, [])

  const notifications = useMemo(() => {
    const result: Notification[] = []

    for (const c of cases) {
      const addr = c.property.address_line_1 || c.property.name

      if (c.status === 'review') {
        const id = `review-${c.id}`
        if (!dismissed.has(id)) {
          result.push({
            id,
            title: 'Case ready for review',
            body: `${addr} — ${c.tenant_name}`,
            href: `/operator/cases/${c.id}`,
            tone: 'warning',
            createdAt: c.last_activity_at,
            read: readIds.has(id),
          })
        }
      }

      if (c.status === 'disputed') {
        const id = `disputed-${c.id}`
        if (!dismissed.has(id)) {
          result.push({
            id,
            title: 'Case disputed',
            body: `${addr} — ${c.tenant_name}`,
            href: `/operator/cases/${c.id}?step=resolved`,
            tone: 'danger',
            createdAt: c.last_activity_at,
            read: readIds.has(id),
          })
        }
      }

      if (!c.assigned_to) {
        const id = `unassigned-${c.id}`
        if (!dismissed.has(id)) {
          result.push({
            id,
            title: 'Unassigned case',
            body: `${addr} — ${c.tenant_name}`,
            href: '/admin',
            tone: 'info',
            createdAt: c.last_activity_at,
            read: readIds.has(id),
          })
        }
      }
    }

    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return result
  }, [cases, dismissed, readIds])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const n of notifications) next.add(n.id)
      writeStoredIds(READ_STORAGE_KEY, next)
      return next
    })
  }, [notifications])

  return { notifications, dismiss, markRead, markAllRead }
}

// Prototype tone palette — public/demo.html:271-273, 1999
const TONE_ICON: Record<NotificationTone, typeof Bell> = {
  warning: AlertTriangle,
  danger: ShieldAlert,
  info: Info,
  success: CheckCircle,
}

const TONE_CLASS: Record<NotificationTone, string> = {
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Only start fetching cases after the panel has been opened once
  const { data: cases = [] } = useEotCases(undefined, { enabled: hasOpened })
  const { notifications, dismiss, markRead, markAllRead } = useCaseNotifications(cases)
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((prev) => !prev); setHasOpened(true) }}
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] overflow-hidden rounded-[var(--radius-md)] border border-zinc-200 bg-white shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              Notifications
              {unreadCount > 0 ? (
                <span className="badge badge-rose">{unreadCount}</span>
              ) : null}
            </h4>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-md px-2 py-1 text-[12px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                No notifications right now.
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => {
                const Icon = TONE_ICON[n.tone]
                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 border-b border-zinc-100 px-4 py-3 transition last:border-b-0',
                      !n.read ? 'bg-sky-50/70' : '',
                      n.href ? 'hover:bg-zinc-50/60' : ''
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        TONE_CLASS[n.tone]
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm text-zinc-900', !n.read ? 'font-semibold' : 'font-medium')}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{n.body}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        dismiss(n.id)
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
                    onClick={() => {
                      markRead(n.id)
                      setOpen(false)
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} onClick={() => markRead(n.id)} role="button" tabIndex={0}>
                    {content}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
