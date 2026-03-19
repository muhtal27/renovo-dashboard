'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type ContractorTab = 'all' | 'active' | 'emergency' | 'with_jobs' | 'with_quotes'

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  company_name: string | null
}

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string
  coverage_area: string | null
  emergency_callout: boolean
  rating: number | null
  is_active: boolean
  updated_at: string | null
}

type ContractorTradeRow = {
  id: string
  contractor_id: string
  trade_type: string
}

type MaintenanceRequestRow = {
  id: number
  property_id: string | null
  contractor_id: string | null
  issue_type: string | null
  description: string | null
  priority: string
  status: string
  scheduled_for: string | null
  updated_at: string | null
}

type MaintenanceQuoteRow = {
  id: string
  maintenance_request_id: number
  contractor_id: string
  quote_amount: number
  quote_notes: string | null
  quote_status: string
  submitted_at: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
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

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.phone || contact.email || 'Unknown'
}

function buildAddress(property: Pick<PropertyRow, 'address_line_1' | 'address_line_2' | 'city' | 'postcode'> | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getQuoteTone(value: string) {
  if (value === 'accepted') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'rejected') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function getRequestTone(value: string) {
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'cancelled') return 'border-stone-200 bg-stone-50 text-stone-700'
  if (value === 'reported' || value === 'triaged' || value === 'quote_requested' || value === 'awaiting_approval') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

export default function ContractorRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [contractors, setContractors] = useState<ContractorRow[]>([])
  const [trades, setTrades] = useState<ContractorTradeRow[]>([])
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [quotes, setQuotes] = useState<MaintenanceQuoteRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])

  const [tab, setTab] = useState<ContractorTab>('all')
  const [search, setSearch] = useState('')
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [
      contactsResponse,
      contractorsResponse,
      tradesResponse,
      requestsResponse,
      quotesResponse,
      propertiesResponse,
    ] = await Promise.all([
      supabase.from('contacts').select('id, full_name, phone, email, company_name').order('updated_at', { ascending: false }),
      supabase
        .from('contractors')
        .select('id, contact_id, company_name, primary_trade, coverage_area, emergency_callout, rating, is_active, updated_at')
        .order('updated_at', { ascending: false }),
      supabase.from('contractor_trades').select('id, contractor_id, trade_type'),
      supabase
        .from('maintenance_requests')
        .select('id, property_id, contractor_id, issue_type, description, priority, status, scheduled_for, updated_at')
        .order('updated_at', { ascending: false })
        .limit(800),
      supabase
        .from('maintenance_quotes')
        .select('id, maintenance_request_id, contractor_id, quote_amount, quote_notes, quote_status, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(800),
      supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode').order('updated_at', { ascending: false }),
    ])

    const firstError = [
      contactsResponse.error,
      contractorsResponse.error,
      tradesResponse.error,
      requestsResponse.error,
      quotesResponse.error,
      propertiesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setContractors((contractorsResponse.data || []) as ContractorRow[])
    setTrades((tradesResponse.data || []) as ContractorTradeRow[])
    setRequests((requestsResponse.data || []) as MaintenanceRequestRow[])
    setQuotes((quotesResponse.data || []) as MaintenanceQuoteRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const tradesByContractorId = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const trade of trades) {
      const existing = map.get(trade.contractor_id) ?? []
      existing.push(trade.trade_type)
      map.set(trade.contractor_id, existing)
    }
    return map
  }, [trades])

  const requestsByContractorId = useMemo(() => {
    const map = new Map<string, MaintenanceRequestRow[]>()
    for (const request of requests) {
      if (!request.contractor_id) continue
      const existing = map.get(request.contractor_id) ?? []
      existing.push(request)
      map.set(request.contractor_id, existing)
    }
    return map
  }, [requests])

  const quotesByContractorId = useMemo(() => {
    const map = new Map<string, MaintenanceQuoteRow[]>()
    for (const quote of quotes) {
      const existing = map.get(quote.contractor_id) ?? []
      existing.push(quote)
      map.set(quote.contractor_id, existing)
    }
    return map
  }, [quotes])

  const filteredContractors = useMemo(() => {
    const query = search.trim().toLowerCase()
    return contractors.filter((contractor) => {
      const contact = contactById.get(contractor.contact_id) ?? null
      const contractorTrades = tradesByContractorId.get(contractor.id) ?? []
      const contractorRequests = requestsByContractorId.get(contractor.id) ?? []
      const contractorQuotes = quotesByContractorId.get(contractor.id) ?? []

      const matchesTab =
        tab === 'all' ||
        (tab === 'active' && contractor.is_active) ||
        (tab === 'emergency' && contractor.emergency_callout) ||
        (tab === 'with_jobs' && contractorRequests.length > 0) ||
        (tab === 'with_quotes' && contractorQuotes.length > 0)

      const matchesSearch =
        query === '' ||
        getContactName(contact).toLowerCase().includes(query) ||
        contractor.company_name?.toLowerCase().includes(query) ||
        contractor.primary_trade.toLowerCase().includes(query) ||
        contractor.coverage_area?.toLowerCase().includes(query) ||
        contractorTrades.some((trade) => trade.toLowerCase().includes(query))

      return matchesTab && matchesSearch
    })
  }, [contactById, contractors, quotesByContractorId, requestsByContractorId, search, tab, tradesByContractorId])

  const selectedContractor = useMemo(
    () => {
      if (!filteredContractors.length) return null

      const effectiveSelectedContractorId =
        selectedContractorId && filteredContractors.some((contractor) => contractor.id === selectedContractorId)
          ? selectedContractorId
          : filteredContractors[0].id

      return contractors.find((contractor) => contractor.id === effectiveSelectedContractorId) || null
    },
    [contractors, filteredContractors, selectedContractorId]
  )

  const selectedContact = useMemo(
    () => (selectedContractor ? contactById.get(selectedContractor.contact_id) ?? null : null),
    [contactById, selectedContractor]
  )

  const selectedTrades = useMemo(
    () => (selectedContractor ? tradesByContractorId.get(selectedContractor.id) ?? [] : []),
    [selectedContractor, tradesByContractorId]
  )

  const selectedRequests = useMemo(
    () => (selectedContractor ? requestsByContractorId.get(selectedContractor.id) ?? [] : []),
    [requestsByContractorId, selectedContractor]
  )

  const selectedQuotes = useMemo(
    () => (selectedContractor ? quotesByContractorId.get(selectedContractor.id) ?? [] : []),
    [quotesByContractorId, selectedContractor]
  )

  const kpis = useMemo(
    () => ({
      total: contractors.length,
      active: contractors.filter((contractor) => contractor.is_active).length,
      emergency: contractors.filter((contractor) => contractor.emergency_callout).length,
      jobs: contractors.filter((contractor) => (requestsByContractorId.get(contractor.id) ?? []).length > 0).length,
      quotes: contractors.filter((contractor) => (quotesByContractorId.get(contractor.id) ?? []).length > 0).length,
    }),
    [contractors, quotesByContractorId, requestsByContractorId]
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
                <Link href="/records/maintenance" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Maintenance workspace
                </Link>
                <Link href="/records/properties" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">
                  Property workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Contractor Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                See the people actually delivering the repair work
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This brings contractors, trade coverage, live maintenance jobs, and quotes into one operator view.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['All contractors', kpis.total, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Active', kpis.active, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Emergency callout', kpis.emergency, 'border-red-200 bg-red-50 text-red-900'],
                  ['With jobs', kpis.jobs, 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['With quotes', kpis.quotes, 'border-sky-200 bg-sky-50 text-sky-900'],
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
                Use this when the bottleneck is not the case but the contractor coverage, trade fit, or quote response.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Check emergency callout and active status before routing urgent work.</li>
                  <li>Use quote history when comparing suppliers for repeated job types.</li>
                  <li>Open maintenance jobs here when you want the contractor view first.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Contractor tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the contractors you need</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredContractors.length} shown of {contractors.length} contractors
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Contractor workspace tabs">
              {[
                ['all', 'All contractors'],
                ['active', 'Active'],
                ['emergency', 'Emergency'],
                ['with_jobs', 'With jobs'],
                ['with_quotes', 'With quotes'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as ContractorTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search contractors</span>
              <input
                type="text"
                placeholder="Search by company, contact, trade, coverage area, or quote history"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading contractor workspace...
          </div>
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
                <p className="app-kicker">Contractor records</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a contractor</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Review trade fit, emergency coverage, active jobs, and quotes in one place.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredContractors.map((contractor) => {
                  const selected = contractor.id === selectedContractorId
                  const contact = contactById.get(contractor.contact_id) ?? null
                  const contractorTrades = tradesByContractorId.get(contractor.id) ?? []
                  const contractorRequests = requestsByContractorId.get(contractor.id) ?? []
                  const contractorQuotes = quotesByContractorId.get(contractor.id) ?? []

                  return (
                    <button
                      key={contractor.id}
                      onClick={() => setSelectedContractorId(contractor.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${
                        selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">
                              {contractor.company_name || getContactName(contact)}
                            </span>
                            {!contractor.is_active && (
                              <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                inactive
                              </span>
                            )}
                            {contractor.emergency_callout && (
                              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
                                emergency
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {contractor.primary_trade}{contractor.coverage_area ? ` • ${contractor.coverage_area}` : ''}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">{formatRelativeTime(contractor.updated_at)}</div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        {contractorTrades.slice(0, 3).map((trade) => (
                          <span key={`${contractor.id}-${trade}`} className="rounded-full border border-current/15 px-2.5 py-1">
                            {trade}
                          </span>
                        ))}
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <span>{contractorRequests.length} jobs</span>
                          <span>{contractorQuotes.length} quotes</span>
                          <span>Rating {contractor.rating ?? '-'}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredContractors.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No contractor records match the current filters yet.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedContractor ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a contractor from the left to inspect trades, jobs, and quotes.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected contractor</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">
                          {selectedContractor.company_name || getContactName(selectedContact)}
                        </h2>
                        {selectedContractor.emergency_callout && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            emergency callout
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedContractor.primary_trade}{selectedContractor.coverage_area ? ` • ${selectedContractor.coverage_area}` : ''}. Contact {getContactName(selectedContact)}.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Primary trade</p>
                          <p className="mt-2 text-sm text-stone-800">{selectedContractor.primary_trade}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Coverage</p>
                          <p className="mt-2 text-sm text-stone-800">{selectedContractor.coverage_area || '-'}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Contact</p>
                          <p className="mt-2 text-sm text-stone-800">{selectedContact?.phone || selectedContact?.email || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Workload</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {selectedRequests.length} live jobs • {selectedQuotes.length} quotes
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          Rating {selectedContractor.rating ?? '-'} • {selectedContractor.is_active ? 'Active supplier' : 'Inactive supplier'}
                        </p>
                      </div>

                      <Link
                        href="/records/maintenance"
                        className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open maintenance workspace
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Trade list</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedTrades.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-4 text-sm">
                              No extra trade tags are linked yet.
                            </div>
                          )}
                          {selectedTrades.map((trade) => (
                            <span key={`${selectedContractor.id}-${trade}`} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700">
                              {trade}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Emergency callout</dt>
                            <dd className="text-right font-medium text-stone-900">{selectedContractor.emergency_callout ? 'Yes' : 'No'}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Rating</dt>
                            <dd className="text-right font-medium text-stone-900">{selectedContractor.rating ?? '-'}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">{formatRelativeTime(selectedContractor.updated_at)}</dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4">
                          <div>
                            <p className="app-kicker">Active jobs</p>
                            <h3 className="mt-2 text-xl font-semibold">Maintenance assigned here</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedRequests.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No maintenance requests are assigned to this contractor yet.
                            </div>
                          )}

                          {selectedRequests.slice(0, 6).map((request) => (
                            <article key={request.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getRequestTone(request.status)}`}>
                                    {formatLabel(request.status)}
                                  </span>
                                  <span className="text-sm font-medium text-stone-900">
                                    {formatLabel(request.issue_type)}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">{formatRelativeTime(request.updated_at)}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                {request.description || 'No maintenance description yet.'}
                              </p>
                              <p className="mt-3 text-xs text-stone-500">
                                {buildAddress(request.property_id ? propertyById.get(request.property_id) ?? null : null)}
                                {request.scheduled_for ? ` • Scheduled ${formatDateTime(request.scheduled_for)}` : ''}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4">
                          <div>
                            <p className="app-kicker">Quote history</p>
                            <h3 className="mt-2 text-xl font-semibold">Submitted prices and notes</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedQuotes.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No quotes are stored for this contractor yet.
                            </div>
                          )}

                          {selectedQuotes.slice(0, 6).map((quote) => {
                            const linkedRequest = requests.find((request) => request.id === quote.maintenance_request_id) || null
                            return (
                              <article key={quote.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getQuoteTone(quote.quote_status)}`}>
                                      {formatLabel(quote.quote_status)}
                                    </span>
                                    <span className="text-sm font-medium text-stone-900">
                                      {formatMoney(quote.quote_amount)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-stone-500">{formatDateTime(quote.submitted_at)}</span>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-stone-700">
                                  {quote.quote_notes || 'No quote notes stored.'}
                                </p>
                                {linkedRequest && (
                                  <p className="mt-3 text-xs text-stone-500">
                                    {formatLabel(linkedRequest.issue_type)} • {buildAddress(linkedRequest.property_id ? propertyById.get(linkedRequest.property_id) ?? null : null)}
                                  </p>
                                )}
                              </article>
                            )
                          })}
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
