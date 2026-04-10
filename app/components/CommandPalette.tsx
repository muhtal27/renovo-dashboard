'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpenText,
  Building2,
  ClipboardCheck,
  CreditCard,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/ui'

type CommandItem = {
  id: string
  label: string
  description?: string
  href: string
  icon: typeof Home
  section: string
  keywords: string[]
}

const COMMANDS: CommandItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Portfolio overview',
    href: '/dashboard',
    icon: Home,
    section: 'Navigation',
    keywords: ['home', 'overview', 'portfolio', 'stats'],
  },
  {
    id: 'tenancies',
    label: 'Tenancies',
    description: 'View all tenancy records',
    href: '/tenancies',
    icon: Building2,
    section: 'Navigation',
    keywords: ['property', 'tenant', 'landlord', 'deposit'],
  },
  {
    id: 'disputes',
    label: 'Disputes',
    description: 'Disputed cases and contested issues',
    href: '/disputes',
    icon: ClipboardCheck,
    section: 'Navigation',
    keywords: ['dispute', 'contested', 'claim', 'resolution'],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Portfolio analytics and performance',
    href: '/reports',
    icon: BarChart3,
    section: 'Navigation',
    keywords: ['analytics', 'performance', 'metrics', 'stats'],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Case allocation and integrations',
    href: '/admin',
    icon: LayoutDashboard,
    section: 'Management',
    keywords: ['allocation', 'assign', 'intake'],
  },
  {
    id: 'teams',
    label: 'Teams',
    description: 'Manage members and roles',
    href: '/teams/members',
    icon: Users,
    section: 'Management',
    keywords: ['members', 'roles', 'team', 'invite'],
  },
  {
    id: 'guidance',
    label: 'Guidance Library',
    description: 'EOT scheme and evidence guidance',
    href: '/guidance',
    icon: BookOpenText,
    section: 'Resources',
    keywords: ['help', 'knowledge', 'scheme', 'evidence', 'tds', 'dps'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account and workspace settings',
    href: '/settings',
    icon: Settings,
    section: 'Account',
    keywords: ['profile', 'account', 'preferences', 'password'],
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Subscription and invoices',
    href: '/account/billing',
    icon: CreditCard,
    section: 'Account',
    keywords: ['subscription', 'invoice', 'payment', 'plan'],
  },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS

    const q = query.toLowerCase()
    return COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.keywords.some((kw) => kw.includes(q))
    )
  }, [query])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleSelect = useCallback(
    (item: CommandItem) => {
      handleClose()
      router.push(item.href)
    },
    [handleClose, router]
  )

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        if (!open) {
          setQuery('')
          setSelectedIndex(0)
        }
      }

      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [open, handleClose])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  const grouped = new Map<string, CommandItem[]>()
  for (const item of filtered) {
    const existing = grouped.get(item.section)
    if (existing) {
      existing.push(item)
    } else {
      grouped.set(item.section, [item])
    }
  }

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/40 pt-[20vh] backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeydown}
            placeholder="Search pages, actions, guidance..."
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {section}
                </p>
                {items.map((item) => {
                  const idx = flatIndex++
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition',
                        idx === selectedIndex
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-zinc-700 hover:bg-zinc-50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.description ? (
                          <p className="truncate text-xs text-zinc-400">{item.description}</p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-100 px-4 py-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono">↑↓</kbd>
              {' '}navigate
              <span className="mx-2">|</span>
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono">↵</kbd>
              {' '}open
            </span>
            <span>
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono">⌘K</kbd>
              {' '}to toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
