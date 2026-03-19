'use client'

import Link from 'next/link'
import { useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type ViewingTab = 'all' | 'requested' | 'booked' | 'recent' | 'closed'

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

type ViewingRequestRow = {
  id: number
  created_at: string | null
  case_id: string | null
  property_id: string | null
  applicant_contact_id: string | null
  requested_date: string | null
  status: string
  notes: string | null
  booked_slot: string | null
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

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatLabel(value: string | null) {
  if (!value) return '-'
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

function getStatusTone(value: string) {
  if (value === 'requested') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'booked' || value === 'confirmed') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'cancelled') return 'border-stone-200 bg-stone-50 text-stone-700'
  return 'border-violet-200 bg-violet-50 text-violet-700'
}

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function isRecent(value: string | null) {
  if (!value) return false
  const createdAt = new Date(value)
  const recentBoundary = new Date()
  recentBoundary.setDate(recentBoundary.getDate() - 7)
  return createdAt >= recentBoundary
}

export default function ViewingRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [requests, setRequests] = useState<ViewingRequestRow[]>([])

  const [tab, setTab] = useState<ViewingTab>('all')
  const [search, setSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [propertiesResponse, contactsResponse, casesResponse, requestsResponse] = await Promise.all([
      supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode').order('updated_at', { ascending: false }),
      supabase.from('contacts').select('id, full_name, phone, email, company_name').order('updated_at', { ascending: false }),
      supabase.from('cases').select('id, case_number, summary, status, priority').order('updated_at', { ascending: false }).limit(800),
      supabase
        .from('viewing_requests')
        .select('id, created_at, case_id, property_id, applicant_contact_id, requested_date, status, notes, booked_slot, updated_at')
        .order('updated_at', { ascending: false })
        .limit(800),
    ])

    const firstError = [propertiesResponse.error, contactsResponse.error, casesResponse.error, requestsResponse.error].find(Boolean)
    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setContacts((contactsResponse.data || []) as ContactRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setRequests((requestsResponse.data || []) as ViewingRequestRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const caseById = useMemo(() => new Map(cases.map((caseItem) => [caseItem.id, caseItem])), [cases])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((request) => {
      const property = request.property_id ? propertyById.get(request.property_id) ?? null : null
      const applicant = request.applicant_contact_id ? contactById.get(request.applicant_contact_id) ?? null : null

      const matchesTab =
        tab === 'all' ||
        (tab === 'requested' && request.status === 'requested') ||
        (tab === 'booked' && !!request.booked_slot) ||
        (tab === 'recent' && isRecent(request.created_at)) ||
        (tab === 'closed' && ['completed', 'cancelled'].includes(request.status))

      const matchesSearch =
        query === '' ||
        buildAddress(property).toLowerCase().includes(query) ||
        getContactName(applicant).toLowerCase().includes(query) ||
        request.status.toLowerCase().includes(query) ||
        request.notes?.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  }, [contactById, propertyById, requests, search, tab])

  const selectedRequest = useMemo(
    () => {
      if (!filteredRequests.length) return null

      const effectiveSelectedRequestId =
        selectedRequestId && filteredRequests.some((request) => request.id === selectedRequestId)
          ? selectedRequestId
          : filteredRequests[0].id

      return requests.find((request) => request.id === effectiveSelectedRequestId) || null
    },
    [filteredRequests, requests, selectedRequestId]
  )

  const selectedProperty = useMemo(
    () => (selectedRequest?.property_id ? propertyById.get(selectedRequest.property_id) ?? null : null),
    [propertyById, selectedRequest]
  )

  const selectedApplicant = useMemo(
    () => (selectedRequest?.applicant_contact_id ? contactById.get(selectedRequest.applicant_contact_id) ?? null : null),
    [contactById, selectedRequest]
  )

  const selectedCase = useMemo(
    () => (selectedRequest?.case_id ? caseById.get(selectedRequest.case_id) ?? null : null),
    [caseById, selectedRequest]
  )

  const kpis = useMemo(
    () => ({
      total: requests.length,
      requested: requests.filter((request) => request.status === 'requested').length,
      booked: requests.filter((request) => !!request.booked_slot).length,
      recent: requests.filter((request) => isRecent(request.created_at)).length,
      closed: requests.filter((request) => ['completed', 'cancelled'].includes(request.status)).length,
    }),
    [requests]
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
                <Link href="/records/properties" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Property workspace</Link>
                <Link href="/records/tenancies" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Tenancy workspace</Link>
              </div>

              <p className="app-kicker mt-6">Viewings Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Turn viewing demand into a clear bookings flow</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This surfaces applicants, requested slots, booked visits, and the linked case context for lettings operations.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['All requests', kpis.total, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Requested', kpis.requested, 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['Booked', kpis.booked, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Recent', kpis.recent, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Closed', kpis.closed, 'border-stone-300 bg-stone-100 text-stone-700'],
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
                Use this when the work is really about applicant flow and slot coordination, not just generic cases.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Prioritise requested and recently created enquiries first.</li>
                  <li>Use the booked view to keep upcoming appointments visible.</li>
                  <li>Open the linked case if the viewing has turned into broader operator work.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Viewing tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the viewing requests that matter</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">{filteredRequests.length} shown of {requests.length} requests</div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Viewing workspace tabs">
              {[
                ['all', 'All requests'],
                ['requested', 'Requested'],
                ['booked', 'Booked'],
                ['recent', 'Recent'],
                ['closed', 'Closed'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as ViewingTab)}
                  aria-pressed={tab === value}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${tab === value ? 'app-pill-active' : 'app-pill'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search viewing requests</span>
              <input
                type="text"
                placeholder="Search by applicant, property, postcode, status, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading viewings workspace...</div>
        )}

        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {pageError}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Viewing requests</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a request</h2>
                <p className="mt-1 text-sm text-stone-600">See the applicant, property, case, and slot information in one place.</p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredRequests.map((request) => {
                  const selected = request.id === selectedRequestId
                  const property = request.property_id ? propertyById.get(request.property_id) ?? null : null
                  const applicant = request.applicant_contact_id ? contactById.get(request.applicant_contact_id) ?? null : null
                  return (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequestId(request.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${
                        selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{getContactName(applicant)}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(request.status)}`}>
                              {formatLabel(request.status)}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {buildAddress(property)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">{formatRelativeTime(request.updated_at ?? request.created_at)}</div>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        {request.booked_slot
                          ? `Booked ${formatDateTime(request.booked_slot)}`
                          : request.requested_date
                            ? `Requested ${formatDateTime(request.requested_date)}`
                            : 'No requested slot'}
                      </div>
                    </button>
                  )
                })}

                {filteredRequests.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">No viewing requests match the current filters.</div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedRequest ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a viewing request from the left to inspect the applicant, property, and case context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected viewing</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedApplicant)}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedRequest.status)}`}>
                          {formatLabel(selectedRequest.status)}
                        </span>
                        {selectedCase?.priority && (
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(selectedCase.priority)}`}>
                            {selectedCase.priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">{buildAddress(selectedProperty)}</p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Requested</p>
                          <p className="mt-2 text-sm text-stone-800">{formatDateTime(selectedRequest.requested_date)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Booked slot</p>
                          <p className="mt-2 text-sm text-stone-800">{formatDateTime(selectedRequest.booked_slot)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Contact</p>
                          <p className="mt-2 text-sm text-stone-800">{selectedApplicant?.phone || selectedApplicant?.email || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedCase && (
                        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Linked case</p>
                          <p className="mt-2 text-lg font-semibold text-stone-900">{selectedCase.case_number || selectedCase.id}</p>
                          <p className="mt-2 text-sm leading-6 text-stone-600">{selectedCase.summary || 'No case summary yet.'}</p>
                        </div>
                      )}

                      {selectedCase ? (
                        <Link href={`/cases/${selectedCase.id}`} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium">
                          Open linked case
                        </Link>
                      ) : (
                        <Link href="/" className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium">
                          Open main case queue
                        </Link>
                      )}

                      <Link href="/records/properties" className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium">
                        Open property workspace
                      </Link>

                      <Link href="/records" className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium">
                        Open contact records
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Request notes</p>
                        <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                          {selectedRequest.notes || 'No viewing notes are stored yet.'}
                        </div>
                      </section>
                    </div>

                    <section className="app-card-muted rounded-[1.6rem] p-5">
                      <div className="flex flex-col gap-2 border-b app-divider pb-4">
                        <div>
                          <p className="app-kicker">Applicant snapshot</p>
                          <h3 className="mt-2 text-xl font-semibold">Core contact details</h3>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-stone-700">
                        <div className="flex items-start justify-between gap-4">
                          <dt>Name</dt>
                          <dd className="text-right font-medium text-stone-900">{getContactName(selectedApplicant)}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt>Phone</dt>
                          <dd className="text-right font-medium text-stone-900">{selectedApplicant?.phone || '-'}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt>Email</dt>
                          <dd className="text-right font-medium text-stone-900">{selectedApplicant?.email || '-'}</dd>
                        </div>
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
