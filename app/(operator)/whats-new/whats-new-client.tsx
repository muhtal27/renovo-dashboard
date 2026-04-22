'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

type ChangeType = 'added' | 'improved' | 'fixed' | 'removed'

const TYPE_BADGE: Record<ChangeType, string> = {
  added: 'badge-emerald',
  improved: 'badge-sky',
  fixed: 'badge-amber',
  removed: 'badge-rose',
}

const TYPE_LABEL: Record<ChangeType, string> = {
  added: 'Added',
  improved: 'Improved',
  fixed: 'Fixed',
  removed: 'Removed',
}

// Mirrors the public marketing changelog at /changelog. Both pages must agree
// on version numbers and dates — a single source of truth for what shipped.
const CHANGELOG = [
  {
    version: '1.28',
    date: '15–17 Apr 2026',
    title: 'Workspace rewrite, CRM OAuth, demo expansion',
    changes: [
      { type: 'added' as ChangeType, text: 'v1.28.3 — Interactive demo expanded with Intelligence, Adjudication Bundle, and workspace rewrites (17 Apr)' },
      { type: 'added' as ChangeType, text: 'v1.28.2 — CRM launch page connects straight through to the OAuth flow (17 Apr)' },
      { type: 'fixed' as ChangeType, text: 'v1.28.1 — Restored missing public assets (logo, icon, open graph image) (16 Apr)' },
      { type: 'added' as ChangeType, text: 'v1.28.0 — Case route wired to the new seven-step end of tenancy workspace (15 Apr)' },
    ],
  },
  {
    version: '1.27',
    date: '14–15 Apr 2026',
    title: 'Workspace persistence and Communications Hub cleanup',
    changes: [
      { type: 'added' as ChangeType, text: 'v1.27.3 — Workspace persistence, evidence upload, and audit logging wired to Supabase (15 Apr)' },
      { type: 'removed' as ChangeType, text: 'v1.27.2 — Removed tenant and landlord portal tabs from the communications hub (14 Apr)' },
      { type: 'improved' as ChangeType, text: 'v1.27.1 — Communications page visual alignment and removal of legacy patterns (14 Apr)' },
      { type: 'added' as ChangeType, text: 'v1.27.0 — PostHog server module and instrumentation client (14 Apr)' },
    ],
  },
  {
    version: '1.22–1.26',
    date: 'Earlier April 2026',
    title: 'UI modernisation sweep',
    changes: [
      { type: 'improved' as ChangeType, text: 'v1.26.x — Dashboard parity updates and animated statistics' },
      { type: 'improved' as ChangeType, text: 'v1.25.x — Comprehensive HTML design overhaul across all operator pages' },
      { type: 'improved' as ChangeType, text: 'v1.24.x — Design system alignment and chart improvements' },
      { type: 'improved' as ChangeType, text: 'v1.22.x — Communications Centre rebuild, major UI modernisation' },
    ],
  },
]

const FILTERS = ['all', 'added', 'improved', 'fixed'] as const

export function WhatsNewClient() {
  const [filter, setFilter] = useState<string>('all')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">What&apos;s New</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Release notes and changelog</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn('pill', filter === f && 'active')}
          >
            {f === 'all' ? 'All' : TYPE_LABEL[f as ChangeType]}
          </button>
        ))}
      </div>

      {/* Changelog entries */}
      <div className="space-y-6">
        {CHANGELOG.map((release) => {
          const changes = filter === 'all'
            ? release.changes
            : release.changes.filter((c) => c.type === filter)

          if (changes.length === 0) return null

          return (
            <div key={release.version} className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="badge badge-emerald font-bold">v{release.version}</span>
                  <h3 className="mt-2 text-base font-semibold text-zinc-900">{release.title}</h3>
                </div>
                <span className="shrink-0 text-[13px] text-zinc-500">{release.date}</span>
              </div>

              <div className="mt-4 space-y-3">
                {changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={cn('badge mt-0.5 shrink-0', TYPE_BADGE[change.type])}>
                      {TYPE_LABEL[change.type]}
                    </span>
                    <span className="text-[13px] text-zinc-700">{change.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
