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

type RecordTab = 'all' | 'tenant' | 'landlord' | 'contractor' | 'applicant'
type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  role: string | null
  company_name: string | null
  contact_type: string | null
  notes: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  summary: string | null
  status: string | null
  priority: string | null
  contact_id: string | null
  property_id: string | null
  next_action_at: string | null
  waiting_on: WaitingOn | null
  waiting_reason: string | null
  created_at: string | null
  updated_at: string | null
  last_activity_at: string | null
}

type CallRow = {
  id: string
  contact_id: string | null
  case_id: string | null
  status: string | null
  intent: string | null
  ai_summary: string | null
  caller_phone: string | null
  last_event_at: string | null
  started_at: string | null
  ended_at: string | null
  needs_operator_review: boolean | null
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  landlord_contact_id: string | null
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
  updated_at: string | null
}

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string
  coverage_area: string | null
  emergency_callout: boolean
  is_active: boolean
  updated_at: string | null
}

type ContactMethodRow = {
  id: string
  contact_id: string
  method_type: string
  method_value: string
  is_primary: boolean
  created_at: string | null
}

type ContactStats = {
  cases: number
  calls: number
  properties: number
  tenancies: number
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

function formatShortDate(value: string | null) {
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

function formatCategoryLabel(value: string | null) {
  if (!value) return 'General contact'
  return value.replace(/_/g, ' ')
}

function buildAddress(property: Pick<PropertyRow, 'address_line_1' | 'address_line_2' | 'city' | 'postcode'>) {
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
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

function getCallStatusTone(value: string | null) {
  if (value === 'in_progress' || value === 'ringing' || value === 'initiated') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (value === 'completed') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (value === 'failed' || value === 'abandoned') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'voicemail') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getContactName(contact: ContactRow) {
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.phone || 'Unknown contact'
}

function getRoleSignals(contact: ContactRow) {
  return `${contact.role || ''} ${contact.contact_type || ''} ${contact.company_name || ''}`.toLowerCase()
}

function getContactBuckets(
  contact: ContactRow,
  context: {
    contractorIds: Set<string>
    tenantIds: Set<string>
    landlordIds: Set<string>
  }
) {
  const signals = getRoleSignals(contact)
  const buckets = new Set<RecordTab>(['all'])

  if (
    context.tenantIds.has(contact.id) ||
    signals.includes('tenant') ||
    signals.includes('resident')
  ) {
    buckets.add('tenant')
  }

  if (
    context.landlordIds.has(contact.id) ||
    signals.includes('landlord') ||
    signals.includes('owner')
  ) {
    buckets.add('landlord')
  }

  if (
    context.contractorIds.has(contact.id) ||
    signals.includes('contractor') ||
    signals.includes('trade') ||
    signals.includes('engineer')
  ) {
    buckets.add('contractor')
  }

  if (signals.includes('applicant') || signals.includes('viewer') || signals.includes('prospect')) {
    buckets.add('applicant')
  }

  return Array.from(buckets)
}

export default function RecordsPage() {
  const router = useRouter()

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [calls, setCalls] = useState<CallRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [contractors, setContractors] = useState<ContractorRow[]>([])
  const [contactMethods, setContactMethods] = useState<ContactMethodRow[]>([])

  const [tab, setTab] = useState<RecordTab>('all')
  const [search, setSearch] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

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
      casesResponse,
      callsResponse,
      propertiesResponse,
      tenanciesResponse,
      contractorsResponse,
      contactMethodsResponse,
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select(
          'id, full_name, phone, email, role, company_name, contact_type, notes, is_active, created_at, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('cases')
        .select(
          'id, case_number, summary, status, priority, contact_id, property_id, next_action_at, waiting_on, waiting_reason, created_at, updated_at, last_activity_at'
        )
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase
        .from('call_sessions')
        .select(
          'id, contact_id, case_id, status, intent, ai_summary, caller_phone, last_event_at, started_at, ended_at, needs_operator_review'
        )
        .order('last_event_at', { ascending: false })
        .limit(500),
      supabase
        .from('properties')
        .select('id, address_line_1, address_line_2, city, postcode, landlord_contact_id, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('tenancies')
        .select(
          'id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('contractors')
        .select(
          'id, contact_id, company_name, primary_trade, coverage_area, emergency_callout, is_active, updated_at'
        )
        .order('updated_at', { ascending: false }),
      supabase
        .from('contact_methods')
        .select('id, contact_id, method_type, method_value, is_primary, created_at')
        .order('created_at', { ascending: false }),
    ])

    const firstError = [
      contactsResponse.error,
      casesResponse.error,
      callsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      contractorsResponse.error,
      contactMethodsResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setCalls((callsResponse.data || []) as CallRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setContractors((contractorsResponse.data || []) as ContractorRow[])
    setContactMethods((contactMethodsResponse.data || []) as ContactMethodRow[])
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

  const contractorByContactId = useMemo(
    () => new Map(contractors.map((contractor) => [contractor.contact_id, contractor])),
    [contractors]
  )

  const tenantIds = useMemo(
    () => new Set(tenancies.map((tenancy) => tenancy.tenant_contact_id).filter(Boolean) as string[]),
    [tenancies]
  )

  const landlordIds = useMemo(() => {
    const ids = new Set<string>()

    for (const property of properties) {
      if (property.landlord_contact_id) ids.add(property.landlord_contact_id)
    }

    for (const tenancy of tenancies) {
      if (tenancy.landlord_contact_id) ids.add(tenancy.landlord_contact_id)
    }

    return ids
  }, [properties, tenancies])

  const contactBucketsById = useMemo(() => {
    const buckets = new Map<string, RecordTab[]>()

    for (const contact of contacts) {
      buckets.set(
        contact.id,
        getContactBuckets(contact, {
          contractorIds: new Set(contractors.map((contractor) => contractor.contact_id)),
          tenantIds,
          landlordIds,
        })
      )
    }

    return buckets
  }, [contacts, contractors, landlordIds, tenantIds])

  const propertyIdsByContactId = useMemo(() => {
    const map = new Map<string, Set<string>>()

    const add = (contactId: string | null, propertyId: string | null) => {
      if (!contactId || !propertyId) return
      const existing = map.get(contactId) ?? new Set<string>()
      existing.add(propertyId)
      map.set(contactId, existing)
    }

    for (const property of properties) add(property.landlord_contact_id, property.id)
    for (const tenancy of tenancies) {
      add(tenancy.tenant_contact_id, tenancy.property_id)
      add(tenancy.landlord_contact_id, tenancy.property_id)
    }

    return map
  }, [properties, tenancies])

  const contactStatsById = useMemo(() => {
    const stats = new Map<string, ContactStats>()

    const getStats = (contactId: string) =>
      stats.get(contactId) || {
        cases: 0,
        calls: 0,
        properties: 0,
        tenancies: 0,
      }

    for (const contact of contacts) {
      stats.set(contact.id, getStats(contact.id))
    }

    for (const call of calls) {
      if (!call.contact_id) continue
      const next = getStats(call.contact_id)
      next.calls += 1
      stats.set(call.contact_id, next)
    }

    for (const tenancy of tenancies) {
      if (tenancy.tenant_contact_id) {
        const next = getStats(tenancy.tenant_contact_id)
        next.tenancies += 1
        stats.set(tenancy.tenant_contact_id, next)
      }
      if (tenancy.landlord_contact_id) {
        const next = getStats(tenancy.landlord_contact_id)
        next.tenancies += 1
        stats.set(tenancy.landlord_contact_id, next)
      }
    }

    for (const property of properties) {
      if (!property.landlord_contact_id) continue
      const next = getStats(property.landlord_contact_id)
      next.properties += 1
      stats.set(property.landlord_contact_id, next)
    }

    for (const caseItem of cases) {
      const touched = new Set<string>()

      if (caseItem.contact_id) touched.add(caseItem.contact_id)

      if (caseItem.property_id) {
        for (const [contactId, propertyIds] of propertyIdsByContactId.entries()) {
          if (propertyIds.has(caseItem.property_id)) touched.add(contactId)
        }
      }

      for (const contactId of touched) {
        const next = getStats(contactId)
        next.cases += 1
        stats.set(contactId, next)
      }
    }

    return stats
  }, [calls, cases, contacts, properties, propertyIdsByContactId, tenancies])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return contacts
      .filter((contact) => {
        const buckets = contactBucketsById.get(contact.id) || ['all']
        const matchesTab = tab === 'all' || buckets.includes(tab)
        const matchesSearch =
          query === '' ||
          getContactName(contact).toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.company_name?.toLowerCase().includes(query) ||
          contact.role?.toLowerCase().includes(query) ||
          contact.contact_type?.toLowerCase().includes(query)

        return matchesTab && matchesSearch
      })
      .sort((left, right) => {
        const leftUpdated = new Date(left.updated_at ?? left.created_at ?? 0).getTime()
        const rightUpdated = new Date(right.updated_at ?? right.created_at ?? 0).getTime()
        return rightUpdated - leftUpdated
      })
  }, [contactBucketsById, contacts, search, tab])

  useEffect(() => {
    if (!filteredContacts.length) {
      setSelectedContactId(null)
      return
    }

    if (!selectedContactId || !filteredContacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(filteredContacts[0].id)
    }
  }, [filteredContacts, selectedContactId])

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  )

  const selectedBuckets = useMemo(
    () => (selectedContact ? contactBucketsById.get(selectedContact.id) || ['all'] : []),
    [contactBucketsById, selectedContact]
  )

  const selectedPropertyIds = useMemo(
    () =>
      selectedContact ? Array.from(propertyIdsByContactId.get(selectedContact.id) ?? new Set<string>()) : [],
    [propertyIdsByContactId, selectedContact]
  )

  const selectedProperties = useMemo(
    () =>
      selectedPropertyIds
        .map((propertyId) => properties.find((property) => property.id === propertyId) || null)
        .filter((property): property is PropertyRow => Boolean(property)),
    [properties, selectedPropertyIds]
  )

  const selectedTenancies = useMemo(
    () =>
      selectedContact
        ? tenancies.filter(
            (tenancy) =>
              tenancy.tenant_contact_id === selectedContact.id ||
              tenancy.landlord_contact_id === selectedContact.id
          )
        : [],
    [selectedContact, tenancies]
  )

  const selectedCases = useMemo(() => {
    if (!selectedContact) return []

    const selectedPropertyIdSet = new Set(selectedPropertyIds)

    return cases.filter(
      (caseItem) =>
        caseItem.contact_id === selectedContact.id ||
        (caseItem.property_id ? selectedPropertyIdSet.has(caseItem.property_id) : false)
    )
  }, [cases, selectedContact, selectedPropertyIds])

  const selectedCalls = useMemo(() => {
    if (!selectedContact) return []

    return calls.filter((call) => call.contact_id === selectedContact.id)
  }, [calls, selectedContact])

  const selectedContractor = useMemo(
    () => (selectedContact ? contractorByContactId.get(selectedContact.id) ?? null : null),
    [contractorByContactId, selectedContact]
  )

  const selectedContactMethods = useMemo(
    () =>
      selectedContact
        ? contactMethods.filter((method) => method.contact_id === selectedContact.id)
        : [],
    [contactMethods, selectedContact]
  )

  const contactKpis = useMemo(
    () => ({
      total: contacts.length,
      tenants: contacts.filter((contact) => (contactBucketsById.get(contact.id) || []).includes('tenant')).length,
      landlords: contacts.filter((contact) =>
        (contactBucketsById.get(contact.id) || []).includes('landlord')
      ).length,
      contractors: contacts.filter((contact) =>
        (contactBucketsById.get(contact.id) || []).includes('contractor')
      ).length,
      applicants: contacts.filter((contact) =>
        (contactBucketsById.get(contact.id) || []).includes('applicant')
      ).length,
    }),
    [contactBucketsById, contacts]
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
                  href="/calls"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Open calls inbox
                </Link>
                <Link
                  href="/knowledge"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Scotland knowledge
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
                  href="/records/compliance"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Compliance workspace
                </Link>
                <Link
                  href="/records/tenancies"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Tenancy workspace
                </Link>
                <Link
                  href="/records/rent"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Rent workspace
                </Link>
                <Link
                  href="/records/lease-lifecycle"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Lease lifecycle
                </Link>
                <Link
                  href="/records/reporting"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Reporting workspace
                </Link>
                <Link
                  href="/records/contractors"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Contractor workspace
                </Link>
                <Link
                  href="/records/viewings"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Viewings workspace
                </Link>
                <Link
                  href="/records/deposits"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Deposit workspace
                </Link>
                <Link
                  href="/records/operations"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Operations workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Records Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Open the people records behind the cases
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This is the first records layer for operators: tenants, landlords, contractors,
                applicants, and general contacts, with linked cases, calls, properties, and
                tenancies in one place.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: 'All contacts',
                    value: contactKpis.total,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                  },
                  {
                    label: 'Tenants',
                    value: contactKpis.tenants,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  },
                  {
                    label: 'Landlords',
                    value: contactKpis.landlords,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                  },
                  {
                    label: 'Contractors',
                    value: contactKpis.contractors,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                  },
                  {
                    label: 'Applicants',
                    value: contactKpis.applicants,
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
                Use the records view when the operator starts from a person, not from a case.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical use</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Search the person first if the caller already exists.</li>
                  <li>Check active tenancies and linked properties before replying.</li>
                  <li>Use the related cases list to avoid opening duplicate work.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Record tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Filter the records by the operator role that matters
                </h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredContacts.length} shown of {contacts.length} contacts
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Record tabs">
              {[
                ['all', 'All contacts'],
                ['tenant', 'Tenants'],
                ['landlord', 'Landlords'],
                ['contractor', 'Contractors'],
                ['applicant', 'Applicants'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as RecordTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search contacts</span>
              <input
                type="text"
                placeholder="Search by name, phone, email, company, role, or contact type"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading records workspace...
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
                <p className="app-kicker">Contact records</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a person or company</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Operators can start here when the job begins with a tenant, landlord, contractor,
                  or applicant instead of a case number.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredContacts.map((contact) => {
                  const selected = contact.id === selectedContactId
                  const buckets = contactBucketsById.get(contact.id) || ['all']
                  const stats = contactStatsById.get(contact.id) || {
                    cases: 0,
                    calls: 0,
                    properties: 0,
                    tenancies: 0,
                  }

                  return (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
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
                            <span className="text-base font-semibold">{getContactName(contact)}</span>
                            {!contact.is_active && (
                              <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                inactive
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {contact.company_name || contact.email || contact.phone || formatCategoryLabel(contact.contact_type)}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Updated</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(contact.updated_at ?? contact.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        {buckets
                          .filter((bucket) => bucket !== 'all')
                          .map((bucket) => (
                            <span
                              key={`${contact.id}-${bucket}`}
                              className="rounded-full border border-current/15 px-2.5 py-1"
                            >
                              {bucket}
                            </span>
                          ))}
                        {contact.phone && (
                          <span className="rounded-full border border-current/15 px-2.5 py-1">
                            {contact.phone}
                          </span>
                        )}
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <span>{stats.cases} cases</span>
                          <span>{stats.calls} calls</span>
                          <span>{stats.properties} properties</span>
                          <span>{stats.tenancies} tenancies</span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {filteredContacts.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No records match the current filters yet. Try widening the search or changing
                    tabs.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedContact ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a contact from the left to inspect linked cases, calls, properties, and
                  tenancy context.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected record</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedContact)}</h2>
                        {!selectedContact.is_active && (
                          <span className="rounded-full border border-stone-300 bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                            inactive
                          </span>
                        )}
                        {selectedBuckets
                          .filter((bucket) => bucket !== 'all')
                          .map((bucket) => (
                            <span
                              key={`${selectedContact.id}-${bucket}`}
                              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700"
                            >
                              {bucket}
                            </span>
                          ))}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedContact.notes?.trim() ||
                          'No operator notes are stored on this contact yet. The linked records below show the current working context.'}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Phone
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{selectedContact.phone || '-'}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Email
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{selectedContact.email || '-'}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Company / type
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {selectedContact.company_name || formatCategoryLabel(selectedContact.contact_type)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Record health
                        </p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {selectedCases.length ? 'Linked to active work' : 'No cases linked yet'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          {selectedCases.length
                            ? `${selectedCases.length} related case${selectedCases.length === 1 ? '' : 's'}, ${selectedCalls.length} call session${selectedCalls.length === 1 ? '' : 's'}, and ${selectedProperties.length} linked propert${selectedProperties.length === 1 ? 'y' : 'ies'}.`
                            : 'This contact has no related case yet. New voice or inbound work can still start here.'}
                        </p>
                      </div>

                      {selectedContractor && (
                        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4 text-amber-900">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                            Contractor profile
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {selectedContractor.company_name || selectedContractor.primary_trade}
                          </p>
                          <p className="mt-2 text-sm leading-6">
                            {selectedContractor.primary_trade}
                            {selectedContractor.coverage_area
                              ? ` • ${selectedContractor.coverage_area}`
                              : ''}
                            {selectedContractor.emergency_callout ? ' • emergency callout enabled' : ''}
                          </p>
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
                            <dt>Role</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatCategoryLabel(selectedContact.role || selectedContact.contact_type)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Created</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedContact.created_at)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatDateTime(selectedContact.updated_at)}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Cases</dt>
                            <dd className="text-right font-medium text-stone-900">{selectedCases.length}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Calls</dt>
                            <dd className="text-right font-medium text-stone-900">{selectedCalls.length}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Contact methods</p>
                        <div className="mt-4 space-y-3">
                          {selectedContactMethods.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-4 text-sm">
                              No extra contact methods are stored for this record.
                            </div>
                          )}

                          {selectedContactMethods.map((method) => (
                            <article key={method.id} className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                                  {formatCategoryLabel(method.method_type)}
                                </span>
                                {method.is_primary && (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                    primary
                                  </span>
                                )}
                              </div>
                              <p className="mt-3 text-sm font-medium text-stone-900">{method.method_value}</p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Linked tenancies</p>
                        <div className="mt-4 space-y-3">
                          {selectedTenancies.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-4 text-sm">
                              No tenancies link to this record yet.
                            </div>
                          )}

                          {selectedTenancies.slice(0, 4).map((tenancy) => (
                            <article key={tenancy.id} className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                                  {tenancy.tenancy_status || tenancy.status || 'tenancy'}
                                </span>
                                <span>{formatShortDate(tenancy.start_date)}</span>
                              </div>
                              <p className="mt-3 text-sm font-medium text-stone-900">
                                Rent {formatMoney(tenancy.rent_amount)} • Deposit {formatMoney(tenancy.deposit_amount)}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Related cases</p>
                            <h3 className="mt-2 text-xl font-semibold">Cases tied to this record</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCases.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No linked cases yet for this contact.
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
                                  {formatRelativeTime(caseItem.last_activity_at ?? caseItem.updated_at ?? caseItem.created_at)}
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
                            <p className="app-kicker">Recent calls</p>
                            <h3 className="mt-2 text-xl font-semibold">Annabelle sessions on this record</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCalls.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No call sessions are linked to this contact yet.
                            </div>
                          )}

                          {selectedCalls.slice(0, 5).map((call) => (
                            <article key={call.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getCallStatusTone(call.status)}`}>
                                    {call.status || 'unknown'}
                                  </span>
                                  {call.case_id && (
                                    <Link
                                      href={`/cases/${call.case_id}`}
                                      className="text-xs font-medium text-stone-700 underline-offset-4 hover:underline"
                                    >
                                      linked case
                                    </Link>
                                  )}
                                </div>
                                <span className="text-xs text-stone-500">
                                  {formatRelativeTime(call.last_event_at ?? call.started_at)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">
                                {call.ai_summary || call.intent || 'No summary yet from the call workflow.'}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Properties</p>
                            <h3 className="mt-2 text-xl font-semibold">Addresses linked to this record</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedProperties.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No properties are linked yet through ownership or tenancy.
                            </div>
                          )}

                          {selectedProperties.slice(0, 6).map((property) => (
                            <article key={property.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <p className="text-sm font-medium text-stone-900">{buildAddress(property)}</p>
                              <p className="mt-2 text-xs text-stone-500">
                                Updated {formatRelativeTime(property.updated_at)}
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
