'use client'

import Link from 'next/link'
import { useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type DepositTab =
  | 'all'
  | 'awaiting_evidence'
  | 'awaiting_response'
  | 'submitted'
  | 'disputed'
  | 'resolved'

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
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  company_name: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  summary: string | null
  status: string | null
  priority: string | null
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

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ')
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

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

export default function DepositRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [claims, setClaims] = useState<DepositClaimRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])

  const [tab, setTab] = useState<DepositTab>('all')
  const [search, setSearch] = useState('')
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [claimsResponse, tenanciesResponse, propertiesResponse, contactsResponse, casesResponse] =
      await Promise.all([
        supabase
          .from('deposit_claims')
          .select(
            'id, case_id, tenancy_id, property_id, claim_status, total_claim_amount, tenant_agreed_amount, disputed_amount, scheme_reference, evidence_notes, submitted_at, resolved_at, updated_at'
          )
          .order('updated_at', { ascending: false })
          .limit(800),
        supabase
          .from('tenancies')
          .select(
            'id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, deposit_scheme_name, deposit_reference'
          )
          .order('updated_at', { ascending: false })
          .limit(800),
        supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode').order('updated_at', { ascending: false }),
        supabase.from('contacts').select('id, full_name, phone, email, company_name').order('updated_at', { ascending: false }),
        supabase.from('cases').select('id, case_number, summary, status, priority').order('updated_at', { ascending: false }).limit(800),
      ])

    const firstError = [
      claimsResponse.error,
      tenanciesResponse.error,
      propertiesResponse.error,
      contactsResponse.error,
      casesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setClaims((claimsResponse.data || []) as DepositClaimRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setContacts((contactsResponse.data || []) as ContactRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const tenancyById = useMemo(() => new Map(tenancies.map((tenancy) => [tenancy.id, tenancy])), [tenancies])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const caseById = useMemo(() => new Map(cases.map((caseItem) => [caseItem.id, caseItem])), [cases])

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()
    return claims.filter((claim) => {
      const tenancy = tenancyById.get(claim.tenancy_id) ?? null
      const property = propertyById.get(claim.property_id) ?? null
      const tenant = tenancy?.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
      const landlord = tenancy?.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null

      const matchesTab =
        tab === 'all' ||
        (tab === 'awaiting_evidence' && claim.claim_status === 'awaiting_evidence') ||
        (tab === 'awaiting_response' &&
          ['awaiting_tenant_response', 'awaiting_landlord_response', 'part_agreed'].includes(claim.claim_status)) ||
        (tab === 'submitted' && claim.claim_status === 'submitted') ||
        (tab === 'disputed' && claim.claim_status === 'disputed') ||
        (tab === 'resolved' && claim.claim_status === 'resolved')

      const matchesSearch =
        query === '' ||
        buildAddress(property).toLowerCase().includes(query) ||
        getContactName(tenant).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        claim.scheme_reference?.toLowerCase().includes(query) ||
        claim.evidence_notes?.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  }, [claims, contactById, propertyById, search, tab, tenancyById])

  const selectedClaim = useMemo(
    () => {
      if (!filteredClaims.length) return null

      const effectiveSelectedClaimId =
        selectedClaimId && filteredClaims.some((claim) => claim.id === selectedClaimId)
          ? selectedClaimId
          : filteredClaims[0].id

      return claims.find((claim) => claim.id === effectiveSelectedClaimId) || null
    },
    [claims, filteredClaims, selectedClaimId]
  )

  const selectedTenancy = useMemo(
    () => (selectedClaim ? tenancyById.get(selectedClaim.tenancy_id) ?? null : null),
    [selectedClaim, tenancyById]
  )

  const selectedProperty = useMemo(
    () => (selectedClaim ? propertyById.get(selectedClaim.property_id) ?? null : null),
    [propertyById, selectedClaim]
  )

  const selectedTenant = useMemo(
    () => (selectedTenancy?.tenant_contact_id ? contactById.get(selectedTenancy.tenant_contact_id) ?? null : null),
    [contactById, selectedTenancy]
  )

  const selectedLandlord = useMemo(
    () => (selectedTenancy?.landlord_contact_id ? contactById.get(selectedTenancy.landlord_contact_id) ?? null : null),
    [contactById, selectedTenancy]
  )

  const selectedCase = useMemo(
    () => (selectedClaim?.case_id ? caseById.get(selectedClaim.case_id) ?? null : null),
    [caseById, selectedClaim]
  )

  const kpis = useMemo(
    () => ({
      total: claims.length,
      evidence: claims.filter((claim) => claim.claim_status === 'awaiting_evidence').length,
      response: claims.filter((claim) =>
        ['awaiting_tenant_response', 'awaiting_landlord_response', 'part_agreed'].includes(claim.claim_status)
      ).length,
      submitted: claims.filter((claim) => claim.claim_status === 'submitted').length,
      disputed: claims.filter((claim) => claim.claim_status === 'disputed').length,
      resolved: claims.filter((claim) => claim.claim_status === 'resolved').length,
    }),
    [claims]
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
                <Link href="/" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Back to queue</Link>
                <Link href="/records/tenancies" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Tenancy workspace</Link>
                <Link href="/records/properties" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Property workspace</Link>
              </div>

              <p className="app-kicker mt-6">Deposit Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Run deposit claims as their own workflow</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This keeps disputed, submitted, and awaiting-response deposit work attached to the right tenancy, property, and case.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  ['All claims', kpis.total, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Awaiting evidence', kpis.evidence, 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['Awaiting response', kpis.response, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Submitted', kpis.submitted, 'border-violet-200 bg-violet-50 text-violet-900'],
                  ['Disputed', kpis.disputed, 'border-red-200 bg-red-50 text-red-900'],
                  ['Resolved', kpis.resolved, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
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
                Use this when the tenancy is moving toward deposit recovery, dispute, or agreement rather than standard messaging.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Prioritise disputed and awaiting-response claims first.</li>
                  <li>Keep scheme references and evidence notes visible.</li>
                  <li>Open the linked case when the claim is part of a broader end-of-tenancy issue.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Deposit tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the claims that need action</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">{filteredClaims.length} shown of {claims.length} claims</div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Deposit workspace tabs">
              {[
                ['all', 'All claims'],
                ['awaiting_evidence', 'Awaiting evidence'],
                ['awaiting_response', 'Awaiting response'],
                ['submitted', 'Submitted'],
                ['disputed', 'Disputed'],
                ['resolved', 'Resolved'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as DepositTab)}
                  aria-pressed={tab === value}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${tab === value ? 'app-pill-active' : 'app-pill'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search deposit claims</span>
              <input
                type="text"
                placeholder="Search by tenant, landlord, property, scheme reference, or evidence notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading deposit workspace...</div>
        )}

        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">Error: {pageError}</div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Deposit claims</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a claim</h2>
                <p className="mt-1 text-sm text-stone-600">See the tenancy, property, money breakdown, and linked case in one place.</p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredClaims.map((claim) => {
                  const selected = claim.id === selectedClaimId
                  const tenancy = tenancyById.get(claim.tenancy_id) ?? null
                  const property = propertyById.get(claim.property_id) ?? null
                  const tenant = tenancy?.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null

                  return (
                    <button
                      key={claim.id}
                      onClick={() => setSelectedClaimId(claim.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${
                        selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{getContactName(tenant)}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getClaimTone(claim.claim_status)}`}>
                              {formatLabel(claim.claim_status)}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {buildAddress(property)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">{formatRelativeTime(claim.updated_at)}</div>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        Claim {formatMoney(claim.total_claim_amount)} • Disputed {formatMoney(claim.disputed_amount)}
                      </div>
                    </button>
                  )
                })}

                {filteredClaims.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">No deposit claims match the current filters.</div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedClaim ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a deposit claim from the left to inspect the tenancy, amounts, and case context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected claim</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedTenant)}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getClaimTone(selectedClaim.claim_status)}`}>
                          {formatLabel(selectedClaim.claim_status)}
                        </span>
                        {selectedCase?.priority && (
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(selectedCase.priority)}`}>
                            {selectedCase.priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {buildAddress(selectedProperty)}. Landlord: {getContactName(selectedLandlord)}.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Total claim</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedClaim.total_claim_amount)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Agreed</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedClaim.tenant_agreed_amount)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Disputed</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedClaim.disputed_amount)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Scheme</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {selectedTenancy?.deposit_scheme_name || 'No scheme recorded'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          Reference {selectedClaim.scheme_reference || selectedTenancy?.deposit_reference || 'not set'}
                        </p>
                      </div>

                      {selectedCase && (
                        <Link href={`/cases/${selectedCase.id}`} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium">
                          Open linked case
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Claim dates</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Submitted</dt>
                            <dd className="text-right font-medium text-stone-900">{formatDate(selectedClaim.submitted_at)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Resolved</dt>
                            <dd className="text-right font-medium text-stone-900">{formatDate(selectedClaim.resolved_at)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Tenancy end</dt>
                            <dd className="text-right font-medium text-stone-900">{formatDate(selectedTenancy?.end_date || null)}</dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    <section className="app-card-muted rounded-[1.6rem] p-5">
                      <div className="flex flex-col gap-2 border-b app-divider pb-4">
                        <div>
                          <p className="app-kicker">Evidence notes</p>
                          <h3 className="mt-2 text-xl font-semibold">What supports the claim</h3>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                        {selectedClaim.evidence_notes || 'No evidence notes are stored yet for this claim.'}
                      </div>
                    </section>
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
