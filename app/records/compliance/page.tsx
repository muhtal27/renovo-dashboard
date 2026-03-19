'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type ComplianceTab = 'all' | 'expired' | 'expiring' | 'missing' | 'pending' | 'valid'

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  landlord_contact_id: string | null
  property_type: string | null
  management_type: string | null
  is_active: boolean
  updated_at: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  company_name: string | null
}

type ComplianceRecordRow = {
  id: string
  property_id: string
  record_type: string
  status: string
  issue_date: string | null
  expiry_date: string | null
  reference_number: string | null
  document_url: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  case_number: string | null
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

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

function getComplianceTone(status: string) {
  if (status === 'expired' || status === 'missing') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'expiring' || status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getComplianceGuidance(recordType: string, status: string) {
  const label = formatLabel(recordType)

  if (status === 'expired') {
    return `${label} is expired. This should usually be treated as an active compliance risk and followed through at property level immediately.`
  }

  if (status === 'missing') {
    return `${label} is missing. Confirm whether the record truly does not exist or simply has not been uploaded into the system yet.`
  }

  if (status === 'expiring') {
    return `${label} is coming up for renewal. Use this queue to prevent the property slipping into an expired state.`
  }

  if (status === 'pending') {
    return `${label} is pending. Check whether an inspection, booking, or document return is already in motion.`
  }

  return `${label} is currently marked valid. Keep the expiry date and document trail accurate.`
}

export default function ComplianceRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [records, setRecords] = useState<ComplianceRecordRow[]>([])

  const [tab, setTab] = useState<ComplianceTab>('all')
  const [search, setSearch] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return

    setLoading(true)
    setError(null)

    const [propertiesResponse, contactsResponse, casesResponse, recordsResponse] = await Promise.all([
      supabase
        .from('properties')
        .select(
          'id, address_line_1, address_line_2, city, postcode, landlord_contact_id, property_type, management_type, is_active, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('contacts')
        .select('id, full_name, phone, email, company_name')
        .order('updated_at', { ascending: false }),
      supabase
        .from('cases')
        .select('id, property_id, case_number, summary, status, priority, updated_at')
        .order('updated_at', { ascending: false })
        .limit(600),
      supabase
        .from('compliance_records')
        .select(
          'id, property_id, record_type, status, issue_date, expiry_date, reference_number, document_url, notes, created_at, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(800),
    ])

    const firstError = [
      propertiesResponse.error,
      contactsResponse.error,
      casesResponse.error,
      recordsResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setContacts((contactsResponse.data || []) as ContactRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setRecords((recordsResponse.data || []) as ComplianceRecordRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])

  const casesByPropertyId = useMemo(() => {
    const map = new Map<string, CaseRow[]>()

    for (const caseItem of cases) {
      if (!caseItem.property_id) continue
      const existing = map.get(caseItem.property_id) ?? []
      existing.push(caseItem)
      map.set(caseItem.property_id, existing)
    }

    for (const [propertyId, values] of map.entries()) {
      values.sort((left, right) => {
        const leftDate = new Date(left.updated_at ?? 0).getTime()
        const rightDate = new Date(right.updated_at ?? 0).getTime()
        return rightDate - leftDate
      })
      map.set(propertyId, values)
    }

    return map
  }, [cases])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()

    return records.filter((record) => {
      const property = propertyById.get(record.property_id) ?? null
      const landlord = property?.landlord_contact_id ? contactById.get(property.landlord_contact_id) ?? null : null

      const matchesTab = tab === 'all' || record.status === tab
      const matchesSearch =
        query === '' ||
        formatLabel(record.record_type).toLowerCase().includes(query) ||
        record.reference_number?.toLowerCase().includes(query) ||
        buildAddress(property).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        property?.postcode?.toLowerCase().includes(query) ||
        record.notes?.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  }, [contactById, propertyById, records, search, tab])

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedRecordId(null)
      return
    }

    if (!selectedRecordId || !filteredRecords.some((record) => record.id === selectedRecordId)) {
      setSelectedRecordId(filteredRecords[0].id)
    }
  }, [filteredRecords, selectedRecordId])

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) || null,
    [records, selectedRecordId]
  )

  const selectedProperty = useMemo(
    () => (selectedRecord ? propertyById.get(selectedRecord.property_id) ?? null : null),
    [propertyById, selectedRecord]
  )

  const selectedLandlord = useMemo(
    () =>
      selectedProperty?.landlord_contact_id
        ? contactById.get(selectedProperty.landlord_contact_id) ?? null
        : null,
    [contactById, selectedProperty?.landlord_contact_id]
  )

  const selectedCases = useMemo(
    () => (selectedRecord ? casesByPropertyId.get(selectedRecord.property_id) ?? [] : []),
    [casesByPropertyId, selectedRecord]
  )

  const primaryRelatedCase = useMemo(
    () => selectedCases[0] ?? null,
    [selectedCases]
  )

  const kpis = useMemo(
    () => ({
      total: records.length,
      expired: records.filter((record) => record.status === 'expired').length,
      expiring: records.filter((record) => record.status === 'expiring').length,
      missing: records.filter((record) => record.status === 'missing').length,
      pending: records.filter((record) => record.status === 'pending').length,
      valid: records.filter((record) => record.status === 'valid').length,
    }),
    [records]
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
                <Link
                  href="/"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Back to queue
                </Link>
                <Link
                  href="/records/properties"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Property workspace
                </Link>
                <Link
                  href="/records/maintenance"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Maintenance workspace
                </Link>
                <Link
                  href="/knowledge"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Scotland knowledge
                </Link>
              </div>

              <p className="app-kicker mt-6">Compliance Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Work ahead of property risk instead of reacting late
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This turns `compliance_records` into an operator queue: expired and expiring
                statutory records, missing documents, and the property context that helps the team
                act before a caller or case forces it.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  {
                    label: 'All records',
                    value: kpis.total,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                  },
                  {
                    label: 'Expired',
                    value: kpis.expired,
                    tone: 'border-red-200 bg-red-50 text-red-900',
                  },
                  {
                    label: 'Expiring',
                    value: kpis.expiring,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                  },
                  {
                    label: 'Missing',
                    value: kpis.missing,
                    tone: 'border-rose-200 bg-rose-50 text-rose-900',
                  },
                  {
                    label: 'Pending',
                    value: kpis.pending,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                  },
                  {
                    label: 'Valid',
                    value: kpis.valid,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.6rem] border p-4 shadow-sm ${card.tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">Operator</p>
              <h2 className="mt-2 text-xl font-semibold">{getOperatorLabel(operator)}</h2>
              <p className="mt-1 text-sm text-stone-600">
                Compliance is where the portal stops being purely reactive and starts preventing
                trouble before it becomes a case.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Prioritise expired and missing records first.</li>
                  <li>Use the property and landlord context before deciding next action.</li>
                  <li>Open related cases if compliance issues are already generating live work.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Compliance tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the records that need action</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredRecords.length} shown of {records.length} records
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Compliance workspace tabs">
              {[
                ['all', 'All records'],
                ['expired', 'Expired'],
                ['expiring', 'Expiring'],
                ['missing', 'Missing'],
                ['pending', 'Pending'],
                ['valid', 'Valid'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as ComplianceTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search compliance</span>
              <input
                type="text"
                placeholder="Search by property, record type, landlord, postcode, reference, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading compliance workspace...
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
                <p className="app-kicker">Compliance queue</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a record</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Review certificate and statutory records at property level before they drift into
                  expired or missing territory.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredRecords.map((record) => {
                  const selected = record.id === selectedRecordId
                  const property = propertyById.get(record.property_id) ?? null
                  const landlord = property?.landlord_contact_id
                    ? contactById.get(property.landlord_contact_id) ?? null
                    : null

                  return (
                    <button
                      key={record.id}
                      onClick={() => setSelectedRecordId(record.id)}
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
                            <span className="text-base font-semibold">{formatLabel(record.record_type)}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getComplianceTone(record.status)}`}>
                              {formatLabel(record.status)}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {buildAddress(property)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(record.updated_at ?? record.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {getContactName(landlord)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          Expiry {formatDate(record.expiry_date)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          Ref {record.reference_number || 'Not set'}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {filteredRecords.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No compliance records match the current filters yet.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedRecord ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a compliance record from the left to inspect the property, landlord, dates,
                  and related case context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected record</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{formatLabel(selectedRecord.record_type)}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getComplianceTone(selectedRecord.status)}`}>
                          {formatLabel(selectedRecord.status)}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {getComplianceGuidance(selectedRecord.record_type, selectedRecord.status)}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Property
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{buildAddress(selectedProperty)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Landlord
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{getContactName(selectedLandlord)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Property type
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {formatLabel(selectedProperty?.property_type ?? null)} • {formatLabel(selectedProperty?.management_type ?? null)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`rounded-[1.5rem] border p-4 ${getComplianceTone(selectedRecord.status)}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Record posture</p>
                        <p className="mt-2 text-lg font-semibold">{formatLabel(selectedRecord.status)}</p>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                          {selectedRecord.status === 'expired' || selectedRecord.status === 'missing'
                            ? 'This needs an immediate property-level follow-through.'
                            : selectedRecord.status === 'expiring' || selectedRecord.status === 'pending'
                              ? 'This needs proactive follow-up before it becomes an expired issue.'
                              : 'This record is currently valid but should stay reviewed and documented.'}
                        </p>
                      </div>

                      {primaryRelatedCase ? (
                        <Link
                          href={`/cases/${primaryRelatedCase.id}`}
                          className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                        >
                          Open newest linked case
                        </Link>
                      ) : (
                        <Link
                          href="/"
                          className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                        >
                          Open main case queue
                        </Link>
                      )}

                      <Link
                        href="/records/properties"
                        className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open property workspace
                      </Link>

                      {selectedCases.length > 0 && (
                        <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 p-4 text-sm text-stone-700">
                          {selectedCases.length} case{selectedCases.length === 1 ? '' : 's'} already sit on this property, so the quickest follow-through is usually through the live case thread rather than treating the record in isolation.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Record snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Issue date</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDate(selectedRecord.issue_date)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Expiry date</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDate(selectedRecord.expiry_date)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Reference</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedRecord.reference_number || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatRelativeTime(selectedRecord.updated_at ?? selectedRecord.created_at)}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Operator notes</p>
                        <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                          {selectedRecord.notes || 'No notes are stored on this compliance record yet.'}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Related cases</p>
                            <h3 className="mt-2 text-xl font-semibold">Live work on the same property</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCases.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No cases are linked to this property right now.
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
                                <span className="text-xs text-stone-500">
                                  {formatRelativeTime(caseItem.updated_at)}
                                </span>
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
                            <p className="app-kicker">Document access</p>
                            <h3 className="mt-2 text-xl font-semibold">Reference and source trail</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                            <p className="text-sm text-stone-700">
                              Document URL: {selectedRecord.document_url ? 'Available' : 'Not uploaded'}
                            </p>
                            {selectedRecord.document_url && (
                              <a
                                href={selectedRecord.document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
                              >
                                Open stored document
                              </a>
                            )}
                          </div>
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
