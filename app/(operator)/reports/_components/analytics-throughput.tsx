'use client'

import type { EotCaseThroughputWeek } from '@/lib/eot-types'

export function AnalyticsThroughput({
  data,
}: {
  data: EotCaseThroughputWeek[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-400">No case data for this period.</p>
  }

  const maxVal = Math.max(...data.flatMap((w) => [w.created, w.resolved]), 1)

  function formatWeek(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {data.map((week) => (
          <div key={week.week_start} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <span className="text-right text-xs tabular-nums text-zinc-400">
              {formatWeek(week.week_start)}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 rounded-r-sm bg-zinc-400 transition-all"
                  style={{ width: `${(week.created / maxVal) * 100}%`, minWidth: week.created > 0 ? 4 : 0 }}
                />
                <span className="text-[11px] tabular-nums text-zinc-500">{week.created}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 rounded-r-sm bg-emerald-500 transition-all"
                  style={{ width: `${(week.resolved / maxVal) * 100}%`, minWidth: week.resolved > 0 ? 4 : 0 }}
                />
                <span className="text-[11px] tabular-nums text-zinc-500">{week.resolved}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-400" />
          <span className="text-zinc-500">Created</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-500">Resolved</span>
        </div>
      </div>
    </div>
  )
}
