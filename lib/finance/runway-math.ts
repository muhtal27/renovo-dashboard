import type { FinanceHeadcount, FinanceMonth, FinanceScenario } from './types'

export type MonthTotals = {
  revenue: number
  expenses: number
  vatNet: number
  netCashFlow: number
  closingCash: number
  burn: number
}

export function totalsForMonth(m: FinanceMonth): MonthTotals {
  const revenue = m.mrr_collected + m.one_off_revenue + m.rd_credit
  const expenses =
    m.payroll +
    m.contractors +
    m.saas_tools +
    m.rent_ops +
    m.legal_accounting +
    m.marketing +
    m.other
  const netCashFlow = revenue - expenses + m.vat_net
  const closingCash = m.opening_cash + netCashFlow
  const burn = netCashFlow < 0 ? -netCashFlow : 0

  return { revenue, expenses, vatNet: m.vat_net, netCashFlow, closingCash, burn }
}

export type RunwaySummary = {
  latestActual: FinanceMonth | null
  currentCash: number
  rolling3MonthAvgNetBurn: number
  runwayMonths: number | null
  cashOutDate: Date | null
}

// Takes all months sorted ASC by month. Returns the runway view based on
// the most recent actual month's closing cash and the rolling 3-month
// average net burn (excluding months with zero or positive net).
export function computeRunwaySummary(monthsAsc: FinanceMonth[]): RunwaySummary {
  const actuals = monthsAsc.filter((m) => m.is_actual)
  const latestActual = actuals.length > 0 ? actuals[actuals.length - 1] : null

  if (!latestActual) {
    return {
      latestActual: null,
      currentCash: 0,
      rolling3MonthAvgNetBurn: 0,
      runwayMonths: null,
      cashOutDate: null,
    }
  }

  const currentCash = totalsForMonth(latestActual).closingCash

  const last3Actuals = actuals.slice(-3)
  const burns = last3Actuals.map((m) => totalsForMonth(m).burn)
  const avgBurn = burns.length > 0 ? burns.reduce((a, b) => a + b, 0) / burns.length : 0

  let runwayMonths: number | null = null
  let cashOutDate: Date | null = null

  if (avgBurn > 0 && currentCash > 0) {
    runwayMonths = currentCash / avgBurn
    const days = Math.round(runwayMonths * 30)
    cashOutDate = new Date()
    cashOutDate.setDate(cashOutDate.getDate() + days)
  } else if (avgBurn === 0) {
    // Not burning — runway effectively infinite
    runwayMonths = null
    cashOutDate = null
  }

  return {
    latestActual,
    currentCash,
    rolling3MonthAvgNetBurn: avgBurn,
    runwayMonths,
    cashOutDate,
  }
}

export function formatGBP(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `£${(amount / 1_000_000).toFixed(2)}M`
    }
    if (Math.abs(amount) >= 1_000) {
      return `£${(amount / 1_000).toFixed(1)}k`
    }
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonth(monthIso: string): string {
  // monthIso is 'YYYY-MM-DD'
  const [y, m] = monthIso.split('-').map((s) => parseInt(s, 10))
  const d = new Date(Date.UTC(y, m - 1, 1))
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function monthToIsoDate(year: number, month1to12: number): string {
  const mm = month1to12.toString().padStart(2, '0')
  return `${year}-${mm}-01`
}

// ─── Headcount ──────────────────────────────────────────────────────────────

export function loadedMonthlyCost(h: FinanceHeadcount): number {
  const multiplier = 1 + h.employer_ni_pct / 100 + h.pension_pct / 100
  return h.gross_monthly_gbp * multiplier
}

// A person is active in a month if:
//   start_date <= last day of month AND (end_date IS NULL OR end_date >= first day of month)
// monthIso must be 'YYYY-MM-01' (first day of month).
export function isActiveInMonth(h: FinanceHeadcount, monthIso: string): boolean {
  const firstDay = monthIso
  const [y, m] = monthIso.split('-').map((s) => parseInt(s, 10))
  // Last day of month — avoid DST / timezone weirdness by using UTC.
  const lastDate = new Date(Date.UTC(y, m, 0))
  const lastDay = lastDate.toISOString().slice(0, 10)

  if (h.start_date > lastDay) return false
  if (h.end_date !== null && h.end_date < firstDay) return false
  return true
}

export function projectedPayrollForMonth(
  monthIso: string,
  headcount: FinanceHeadcount[]
): number {
  return headcount
    .filter((h) => isActiveInMonth(h, monthIso))
    .reduce((sum, h) => sum + loadedMonthlyCost(h), 0)
}

export type HeadcountStatus = 'upcoming' | 'active' | 'ended'

export function statusForHeadcount(
  h: FinanceHeadcount,
  today: Date = new Date()
): HeadcountStatus {
  const todayIso = today.toISOString().slice(0, 10)
  if (h.start_date > todayIso) return 'upcoming'
  if (h.end_date !== null && h.end_date < todayIso) return 'ended'
  return 'active'
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Scenarios ──────────────────────────────────────────────────────────────

function addMonthIso(iso: string, n: number): string {
  const [y, m] = iso.split('-').map((s) => parseInt(s, 10))
  const totalMonths = (y * 12 + (m - 1)) + n
  const ny = Math.floor(totalMonths / 12)
  const nm = (totalMonths % 12) + 1
  return monthToIsoDate(ny, nm)
}

export type ProjectedMonth = {
  month: string
  revenue: number
  expenses: number
  fundraise: number
  netCashFlow: number
  closingCash: number
}

// Project forward from the latest actual month using the scenario's
// assumptions. Returns one projected month per step up to `horizon`.
// Stops projecting once cash crosses zero so the caller can pick runway
// months without overshoot.
export function projectScenario(
  monthsAsc: FinanceMonth[],
  scenario: FinanceScenario,
  horizon: number = 18
): ProjectedMonth[] {
  const actuals = monthsAsc.filter((m) => m.is_actual)
  if (actuals.length === 0) return []

  const latest = actuals[actuals.length - 1]
  const latestTotals = totalsForMonth(latest)

  // Start point carried forward
  let priorMrr = latest.mrr_collected
  const baseFlatInflows = latest.one_off_revenue + latest.rd_credit
  const baseVatNet = latest.vat_net
  let priorExpenses =
    latest.payroll +
    latest.contractors +
    latest.saas_tools +
    latest.rent_ops +
    latest.legal_accounting +
    latest.marketing +
    latest.other
  let priorClosing = latestTotals.closingCash

  const churnFactor = 1 - scenario.gross_churn_pct / 100
  const expenseFactor = 1 + scenario.expense_growth_pct / 100
  const fundraise = scenario.fundraise_amount ?? 0
  const fundraiseMonth = scenario.fundraise_close_date
    ? `${scenario.fundraise_close_date.slice(0, 7)}-01`
    : null

  const out: ProjectedMonth[] = []
  for (let i = 1; i <= horizon; i++) {
    const monthIso = addMonthIso(latest.month, i)
    const mrr = priorMrr * churnFactor + scenario.new_mrr_monthly
    const revenue = mrr + baseFlatInflows
    const expenses = priorExpenses * expenseFactor
    const fundraiseThisMonth = fundraiseMonth === monthIso ? fundraise : 0
    const netCashFlow = revenue - expenses + baseVatNet + fundraiseThisMonth
    const closingCash = priorClosing + netCashFlow

    out.push({
      month: monthIso,
      revenue,
      expenses,
      fundraise: fundraiseThisMonth,
      netCashFlow,
      closingCash,
    })

    priorMrr = mrr
    priorExpenses = expenses
    priorClosing = closingCash

    if (closingCash < 0 && i >= 1) break
  }

  return out
}

export type ScenarioRunway = {
  scenario: FinanceScenario
  startingCash: number
  projection: ProjectedMonth[]
  runwayMonths: number | null
  cashOutDate: Date | null
}

export function runwayForScenario(
  monthsAsc: FinanceMonth[],
  scenario: FinanceScenario
): ScenarioRunway {
  const actuals = monthsAsc.filter((m) => m.is_actual)
  const latest = actuals[actuals.length - 1]
  const startingCash = latest ? totalsForMonth(latest).closingCash : 0

  const projection = projectScenario(monthsAsc, scenario, 36)

  // Runway = months until closing cash goes negative (linearly
  // interpolated across the breakpoint month).
  let runwayMonths: number | null = null
  if (startingCash <= 0) {
    runwayMonths = 0
  } else {
    let priorClosing = startingCash
    for (let i = 0; i < projection.length; i++) {
      const pm = projection[i]
      if (pm.closingCash < 0) {
        // Linear interpolation within this month
        const fraction = priorClosing / (priorClosing - pm.closingCash)
        runwayMonths = i + fraction
        break
      }
      priorClosing = pm.closingCash
    }
    // If projection never goes negative within horizon, runwayMonths stays null = "beyond horizon"
  }

  let cashOutDate: Date | null = null
  if (runwayMonths !== null) {
    const days = Math.round(runwayMonths * 30)
    cashOutDate = new Date()
    cashOutDate.setDate(cashOutDate.getDate() + days)
  }

  return { scenario, startingCash, projection, runwayMonths, cashOutDate }
}
