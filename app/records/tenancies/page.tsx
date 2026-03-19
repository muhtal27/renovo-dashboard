'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type TenancyTab = 'all' | 'active' | 'ending_soon' | 'ended' | 'with_claims'

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  company_name: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  status: string | null
  tenancy_status: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | null
  deposit_amount: number | null
  deposit_scheme_name: string | null
  deposit_reference: string | null
  updated_at: string | null
}

type DepositClaimRow = {
  id: string
  case_id: string | null
  tenancy_id: string
  property_id: string
  claim_status: string
  total_claim_amount: number | null
  tenant_agreed_amount: number | null
  disputed_amount: number | null
  scheme_reference: string | null
  evidence_notes: string | null
  submitted_at: string | null
  resolved_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  tenancy_id: string | null
  property_id: string | null
  summary: string | null
  status: string | null
  priority: string | null
  updated_at: string | null
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'No recent activity'
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLabel(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

function buildAddress(property: Pick<PropertyRow, 'address_line_1' | 'address_line_2' | 'city' | 'postcode'> | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.phone || contact.email || 'Unknown'
}

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getClaimTone(value: string) {
  if (value === 'disputed') return 'border-red-200 bg-red-50 text-red-700'
  if (
    value === 'awaiting_evidence' ||
    value === 'awaiting_tenant_response' ||
    value === 'awaiting_landlord_response' ||
    value === 'part_agreed'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  if (value === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function isActiveTenancy(tenancy: TenancyRow) {
  return tenancy.tenancy_status === 'active' || tenancy.status === 'active'
}

function isEndingSoon(endDate: string | null) {
  if (!endDate) return false
  const now = new Date()
  const end = new Date(endDate)
  const inThirtyDays = new Date()
  inThirtyDays.setDate(now.getDate() + 30)
  return end >= now && end <= inThirtyDays
}

export default function TenancyRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [claims, setClaims] = useState<DepositClaimRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])

  const [tab, setTab] = useState<TenancyTab>('all')
  const [search, setSearch] = useState('')
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [contactsResponse, propertiesResponse, tenanciesResponse, claimsResponse, casesResponse] =
      await Promise.all([
        supabase
          .from('contacts')
          .select('id, full_name, phone, email, company_name')
          .order('updated_at', { ascending: false }),
        supabase
          .from('properties')
          .select('id, address_line_1, address_line_2, city, postcode')
          .order('updated_at', { ascending: false }),
        supabase
          .from('tenancies')
          .select(
            'id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, deposit_scheme_name, deposit_reference, updated_at'
          )
          .order('updated_at', { ascending: false })
          .limit(800),
        supabase
          .from('deposit_claims')
          .select(
            'id, case_id, tenancy_id, property_id, claim_status, total_claim_amount, tenant_agreed_amount, disputed_amount, scheme_reference, evidence_notes, submitted_at, resolved_at, updated_at'
          )
          .order('updated_at', { ascending: false })
          .limit(800),
        supabase
          .from('cases')
          .select('id, case_number, tenancy_id, property_id, summary, status, priority, updated_at')
          .order('updated_at', { ascending: false })
          .limit(800),
      ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      claimsResponse.error,
      casesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setClaims((claimsResponse.data || []) as DepositClaimRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const claimsByTenancyId = useMemo(() => {
    const map = new Map<string, DepositClaimRow[]>()
    for (const claim of claims) {
      const existing = map.get(claim.tenancy_id) ?? []
      existing.push(claim)
      map.set(claim.tenancy_id, existing)
    }
    return map
  }, [claims])

  const casesByTenancyId = useMemo(() => {
    const map = new Map<string, CaseRow[]>()
    for (const caseItem of cases) {
      if (!caseItem.tenancy_id) continue
      const existing = map.get(caseItem.tenancy_id) ?? []
      existing.push(caseItem)
      map.set(caseItem.tenancy_id, existing)
    }
    return map
  }, [cases])

  const filteredTenancies = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tenancies.filter((tenancy) => {
      const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
      const landlord = tenancy.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null
      const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
      const tenancyClaims = claimsByTenancyId.get(tenancy.id) ?? []

      const matchesTab =
        tab === 'all' ||
        (tab === 'active' && isActiveTenancy(tenancy)) ||
        (tab === 'ending_soon' && isEndingSoon(tenancy.end_date)) ||
        (tab === 'ended' && !isActiveTenancy(tenancy) && !!tenancy.end_date) ||
        (tab === 'with_claims' && tenancyClaims.length > 0)

      const matchesSearch =
        query === '' ||
        getContactName(tenant).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        buildAddress(property).toLowerCase().includes(query) ||
        property?.postcode?.toLowerCase().includes(query) ||
        tenancy.deposit_scheme_name?.toLowerCase().includes(query) ||
        tenancy.deposit_reference?.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  }, [claimsByTenancyId, contactById, propertyById, search, tab, tenancies])

  useEffect(() => {
    if (!filteredTenancies.length) {
      setSelectedTenancyId(null)
      return
    }

    if (!selectedTenancyId || !filteredTenancies.some((tenancy) => tenancy.id === selectedTenancyId)) {
      setSelectedTenancyId(filteredTenancies[0].id)
    }
  }, [filteredTenancies, selectedTenancyId])

  const selectedTenancy = useMemo(
    () => tenancies.find((tenancy) => tenancy.id === selectedTenancyId) || null,
    [tenancies, selectedTenancyId]
  )

  const selectedProperty = useMemo(
    () => (selectedTenancy?.property_id ? propertyById.get(selectedTenancy.property_id) ?? null : null),
    [propertyById, selectedTenancy?.property_id]
  )

  const selectedTenant = useMemo(
    () => (selectedTenancy?.tenant_contact_id ? contactById.get(selectedTenancy.tenant_contact_id) ?? null : null),
    [contactById, selectedTenancy?.tenant_contact_id]
  )

  const selectedLandlord = useMemo(
    () =>
      selectedTenancy?.landlord_contact_id
        ? contactById.get(selectedTenancy.landlord_contact_id) ?? null
        : null,
    [contactById, selectedTenancy?.landlord_contact_id]
  )

  const selectedClaims = useMemo(
    () => (selectedTenancy ? claimsByTenancyId.get(selectedTenancy.id) ?? [] : []),
    [claimsByTenancyId, selectedTenancy]
  )

  const selectedCases = useMemo(
    () => (selectedTenancy ? casesByTenancyId.get(selectedTenancy.id) ?? [] : []),
    [casesByTenancyId, selectedTenancy]
  )

  const kpis = useMemo(
    () => ({
      total: tenancies.length,
      active: tenancies.filter((tenancy) => isActiveTenancy(tenancy)).length,
      endingSoon: tenancies.filter((tenancy) => isEndingSoon(tenancy.end_date)).length,
      ended: tenancies.filter((tenancy) => !isActiveTenancy(tenancy) && !!tenancy.end_date).length,
      claims: tenancies.filter((tenancy) => (claimsByTenancyId.get(tenancy.id) ?? []).length > 0).length,
    }),
    [claimsByTenancyId, tenancies]
  )

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px]">
        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Back to queue
                </Link>
                <Link href="/records" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Contact records
                </Link>
                <Link href="/records/properties" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Property workspace
                </Link>
                <Link href="/records/deposits" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Deposit workspace
                </Link>
                <Link href="/records/rent" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Rent workspace
                </Link>
                <Link href="/records/lease-lifecycle" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Lease lifecycle
                </Link>
                <Link href="/records/reporting" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Reporting workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Tenancy Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Work the tenancy record, not just the case around it
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This ties tenant, landlord, property, rent, deposit, and end-of-tenancy claims into one operator view.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['All tenancies', kpis.total, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Active', kpis.active, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Ending soon', kpis.endingSoon, 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['Ended', kpis.ended, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['With claims', kpis.claims, 'border-violet-200 bg-violet-50 text-violet-900'],
                ].map(([label, value, tone]) => (
                  <article key={String(label)} className={`rounded-[1.6rem] border p-4 shadow-sm ${tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</div>
                    <div className="mt-3 text-3xl font-semibold">{value}</div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">Operator</p>
              <h2 className="mt-2 text-xl font-semibold">{getOperatorLabel(operator)}</h2>
              <p className="mt-1 text-sm text-stone-600">
                Use this when the question is really about the tenancy itself: rent, deposit, occupancy, or who holds responsibility.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Check active and ending-soon tenancies before changing occupancy assumptions.</li>
                  <li>Use deposit claims to keep end-of-tenancy issues attached to the right record.</li>
                  <li>Open linked cases when the tenancy question is already generating live work.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Tenancy tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the tenancy records that matter</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredTenancies.length} shown of {tenancies.length} tenancies
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Tenancy workspace tabs">
              {[
                ['all', 'All tenancies'],
                ['active', 'Active'],
                ['ending_soon', 'Ending soon'],
                ['ended', 'Ended'],
                ['with_claims', 'With claims'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as TenancyTab)}
                  aria-pressed={tab === value}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                    tab === value ? 'app-pill-active' : 'app-pill'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search tenancies</span>
              <input
                type="text"
                placeholder="Search by tenant, landlord, property, postcode, or deposit references"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading tenancy workspace...
          </div>
        )}

        {pageError && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {pageError}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Tenancy records</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a tenancy</h2>
                <p className="mt-1 text-sm text-stone-600">
                  See the tenant, landlord, property, deposit, and claim context in one place.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredTenancies.map((tenancy) => {
                  const selected = tenancy.id === selectedTenancyId
                  const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
                  const landlord = tenancy.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null
                  const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
                  const tenancyClaims = claimsByTenancyId.get(tenancy.id) ?? []

                  return (
                    <button
                      key={tenancy.id}
                      onClick={() => setSelectedTenancyId(tenancy.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${
                        selected
                          ? 'app-selected-card'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{getContactName(tenant)}</span>
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                              {tenancy.tenancy_status || tenancy.status || 'tenancy'}
                            </span>
                            {tenancyClaims.length > 0 && (
                              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                                {tenancyClaims.length} claim{tenancyClaims.length === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {buildAddress(property)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(tenancy.updated_at ?? tenancy.start_date)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          Landlord {getContactName(landlord)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          Rent {formatMoney(tenancy.rent_amount)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          Deposit {formatMoney(tenancy.deposit_amount)}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {filteredTenancies.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No tenancy records match the current filters yet.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedTenancy ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a tenancy from the left to inspect occupancy, deposit, and case context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected tenancy</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedTenant)}</h2>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                          {selectedTenancy.tenancy_status || selectedTenancy.status || 'tenancy'}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {buildAddress(selectedProperty)}. Landlord: {getContactName(selectedLandlord)}.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Rent</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedTenancy.rent_amount)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Deposit</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedTenancy.deposit_amount)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Dates</p>
                          <p className="mt-2 text-sm text-stone-800">
                            {formatDate(selectedTenancy.start_date)} to {formatDate(selectedTenancy.end_date)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Deposit scheme</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {selectedTenancy.deposit_scheme_name || 'No scheme recorded'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          Reference {selectedTenancy.deposit_reference || selectedClaims[0]?.scheme_reference || 'not set'}
                        </p>
                      </div>

                      <Link
                        href="/records/deposits"
                        className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open deposit workspace
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Tenancy snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Tenant</dt>
                            <dd className="text-right font-medium text-stone-900">{getContactName(selectedTenant)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Landlord</dt>
                            <dd className="text-right font-medium text-stone-900">{getContactName(selectedLandlord)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Property</dt>
                            <dd className="text-right font-medium text-stone-900">{selectedProperty?.postcode || '-'}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">{formatRelativeTime(selectedTenancy.updated_at)}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Claim posture</p>
                        <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                          {selectedClaims.length === 0
                            ? 'No deposit claim is linked to this tenancy.'
                            : `${selectedClaims.length} deposit claim${selectedClaims.length === 1 ? '' : 's'} exist on this tenancy.`}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Related cases</p>
                            <h3 className="mt-2 text-xl font-semibold">Case work on this tenancy</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCases.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No cases are linked to this tenancy yet.
                            </div>
                          )}

                          {selectedCases.slice(0, 6).map((caseItem) => (
                            <article key={caseItem.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/cases/${caseItem.id}`}
                                    className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
                                  >
                                    {caseItem.case_number || caseItem.id}
                                  </Link>
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(caseItem.priority)}`}>
                                    {caseItem.priority || 'unknown'}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">{formatRelativeTime(caseItem.updated_at)}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                {caseItem.summary || 'No case summary yet.'}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Deposit claims</p>
                            <h3 className="mt-2 text-xl font-semibold">End-of-tenancy money work</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedClaims.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No deposit claims are linked to this tenancy.
                            </div>
                          )}

                          {selectedClaims.map((claim) => (
                            <article key={claim.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getClaimTone(claim.claim_status)}`}>
                                    {formatLabel(claim.claim_status)}
                                  </span>
                                  <span className="text-sm font-medium text-stone-900">
                                    Claim {formatMoney(claim.total_claim_amount)}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">
                                  {claim.submitted_at ? `Submitted ${formatDate(claim.submitted_at)}` : 'Not submitted'}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                Agreed {formatMoney(claim.tenant_agreed_amount)} • Disputed {formatMoney(claim.disputed_amount)}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
