'use client'

import { useMemo } from 'react'
import type { FinanceMonth } from '@/lib/finance/types'
import { formatGBP, formatMonth, totalsForMonth } from '@/lib/finance/runway-math'

type Props = {
  months: FinanceMonth[]
}

const W = 960
const H = 280
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 36

export function RunwayChart({ months }: Props) {
  const data = useMemo(() => {
    const sorted = [...months].sort((a, b) => (a.month > b.month ? 1 : -1))
    const last12 = sorted.slice(-12)
    return last12.map((m) => {
      const t = totalsForMonth(m)
      return {
        id: m.id,
        month: m.month,
        isActual: m.is_actual,
        closing: t.closingCash,
        net: t.netCashFlow,
      }
    })
  }, [months])

  if (data.length === 0) return null

  const cashMax = Math.max(...data.map((d) => d.closing), 0)
  const cashMin = Math.min(...data.map((d) => d.closing), 0)
  const netMax = Math.max(...data.map((d) => Math.abs(d.net)), 1)

  const yPad = (cashMax - cashMin) * 0.1 || 1000
  const yMax = cashMax + yPad
  const yMin = cashMin - yPad
  const yRange = yMax - yMin || 1

  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const barSlot = innerW / data.length
  const barWidth = Math.min(barSlot * 0.5, 28)
  const barAreaHalf = innerH * 0.28

  function xForIndex(i: number) {
    return PAD_LEFT + barSlot * i + barSlot / 2
  }
  function yForCash(v: number) {
    return PAD_TOP + innerH - ((v - yMin) / yRange) * innerH
  }
  function barHeight(net: number) {
    return (Math.abs(net) / netMax) * barAreaHalf
  }

  // Cash line — built per segment so we can dash the forecast portion
  const segments: Array<{ from: number; to: number; forecast: boolean }> = []
  for (let i = 0; i < data.length - 1; i++) {
    const forecast = !data[i].isActual || !data[i + 1].isActual
    segments.push({ from: i, to: i + 1, forecast })
  }

  // Y axis gridlines
  const ticks = niceTicks(yMin, yMax, 4)

  const zeroY = yForCash(0)
  const barBaselineY = PAD_TOP + innerH - barAreaHalf

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cash balance over time with monthly net bars"
        className="h-[280px] w-full min-w-[720px]"
      >
        {/* Gridlines */}
        {ticks.map((t) => {
          const y = yForCash(t)
          return (
            <g key={`tick-${t}`}>
              <line
                x1={PAD_LEFT}
                x2={W - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="#f4f4f5"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill="#a1a1aa"
              >
                {formatGBP(t, { compact: true })}
              </text>
            </g>
          )
        })}

        {/* Zero line for cash */}
        <line
          x1={PAD_LEFT}
          x2={W - PAD_RIGHT}
          y1={zeroY}
          y2={zeroY}
          stroke="#e4e4e7"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {/* Net bars (centered on baselineY) */}
        {data.map((d, i) => {
          const h = barHeight(d.net)
          const y = d.net >= 0 ? barBaselineY - h : barBaselineY
          const color = d.net >= 0 ? '#10b981' : '#f43f5e'
          const opacity = d.isActual ? 0.9 : 0.35
          return (
            <rect
              key={`bar-${d.id}`}
              x={xForIndex(i) - barWidth / 2}
              y={y}
              width={barWidth}
              height={Math.max(h, 1)}
              fill={color}
              opacity={opacity}
              rx={2}
            >
              <title>
                {formatMonth(d.month)} · Net {formatGBP(d.net)}
              </title>
            </rect>
          )
        })}

        {/* Cash line segments */}
        {segments.map((seg, idx) => {
          const a = data[seg.from]
          const b = data[seg.to]
          const x1 = xForIndex(seg.from)
          const y1 = yForCash(a.closing)
          const x2 = xForIndex(seg.to)
          const y2 = yForCash(b.closing)
          return (
            <line
              key={`seg-${idx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#18181b"
              strokeWidth={2}
              strokeDasharray={seg.forecast ? '4 4' : undefined}
              strokeLinecap="round"
            />
          )
        })}

        {/* Cash dots */}
        {data.map((d, i) => (
          <g key={`dot-${d.id}`}>
            <circle
              cx={xForIndex(i)}
              cy={yForCash(d.closing)}
              r={3.5}
              fill={d.isActual ? '#18181b' : '#ffffff'}
              stroke="#18181b"
              strokeWidth={1.5}
            />
            <title>
              {formatMonth(d.month)} · Cash {formatGBP(d.closing)}
            </title>
          </g>
        ))}

        {/* X axis labels */}
        {data.map((d, i) => (
          <text
            key={`xlab-${d.id}`}
            x={xForIndex(i)}
            y={H - 12}
            textAnchor="middle"
            fontSize={10}
            fill="#71717a"
          >
            {shortMonth(d.month)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-2 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4 bg-zinc-900" />
          Cash (actual)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4 border-t-[2px] border-dashed border-zinc-900" />
          Cash (forecast)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-[2px] bg-emerald-500" />
          Positive net
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-[2px] bg-rose-500" />
          Negative net (burn)
        </span>
      </div>
    </div>
  )
}

function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min]
  const range = max - min
  const step = niceStep(range / count)
  const first = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = first; v <= max; v += step) {
    ticks.push(Math.round(v))
  }
  return ticks
}

function niceStep(raw: number): number {
  const exp = Math.floor(Math.log10(Math.abs(raw)))
  const base = Math.pow(10, exp)
  const norm = raw / base
  let nice
  if (norm < 1.5) nice = 1
  else if (norm < 3) nice = 2
  else if (norm < 7) nice = 5
  else nice = 10
  return nice * base
}

function shortMonth(iso: string): string {
  const [y, m] = iso.split('-').map((s) => parseInt(s, 10))
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('en-GB', { month: 'short' })
}
