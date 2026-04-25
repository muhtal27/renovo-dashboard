'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { FinanceMonth, FinanceScenario } from '@/lib/finance/types'
import {
  computeRunwaySummary,
  formatGBP,
  formatMonth,
  runwayForScenario,
  totalsForMonth,
} from '@/lib/finance/runway-math'
import { RunwayChart } from './runway-chart'

export function RunwayDashboardView() {
  const [months, setMonths] = useState<FinanceMonth[] | null>(null)
  const [scenarios, setScenarios] = useState<FinanceScenario[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [mRes, sRes] = await Promise.all([
          fetch('/api/internal/runway/months', { cache: 'no-store' }),
          fetch('/api/internal/runway/scenarios', { cache: 'no-store' }),
        ])
        if (!mRes.ok || !sRes.ok) throw new Error('Failed to load.')
        const mBody = (await mRes.json()) as { months: FinanceMonth[] }
        const sBody = (await sRes.json()) as { scenarios: FinanceScenario[] }
        if (!cancelled) {
          setMonths(mBody.months)
          setScenarios(sBody.scenarios)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load.')
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(
    () => (months ? computeRunwaySummary(months) : null),
    [months]
  )

  const activeScenario = useMemo(
    () => scenarios?.find((s) => s.is_active) ?? null,
    [scenarios]
  )

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  if (months === null || scenarios === null || summary === null) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[108px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
          ))}
        </div>
        <div className="h-[320px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
      </div>
    )
  }

  const hasData = months.length > 0
  const hasActual = summary.latestActual !== null

  return (
    <>
      {!hasData && <EmptyState />}
      {hasData && !hasActual && <NoActualBanner />}

      {activeScenario && (
        <ActiveScenarioBanner
          scenario={activeScenario}
          count={scenarios.length}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <HeroCard
          label="Cash on hand"
          value={formatGBP(summary.currentCash)}
          sub={
            summary.latestActual
              ? `As of ${formatMonth(summary.latestActual.month)}`
              : 'Add an actual month'
          }
          tone={summary.currentCash > 0 ? 'neutral' : 'bad'}
        />
        <HeroCard
          label="Runway (rolling)"
          value={
            summary.runwayMonths === null
              ? hasActual
                ? '∞'
                : '—'
              : `${summary.runwayMonths.toFixed(1)} mo`
          }
          sub={
            summary.runwayMonths === null
              ? hasActual
                ? 'Not burning this quarter'
                : 'Needs ≥ 1 actual month'
              : 'Rolling 3-mo avg net burn'
          }
          tone={runwayTone(summary.runwayMonths)}
        />
        <HeroCard
          label="Cash-out (rolling)"
          value={summary.cashOutDate ? formatShortMonth(summary.cashOutDate) : '—'}
          sub={
            summary.rolling3MonthAvgNetBurn > 0
              ? `Burn ${formatGBP(summary.rolling3MonthAvgNetBurn)}/mo`
              : 'No burn detected'
          }
          tone={runwayTone(summary.runwayMonths)}
        />
      </div>

      {hasData && (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-900">
                Cash balance & monthly net
              </h3>
              <p className="mt-1 text-[12px] text-zinc-500">
                Last 12 months (or all months if fewer)
              </p>
            </div>
            <Link
              href="/runway/ledger"
              className="text-[12px] font-medium text-emerald-700 transition hover:text-emerald-900"
            >
              Edit ledger →
            </Link>
          </div>
          <RunwayChart months={months} />
        </div>
      )}

      {hasActual && scenarios.length > 0 && (
        <ScenarioComparison months={months} scenarios={scenarios} />
      )}

      {hasData && (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 text-base font-semibold text-zinc-900">Last six months</h3>
          <div className="overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Expenses</th>
                  <th className="text-right">Net</th>
                  <th className="text-right">Closing</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {lastSix(months).map((m) => {
                  const t = totalsForMonth(m)
                  return (
                    <tr key={m.id}>
                      <td className="font-medium text-zinc-900">{formatMonth(m.month)}</td>
                      <td className="text-right tabular-nums text-zinc-700">
                        {formatGBP(t.revenue)}
                      </td>
                      <td className="text-right tabular-nums text-zinc-700">
                        {formatGBP(t.expenses)}
                      </td>
                      <td
                        className={`text-right tabular-nums font-medium ${
                          t.netCashFlow < 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatGBP(t.netCashFlow)}
                      </td>
                      <td className="text-right tabular-nums font-semibold text-zinc-900">
                        {formatGBP(t.closingCash)}
                      </td>
                      <td>
                        <span
                          className={`badge ${m.is_actual ? 'badge-emerald' : 'badge-zinc'}`}
                        >
                          {m.is_actual ? 'Actual' : 'Forecast'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function runwayTone(months: number | null): 'neutral' | 'good' | 'warn' | 'bad' {
  if (months === null) return 'neutral'
  if (months < 6) return 'bad'
  if (months < 12) return 'warn'
  return 'good'
}

function HeroCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const valueColor =
    tone === 'bad'
      ? 'text-rose-700'
      : tone === 'warn'
      ? 'text-amber-700'
      : tone === 'good'
      ? 'text-emerald-700'
      : 'text-zinc-900'
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-5">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div
        className={`mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums ${valueColor}`}
      >
        {value}
      </div>
      <div className="mt-2 text-[12px] text-zinc-500">{sub}</div>
    </div>
  )
}

function ActiveScenarioBanner({
  scenario,
  count,
}: {
  scenario: FinanceScenario
  count: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="badge badge-emerald">Active</span>
        <span className="font-medium text-emerald-900">Scenario: {scenario.name}</span>
        {scenario.notes && (
          <span className="text-emerald-800/80">· {scenario.notes}</span>
        )}
      </div>
      <Link
        href="/runway/scenarios"
        className="text-[12px] font-medium text-emerald-800 transition hover:text-emerald-950"
      >
        {count > 1 ? 'Compare scenarios →' : 'Manage scenarios →'}
      </Link>
    </div>
  )
}

function ScenarioComparison({
  months,
  scenarios,
}: {
  months: FinanceMonth[]
  scenarios: FinanceScenario[]
}) {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Scenario comparison</h3>
          <p className="mt-1 text-[12px] text-zinc-500">
            Runway projected from the latest actual month under each scenario&apos;s assumptions.
          </p>
        </div>
        <Link
          href="/runway/scenarios"
          className="text-[12px] font-medium text-emerald-700 transition hover:text-emerald-900"
        >
          Edit scenarios →
        </Link>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-zinc-200">
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="text-right">New MRR / mo</th>
              <th className="text-right">Churn</th>
              <th className="text-right">Exp growth</th>
              <th className="text-right">Fundraise</th>
              <th className="text-right">Runway</th>
              <th className="text-right">Cash-out</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => {
              const r = runwayForScenario(months, s)
              return (
                <tr key={s.id} className={s.is_active ? 'bg-emerald-50/40' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{s.name}</span>
                      {s.is_active && (
                        <span className="badge badge-emerald">Active</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-zinc-700">
                    {formatGBP(s.new_mrr_monthly)}
                  </td>
                  <td className="text-right tabular-nums text-zinc-700">
                    {s.gross_churn_pct.toFixed(1)}%
                  </td>
                  <td className="text-right tabular-nums text-zinc-700">
                    {s.expense_growth_pct.toFixed(1)}%
                  </td>
                  <td className="text-right tabular-nums text-zinc-700">
                    {s.fundraise_amount ? formatGBP(s.fundraise_amount) : '—'}
                  </td>
                  <td
                    className={`text-right tabular-nums font-semibold ${runwayTextColor(
                      r.runwayMonths
                    )}`}
                  >
                    {r.runwayMonths === null
                      ? r.startingCash > 0
                        ? '>36 mo'
                        : '—'
                      : `${r.runwayMonths.toFixed(1)} mo`}
                  </td>
                  <td className="text-right tabular-nums text-zinc-700">
                    {r.cashOutDate ? formatShortMonth(r.cashOutDate) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function runwayTextColor(months: number | null): string {
  if (months === null) return 'text-zinc-900'
  if (months < 6) return 'text-rose-700'
  if (months < 12) return 'text-amber-700'
  return 'text-emerald-700'
}

function EmptyState() {
  return (
    <div className="rounded-[10px] border border-dashed border-zinc-300 bg-white p-6 text-center">
      <h3 className="text-base font-semibold text-zinc-900">No data yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Add your first month in the ledger to see runway, cash balance, and a chart.
      </p>
      <Link
        href="/runway/ledger"
        className="mt-4 inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
      >
        Go to ledger →
      </Link>
    </div>
  )
}

function NoActualBanner() {
  return (
    <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
      No months are marked as <strong>Actual</strong> yet. Mark at least one month as actual in the
      ledger for runway to compute.
    </div>
  )
}

function lastSix(months: FinanceMonth[]): FinanceMonth[] {
  return [...months]
    .sort((a, b) => (a.month > b.month ? -1 : 1))
    .slice(0, 6)
}

function formatShortMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
