'use client'

import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorNav } from '@/app/operator-nav'
import { OperatorSessionState } from '@/app/operator-session-state'

type LeaseTab = 'all' | 'due' | 'planned' | 'completed'

type ContactRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
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
  rent_amount: number | string | null
  updated_at: string | null
}

type LeaseEventRow = {
  id: string
  tenancy_id: string
  property_id: string | null
  case_id: string | null
  event_type: string
  status: 'planned' | 'due' | 'completed' | 'cancelled'
  scheduled_for: string | null
  completed_at: string | null
  source: 'manual' | 'system'
  note: string | null
  created_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  tenancy_id: string | null
  property_id: string | null
  case_type: string | null
  summary: string | null
  status: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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

function formatLabel(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.email || contact.phone || 'Unknown'
}

function buildAddress(property: PropertyRow | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getEventTone(status: LeaseEventRow['status']) {
  if (status === 'due') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'cancelled') return 'border-stone-200 bg-stone-100 text-stone-600'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function isActiveTenancy(tenancy: TenancyRow) {
  return tenancy.tenancy_status === 'active' || tenancy.status === 'active'
}

export default function LeaseLifecyclePage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [events, setEvents] = useState<LeaseEventRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])

  const [tab, setTab] = useState<LeaseTab>('all')
  const [search, setSearch] = useState('')
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null)
  const [eventType, setEventType] = useState('renewal_review')
  const [scheduledFor, setScheduledFor] = useState('')
  const [note, setNote] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState('')

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadWorkspace = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [contactsResponse, propertiesResponse, tenanciesResponse, eventsResponse, casesResponse] =
      await Promise.all([
        supabase.from('contacts').select('id, full_name, email, phone, company_name').order('updated_at', { ascending: false }),
        supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode').order('updated_at', { ascending: false }),
        supabase.from('tenancies').select('id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, updated_at').order('updated_at', { ascending: false }),
        supabase.from('lease_lifecycle_events').select('id, tenancy_id, property_id, case_id, event_type, status, scheduled_for, completed_at, source, note, created_at, updated_at').order('scheduled_for', { ascending: true }).limit(1200),
        supabase.from('cases').select('id, case_number, tenancy_id, property_id, case_type, summary, status').order('updated_at', { ascending: false }).limit(800),
      ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      eventsResponse.error,
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
    setEvents((eventsResponse.data || []) as LeaseEventRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId || authError) return
    void loadWorkspace()
  }, [authError, operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const eventsByTenancyId = useMemo(() => {
    const map = new Map<string, LeaseEventRow[]>()
    for (const eventItem of events) {
      const existing = map.get(eventItem.tenancy_id) ?? []
      existing.push(eventItem)
      map.set(eventItem.tenancy_id, existing)
    }
    return map
  }, [events])

  const filteredTenancies = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tenancies.filter((tenancy) => {
      const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
      const landlord = tenancy.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null
      const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
      const tenancyEvents = eventsByTenancyId.get(tenancy.id) ?? []
      const hasDue = tenancyEvents.some((eventItem) => eventItem.status === 'due')
      const hasPlanned = tenancyEvents.some((eventItem) => eventItem.status === 'planned')
      const hasCompleted = tenancyEvents.some((eventItem) => eventItem.status === 'completed')

      const matchesSearch =
        query === '' ||
        getContactName(tenant).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        buildAddress(property).toLowerCase().includes(query) ||
        property?.postcode?.toLowerCase().includes(query)

      const matchesTab =
        tab === 'all' ||
        (tab === 'due' && hasDue) ||
        (tab === 'planned' && hasPlanned) ||
        (tab === 'completed' && hasCompleted)

      return matchesSearch && matchesTab
    })
  }, [contactById, eventsByTenancyId, propertyById, search, tab, tenancies])

  const selectedTenancy = useMemo(() => {
    if (!filteredTenancies.length) return null

    const effectiveSelectedTenancyId =
      selectedTenancyId && filteredTenancies.some((tenancy) => tenancy.id === selectedTenancyId)
        ? selectedTenancyId
        : filteredTenancies[0].id

    return tenancies.find((tenancy) => tenancy.id === effectiveSelectedTenancyId) || null
  }, [filteredTenancies, selectedTenancyId, tenancies])
  const selectedTenant = useMemo(() => (selectedTenancy?.tenant_contact_id ? contactById.get(selectedTenancy.tenant_contact_id) ?? null : null), [contactById, selectedTenancy])
  const selectedLandlord = useMemo(() => (selectedTenancy?.landlord_contact_id ? contactById.get(selectedTenancy.landlord_contact_id) ?? null : null), [contactById, selectedTenancy])
  const selectedProperty = useMemo(() => (selectedTenancy?.property_id ? propertyById.get(selectedTenancy.property_id) ?? null : null), [propertyById, selectedTenancy])
  const selectedEvents = useMemo(() => {
    if (!selectedTenancy) return []
    return [...(eventsByTenancyId.get(selectedTenancy.id) ?? [])].sort((left, right) => {
      const leftTime = new Date(left.scheduled_for || left.created_at || 0).getTime()
      const rightTime = new Date(right.scheduled_for || right.created_at || 0).getTime()
      return left.status === 'due' && right.status !== 'due' ? -1 : right.status === 'due' && left.status !== 'due' ? 1 : leftTime - rightTime
    })
  }, [eventsByTenancyId, selectedTenancy])
  const selectedCases = useMemo(() => {
    if (!selectedTenancy) return []
    return cases.filter((caseItem) => caseItem.tenancy_id === selectedTenancy.id || caseItem.property_id === selectedTenancy.property_id)
  }, [cases, selectedTenancy])

  const effectiveSelectedCaseId =
    selectedCaseId && selectedCases.some((caseItem) => caseItem.id === selectedCaseId)
      ? selectedCaseId
      : selectedCases[0]?.id || ''

  const kpis = useMemo(() => ({
    due: events.filter((eventItem) => eventItem.status === 'due').length,
    planned: events.filter((eventItem) => eventItem.status === 'planned').length,
    completed: events.filter((eventItem) => eventItem.status === 'completed').length,
    activeTenancies: tenancies.filter((tenancy) => isActiveTenancy(tenancy)).length,
  }), [events, tenancies])

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTenancy) return
    if (!scheduledFor) {
      setActionMessage('Choose a target date before adding a lifecycle event.')
      return
    }

    setSaving(true)
    setActionMessage(null)

    const status = scheduledFor <= new Date().toISOString().slice(0, 10) ? 'due' : 'planned'

    const { data, error: insertError } = await supabase
      .from('lease_lifecycle_events')
      .insert({
        tenancy_id: selectedTenancy.id,
        case_id: effectiveSelectedCaseId || null,
        event_type: eventType,
        status,
        scheduled_for: scheduledFor,
        source: 'manual',
        note: note.trim() || null,
      })
      .select('id, tenancy_id, property_id, case_id, event_type, status, scheduled_for, completed_at, source, note, created_at, updated_at')
      .single()

    if (insertError) {
      setActionMessage(`Error: ${insertError.message}`)
      setSaving(false)
      return
    }

    setEvents((current) => [...current, data as LeaseEventRow])
    setScheduledFor('')
    setNote('')
    setActionMessage('Lifecycle event added.')
    setSaving(false)
  }

  async function handleCompleteEvent(eventId: string) {
    setUpdatingId(eventId)
    setActionMessage(null)

    const { data, error: updateError } = await supabase
      .from('lease_lifecycle_events')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('id, tenancy_id, property_id, case_id, event_type, status, scheduled_for, completed_at, source, note, created_at, updated_at')
      .single()

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setUpdatingId(null)
      return
    }

    setEvents((current) => current.map((eventItem) => (eventItem.id === eventId ? (data as LeaseEventRow) : eventItem)))
    setUpdatingId(null)
    setActionMessage('Lifecycle event marked complete.')
  }

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="lease" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div>
            <p className="app-kicker">End of Tenancy</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Track end of tenancy, notice, and move-out work before it turns into inbox chaos</h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">Keep term dates, renewal actions, notice windows, and move-out follow-through attached to the tenancy itself.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Due now', kpis.due, 'border-rose-200 bg-rose-50 text-rose-900'],
                  ['Planned', kpis.planned, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Completed', kpis.completed, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Active tenancies', kpis.activeTenancies, 'border-stone-200 bg-stone-50 text-stone-900'],
                ].map(([label, value, tone]) => (
                  <article key={String(label)} className={`rounded-[1.6rem] border p-4 shadow-sm ${tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</div>
                    <div className="mt-3 text-3xl font-semibold">{value}</div>
                  </article>
                ))}
              </div>
            </div>

          <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 text-sm leading-6 text-stone-600">
              Review due actions first, link them to the right case if discussions are already open, and use completed items as the tenancy audit trail.
            </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Filter</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter tenancies by lifecycle pressure</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">{filteredTenancies.length} shown of {tenancies.length} tenancies</div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3" aria-label="End of tenancy tabs">
              {[
                ['all', 'All tenancies'],
                ['due', 'Due actions'],
                ['planned', 'Planned'],
                ['completed', 'Completed'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setTab(value as LeaseTab)} aria-pressed={tab === value} className={`rounded-full px-4 py-2.5 text-sm font-medium ${tab === value ? 'app-pill-active' : 'app-pill'}`}>
                  {label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search end of tenancy workflow</span>
              <input type="text" placeholder="Search by tenant, landlord, property, or postcode" value={search} onChange={(event) => setSearch(event.target.value)} className="app-field text-sm outline-none" />
            </label>
          </div>
        </section>

        {loading && <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading end of tenancy workspace...</div>}
        {pageError && <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">Error: {pageError}</div>}
        {actionMessage && <div className="mt-6 rounded-[1.8rem] border border-sky-200 bg-sky-50/95 p-6 text-sm text-sky-800">{actionMessage}</div>}

        {!loading && !pageError && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Tenancy lifecycle</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a tenancy</h2>
                <p className="mt-1 text-sm text-stone-600">See planned and due lifecycle actions before renewal, notice, or move-out work gets lost.</p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredTenancies.map((tenancy) => {
                  const selected = tenancy.id === selectedTenancyId
                  const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
                  const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
                  const dueCount = (eventsByTenancyId.get(tenancy.id) ?? []).filter((eventItem) => eventItem.status === 'due').length

                  return (
                    <button key={tenancy.id} onClick={() => setSelectedTenancyId(tenancy.id)} aria-pressed={selected} className={`w-full rounded-[1.6rem] border p-4 text-left ${selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{getContactName(tenant)}</span>
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">{tenancy.tenancy_status || tenancy.status || 'tenancy'}</span>
                            {dueCount > 0 && <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">{dueCount} due</span>}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>{buildAddress(property)}</p>
                        </div>
                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-800">{formatRelativeTime(tenancy.updated_at)}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {filteredTenancies.length === 0 && <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">No tenancies match the current lifecycle filters yet.</div>}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedTenancy ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">Choose a tenancy from the left to inspect lease lifecycle work.</div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div>
                      <p className="app-kicker">Selected tenancy</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedTenant)}</h2>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">{selectedTenancy.tenancy_status || selectedTenancy.status || 'tenancy'}</span>
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">{buildAddress(selectedProperty)}. Landlord: {getContactName(selectedLandlord)}.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Term dates</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{formatDate(selectedTenancy.start_date)} to {formatDate(selectedTenancy.end_date)}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">Keep renewal review, notice windows, and move-out actions attached here instead of burying them in inbox notes.</p>
                      </div>

                      <div className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Related case</p>
                        <select value={effectiveSelectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="app-field mt-3 text-sm outline-none">
                          <option value="">No linked case</option>
                          {selectedCases.map((caseItem) => (
                            <option key={caseItem.id} value={caseItem.id}>{(caseItem.case_number || caseItem.id).slice(0, 18)} • {formatLabel(caseItem.case_type)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Add lifecycle event</p>
                        <h3 className="mt-2 text-xl font-semibold">Book the next lease or tenancy action</h3>
                        <form className="mt-4 space-y-4" onSubmit={handleCreateEvent}>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Event type</span>
                            <select value={eventType} onChange={(event) => setEventType(event.target.value)} className="app-field text-sm outline-none">
                              <option value="renewal_review">Renewal review</option>
                              <option value="rent_review">Rent review</option>
                              <option value="inspection">Inspection</option>
                              <option value="notice_received">Notice received</option>
                              <option value="notice_served">Notice served</option>
                              <option value="move_out">Move-out</option>
                              <option value="deposit_follow_up">Deposit follow-up</option>
                              <option value="other">Other</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Scheduled for</span>
                            <input type="date" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className="app-field text-sm outline-none" />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Notes</span>
                            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="app-field min-h-[120px] text-sm outline-none" placeholder="Context for the renewal, notice, or move-out action" />
                          </label>

                          <button type="submit" disabled={saving} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium disabled:opacity-60">{saving ? 'Saving lifecycle event...' : 'Add lifecycle event'}</button>
                        </form>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Lifecycle queue</p>
                            <h3 className="mt-2 text-xl font-semibold">Planned and completed actions for this tenancy</h3>
                          </div>
                          <div className="text-sm text-stone-500">{selectedEvents.length} events</div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedEvents.length === 0 && <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No lifecycle events are linked to this tenancy yet.</div>}
                          {selectedEvents.map((eventItem) => (
                            <article key={eventItem.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getEventTone(eventItem.status)}`}>{formatLabel(eventItem.event_type)} • {formatLabel(eventItem.status)}</span>
                                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">{eventItem.source}</span>
                                  </div>
                                  <p className="mt-3 text-sm leading-7 text-stone-700">{eventItem.note || 'No event note recorded.'}</p>
                                  <p className="mt-2 text-xs text-stone-500">Scheduled {formatDate(eventItem.scheduled_for)} • Completed {formatDate(eventItem.completed_at)}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                  {eventItem.status !== 'completed' && eventItem.status !== 'cancelled' && (
                                    <button onClick={() => void handleCompleteEvent(eventItem.id)} disabled={updatingId === eventItem.id} className="app-secondary-button inline-flex items-center rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60">Mark complete</button>
                                  )}
                                </div>
                              </div>
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
