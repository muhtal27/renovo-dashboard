'use client'

import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOperatorProfile,
  getSessionUser,
  type CurrentOperator,
} from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { OperatorNav } from '@/app/operator-nav'

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  is_active?: boolean | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  status: string | null
  tenancy_status: string | null
  rent_amount: number | string | null
  start_date: string | null
  end_date: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  case_type: string | null
  status: string | null
  priority: string | null
}

type MaintenanceRow = {
  id: number
  property_id: string | null
  status: string | null
}

type ComplianceRow = {
  id: string
  property_id: string | null
  status: string | null
}

type DepositRow = {
  id: string
  property_id: string | null
  claim_status: string | null
}

type RentEntryRow = {
  id: string
  property_id: string | null
  tenancy_id: string
  entry_type: 'charge' | 'payment' | 'credit' | 'adjustment'
  status: 'open' | 'cleared' | 'void'
  amount: number | string
  due_date: string | null
  posted_at: string | null
}

type LeaseEventRow = {
  id: string
  property_id: string | null
  tenancy_id: string
  event_type: string
  status: 'planned' | 'due' | 'completed' | 'cancelled'
  scheduled_for: string | null
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function formatMoney(value: number | string | null | undefined) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

function formatLabel(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

function buildAddress(property: PropertyRow | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function isActiveTenancy(tenancy: TenancyRow) {
  return tenancy.tenancy_status === 'active' || tenancy.status === 'active'
}

function isOpenCase(caseItem: CaseRow) {
  return !['resolved', 'closed', 'cancelled'].includes(caseItem.status || '')
}

export default function ReportingWorkspacePage() {
  const router = useRouter()

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRow[]>([])
  const [compliance, setCompliance] = useState<ComplianceRow[]>([])
  const [deposits, setDeposits] = useState<DepositRow[]>([])
  const [rentEntries, setRentEntries] = useState<RentEntryRow[]>([])
  const [leaseEvents, setLeaseEvents] = useState<LeaseEventRow[]>([])

  const operatorUserId = operator?.authUser?.id ?? null

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const profile = await getOperatorProfile(userId)
      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return { ...current, profile }
      })
      if (profile?.is_active === false) setError('Your operator profile is inactive. Please contact an administrator.')
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to load operator profile.')
    }
  })

  const loadWorkspace = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [propertiesResponse, tenanciesResponse, casesResponse, maintenanceResponse, complianceResponse, depositsResponse, rentResponse, leaseResponse] = await Promise.all([
      supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode, is_active').order('updated_at', { ascending: false }),
      supabase.from('tenancies').select('id, property_id, status, tenancy_status, rent_amount, start_date, end_date').order('updated_at', { ascending: false }),
      supabase.from('cases').select('id, property_id, case_type, status, priority').order('updated_at', { ascending: false }).limit(1500),
      supabase.from('maintenance_requests').select('id, property_id, status').order('updated_at', { ascending: false }).limit(1500),
      supabase.from('compliance_records').select('id, property_id, status').order('updated_at', { ascending: false }).limit(1500),
      supabase.from('deposit_claims').select('id, property_id, claim_status').order('updated_at', { ascending: false }).limit(1500),
      supabase.from('rent_ledger_entries').select('id, property_id, tenancy_id, entry_type, status, amount, due_date, posted_at').order('posted_at', { ascending: false }).limit(2000),
      supabase.from('lease_lifecycle_events').select('id, property_id, tenancy_id, event_type, status, scheduled_for').order('scheduled_for', { ascending: true }).limit(2000),
    ])

    const firstError = [
      propertiesResponse.error,
      tenanciesResponse.error,
      casesResponse.error,
      maintenanceResponse.error,
      complianceResponse.error,
      depositsResponse.error,
      rentResponse.error,
      leaseResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setMaintenance((maintenanceResponse.data || []) as MaintenanceRow[])
    setCompliance((complianceResponse.data || []) as ComplianceRow[])
    setDeposits((depositsResponse.data || []) as DepositRow[])
    setRentEntries((rentResponse.data || []) as RentEntryRow[])
    setLeaseEvents((leaseResponse.data || []) as LeaseEventRow[])
    setLoading(false)
  })

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      try {
        const user = await getSessionUser()
        if (cancelled) return
        if (!user) {
          router.replace('/login')
          setAuthLoading(false)
          return
        }
        setOperator({ authUser: user, profile: null })
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to load operator session.')
          setAuthLoading(false)
        }
      }
    }

    bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setOperator(null)
        setAuthLoading(false)
        router.replace('/login')
        return
      }

      try {
        if (!cancelled) setOperator({ authUser: session.user, profile: null })
        setAuthLoading(false)
        void hydrateOperatorProfile(session.user.id)
      } catch (authError) {
        if (!cancelled) setError(authError instanceof Error ? authError.message : 'Unable to refresh operator session.')
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!operatorUserId) return
    void loadWorkspace()
  }, [operatorUserId])

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const propertyRows = useMemo(() => {
    return properties
      .map((property) => {
        const propertyTenancies = tenancies.filter((tenancy) => tenancy.property_id === property.id)
        const activeTenancies = propertyTenancies.filter((tenancy) => isActiveTenancy(tenancy))
        const propertyCases = cases.filter((caseItem) => caseItem.property_id === property.id && isOpenCase(caseItem))
        const propertyMaintenance = maintenance.filter((item) => item.property_id === property.id && !['completed', 'cancelled'].includes(item.status || ''))
        const propertyCompliance = compliance.filter((item) => item.property_id === property.id && ['expired', 'expiring', 'missing', 'pending'].includes(item.status || ''))
        const propertyDeposits = deposits.filter((item) => item.property_id === property.id && !['resolved', 'cancelled'].includes(item.claim_status || ''))
        const propertyLeaseEvents = leaseEvents.filter((item) => item.property_id === property.id && item.status === 'due')
        const propertyRentEntries = rentEntries.filter((item) => item.property_id === property.id && item.status !== 'void')

        let ledgerBalance = 0
        let overdue = 0
        let collectedThisMonth = 0

        for (const entry of propertyRentEntries) {
          const amount = toNumber(entry.amount)
          if (entry.entry_type === 'charge' || entry.entry_type === 'adjustment') {
            ledgerBalance += amount
            if (entry.status === 'open' && entry.due_date && new Date(entry.due_date) < new Date()) {
              overdue += amount
            }
          } else {
            ledgerBalance -= amount
            if (entry.posted_at) {
              const target = new Date(entry.posted_at)
              const now = new Date()
              if (target.getUTCFullYear() === now.getUTCFullYear() && target.getUTCMonth() === now.getUTCMonth()) {
                collectedThisMonth += amount
              }
            }
          }
        }

        const monthlyRent = activeTenancies.reduce((sum, tenancy) => sum + toNumber(tenancy.rent_amount), 0)
        const riskScore = overdue + propertyMaintenance.length * 150 + propertyCompliance.length * 250 + propertyLeaseEvents.length * 100

        return {
          property,
          activeTenancies: activeTenancies.length,
          openCases: propertyCases.length,
          maintenanceLive: propertyMaintenance.length,
          complianceRisk: propertyCompliance.length,
          depositWork: propertyDeposits.length,
          dueLeaseEvents: propertyLeaseEvents.length,
          monthlyRent,
          ledgerBalance,
          overdue,
          collectedThisMonth,
          riskScore,
        }
      })
      .sort((left, right) => right.riskScore - left.riskScore || right.monthlyRent - left.monthlyRent)
  }, [cases, compliance, deposits, leaseEvents, maintenance, properties, rentEntries, tenancies])

  const portfolioKpis = useMemo(() => {
    const activeTenancies = tenancies.filter((tenancy) => isActiveTenancy(tenancy))
    const monthlyContractedRent = activeTenancies.reduce((sum, tenancy) => sum + toNumber(tenancy.rent_amount), 0)

    let outstandingBalance = 0
    let overdueBalance = 0
    let collectedThisMonth = 0

    for (const entry of rentEntries) {
      if (entry.status === 'void') continue
      const amount = toNumber(entry.amount)
      if (entry.entry_type === 'charge' || entry.entry_type === 'adjustment') {
        outstandingBalance += amount
        if (entry.status === 'open' && entry.due_date && new Date(entry.due_date) < new Date()) {
          overdueBalance += amount
        }
      } else {
        outstandingBalance -= amount
        if (entry.posted_at) {
          const target = new Date(entry.posted_at)
          const now = new Date()
          if (target.getUTCFullYear() === now.getUTCFullYear() && target.getUTCMonth() === now.getUTCMonth()) {
            collectedThisMonth += amount
          }
        }
      }
    }

    return {
      properties: properties.length,
      activeTenancies: activeTenancies.length,
      monthlyContractedRent,
      collectedThisMonth,
      outstandingBalance,
      overdueBalance,
      maintenanceLive: maintenance.filter((item) => !['completed', 'cancelled'].includes(item.status || '')).length,
      complianceRisk: compliance.filter((item) => ['expired', 'expiring', 'missing', 'pending'].includes(item.status || '')).length,
      dueLeaseEvents: leaseEvents.filter((item) => item.status === 'due').length,
      openCases: cases.filter((caseItem) => isOpenCase(caseItem)).length,
    }
  }, [cases, compliance, leaseEvents, maintenance, properties.length, rentEntries, tenancies])

  const caseMix = useMemo(() => {
    const counts = new Map<string, number>()
    for (const caseItem of cases.filter((item) => isOpenCase(item))) {
      const key = formatLabel(caseItem.case_type)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])
  }, [cases])

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">Loading operator session...</div>
        </div>
      </main>
    )
  }

  if (!operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">Redirecting to sign in...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="reporting" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div>
            <p className="app-kicker">Reporting workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Portfolio reporting in one place</h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">See rent position, lease pressure, maintenance load, compliance risk, deposits, and live case volume without jumping between screens.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Properties', portfolioKpis.properties, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Active tenancies', portfolioKpis.activeTenancies, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Contracted monthly', formatMoney(portfolioKpis.monthlyContractedRent), 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Collected this month', formatMoney(portfolioKpis.collectedThisMonth), 'border-teal-200 bg-teal-50 text-teal-900'],
                  ['Overdue rent', formatMoney(portfolioKpis.overdueBalance), 'border-rose-200 bg-rose-50 text-rose-900'],
                ].map(([label, value, tone]) => (
                  <article key={String(label)} className={`rounded-[1.6rem] border p-4 shadow-sm ${tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</div>
                    <div className="mt-3 text-3xl font-semibold">{value}</div>
                  </article>
                ))}
              </div>

            <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 text-sm leading-6 text-stone-600">
              Use this view to spot pressure quickly: what is overdue, what is collecting, what is expiring, and what needs action next.
            </div>
          </div>
        </section>

        {loading && <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading reporting workspace...</div>}
        {error && <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">Error: {error}</div>}

        {!loading && !error && (
          <div className="mt-6 space-y-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
              <div className="app-surface rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="app-kicker">Portfolio pressure</p>
                    <h2 className="mt-2 text-2xl font-semibold">Operational risk and money posture</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Open cases', portfolioKpis.openCases, 'border-stone-200 bg-stone-50 text-stone-900'],
                    ['Maintenance live', portfolioKpis.maintenanceLive, 'border-amber-200 bg-amber-50 text-amber-900'],
                    ['Compliance risk', portfolioKpis.complianceRisk, 'border-rose-200 bg-rose-50 text-rose-900'],
                    ['Lease events due', portfolioKpis.dueLeaseEvents, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ].map(([label, value, tone]) => (
                    <article key={String(label)} className={`rounded-[1.4rem] border p-4 ${tone}`}>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{label}</div>
                      <div className="mt-3 text-2xl font-semibold">{value}</div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="app-surface rounded-[2rem] p-5 md:p-6">
                <p className="app-kicker">Case mix</p>
                <h2 className="mt-2 text-2xl font-semibold">What is driving live workload</h2>
                <div className="mt-5 space-y-3">
                  {caseMix.length === 0 && <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No open cases are visible right now.</div>}
                  {caseMix.slice(0, 8).map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between rounded-[1.4rem] border border-stone-200 bg-white/90 px-4 py-3 text-sm">
                      <span className="font-medium text-stone-800">{label}</span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">{count}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="app-kicker">Portfolio rows</p>
                  <h2 className="mt-2 text-2xl font-semibold">Property by property operating view</h2>
                </div>
                <div className="text-sm text-stone-500">{propertyRows.length} properties</div>
              </div>

              <div className="mt-5 space-y-4">
                {propertyRows.map((row) => (
                  <article key={row.property.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-stone-900">{buildAddress(propertyById.get(row.property.id) ?? row.property)}</h3>
                        <p className="mt-2 text-sm text-stone-600">
                          {row.activeTenancies} active tenancies • {row.openCases} open cases • {row.maintenanceLive} maintenance live • {row.complianceRisk} compliance at risk
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {row.overdue > 0 && <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Overdue {formatMoney(row.overdue)}</span>}
                        {row.dueLeaseEvents > 0 && <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{row.dueLeaseEvents} lease items due</span>}
                        {row.depositWork > 0 && <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">{row.depositWork} deposit items</span>}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="app-card-muted rounded-[1.2rem] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Monthly rent</p>
                        <p className="mt-2 text-sm font-medium text-stone-900">{formatMoney(row.monthlyRent)}</p>
                      </div>
                      <div className="app-card-muted rounded-[1.2rem] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Collected this month</p>
                        <p className="mt-2 text-sm font-medium text-stone-900">{formatMoney(row.collectedThisMonth)}</p>
                      </div>
                      <div className="app-card-muted rounded-[1.2rem] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Ledger balance</p>
                        <p className="mt-2 text-sm font-medium text-stone-900">{formatMoney(row.ledgerBalance)}</p>
                      </div>
                      <div className="app-card-muted rounded-[1.2rem] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Overdue</p>
                        <p className="mt-2 text-sm font-medium text-stone-900">{formatMoney(row.overdue)}</p>
                      </div>
                    </div>
                  </article>
                ))}

                {propertyRows.length === 0 && <div className="app-empty-state rounded-[1.4rem] p-6 text-sm">No property reporting rows are visible yet.</div>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
