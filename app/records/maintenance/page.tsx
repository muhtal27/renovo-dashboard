'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOperatorLabel,
  getOperatorProfile,
  getSessionUser,
  type CurrentOperator,
} from '@/lib/operator'
import { supabase } from '@/lib/supabase'

type MaintenanceTab = 'all' | 'open' | 'approval' | 'scheduled' | 'completed' | 'quotes'

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

type CaseRow = {
  id: string
  case_number: string | null
  summary: string | null
  status: string | null
  priority: string | null
}

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string
  coverage_area: string | null
  emergency_callout: boolean
  is_active: boolean
}

type MaintenanceRequestRow = {
  id: number
  created_at: string | null
  case_id: string | null
  property_id: string | null
  tenancy_id: string | null
  reported_by_contact_id: string | null
  issue_type: string | null
  subcategory: string | null
  description: string | null
  access_notes: string | null
  priority: string
  status: string
  contractor_id: string | null
  scheduled_for: string | null
  completed_at: string | null
  landlord_approval_required: boolean
  estimated_cost: number | null
  final_cost: number | null
  updated_at: string | null
}

type MaintenanceQuoteRow = {
  id: string
  maintenance_request_id: number
  contractor_id: string
  quote_amount: number
  quote_notes: string | null
  quote_status: string
  file_url: string | null
  submitted_at: string | null
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

function formatDateTime(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function getPriorityTone(value: string) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getStatusTone(value: string) {
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'cancelled') return 'border-stone-200 bg-stone-50 text-stone-700'
  if (value === 'reported' || value === 'triaged' || value === 'quote_requested' || value === 'awaiting_approval') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function getQuoteTone(value: string) {
  if (value === 'accepted') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'rejected') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function isOpenMaintenance(status: string) {
  return !['completed', 'cancelled'].includes(status)
}

function isScheduledMaintenance(status: string, scheduledFor: string | null) {
  return (status === 'scheduled' || status === 'approved' || status === 'in_progress') && !!scheduledFor
}

function needsApproval(request: MaintenanceRequestRow) {
  return request.status === 'awaiting_approval' || request.landlord_approval_required
}

export default function MaintenanceRecordsPage() {
  const router = useRouter()

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [contractors, setContractors] = useState<ContractorRow[]>([])
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([])
  const [quotes, setQuotes] = useState<MaintenanceQuoteRow[]>([])

  const [tab, setTab] = useState<MaintenanceTab>('all')
  const [search, setSearch] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const profile = await getOperatorProfile(userId)

      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return {
          ...current,
          profile,
        }
      })

      if (profile?.is_active === false) {
        setError('Your operator profile is inactive. Please contact an administrator.')
      }
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'Unable to load operator profile.'
      )
    }
  })

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return

    setLoading(true)
    setError(null)

    const [
      contactsResponse,
      propertiesResponse,
      casesResponse,
      contractorsResponse,
      requestsResponse,
      quotesResponse,
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, full_name, phone, email, company_name')
        .order('updated_at', { ascending: false }),
      supabase
        .from('properties')
        .select('id, address_line_1, address_line_2, city, postcode')
        .order('updated_at', { ascending: false }),
      supabase
        .from('cases')
        .select('id, case_number, summary, status, priority')
        .order('updated_at', { ascending: false })
        .limit(600),
      supabase
        .from('contractors')
        .select('id, contact_id, company_name, primary_trade, coverage_area, emergency_callout, is_active')
        .order('updated_at', { ascending: false }),
      supabase
        .from('maintenance_requests')
        .select(
          'id, created_at, case_id, property_id, tenancy_id, reported_by_contact_id, issue_type, subcategory, description, access_notes, priority, status, contractor_id, scheduled_for, completed_at, landlord_approval_required, estimated_cost, final_cost, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(800),
      supabase
        .from('maintenance_quotes')
        .select(
          'id, maintenance_request_id, contractor_id, quote_amount, quote_notes, quote_status, file_url, submitted_at'
        )
        .order('submitted_at', { ascending: false })
        .limit(800),
    ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      casesResponse.error,
      contractorsResponse.error,
      requestsResponse.error,
      quotesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setContractors((contractorsResponse.data || []) as ContractorRow[])
    setRequests((requestsResponse.data || []) as MaintenanceRequestRow[])
    setQuotes((quotesResponse.data || []) as MaintenanceQuoteRow[])
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

        setOperator({
          authUser: user,
          profile: null,
        })
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
        const user = session.user
        if (!cancelled) {
          setOperator({
            authUser: user,
            profile: null,
          })
        }
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to refresh operator session.')
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])
  const caseById = useMemo(() => new Map(cases.map((caseItem) => [caseItem.id, caseItem])), [cases])
  const contractorById = useMemo(() => new Map(contractors.map((contractor) => [contractor.id, contractor])), [contractors])

  const quotesByRequestId = useMemo(() => {
    const map = new Map<number, MaintenanceQuoteRow[]>()

    for (const quote of quotes) {
      const existing = map.get(quote.maintenance_request_id) ?? []
      existing.push(quote)
      map.set(quote.maintenance_request_id, existing)
    }

    for (const [requestId, values] of map.entries()) {
      values.sort((left, right) => {
        const leftDate = new Date(left.submitted_at ?? 0).getTime()
        const rightDate = new Date(right.submitted_at ?? 0).getTime()
        return rightDate - leftDate
      })
      map.set(requestId, values)
    }

    return map
  }, [quotes])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests.filter((request) => {
      const property = request.property_id ? propertyById.get(request.property_id) ?? null : null
      const reporter = request.reported_by_contact_id
        ? contactById.get(request.reported_by_contact_id) ?? null
        : null
      const contractor = request.contractor_id ? contractorById.get(request.contractor_id) ?? null : null
      const requestQuotes = quotesByRequestId.get(request.id) ?? []

      const matchesTab =
        tab === 'all' ||
        (tab === 'open' && isOpenMaintenance(request.status)) ||
        (tab === 'approval' && needsApproval(request)) ||
        (tab === 'scheduled' && isScheduledMaintenance(request.status, request.scheduled_for)) ||
        (tab === 'completed' && request.status === 'completed') ||
        (tab === 'quotes' && requestQuotes.length > 0)

      const matchesSearch =
        query === '' ||
        buildAddress(property).toLowerCase().includes(query) ||
        request.issue_type?.toLowerCase().includes(query) ||
        request.subcategory?.toLowerCase().includes(query) ||
        request.description?.toLowerCase().includes(query) ||
        getContactName(reporter).toLowerCase().includes(query) ||
        contractor?.company_name?.toLowerCase().includes(query) ||
        contractor?.primary_trade?.toLowerCase().includes(query)

      return matchesTab && matchesSearch
    })
  }, [contactById, contractorById, propertyById, quotesByRequestId, requests, search, tab])

  useEffect(() => {
    if (!filteredRequests.length) {
      setSelectedRequestId(null)
      return
    }

    if (
      selectedRequestId === null ||
      !filteredRequests.some((request) => request.id === selectedRequestId)
    ) {
      setSelectedRequestId(filteredRequests[0].id)
    }
  }, [filteredRequests, selectedRequestId])

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) || null,
    [requests, selectedRequestId]
  )

  const selectedProperty = useMemo(
    () => (selectedRequest?.property_id ? propertyById.get(selectedRequest.property_id) ?? null : null),
    [propertyById, selectedRequest?.property_id]
  )

  const selectedCase = useMemo(
    () => (selectedRequest?.case_id ? caseById.get(selectedRequest.case_id) ?? null : null),
    [caseById, selectedRequest?.case_id]
  )

  const selectedReporter = useMemo(
    () =>
      selectedRequest?.reported_by_contact_id
        ? contactById.get(selectedRequest.reported_by_contact_id) ?? null
        : null,
    [contactById, selectedRequest?.reported_by_contact_id]
  )

  const selectedContractor = useMemo(
    () =>
      selectedRequest?.contractor_id ? contractorById.get(selectedRequest.contractor_id) ?? null : null,
    [contractorById, selectedRequest?.contractor_id]
  )

  const selectedQuotes = useMemo(
    () => (selectedRequest ? quotesByRequestId.get(selectedRequest.id) ?? [] : []),
    [quotesByRequestId, selectedRequest]
  )

  const kpis = useMemo(
    () => ({
      total: requests.length,
      open: requests.filter((request) => isOpenMaintenance(request.status)).length,
      approval: requests.filter((request) => needsApproval(request)).length,
      scheduled: requests.filter((request) => isScheduledMaintenance(request.status, request.scheduled_for)).length,
      completed: requests.filter((request) => request.status === 'completed').length,
      withQuotes: requests.filter((request) => (quotesByRequestId.get(request.id) ?? []).length > 0).length,
    }),
    [quotesByRequestId, requests]
  )

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading operator session...
          </div>
        </div>
      </main>
    )
  }

  if (!operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Redirecting to sign in...
          </div>
        </div>
      </main>
    )
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
                  href="/records"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Contact records
                </Link>
                <Link
                  href="/records/properties"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Property workspace
                </Link>
                <Link
                  href="/records/compliance"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Compliance workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Maintenance Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Run property maintenance as an operator workflow
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This brings maintenance into the portal as its own queue: request status, landlord
                approval, scheduling, contractors, and quotes, all tied back to the property and
                case context.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  {
                    label: 'All requests',
                    value: kpis.total,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                  },
                  {
                    label: 'Open',
                    value: kpis.open,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                  },
                  {
                    label: 'Awaiting approval',
                    value: kpis.approval,
                    tone: 'border-red-200 bg-red-50 text-red-900',
                  },
                  {
                    label: 'Scheduled',
                    value: kpis.scheduled,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                  },
                  {
                    label: 'Completed',
                    value: kpis.completed,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  },
                  {
                    label: 'With quotes',
                    value: kpis.withQuotes,
                    tone: 'border-violet-200 bg-violet-50 text-violet-900',
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
                Use the maintenance layer when one repair needs landlord sign-off, contractor quotes,
                and proper follow-through instead of just message replies.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Prioritise urgent or approval-blocked jobs first.</li>
                  <li>Use the property and case context before assigning a contractor.</li>
                  <li>Compare quote activity before moving a job into approval or scheduling.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Maintenance tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the jobs that need action</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredRequests.length} shown of {requests.length} requests
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Maintenance workspace tabs">
              {[
                ['all', 'All requests'],
                ['open', 'Open'],
                ['approval', 'Awaiting approval'],
                ['scheduled', 'Scheduled'],
                ['completed', 'Completed'],
                ['quotes', 'With quotes'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as MaintenanceTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search maintenance</span>
              <input
                type="text"
                placeholder="Search by address, issue, description, reporter, trade, or contractor"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading maintenance workspace...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Maintenance queue</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a request</h2>
                <p className="mt-1 text-sm text-stone-600">
                  See which jobs are still open, blocked by approval, scheduled, quoted, or done.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredRequests.map((request) => {
                  const selected = request.id === selectedRequestId
                  const property = request.property_id ? propertyById.get(request.property_id) ?? null : null
                  const reporter = request.reported_by_contact_id
                    ? contactById.get(request.reported_by_contact_id) ?? null
                    : null
                  const contractor = request.contractor_id ? contractorById.get(request.contractor_id) ?? null : null
                  const requestQuotes = quotesByRequestId.get(request.id) ?? []

                  return (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequestId(request.id)}
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
                            <span className="text-base font-semibold">
                              {formatLabel(request.issue_type)}{request.subcategory ? ` • ${formatLabel(request.subcategory)}` : ''}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(request.status)}`}>
                              {formatLabel(request.status)}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityTone(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {request.description || 'No maintenance description yet.'}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(request.updated_at ?? request.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {buildAddress(property)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {getContactName(reporter)}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {contractor?.company_name || contractor?.primary_trade || 'No contractor'}
                        </span>
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <span>{requestQuotes.length} quote{requestQuotes.length === 1 ? '' : 's'}</span>
                          <span>{request.landlord_approval_required ? 'Needs approval' : 'Approval clear'}</span>
                          <span>{request.scheduled_for ? `Scheduled ${formatDateTime(request.scheduled_for)}` : 'Not scheduled'}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredRequests.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No maintenance requests match the current filters yet.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedRequest ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a maintenance request from the left to inspect the job, property, quotes,
                  and case context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected request</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">
                          {formatLabel(selectedRequest.issue_type)}{selectedRequest.subcategory ? ` • ${formatLabel(selectedRequest.subcategory)}` : ''}
                        </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusTone(selectedRequest.status)}`}>
                          {formatLabel(selectedRequest.status)}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(selectedRequest.priority)}`}>
                          {selectedRequest.priority}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedRequest.description || 'No maintenance description is stored for this job yet.'}
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
                            Reporter
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{getContactName(selectedReporter)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Contractor
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {selectedContractor?.company_name || selectedContractor?.primary_trade || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`rounded-[1.5rem] border p-4 ${
                          needsApproval(selectedRequest)
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : selectedRequest.scheduled_for
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : 'border-stone-200 bg-stone-50 text-stone-700'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Job posture</p>
                        <p className="mt-2 text-lg font-semibold">
                          {needsApproval(selectedRequest)
                            ? 'Waiting on landlord approval'
                            : selectedRequest.scheduled_for
                              ? 'Scheduled or moving'
                              : 'Needs next step'}
                        </p>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                          {needsApproval(selectedRequest)
                            ? 'This repair is blocked until the approval decision is clear.'
                            : selectedRequest.scheduled_for
                              ? `Scheduled for ${formatDateTime(selectedRequest.scheduled_for)}.`
                            : 'Set the contractor, quote path, or schedule so this repair keeps moving.'}
                        </p>
                      </div>

                      {selectedCase ? (
                        <Link
                          href={`/cases/${selectedCase.id}`}
                          className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                        >
                          Open linked case
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

                      {selectedContractor && (
                        <Link
                          href="/records/contractors"
                          className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                        >
                          Open contractor workspace
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Request snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Created</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedRequest.created_at)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Scheduled</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedRequest.scheduled_for)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Completed</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedRequest.completed_at)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Estimated cost</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatMoney(selectedRequest.estimated_cost)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Final cost</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatMoney(selectedRequest.final_cost)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Approval</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedRequest.landlord_approval_required ? 'Required' : 'Not flagged'}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Access notes</p>
                        <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4 text-sm leading-7 text-stone-700">
                          {selectedRequest.access_notes || 'No access notes stored yet for this repair.'}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Linked case</p>
                            <h3 className="mt-2 text-xl font-semibold">Case context for this repair</h3>
                          </div>
                        </div>

                        <div className="mt-5">
                          {!selectedCase ? (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No case is linked to this maintenance request yet.
                            </div>
                          ) : (
                            <article className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/cases/${selectedCase.id}`}
                                    className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
                                  >
                                    {selectedCase.case_number || selectedCase.id}
                                  </Link>
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(selectedCase.priority || 'low')}`}>
                                    {selectedCase.priority || 'unknown'}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">{selectedCase.status || 'unknown'}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                {selectedCase.summary || 'No case summary yet.'}
                              </p>
                            </article>
                          )}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Quotes</p>
                            <h3 className="mt-2 text-xl font-semibold">Contractor pricing and files</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedQuotes.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No quotes are linked to this request yet.
                            </div>
                          )}

                          {selectedQuotes.map((quote) => {
                            const quoteContractor = contractorById.get(quote.contractor_id) ?? null

                            return (
                              <article key={quote.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getQuoteTone(quote.quote_status)}`}>
                                      {formatLabel(quote.quote_status)}
                                    </span>
                                    <span className="text-sm font-medium text-stone-900">
                                      {quoteContractor?.company_name || quoteContractor?.primary_trade || 'Unknown contractor'}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-stone-900">
                                    {formatMoney(quote.quote_amount)}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-stone-700">
                                  {quote.quote_notes || 'No quote notes stored.'}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                  <span>Submitted {formatDateTime(quote.submitted_at)}</span>
                                  {quote.file_url && (
                                    <a
                                      href={quote.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-medium text-stone-700 underline-offset-4 hover:underline"
                                    >
                                      Open quote file
                                    </a>
                                  )}
                                </div>
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
