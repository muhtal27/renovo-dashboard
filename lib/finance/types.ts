export type FinanceMonth = {
  id: string
  month: string
  is_actual: boolean
  opening_cash: number
  mrr_collected: number
  one_off_revenue: number
  rd_credit: number
  payroll: number
  contractors: number
  saas_tools: number
  rent_ops: number
  legal_accounting: number
  marketing: number
  other: number
  vat_net: number
  notes: string | null
  updated_at: string
}

export type FinanceMonthInput = Omit<
  FinanceMonth,
  'id' | 'updated_at'
>

export const FINANCE_MONTH_NUMERIC_KEYS = [
  'opening_cash',
  'mrr_collected',
  'one_off_revenue',
  'rd_credit',
  'payroll',
  'contractors',
  'saas_tools',
  'rent_ops',
  'legal_accounting',
  'marketing',
  'other',
  'vat_net',
] as const

export type FinanceMonthNumericKey = typeof FINANCE_MONTH_NUMERIC_KEYS[number]

export type FinanceHeadcount = {
  id: string
  name: string
  role: string | null
  start_date: string  // 'YYYY-MM-DD'
  end_date: string | null
  gross_monthly_gbp: number
  employer_ni_pct: number
  pension_pct: number
  notes: string | null
  updated_at: string
}

export const FINANCE_HEADCOUNT_NUMERIC_KEYS = [
  'gross_monthly_gbp',
  'employer_ni_pct',
  'pension_pct',
] as const

export type FinanceHeadcountNumericKey = typeof FINANCE_HEADCOUNT_NUMERIC_KEYS[number]

export type FinanceScenario = {
  id: string
  name: string
  is_active: boolean
  new_mrr_monthly: number
  gross_churn_pct: number
  expense_growth_pct: number
  fundraise_amount: number | null
  fundraise_close_date: string | null
  notes: string | null
  updated_at: string
}

export const FINANCE_SCENARIO_NUMERIC_KEYS = [
  'new_mrr_monthly',
  'gross_churn_pct',
  'expense_growth_pct',
] as const

export type FinanceScenarioNumericKey = typeof FINANCE_SCENARIO_NUMERIC_KEYS[number]
