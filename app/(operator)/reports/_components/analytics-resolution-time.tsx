'use client'

import { formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { EotResolutionTimeSummary } from '@/lib/eot-types'

function statusBarColor(status: string) {
  switch (status) {
    case 'disputed':
      return 'bg-rose-500'
    case 'resolved':
      return 'bg-emerald-500'
    case 'submitted':
      return 'bg-blue-500'
    case 'ready_for_claim':
      return 'bg-emerald-400'
    case 'review':
    case 'draft_sent':
      return 'bg-amber-500'
    case 'analysis':
      return 'bg-amber-400'
    case 'collecting_evidence':
      return 'bg-zinc-400'
    case 'draft':
      return 'bg-zinc-300'
    default:
      return 'bg-zinc-400'
  }
}

export function AnalyticsResolutionTime({
  data,
}: {
  data: EotResolutionTimeSummary
}) {
  const delta =
    data.previous_period_avg_days != null
      ? data.overall_avg_days - data.previous_period_avg_days
      : null

  const maxDays = Math.max(...data.by_stage.map((s) => s.avg_days), 1)

  return (
    <div className="space-y-5">
      {/* Headline KPI */}
      <div>
        <p className="text-xs text-zinc-500">Avg. resolution time</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-zinc-950">
            {data.overall_avg_days.toFixed(1)}
          </span>
          <span className="text-sm text-zinc-400">days</span>
          {delta != null && (
            <span
              className={`text-xs font-medium ${delta <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}d vs prev
            </span>
          )}
        </div>
      </div>

      {/* By-stage breakdown */}
      {data.by_stage.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium text-zinc-500">Time in stage (active cases)</p>
          <div className="space-y-2">
            {data.by_stage
              .sort((a, b) => b.avg_days - a.avg_days)
              .map((stage) => (
                <div key={stage.stage} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
                  <span className="truncate text-xs text-zinc-600">
                    {formatEnumLabel(stage.stage)}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${statusBarColor(stage.stage)} transition-all`}
                      style={{ width: `${(stage.avg_days / maxDays) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-xs tabular-nums text-zinc-500">
                    {stage.avg_days.toFixed(1)}d
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {data.by_stage.length === 0 && (
        <p className="text-sm text-zinc-400">No active cases in this period.</p>
      )}
    </div>
  )
}
