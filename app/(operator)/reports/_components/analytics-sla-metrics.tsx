'use client'

import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { SlaSummary } from '@/lib/mock/report-fixtures'

/* ── SLA target row ──────────────────────────────────────────── */

function SlaTargetRow({ target }: { target: SlaSummary['targets'][number] }) {
  const isOnTrack = target.actualDays <= target.targetDays
  const barWidth = Math.min((target.compliancePct / 100) * 100, 100)

  return (
    <div className="flex items-center gap-4 border-b border-zinc-100 py-3 last:border-b-0">
      <div className="w-32">
        <p className="text-[13px] font-medium text-zinc-900">{target.label}</p>
        <p className="text-[11px] text-zinc-500">
          Target: {target.targetDays}d
        </p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                target.compliancePct >= 90
                  ? 'bg-emerald-500'
                  : target.compliancePct >= 75
                    ? 'bg-amber-500'
                    : 'bg-rose-500',
              )}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="w-12 text-right text-[11px] font-semibold tabular-nums text-zinc-700">
            {target.compliancePct}%
          </span>
        </div>
      </div>
      <div className="w-20 text-right">
        <span
          className={cn(
            'text-[13px] font-semibold tabular-nums',
            isOnTrack ? 'text-emerald-600' : 'text-rose-600',
          )}
        >
          {target.actualDays}d
        </span>
        <p className="text-[10px] text-zinc-400">avg actual</p>
      </div>
      <div className="w-16 text-right">
        <span className="text-[11px] tabular-nums text-zinc-600">
          {target.casesInTarget}/{target.totalCases}
        </span>
      </div>
    </div>
  )
}

/* ── Weekly compliance mini chart ─────────────────────────────── */

function WeeklyComplianceChart({ data }: { data: SlaSummary['weeklyCompliance'] }) {
  const maxVal = Math.max(...data.map((d) => d.pct), 100)

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.pct / maxVal) * 100, 8)
          const isGood = d.pct >= 90
          return (
            <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-zinc-600">
                {d.pct}%
              </span>
              <div
                className={cn(
                  'w-full max-w-[48px] origin-bottom rounded-t-[3px] transition-all duration-500',
                  isGood ? 'bg-emerald-500' : 'bg-amber-500',
                )}
                style={{ height: barHeight }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex gap-2">
        {data.map((d) => (
          <div key={d.week} className="flex-1 text-center text-[10px] font-medium text-zinc-400">
            {d.week}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */

export function AnalyticsSlaMetrics({ data }: { data: SlaSummary }) {
  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">SLA Met</span>
          <div className="stat-value text-emerald-600">{data.totalCasesMet}</div>
          <p className="mt-1 text-xs text-zinc-500">
            {data.overallCompliance}% compliance
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">SLA Missed</span>
          <div className="stat-value text-rose-600">{data.totalCasesMissed}</div>
          <p className="mt-1 text-xs text-zinc-500">Exceeded target time</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pipeline Value</span>
          <div className="stat-value">{formatCurrency(data.pipelineValue)}</div>
          <p className="mt-1 text-xs text-zinc-500">
            Total deposits in pipeline
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Projected Recovery</span>
          <div className="stat-value text-emerald-600">
            {formatCurrency(data.projectedRecovery)}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Based on {data.recoveryRate}% historical rate
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* SLA targets detail */}
        <div className="stat-card">
          <h4 className="mb-2 text-sm font-semibold text-zinc-900">
            SLA Target Performance
          </h4>
          <div>
            {data.targets.map((target) => (
              <SlaTargetRow key={target.metric} target={target} />
            ))}
          </div>
        </div>

        {/* Weekly compliance */}
        <div className="stat-card">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">
            Weekly Compliance
          </h4>
          <WeeklyComplianceChart data={data.weeklyCompliance} />
          <p className="mt-3 text-xs text-zinc-500">
            Percentage of cases meeting SLA targets per week
          </p>
        </div>
      </div>
    </div>
  )
}
