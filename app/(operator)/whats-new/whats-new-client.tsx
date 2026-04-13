'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

type ChangeType = 'added' | 'improved' | 'fixed' | 'removed'

const TYPE_BADGE: Record<ChangeType, string> = {
  added: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  improved: 'border-sky-200 bg-sky-50 text-sky-700',
  fixed: 'border-amber-200 bg-amber-50 text-amber-700',
  removed: 'border-rose-200 bg-rose-50 text-rose-700',
}

const TYPE_LABEL: Record<ChangeType, string> = {
  added: 'Added',
  improved: 'Improved',
  fixed: 'Fixed',
  removed: 'Removed',
}

const CHANGELOG = [
  {
    version: '2.4.0',
    date: '12 Apr 2026',
    title: 'AI-Powered Analysis Engine',
    changes: [
      { type: 'added' as ChangeType, text: 'AI analysis engine for automatic issue detection and severity assessment' },
      { type: 'added' as ChangeType, text: 'Drag-and-drop kanban board for case pipeline management' },
      { type: 'improved' as ChangeType, text: 'Dashboard KPI cards now show sparkline trends and animated counters' },
      { type: 'improved' as ChangeType, text: 'Command palette (Cmd+K) with fuzzy search across all pages' },
      { type: 'fixed' as ChangeType, text: 'Notification centre badge count not updating in real-time' },
    ],
  },
  {
    version: '2.3.1',
    date: '28 Mar 2026',
    title: 'Communication Centre Rebuild',
    changes: [
      { type: 'added' as ChangeType, text: 'Unified Communication Centre with inbox, conversations and templates' },
      { type: 'added' as ChangeType, text: 'Tenant and landlord portal messaging channels' },
      { type: 'improved' as ChangeType, text: 'Message threading with case reference linking' },
      { type: 'fixed' as ChangeType, text: 'Email template variables not substituting correctly' },
    ],
  },
  {
    version: '2.3.0',
    date: '15 Mar 2026',
    title: 'Operations Command Centre',
    changes: [
      { type: 'added' as ChangeType, text: 'Single-flow operations dashboard with real-time pipeline visualisation' },
      { type: 'added' as ChangeType, text: 'Team workload analytics and capacity planning charts' },
      { type: 'improved' as ChangeType, text: 'Report export now includes CSV and PDF formats' },
      { type: 'fixed' as ChangeType, text: 'Calendar import error in ending-soon tenancy table' },
      { type: 'removed' as ChangeType, text: 'Legacy dual-panel dashboard layout' },
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
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">What&apos;s New</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Release notes and changelog</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
              filter === f
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            )}
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
                  <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    v{release.version}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-zinc-900">{release.title}</h3>
                </div>
                <span className="shrink-0 text-[13px] text-zinc-500">{release.date}</span>
              </div>

              <div className="mt-4 space-y-3">
                {changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                        TYPE_BADGE[change.type]
                      )}
                    >
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
