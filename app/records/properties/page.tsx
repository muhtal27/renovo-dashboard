'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type PropertyTab = 'all' | 'active_tenancy' | 'maintenance' | 'compliance' | 'vacant'
type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'

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
  country: string | null
  landlord_contact_id: string | null
  property_type: string | null
  bedroom_count: number | null
  bathroom_count: number | null
  furnishing_status: string | null
  management_type: string | null
  is_active: boolean
  created_at: string | null
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
  updated_at: string | null
}

type CaseRow = {
  id: string
  property_id: string | null
  contact_id: string | null
  case_number: string | null
  summary: string | null
  status: string | null
  priority: string | null
  next_action_at: string | null
  waiting_on: WaitingOn | null
  waiting_reason: string | null
  last_activity_at: string | null
  updated_at: string | null
}

type MaintenanceRequestRow = {
  id: number
  case_id: string | null
  property_id: string | null
  tenancy_id: string | null
  reported_by_contact_id: string | null
  issue_type: string | null
  subcategory: string | null
  description: string | null
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

type ComplianceRecordRow = {
  id: string
  property_id: string
  record_type: string
  status: string
  issue_date: string | null
  expiry_date: string | null
  reference_number: string | null
  updated_at: string | null
}

type ViewingRequestRow = {
  id: number
  case_id: string | null
  property_id: string | null
  applicant_contact_id: string | null
  requested_date: string | null
  status: string
  booked_slot: string | null
  updated_at: string | null
}

type PropertyStats = {
  cases: number
  maintenance: number
  compliance: number
  tenancies: number
  viewings: number
}

const WAITING_ON_LABELS: Record<WaitingOn, string> = {
  none: 'No wait',
  tenant: 'Waiting on tenant',
  landlord: 'Waiting on landlord',
  contractor: 'Waiting on contractor',
  internal: 'Waiting internally',
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

function buildAddress(property: Pick<PropertyRow, 'address_line_1' | 'address_line_2' | 'city' | 'postcode'>) {
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.phone || contact.email || 'Unknown'
}

function getPropertyState(
  property: PropertyRow,
  activeTenancy: TenancyRow | null,
  liveMaintenanceCount: number,
  complianceRiskCount: number
) {
  if (!property.is_active) {
    return {
      label: 'Inactive property',
      detail: 'This property is marked inactive in the record.',
      className: 'border-stone-300 bg-stone-100 text-stone-700',
    }
  }

  if (complianceRiskCount > 0) {
    return {
      label: 'Compliance attention',
      detail: `${complianceRiskCount} record${complianceRiskCount === 1 ? '' : 's'} need attention.`,
      className: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  if (liveMaintenanceCount > 0) {
    return {
      label: 'Maintenance live',
      detail: `${liveMaintenanceCount} open maintenance item${liveMaintenanceCount === 1 ? '' : 's'} running now.`,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    }
  }

  if (activeTenancy) {
    return {
      label: 'Occupied',
      detail: `Active tenancy from ${formatDate(activeTenancy.start_date)}.`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  return {
    label: 'Vacant / no active tenancy',
    detail: 'No active tenancy is linked right now.',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  }
}

function getCaseNextStepSummary(item: Pick<CaseRow, 'next_action_at' | 'waiting_on' | 'waiting_reason'>) {
  const waitingOn = item.waiting_on && item.waiting_on !== 'none' ? WAITING_ON_LABELS[item.waiting_on] : null
  const waitingReason = item.waiting_reason?.trim() || null

  if (item.next_action_at) {
    return `Next step ${formatDateTime(item.next_action_at)}${waitingOn ? ` • ${waitingOn.toLowerCase()}` : ''}`
  }

  if (waitingOn) {
    return waitingReason ? `${waitingOn} • ${waitingReason}` : waitingOn
  }

  return 'No next step set'
}

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getComplianceTone(value: string) {
  if (value === 'expired' || value === 'missing') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'expiring' || value === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function getMaintenanceTone(value: string) {
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value === 'cancelled') return 'border-stone-200 bg-stone-50 text-stone-700'
  if (value === 'reported' || value === 'triaged' || value === 'quote_requested' || value === 'awaiting_approval') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

export default function PropertyRecordsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestRow[]>([])
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecordRow[]>([])
  const [viewingRequests, setViewingRequests] = useState<ViewingRequestRow[]>([])

  const [tab, setTab] = useState<PropertyTab>('all')
  const [search, setSearch] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return

    setLoading(true)
    setError(null)

    const [
      contactsResponse,
      propertiesResponse,
      tenanciesResponse,
      casesResponse,
      maintenanceResponse,
      complianceResponse,
      viewingsResponse,
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, full_name, phone, email, company_name')
        .order('updated_at', { ascending: false }),
      supabase
        .from('properties')
        .select(
          'id, address_line_1, address_line_2, city, postcode, country, landlord_contact_id, property_type, bedroom_count, bathroom_count, furnishing_status, management_type, is_active, created_at, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('tenancies')
        .select(
          'id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, deposit_scheme_name, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('cases')
        .select(
          'id, property_id, contact_id, case_number, summary, status, priority, next_action_at, waiting_on, waiting_reason, last_activity_at, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(600),
      supabase
        .from('maintenance_requests')
        .select(
          'id, case_id, property_id, tenancy_id, reported_by_contact_id, issue_type, subcategory, description, priority, status, contractor_id, scheduled_for, completed_at, landlord_approval_required, estimated_cost, final_cost, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(600),
      supabase
        .from('compliance_records')
        .select(
          'id, property_id, record_type, status, issue_date, expiry_date, reference_number, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(600),
      supabase
        .from('viewing_requests')
        .select(
          'id, case_id, property_id, applicant_contact_id, requested_date, status, booked_slot, updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(600),
    ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      casesResponse.error,
      maintenanceResponse.error,
      complianceResponse.error,
      viewingsResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setMaintenanceRequests((maintenanceResponse.data || []) as MaintenanceRequestRow[])
    setComplianceRecords((complianceResponse.data || []) as ComplianceRecordRow[])
    setViewingRequests((viewingsResponse.data || []) as ViewingRequestRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])

  const activeTenancyByPropertyId = useMemo(() => {
    const map = new Map<string, TenancyRow>()

    const candidates = tenancies
      .filter((tenancy) => tenancy.property_id)
      .sort((left, right) => {
        const leftRank = left.tenancy_status === 'active' || left.status === 'active' ? 0 : 1
        const rightRank = right.tenancy_status === 'active' || right.status === 'active' ? 0 : 1
        if (leftRank !== rightRank) return leftRank - rightRank

        const leftDate = new Date(left.start_date ?? left.updated_at ?? 0).getTime()
        const rightDate = new Date(right.start_date ?? right.updated_at ?? 0).getTime()
        return rightDate - leftDate
      })

    for (const tenancy of candidates) {
      if (!tenancy.property_id || map.has(tenancy.property_id)) continue
      if (tenancy.tenancy_status === 'active' || tenancy.status === 'active') {
        map.set(tenancy.property_id, tenancy)
      }
    }

    return map
  }, [tenancies])

  const propertyStatsById = useMemo(() => {
    const stats = new Map<string, PropertyStats>()

    const getStats = (propertyId: string) =>
      stats.get(propertyId) || {
        cases: 0,
        maintenance: 0,
        compliance: 0,
        tenancies: 0,
        viewings: 0,
      }

    for (const property of properties) {
      stats.set(property.id, getStats(property.id))
    }

    for (const tenancy of tenancies) {
      if (!tenancy.property_id) continue
      const next = getStats(tenancy.property_id)
      next.tenancies += 1
      stats.set(tenancy.property_id, next)
    }

    for (const caseItem of cases) {
      if (!caseItem.property_id) continue
      const next = getStats(caseItem.property_id)
      next.cases += 1
      stats.set(caseItem.property_id, next)
    }

    for (const request of maintenanceRequests) {
      if (!request.property_id) continue
      const next = getStats(request.property_id)
      next.maintenance += 1
      stats.set(request.property_id, next)
    }

    for (const record of complianceRecords) {
      const next = getStats(record.property_id)
      next.compliance += 1
      stats.set(record.property_id, next)
    }

    for (const viewing of viewingRequests) {
      if (!viewing.property_id) continue
      const next = getStats(viewing.property_id)
      next.viewings += 1
      stats.set(viewing.property_id, next)
    }

    return stats
  }, [cases, complianceRecords, maintenanceRequests, properties, tenancies, viewingRequests])

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase()

    return properties
      .filter((property) => {
        const landlord = property.landlord_contact_id
          ? contactById.get(property.landlord_contact_id) ?? null
          : null
        const activeTenancy = activeTenancyByPropertyId.get(property.id) ?? null
        const liveMaintenance = maintenanceRequests.filter(
          (request) =>
            request.property_id === property.id &&
            !['completed', 'cancelled'].includes(request.status)
        ).length
        const complianceRisk = complianceRecords.filter(
          (record) =>
            record.property_id === property.id &&
            ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
        ).length

        const matchesTab =
          tab === 'all' ||
          (tab === 'active_tenancy' && !!activeTenancy) ||
          (tab === 'maintenance' && liveMaintenance > 0) ||
          (tab === 'compliance' && complianceRisk > 0) ||
          (tab === 'vacant' && !activeTenancy)

        const matchesSearch =
          query === '' ||
          buildAddress(property).toLowerCase().includes(query) ||
          property.postcode?.toLowerCase().includes(query) ||
          property.city?.toLowerCase().includes(query) ||
          property.property_type?.toLowerCase().includes(query) ||
          property.management_type?.toLowerCase().includes(query) ||
          getContactName(landlord).toLowerCase().includes(query)

        return matchesTab && matchesSearch
      })
      .sort((left, right) => {
        const leftUpdated = new Date(left.updated_at ?? left.created_at ?? 0).getTime()
        const rightUpdated = new Date(right.updated_at ?? right.created_at ?? 0).getTime()
        return rightUpdated - leftUpdated
      })
  }, [activeTenancyByPropertyId, complianceRecords, contactById, maintenanceRequests, properties, search, tab])

  const selectedProperty = useMemo(
    () => {
      if (!filteredProperties.length) return null

      const effectiveSelectedPropertyId =
        selectedPropertyId && filteredProperties.some((property) => property.id === selectedPropertyId)
          ? selectedPropertyId
          : filteredProperties[0].id

      return properties.find((property) => property.id === effectiveSelectedPropertyId) || null
    },
    [filteredProperties, properties, selectedPropertyId]
  )

  const selectedLandlord = useMemo(
    () =>
      selectedProperty?.landlord_contact_id
        ? contactById.get(selectedProperty.landlord_contact_id) ?? null
        : null,
    [contactById, selectedProperty]
  )

  const selectedActiveTenancy = useMemo(
    () => (selectedProperty ? activeTenancyByPropertyId.get(selectedProperty.id) ?? null : null),
    [activeTenancyByPropertyId, selectedProperty]
  )

  const selectedTenancyContacts = useMemo(() => {
    if (!selectedActiveTenancy) return { tenant: null as ContactRow | null, landlord: null as ContactRow | null }

    return {
      tenant: selectedActiveTenancy.tenant_contact_id
        ? contactById.get(selectedActiveTenancy.tenant_contact_id) ?? null
        : null,
      landlord: selectedActiveTenancy.landlord_contact_id
        ? contactById.get(selectedActiveTenancy.landlord_contact_id) ?? null
        : null,
    }
  }, [contactById, selectedActiveTenancy])

  const selectedCases = useMemo(
    () => (selectedProperty ? cases.filter((caseItem) => caseItem.property_id === selectedProperty.id) : []),
    [cases, selectedProperty]
  )

  const selectedMaintenance = useMemo(
    () =>
      selectedProperty
        ? maintenanceRequests.filter((request) => request.property_id === selectedProperty.id)
        : [],
    [maintenanceRequests, selectedProperty]
  )

  const selectedCompliance = useMemo(
    () =>
      selectedProperty
        ? complianceRecords.filter((record) => record.property_id === selectedProperty.id)
        : [],
    [complianceRecords, selectedProperty]
  )

  const selectedViewings = useMemo(
    () =>
      selectedProperty
        ? viewingRequests.filter((request) => request.property_id === selectedProperty.id)
        : [],
    [selectedProperty, viewingRequests]
  )

  const propertyKpis = useMemo(
    () => ({
      total: properties.length,
      activeTenancy: properties.filter((property) => activeTenancyByPropertyId.has(property.id)).length,
      maintenance: properties.filter((property) =>
        maintenanceRequests.some(
          (request) =>
            request.property_id === property.id && !['completed', 'cancelled'].includes(request.status)
        )
      ).length,
      compliance: properties.filter((property) =>
        complianceRecords.some(
          (record) =>
            record.property_id === property.id &&
            ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
        )
      ).length,
      vacant: properties.filter((property) => !activeTenancyByPropertyId.has(property.id)).length,
    }),
    [activeTenancyByPropertyId, complianceRecords, maintenanceRequests, properties]
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
                  href="/records"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Contact records
                </Link>
                <Link
                  href="/calls"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Calls inbox
                </Link>
                <Link
                  href="/records/maintenance"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Maintenance workspace
                </Link>
                <Link
                  href="/records/compliance"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Compliance workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Property Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Open the property record behind the work
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This view turns the property schema into an operator workspace: landlord context,
                active tenancy, maintenance, compliance, viewing demand, and property-linked cases
                in one place.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: 'All properties',
                    value: propertyKpis.total,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                  },
                  {
                    label: 'Active tenancy',
                    value: propertyKpis.activeTenancy,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  },
                  {
                    label: 'Maintenance live',
                    value: propertyKpis.maintenance,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                  },
                  {
                    label: 'Compliance risk',
                    value: propertyKpis.compliance,
                    tone: 'border-red-200 bg-red-50 text-red-900',
                  },
                  {
                    label: 'Vacant',
                    value: propertyKpis.vacant,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
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
                Use the property layer when one address is generating multiple cases, calls, or
                compliance questions.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Check who owns and occupies the property before replying.</li>
                  <li>Review maintenance and compliance together, not in isolation.</li>
                  <li>Use the related case list to avoid repeating the same work across addresses.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Property tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the addresses that need attention</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredProperties.length} shown of {properties.length} properties
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Property workspace tabs">
              {[
                ['all', 'All properties'],
                ['active_tenancy', 'Active tenancy'],
                ['maintenance', 'Maintenance live'],
                ['compliance', 'Compliance risk'],
                ['vacant', 'Vacant'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as PropertyTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search properties</span>
              <input
                type="text"
                placeholder="Search by address, postcode, city, landlord, type, or management style"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading property workspace...
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
                <p className="app-kicker">Property records</p>
                <h2 className="mt-2 text-xl font-semibold">Choose an address</h2>
                <p className="mt-1 text-sm text-stone-600">
                  See occupancy, landlord context, maintenance, compliance, and linked cases for the
                  address itself.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredProperties.map((property) => {
                  const selected = property.id === selectedPropertyId
                  const activeTenancy = activeTenancyByPropertyId.get(property.id) ?? null
                  const landlord = property.landlord_contact_id
                    ? contactById.get(property.landlord_contact_id) ?? null
                    : null
                  const propertyMaintenanceCount = maintenanceRequests.filter(
                    (request) =>
                      request.property_id === property.id &&
                      !['completed', 'cancelled'].includes(request.status)
                  ).length
                  const propertyComplianceRiskCount = complianceRecords.filter(
                    (record) =>
                      record.property_id === property.id &&
                      ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
                  ).length
                  const propertyState = getPropertyState(
                    property,
                    activeTenancy,
                    propertyMaintenanceCount,
                    propertyComplianceRiskCount
                  )
                  const stats = propertyStatsById.get(property.id) || {
                    cases: 0,
                    maintenance: 0,
                    compliance: 0,
                    tenancies: 0,
                    viewings: 0,
                  }

                  return (
                    <button
                      key={property.id}
                      onClick={() => setSelectedPropertyId(property.id)}
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
                            <span className="text-base font-semibold">{buildAddress(property)}</span>
                            {!property.is_active && (
                              <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                inactive
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {getContactName(landlord)} • {formatLabel(property.property_type)} • {formatLabel(property.management_type)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(property.updated_at ?? property.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 rounded-2xl border px-3 py-2 text-xs ${propertyState.className}`}>
                        <div className="font-medium">{propertyState.label}</div>
                        <div className="mt-1 opacity-80">{propertyState.detail}</div>
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                          <span>{stats.cases} cases</span>
                          <span>{stats.maintenance} maintenance</span>
                          <span>{stats.compliance} compliance</span>
                          <span>{stats.tenancies} tenancies</span>
                          <span>{stats.viewings} viewings</span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredProperties.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No properties match the current filters. Try widening the search or changing
                    tabs.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedProperty ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a property from the left to inspect occupancy, maintenance, compliance,
                  and linked cases.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected property</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{buildAddress(selectedProperty)}</h2>
                        {!selectedProperty.is_active && (
                          <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                            inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedLandlord
                          ? `Landlord: ${getContactName(selectedLandlord)}.`
                          : 'No landlord contact is linked to this property yet.'}{' '}
                        {selectedActiveTenancy
                          ? `Active tenancy from ${formatDate(selectedActiveTenancy.start_date)}.`
                          : 'No active tenancy is linked right now.'}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Landlord
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{getContactName(selectedLandlord)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Type / management
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {formatLabel(selectedProperty.property_type)} • {formatLabel(selectedProperty.management_type)}
                          </p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Beds / baths
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {selectedProperty.bedroom_count ?? '-'} bed • {selectedProperty.bathroom_count ?? '-'} bath
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`rounded-[1.5rem] border p-4 ${
                          getPropertyState(
                            selectedProperty,
                            selectedActiveTenancy,
                            selectedMaintenance.filter(
                              (request) => !['completed', 'cancelled'].includes(request.status)
                            ).length,
                            selectedCompliance.filter((record) =>
                              ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
                            ).length
                          ).className
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Property posture</p>
                        <p className="mt-2 text-lg font-semibold">
                          {
                            getPropertyState(
                              selectedProperty,
                              selectedActiveTenancy,
                              selectedMaintenance.filter(
                                (request) => !['completed', 'cancelled'].includes(request.status)
                              ).length,
                              selectedCompliance.filter((record) =>
                                ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
                              ).length
                            ).label
                          }
                        </p>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                          {
                            getPropertyState(
                              selectedProperty,
                              selectedActiveTenancy,
                              selectedMaintenance.filter(
                                (request) => !['completed', 'cancelled'].includes(request.status)
                              ).length,
                              selectedCompliance.filter((record) =>
                                ['expired', 'expiring', 'missing', 'pending'].includes(record.status)
                              ).length
                            ).detail
                          }
                        </p>
                      </div>

                      <Link
                        href="/records"
                        className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open people records
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Property snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Postcode</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedProperty.postcode || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Country</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedProperty.country || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Furnishing</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatLabel(selectedProperty.furnishing_status)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Created</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedProperty.created_at)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedProperty.updated_at)}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Active tenancy</p>
                        {!selectedActiveTenancy ? (
                          <div className="mt-4 app-empty-state rounded-[1.4rem] p-4 text-sm">
                            No active tenancy is linked right now.
                          </div>
                        ) : (
                          <div className="mt-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                            <p className="text-sm font-medium text-stone-900">
                              Tenant: {getContactName(selectedTenancyContacts.tenant)}
                            </p>
                            <p className="mt-2 text-sm text-stone-700">
                              Start {formatDate(selectedActiveTenancy.start_date)} • Rent {formatMoney(selectedActiveTenancy.rent_amount)}
                            </p>
                            <p className="mt-2 text-sm text-stone-700">
                              Deposit {formatMoney(selectedActiveTenancy.deposit_amount)} • {selectedActiveTenancy.deposit_scheme_name || 'No scheme noted'}
                            </p>
                          </div>
                        )}
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Related cases</p>
                            <h3 className="mt-2 text-xl font-semibold">Cases tied to this address</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCases.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No cases are linked to this property yet.
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
                                  {formatRelativeTime(caseItem.last_activity_at ?? caseItem.updated_at)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                {caseItem.summary || 'No case summary yet.'}
                              </p>
                              <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs text-stone-700">
                                {getCaseNextStepSummary(caseItem)}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Maintenance</p>
                            <h3 className="mt-2 text-xl font-semibold">Work orders on this property</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedMaintenance.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No maintenance requests are linked yet.
                            </div>
                          )}

                          {selectedMaintenance.slice(0, 6).map((request) => (
                            <article key={request.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getMaintenanceTone(request.status)}`}>
                                    {formatLabel(request.status)}
                                  </span>
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityTone(request.priority)}`}>
                                    {request.priority}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">
                                  {formatRelativeTime(request.updated_at)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-medium text-stone-900">
                                {formatLabel(request.issue_type)}{request.subcategory ? ` • ${formatLabel(request.subcategory)}` : ''}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-stone-700">
                                {request.description || 'No maintenance description yet.'}
                              </p>
                              <p className="mt-3 text-xs text-stone-500">
                                {request.scheduled_for ? `Scheduled ${formatDateTime(request.scheduled_for)} • ` : ''}
                                {request.landlord_approval_required ? 'Landlord approval required' : 'No landlord approval flagged'}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Compliance</p>
                            <h3 className="mt-2 text-xl font-semibold">Certificates and statutory records</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCompliance.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No compliance records are linked to this property yet.
                            </div>
                          )}

                          {selectedCompliance.slice(0, 6).map((record) => (
                            <article key={record.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getComplianceTone(record.status)}`}>
                                    {formatLabel(record.status)}
                                  </span>
                                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                                    {formatLabel(record.record_type)}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">
                                  {record.expiry_date ? `Expires ${formatDate(record.expiry_date)}` : 'No expiry date'}
                                </span>
                              </div>
                              <p className="mt-3 text-sm text-stone-700">
                                Reference: {record.reference_number || 'No reference number'}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Viewings</p>
                            <h3 className="mt-2 text-xl font-semibold">Demand and booking activity</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedViewings.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No viewing requests are linked to this property yet.
                            </div>
                          )}

                          {selectedViewings.slice(0, 6).map((request) => (
                            <article key={request.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                                    {formatLabel(request.status)}
                                  </span>
                                  <span className="text-xs text-stone-500">
                                    Applicant {getContactName(request.applicant_contact_id ? contactById.get(request.applicant_contact_id) ?? null : null)}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">
                                  {request.booked_slot
                                    ? `Booked ${formatDateTime(request.booked_slot)}`
                                    : request.requested_date
                                      ? `Requested ${formatDateTime(request.requested_date)}`
                                      : 'No requested slot'}
                                </span>
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
