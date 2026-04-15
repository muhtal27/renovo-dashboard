'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/ui'
import { formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { AiAccuracySummary } from '@/lib/mock/report-fixtures'

/* ── Bar chart for category breakdown ─────────────────────────── */

function CategoryBar({
  category,
}: {
  category: AiAccuracySummary['categories'][number]
}) {
  const agreedWidth = category.total > 0 ? (category.agreed / category.total) * 100 : 0
  const overriddenWidth = category.total > 0 ? (category.overridden / category.total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium text-zinc-700">
        {formatEnumLabel(category.type)}
      </span>
      <div className="flex flex-1 items-center gap-0 overflow-hidden rounded-full bg-zinc-100" style={{ height: 10 }}>
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${agreedWidth}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-700"
          style={{ width: `${overriddenWidth}%` }}
        />
      </div>
      <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-emerald-600">
        {category.agreePct}%
      </span>
    </div>
  )
}

/* ── Trend line chart ─────────────────────────────────────────── */

function TrendChart({ data }: { data: AiAccuracySummary['monthlyTrend'] }) {
  const w = 280
  const h = 100
  const pad = 20

  const minPct = Math.min(...data.map((d) => d.agreePct)) - 5
  const maxPct = Math.max(...data.map((d) => d.agreePct)) + 5
  const range = maxPct - minPct || 1

  const coords = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - 2 * pad),
    y: h - pad - ((d.agreePct - minPct) / range) * (h - 2 * pad),
  }))

  const points = coords.map((c) => `${c.x},${c.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 320 }} role="img" aria-label="AI agreement rate trend over the last 6 months">
        {/* Grid lines */}
        {[minPct, minPct + range / 2, maxPct].map((val, i) => {
          const y = h - pad - ((val - minPct) / range) * (h - 2 * pad)
          return (
            <g key={i}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#e4e4e7" strokeWidth="0.5" />
              <text x={pad - 4} y={y + 3} textAnchor="end" fill="#a1a1aa" fontSize="8">
                {Math.round(val)}%
              </text>
            </g>
          )
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#10b981" />
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={coords[i].x}
            y={h - 4}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="8"
          >
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────── */

export function AnalyticsAiAccuracy({ data }: { data: AiAccuracySummary }) {
  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => b.total - a.total),
    [data.categories],
  )

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Agreement Rate</span>
          <div className="stat-value text-emerald-600">{data.overallAgreementRate}%</div>
          <p className="mt-1 text-xs text-zinc-500">
            {data.totalDecisions} total decisions
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Overrides</span>
          <div className="stat-value">{data.totalOverrides}</div>
          <p className="mt-1 text-xs text-zinc-500">
            Operator-overridden AI decisions
          </p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Confidence</span>
          <div className="stat-value">{data.avgConfidence}%</div>
          <p className="mt-1 text-xs text-zinc-500">Mean AI confidence score</p>
        </div>
        <div className="stat-card">
          <span className="stat-label">Improvement Trend</span>
          <div className={cn(
            'stat-value',
            data.improvementTrend > 0 ? 'text-emerald-600' : 'text-rose-600',
          )}>
            {data.improvementTrend > 0 ? '+' : ''}{data.improvementTrend}%
          </div>
          <p className="mt-1 text-xs text-zinc-500">30-day improvement</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Category breakdown */}
        <div className="stat-card">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">
            Agreement by Category
          </h4>
          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <CategoryBar key={cat.type} category={cat} />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Agreed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Overridden
            </span>
          </div>
        </div>

        {/* Trend over time */}
        <div className="stat-card">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">
            Agreement Trend
          </h4>
          <TrendChart data={data.monthlyTrend} />
          <p className="mt-3 text-xs text-zinc-500">
            Monthly agreement rate between AI recommendations and operator decisions
          </p>
        </div>
      </div>
    </div>
  )
}
