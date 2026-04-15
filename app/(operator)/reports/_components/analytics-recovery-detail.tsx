'use client'

import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { RecoveryByScheme } from '@/lib/mock/report-fixtures'

/* ── Donut chart (SVG) ────────────────────────────────────────── */

function DonutChart({
  claimed,
  awarded,
}: {
  claimed: number
  awarded: number
}) {
  const total = claimed || 1
  const awardedPct = (awarded / total) * 100
  const gap = total - awarded

  const size = 140
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const awardedDash = (awardedPct / 100) * circumference
  const gapDash = circumference - awardedDash

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Recovery rate: ${Math.round((awarded / (claimed || 1)) * 100)}% of ${formatCurrency(claimed)} recovered`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={strokeWidth}
        />
        {/* Awarded ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeDasharray={`${awardedDash} ${gapDash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          fill="#18181b"
          fontSize="20"
          fontWeight="700"
          fontFamily="var(--font-dm-sans), sans-serif"
        >
          {Math.round(awardedPct)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize="10"
          fontFamily="var(--font-dm-sans), sans-serif"
        >
          recovered
        </text>
      </svg>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Awarded {formatCurrency(awarded)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-200" />
          Difference {formatCurrency(gap)}
        </span>
      </div>
    </div>
  )
}

/* ── Scheme breakdown table ───────────────────────────────────── */

function SchemeRow({ scheme }: { scheme: RecoveryByScheme }) {
  const barWidth = Math.min(scheme.successRate, 100)

  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 py-3 last:border-b-0">
      <div className="w-44 min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-900">
          {scheme.scheme}
        </p>
        <p className="text-[11px] text-zinc-500">{scheme.cases} cases</p>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                scheme.successRate >= 85
                  ? 'bg-emerald-500'
                  : scheme.successRate >= 70
                    ? 'bg-amber-500'
                    : 'bg-rose-500',
              )}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-zinc-600">
            {scheme.successRate}%
          </span>
        </div>
      </div>
      <div className="w-20 text-right">
        <p className="text-[12px] font-semibold tabular-nums text-zinc-900">
          {formatCurrency(scheme.awarded)}
        </p>
        <p className="text-[10px] text-zinc-400">
          of {formatCurrency(scheme.claimed)}
        </p>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */

export function AnalyticsRecoveryDetail({
  schemes,
  totalClaimed,
  totalAwarded,
}: {
  schemes: RecoveryByScheme[]
  totalClaimed: number
  totalAwarded: number
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Donut chart */}
      <div className="stat-card flex flex-col items-center justify-center">
        <h4 className="mb-4 self-start text-sm font-semibold text-zinc-900">
          Claimed vs Awarded
        </h4>
        <DonutChart claimed={totalClaimed} awarded={totalAwarded} />
      </div>

      {/* Scheme breakdown */}
      <div className="stat-card">
        <h4 className="mb-2 text-sm font-semibold text-zinc-900">
          By Scheme Breakdown
        </h4>
        {schemes.length > 0 ? (
          <div>
            {schemes.map((scheme) => (
              <SchemeRow key={scheme.scheme} scheme={scheme} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-400">
            Scheme-level recovery analytics will be available when more data is collected.
          </p>
        )}
      </div>
    </div>
  )
}
