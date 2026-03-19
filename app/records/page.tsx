'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorNav } from '@/app/operator-nav'
import { OperatorSessionState } from '@/app/operator-session-state'

type LifecycleTab = 'all' | 'at_risk' | 'arrears' | 'ending_soon' | 'deposits'
type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'
type WorkspaceFocus = 'overview' | 'money' | 'lease' | 'casework'

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
  rent_amount: number | string | null
  deposit_amount: number | string | null
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
  priority: string | null
  next_action_at: string | null
  waiting_on: WaitingOn | null
  updated_at: string | null
}

type RentEntryRow = {
  id: string
  tenancy_id: string
  entry_type: 'charge' | 'payment' | 'credit' | 'adjustment'
  status: 'open' | 'cleared' | 'void'
  amount: number | string
  due_date: string | null
  posted_at: string | null
  category: string | null
  reference: string | null
}

type LeaseEventRow = {
  id: string
  tenancy_id: string
  event_type: string
  status: 'planned' | 'due' | 'completed' | 'cancelled'
  scheduled_for: string | null
  completed_at: string | null
  note: string | null
}

type DepositClaimRow = {
  id: string
  tenancy_id: string
  claim_status: string
  disputed_amount: number | string | null
  total_claim_amount: number | string | null
  updated_at: string | null
}

type TenancyHealth = {
  balance: number
  overdue: number
  dueEvents: number
  openCases: number
  urgentCases: number
  disputedClaims: number
  endingSoon: boolean
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value))
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

function isActiveTenancy(tenancy: TenancyRow) {
  return tenancy.tenancy_status === 'active' || tenancy.status === 'active'
}

function isEndingSoon(endDate: string | null) {
  if (!endDate) return false
  const today = new Date()
  const end = new Date(endDate)
  const inFortyFiveDays = new Date()
  inFortyFiveDays.setDate(today.getDate() + 45)
  return end >= today && end <= inFortyFiveDays
}

function getStageLabel(tenancy: TenancyRow) {
  if (tenancy.tenancy_status === 'ended' || tenancy.status === 'ended') return 'Ended tenancy'
  if (isEndingSoon(tenancy.end_date)) return 'Renewal window'
  if (isActiveTenancy(tenancy)) return 'Active tenancy'
  return formatLabel(tenancy.tenancy_status || tenancy.status)
}

function getPriorityTone(value: string | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getLifecycleTone(status: LeaseEventRow['status']) {
  if (status === 'due') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'planned') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-100 text-stone-600'
}

function getClaimTone(status: string) {
  if (status === 'disputed') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function getTenancyHealthLabel(health: TenancyHealth) {
  if (health.overdue > 0 || health.urgentCases > 0 || health.disputedClaims > 0) return 'Needs intervention'
  if (health.dueEvents > 0 || health.endingSoon || health.openCases > 0) return 'Needs attention'
  return 'On track'
}

function getTenancyHealthTone(health: TenancyHealth) {
  if (health.overdue > 0 || health.urgentCases > 0 || health.disputedClaims > 0) {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  if (health.dueEvents > 0 || health.endingSoon || health.openCases > 0) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function RecordsPage() {
  const router = useRouter()
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [entries, setEntries] = useState<RentEntryRow[]>([])
  const [events, setEvents] = useState<LeaseEventRow[]>([])
  const [claims, setClaims] = useState<DepositClaimRow[]>([])

  const [tab, setTab] = useState<LifecycleTab>('all')
  const [search, setSearch] = useState('')
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [workspaceFocus, setWorkspaceFocus] = useState<WorkspaceFocus>('overview')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [savingEntry, setSavingEntry] = useState(false)
  const [savingLifecycle, setSavingLifecycle] = useState(false)
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null)
  const [completingEventId, setCompletingEventId] = useState<string | null>(null)
  const [entryType, setEntryType] = useState<RentEntryRow['entry_type']>('payment')
  const [entryCategory, setEntryCategory] = useState('rent')
  const [amountInput, setAmountInput] = useState('')
  const [dueDateInput, setDueDateInput] = useState('')
  const [referenceInput, setReferenceInput] = useState('')
  const [lifecycleType, setLifecycleType] = useState('renewal_review')
  const [scheduledForInput, setScheduledForInput] = useState('')
  const [lifecycleNote, setLifecycleNote] = useState('')

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadWorkspace = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [
      contactsResponse,
      propertiesResponse,
      tenanciesResponse,
      casesResponse,
      entriesResponse,
      eventsResponse,
      claimsResponse,
    ] = await Promise.all([
      supabase.from('contacts').select('id, full_name, phone, email, company_name').order('updated_at', { ascending: false }),
      supabase.from('properties').select('id, address_line_1, address_line_2, city, postcode').order('updated_at', { ascending: false }),
      supabase.from('tenancies').select('id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, updated_at').order('updated_at', { ascending: false }).limit(1200),
      supabase.from('cases').select('id, case_number, tenancy_id, property_id, case_type, summary, status, priority, next_action_at, waiting_on, updated_at').order('updated_at', { ascending: false }).limit(1500),
      supabase.from('rent_ledger_entries').select('id, tenancy_id, entry_type, status, amount, due_date, posted_at, category, reference').order('posted_at', { ascending: false }).limit(2000),
      supabase.from('lease_lifecycle_events').select('id, tenancy_id, event_type, status, scheduled_for, completed_at, note').order('scheduled_for', { ascending: true }).limit(2000),
      supabase.from('deposit_claims').select('id, tenancy_id, claim_status, disputed_amount, total_claim_amount, updated_at').order('updated_at', { ascending: false }).limit(1200),
    ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      casesResponse.error,
      entriesResponse.error,
      eventsResponse.error,
      claimsResponse.error,
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
    setEntries((entriesResponse.data || []) as RentEntryRow[])
    setEvents((eventsResponse.data || []) as LeaseEventRow[])
    setClaims((claimsResponse.data || []) as DepositClaimRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId || authError) return
    void loadWorkspace()
  }, [authError, operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const casesByTenancyId = useMemo(() => {
    const map = new Map<string, CaseRow[]>()
    for (const item of cases) {
      if (!item.tenancy_id) continue
      const existing = map.get(item.tenancy_id) ?? []
      existing.push(item)
      map.set(item.tenancy_id, existing)
    }
    return map
  }, [cases])

  const entriesByTenancyId = useMemo(() => {
    const map = new Map<string, RentEntryRow[]>()
    for (const item of entries) {
      const existing = map.get(item.tenancy_id) ?? []
      existing.push(item)
      map.set(item.tenancy_id, existing)
    }
    return map
  }, [entries])

  const eventsByTenancyId = useMemo(() => {
    const map = new Map<string, LeaseEventRow[]>()
    for (const item of events) {
      const existing = map.get(item.tenancy_id) ?? []
      existing.push(item)
      map.set(item.tenancy_id, existing)
    }
    return map
  }, [events])

  const claimsByTenancyId = useMemo(() => {
    const map = new Map<string, DepositClaimRow[]>()
    for (const item of claims) {
      const existing = map.get(item.tenancy_id) ?? []
      existing.push(item)
      map.set(item.tenancy_id, existing)
    }
    return map
  }, [claims])

  const healthByTenancyId = useMemo(() => {
    const map = new Map<string, TenancyHealth>()

    for (const tenancy of tenancies) {
      const tenancyEntries = entriesByTenancyId.get(tenancy.id) ?? []
      const tenancyEvents = eventsByTenancyId.get(tenancy.id) ?? []
      const tenancyCases = casesByTenancyId.get(tenancy.id) ?? []
      const tenancyClaims = claimsByTenancyId.get(tenancy.id) ?? []

      const stats = tenancyEntries.reduce(
        (acc, entry) => {
          const amount = toNumber(entry.amount)
          const isDebit = entry.entry_type === 'charge' || entry.entry_type === 'adjustment'
          const isCredit = entry.entry_type === 'payment' || entry.entry_type === 'credit'
          const dueInPast = entry.due_date ? new Date(entry.due_date) < new Date() : false

          if (entry.status !== 'void') {
            if (isDebit) acc.balance += amount
            if (isCredit) acc.balance -= amount
          }

          if (entry.status === 'open' && isDebit && dueInPast) {
            acc.overdue += amount
          }

          return acc
        },
        { balance: 0, overdue: 0 }
      )

      map.set(tenancy.id, {
        balance: stats.balance,
        overdue: stats.overdue,
        dueEvents: tenancyEvents.filter((item) => item.status === 'due').length,
        openCases: tenancyCases.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length,
        urgentCases: tenancyCases.filter((item) => item.priority === 'urgent').length,
        disputedClaims: tenancyClaims.filter((item) => item.claim_status === 'disputed').length,
        endingSoon: isEndingSoon(tenancy.end_date),
      })
    }

    return map
  }, [casesByTenancyId, claimsByTenancyId, entriesByTenancyId, eventsByTenancyId, tenancies])

  const filteredTenancies = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tenancies.filter((tenancy) => {
      const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
      const landlord = tenancy.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null
      const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
      const health = healthByTenancyId.get(tenancy.id) ?? {
        balance: 0,
        overdue: 0,
        dueEvents: 0,
        openCases: 0,
        urgentCases: 0,
        disputedClaims: 0,
        endingSoon: false,
      }

      const matchesSearch =
        query === '' ||
        getContactName(tenant).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        buildAddress(property).toLowerCase().includes(query)

      const atRisk = health.overdue > 0 || health.dueEvents > 0 || health.urgentCases > 0 || health.disputedClaims > 0
      const matchesTab =
        tab === 'all' ||
        (tab === 'at_risk' && atRisk) ||
        (tab === 'arrears' && health.overdue > 0) ||
        (tab === 'ending_soon' && health.endingSoon) ||
        (tab === 'deposits' && health.disputedClaims > 0)

      return matchesSearch && matchesTab
    })
  }, [contactById, healthByTenancyId, propertyById, search, tab, tenancies])

  const resolvedSelectedTenancyId =
    selectedTenancyId && filteredTenancies.some((tenancy) => tenancy.id === selectedTenancyId)
      ? selectedTenancyId
      : filteredTenancies[0]?.id ?? null

  const selectedTenancy = useMemo(
    () => tenancies.find((tenancy) => tenancy.id === resolvedSelectedTenancyId) ?? null,
    [resolvedSelectedTenancyId, tenancies]
  )

  const selectedTenant = selectedTenancy?.tenant_contact_id
    ? contactById.get(selectedTenancy.tenant_contact_id) ?? null
    : null
  const selectedLandlord = selectedTenancy?.landlord_contact_id
    ? contactById.get(selectedTenancy.landlord_contact_id) ?? null
    : null
  const selectedProperty = selectedTenancy?.property_id
    ? propertyById.get(selectedTenancy.property_id) ?? null
    : null
  const selectedCases = useMemo(
    () => (selectedTenancy ? (casesByTenancyId.get(selectedTenancy.id) ?? []) : []),
    [casesByTenancyId, selectedTenancy]
  )
  const resolvedSelectedCaseId =
    selectedCaseId && selectedCases.some((caseItem) => caseItem.id === selectedCaseId)
      ? selectedCaseId
      : selectedCases.find(
          (caseItem) => caseItem.case_type === 'rent' || caseItem.case_type === 'tenancy_admin'
        )?.id ?? selectedCases[0]?.id ?? ''
  const selectedEntries = useMemo(
    () =>
      selectedTenancy
        ? [...(entriesByTenancyId.get(selectedTenancy.id) ?? [])].sort((left, right) => {
            const leftTime = new Date(left.due_date || left.posted_at || 0).getTime()
            const rightTime = new Date(right.due_date || right.posted_at || 0).getTime()
            return rightTime - leftTime
          })
        : [],
    [entriesByTenancyId, selectedTenancy]
  )
  const selectedEvents = useMemo(
    () =>
      selectedTenancy
        ? [...(eventsByTenancyId.get(selectedTenancy.id) ?? [])].sort((left, right) => {
            const leftTime = new Date(left.scheduled_for || left.completed_at || 0).getTime()
            const rightTime = new Date(right.scheduled_for || right.completed_at || 0).getTime()
            return leftTime - rightTime
          })
        : [],
    [eventsByTenancyId, selectedTenancy]
  )
  const selectedClaims = useMemo(
    () => (selectedTenancy ? claimsByTenancyId.get(selectedTenancy.id) ?? [] : []),
    [claimsByTenancyId, selectedTenancy]
  )
  const selectedHealth = useMemo(
    () =>
      (selectedTenancy && healthByTenancyId.get(selectedTenancy.id)) || {
        balance: 0,
        overdue: 0,
        dueEvents: 0,
        openCases: 0,
        urgentCases: 0,
        disputedClaims: 0,
        endingSoon: false,
      },
    [healthByTenancyId, selectedTenancy]
  )

  const overallStats = useMemo(() => {
    const active = tenancies.filter((tenancy) => isActiveTenancy(tenancy)).length
    const endingSoon = tenancies.filter((tenancy) => isEndingSoon(tenancy.end_date)).length
    const arrears = Array.from(healthByTenancyId.values()).reduce((sum, item) => sum + item.overdue, 0)
    const dueEvents = Array.from(healthByTenancyId.values()).reduce((sum, item) => sum + item.dueEvents, 0)
    const openCases = cases.filter((item) => item.status !== 'resolved' && item.status !== 'closed').length
    const disputedClaims = claims.filter((item) => item.claim_status === 'disputed').length

    return { active, endingSoon, arrears, dueEvents, openCases, disputedClaims }
  }, [cases, claims, healthByTenancyId, tenancies])

  async function handleCreateEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTenancy) return

    const amount = Number(amountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage('Enter a valid amount before adding a ledger item.')
      return
    }

    setSavingEntry(true)
    setActionMessage(null)

    const { data, error: insertError } = await supabase
      .from('rent_ledger_entries')
      .insert({
        tenancy_id: selectedTenancy.id,
        case_id: resolvedSelectedCaseId || null,
        entry_type: entryType,
        category: entryCategory,
        status: entryType === 'payment' || entryType === 'credit' ? 'cleared' : 'open',
        amount,
        due_date: dueDateInput || null,
        reference: referenceInput.trim() || null,
      })
      .select('id, tenancy_id, entry_type, status, amount, due_date, posted_at, category, reference')
      .single()

    if (insertError) {
      setActionMessage(`Error: ${insertError.message}`)
      setSavingEntry(false)
      return
    }

    setEntries((current) => [data as RentEntryRow, ...current])
    setAmountInput('')
    setDueDateInput('')
    setReferenceInput('')
    setActionMessage('Ledger item added to the tenancy workspace.')
    setSavingEntry(false)
  }

  async function handleSetEntryStatus(entryId: string, status: RentEntryRow['status']) {
    setUpdatingEntryId(entryId)
    setActionMessage(null)

    const { data, error: updateError } = await supabase
      .from('rent_ledger_entries')
      .update({ status })
      .eq('id', entryId)
      .select('id, tenancy_id, entry_type, status, amount, due_date, posted_at, category, reference')
      .single()

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setUpdatingEntryId(null)
      return
    }

    setEntries((current) =>
      current.map((entry) => (entry.id === entryId ? (data as RentEntryRow) : entry))
    )
    setUpdatingEntryId(null)
    setActionMessage(`Ledger item marked ${status}.`)
  }

  async function handleCreateLifecycleEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTenancy) return
    if (!scheduledForInput) {
      setActionMessage('Choose a date before adding a lifecycle event.')
      return
    }

    setSavingLifecycle(true)
    setActionMessage(null)

    const status = scheduledForInput <= new Date().toISOString().slice(0, 10) ? 'due' : 'planned'

    const { data, error: insertError } = await supabase
      .from('lease_lifecycle_events')
      .insert({
        tenancy_id: selectedTenancy.id,
        case_id: resolvedSelectedCaseId || null,
        event_type: lifecycleType,
        status,
        scheduled_for: scheduledForInput,
        source: 'manual',
        note: lifecycleNote.trim() || null,
      })
      .select('id, tenancy_id, event_type, status, scheduled_for, completed_at, note')
      .single()

    if (insertError) {
      setActionMessage(`Error: ${insertError.message}`)
      setSavingLifecycle(false)
      return
    }

    setEvents((current) => [...current, data as LeaseEventRow])
    setScheduledForInput('')
    setLifecycleNote('')
    setActionMessage('Lifecycle event added to the tenancy workspace.')
    setSavingLifecycle(false)
  }

  async function handleCompleteLifecycleEvent(eventId: string) {
    setCompletingEventId(eventId)
    setActionMessage(null)

    const { data, error: updateError } = await supabase
      .from('lease_lifecycle_events')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', eventId)
      .select('id, tenancy_id, event_type, status, scheduled_for, completed_at, note')
      .single()

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setCompletingEventId(null)
      return
    }

    setEvents((current) =>
      current.map((item) => (item.id === eventId ? (data as LeaseEventRow) : item))
    )
    setCompletingEventId(null)
    setActionMessage('Lifecycle event marked complete.')
  }

  async function handleSignOut() {
    setSigningOut(true)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
      setSigningOut(false)
      return
    }
    router.replace('/')
    router.refresh()
  }

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  return (
    <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <OperatorNav current="crm" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="app-kicker">Tenancy CRM</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
                One tenancy CRM for the full customer lifecycle
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-stone-700">
                Track the tenancy, the accounts position, the renewal milestones, the deposit risk, and the live work around it without bouncing between six different tools. This is the joined-up control layer the CRM story is supposed to promise.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {[
              { label: 'Active tenancies', value: overallStats.active, tone: 'border-stone-200 bg-white' },
              { label: 'Renewal window', value: overallStats.endingSoon, tone: 'border-amber-200 bg-amber-50' },
              { label: 'Arrears pressure', value: formatMoney(overallStats.arrears), tone: 'border-red-200 bg-red-50' },
              { label: 'Lease actions due', value: overallStats.dueEvents, tone: 'border-sky-200 bg-sky-50' },
              { label: 'Open tenancy cases', value: overallStats.openCases, tone: 'border-stone-200 bg-white' },
              { label: 'Deposit disputes', value: overallStats.disputedClaims, tone: 'border-rose-200 bg-rose-50' },
            ].map((item) => (
              <article key={item.label} className={`rounded-[1.4rem] border p-4 ${item.tone}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-stone-900">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        {pageError && (
          <div className="rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            {pageError}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_320px]">
          <aside className="app-surface rounded-[2rem] p-5">
            <div className="flex flex-col gap-3 border-b app-divider pb-4">
              <div>
              <p className="app-kicker">CRM filter</p>
              <h2 className="mt-2 text-2xl font-semibold">Choose the tenancy to run</h2>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Search by tenant, landlord, or address</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tenancy CRM"
                  className="app-field text-sm outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'at_risk', label: 'At risk' },
                  { id: 'arrears', label: 'Arrears' },
                  { id: 'ending_soon', label: 'Ending soon' },
                  { id: 'deposits', label: 'Deposits' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as LifecycleTab)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      tab === item.id ? 'app-pill-active' : 'app-pill'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="app-empty-state rounded-[1.5rem] p-4 text-sm">Loading tenancies...</div>
              ) : filteredTenancies.length === 0 ? (
                <div className="app-empty-state rounded-[1.5rem] p-4 text-sm">No tenancies match this filter.</div>
              ) : (
                filteredTenancies.map((tenancy) => {
                  const selected = tenancy.id === selectedTenancyId
                  const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
                  const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
                  const health = healthByTenancyId.get(tenancy.id) ?? {
                    balance: 0,
                    overdue: 0,
                    dueEvents: 0,
                    openCases: 0,
                    urgentCases: 0,
                    disputedClaims: 0,
                    endingSoon: false,
                  }

                  return (
                    <button
                      key={tenancy.id}
                      onClick={() => setSelectedTenancyId(tenancy.id)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left ${
                        selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{getContactName(tenant)}</p>
                          <p className="mt-1 text-sm text-stone-600">{buildAddress(property)}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTenancyHealthTone(health)}`}>
                          {getTenancyHealthLabel(health)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
                        <span className="rounded-full border border-current/15 px-2.5 py-1">{getStageLabel(tenancy)}</span>
                        {health.overdue > 0 && <span className="rounded-full border border-current/15 px-2.5 py-1">Arrears {formatMoney(health.overdue)}</span>}
                        {health.dueEvents > 0 && <span className="rounded-full border border-current/15 px-2.5 py-1">{health.dueEvents} due</span>}
                        {health.disputedClaims > 0 && <span className="rounded-full border border-current/15 px-2.5 py-1">Deposit dispute</span>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="app-surface rounded-[2rem] p-6">
            {!selectedTenancy ? (
              <div className="app-empty-state rounded-[1.7rem] p-8 text-sm">
                Pick a tenancy to see the full lifecycle control view.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <p className="app-kicker">Tenancy Overview</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-3xl font-semibold">{getContactName(selectedTenant)}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getTenancyHealthTone(selectedHealth)}`}>
                        {getTenancyHealthLabel(selectedHealth)}
                      </span>
                    </div>
                    <p className="mt-3 text-base leading-7 text-stone-700">{buildAddress(selectedProperty)}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Stage</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{getStageLabel(selectedTenancy)}</p>
                        <p className="mt-2 text-sm text-stone-600">{formatDate(selectedTenancy.start_date)} to {formatDate(selectedTenancy.end_date)}</p>
                      </div>
                      <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Rent position</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{formatMoney(selectedHealth.balance)}</p>
                        <p className="mt-2 text-sm text-stone-600">Overdue now {formatMoney(selectedHealth.overdue)}</p>
                      </div>
                      <div className="rounded-[1.3rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Live work</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{selectedHealth.openCases} open cases</p>
                        <p className="mt-2 text-sm text-stone-600">{selectedHealth.dueEvents} lifecycle actions due</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-stone-200 bg-white/92 p-4">
                    <p className="app-kicker">Relationship Map</p>
                    <dl className="mt-4 space-y-3 text-sm text-stone-600">
                      <div className="flex items-start justify-between gap-4">
                        <dt>Tenant</dt>
                        <dd className="text-right font-medium text-stone-900">{getContactName(selectedTenant)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt>Landlord</dt>
                        <dd className="text-right font-medium text-stone-900">{getContactName(selectedLandlord)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt>Rent</dt>
                        <dd className="text-right font-medium text-stone-900">{formatMoney(selectedTenancy.rent_amount)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt>Deposit</dt>
                        <dd className="text-right font-medium text-stone-900">{formatMoney(selectedTenancy.deposit_amount)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt>Last update</dt>
                        <dd className="text-right font-medium text-stone-900">{formatRelativeTime(selectedTenancy.updated_at)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'money', label: 'Accounts' },
                    { id: 'lease', label: 'Renewals' },
                    { id: 'casework', label: 'Case Management' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setWorkspaceFocus(item.id as WorkspaceFocus)}
                      className={`rounded-full px-4 py-2 text-sm font-medium ${
                        workspaceFocus === item.id ? 'app-pill-active' : 'app-pill'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {actionMessage && (
                  <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    {actionMessage}
                  </div>
                )}

                {workspaceFocus === 'overview' && (
                <div className="grid gap-4 xl:grid-cols-2">
                  <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                    <div className="flex items-end justify-between gap-4 border-b app-divider pb-4">
                      <div>
                        <p className="app-kicker">Lifecycle Timeline</p>
                        <h3 className="mt-2 text-xl font-semibold">What is due across the tenancy</h3>
                      </div>
                      <Link href="/records/lease-lifecycle" className="app-secondary-button rounded-full px-3 py-2 text-sm font-medium">
                        Open lifecycle workspace
                      </Link>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedEvents.length === 0 ? (
                        <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No lifecycle events are linked yet.</div>
                      ) : (
                        selectedEvents.slice(0, 6).map((item) => (
                          <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getLifecycleTone(item.status)}`}>
                                {formatLabel(item.status)}
                              </span>
                              <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                {formatLabel(item.event_type)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-stone-700">
                              {item.status === 'completed' ? `Completed ${formatDate(item.completed_at)}` : `Scheduled ${formatDate(item.scheduled_for)}`}
                            </p>
                            {item.note && <p className="mt-2 text-sm text-stone-600">{item.note}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                    <div className="flex items-end justify-between gap-4 border-b app-divider pb-4">
                      <div>
                        <p className="app-kicker">Rent And Ledger</p>
                        <h3 className="mt-2 text-xl font-semibold">Money pressure without leaving the screen</h3>
                      </div>
                      <Link href="/records/rent" className="app-secondary-button rounded-full px-3 py-2 text-sm font-medium">
                        Open rent workspace
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Live balance</p>
                        <p className="mt-2 text-xl font-semibold text-stone-900">{formatMoney(selectedHealth.balance)}</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-red-200 bg-red-50/90 p-4">
                        <p className="app-kicker">Overdue</p>
                        <p className="mt-2 text-xl font-semibold text-red-700">{formatMoney(selectedHealth.overdue)}</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Recent items</p>
                        <p className="mt-2 text-xl font-semibold text-stone-900">{selectedEntries.length}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedEntries.length === 0 ? (
                        <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No ledger items are linked yet.</div>
                      ) : (
                        selectedEntries.slice(0, 5).map((item) => (
                          <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-stone-900">{formatLabel(item.entry_type)} • {formatLabel(item.category)}</p>
                                <p className="mt-1 text-sm text-stone-600">Due {formatDate(item.due_date)} • {item.reference || 'No reference'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-stone-900">{formatMoney(item.amount)}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">{item.status}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </div>
                )}

                {workspaceFocus === 'casework' && (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                    <div className="flex items-end justify-between gap-4 border-b app-divider pb-4">
                      <div>
                        <p className="app-kicker">Live Cases</p>
                        <h3 className="mt-2 text-xl font-semibold">Every issue already tied to this tenancy</h3>
                      </div>
                      <Link href="/calls" className="app-secondary-button rounded-full px-3 py-2 text-sm font-medium">
                        Go to queue
                      </Link>
                    </div>
                    <div className="mt-4 space-y-3">
                      {selectedCases.length === 0 ? (
                        <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No cases are linked to this tenancy yet.</div>
                      ) : (
                        selectedCases.slice(0, 6).map((item) => (
                          <Link key={item.id} href={`/cases/${item.id}`} className="block rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4 hover:border-stone-400 hover:bg-white">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-stone-900">{item.case_number || item.id.slice(0, 8)}</span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getPriorityTone(item.priority)}`}>
                                {formatLabel(item.priority)}
                              </span>
                              <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                {formatLabel(item.case_type)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-stone-700">{item.summary || 'No summary yet'}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-500">Updated {formatRelativeTime(item.updated_at)}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                    <p className="app-kicker">Deposit And Control</p>
                    <h3 className="mt-2 text-xl font-semibold">The final pressure points</h3>
                    <div className="mt-4 space-y-3">
                      {selectedClaims.length === 0 ? (
                        <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No deposit claims are linked right now.</div>
                      ) : (
                        selectedClaims.map((item) => (
                          <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getClaimTone(item.claim_status)}`}>
                              {formatLabel(item.claim_status)}
                            </span>
                            <p className="mt-3 text-sm text-stone-700">Claim total {formatMoney(item.total_claim_amount)} • Disputed {formatMoney(item.disputed_amount)}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-500">Updated {formatRelativeTime(item.updated_at)}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-5 rounded-[1.3rem] border border-emerald-200 bg-emerald-50/90 p-4 text-sm leading-7 text-emerald-950/85">
                      This view is meant to let the team run the tenancy from one place: people, dates, money, issues, and end-of-tenancy risk together.
                    </div>
                  </article>
                </div>
                )}

                {workspaceFocus === 'money' && (
                  <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                    <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                      <p className="app-kicker">Money Console</p>
                      <h3 className="mt-2 text-xl font-semibold">Post and resolve ledger movement here</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                          <p className="app-kicker">Live balance</p>
                          <p className="mt-2 text-xl font-semibold text-stone-900">{formatMoney(selectedHealth.balance)}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-red-200 bg-red-50/90 p-4">
                          <p className="app-kicker">Overdue now</p>
                          <p className="mt-2 text-xl font-semibold text-red-700">{formatMoney(selectedHealth.overdue)}</p>
                        </div>
                      </div>

                      <form className="mt-5 space-y-4" onSubmit={handleCreateEntry}>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Related case</span>
                          <select value={resolvedSelectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="app-field text-sm outline-none">
                            <option value="">No linked case</option>
                            {selectedCases.map((caseItem) => (
                              <option key={caseItem.id} value={caseItem.id}>
                                {(caseItem.case_number || caseItem.id).slice(0, 18)} • {formatLabel(caseItem.case_type)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Entry type</span>
                          <select value={entryType} onChange={(event) => setEntryType(event.target.value as RentEntryRow['entry_type'])} className="app-field text-sm outline-none">
                            <option value="payment">Payment received</option>
                            <option value="charge">Charge due</option>
                            <option value="credit">Credit</option>
                            <option value="adjustment">Adjustment</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
                          <select value={entryCategory} onChange={(event) => setEntryCategory(event.target.value)} className="app-field text-sm outline-none">
                            <option value="rent">Rent</option>
                            <option value="fee">Fee</option>
                            <option value="maintenance_recharge">Maintenance recharge</option>
                            <option value="deposit_claim">Deposit claim</option>
                            <option value="other">Other</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Amount</span>
                          <input type="number" min="0" step="0.01" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} className="app-field text-sm outline-none" placeholder="0.00" />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Due date</span>
                          <input type="date" value={dueDateInput} onChange={(event) => setDueDateInput(event.target.value)} className="app-field text-sm outline-none" />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Reference</span>
                          <input type="text" value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} className="app-field text-sm outline-none" placeholder="Receipt, bank ref, or invoice" />
                        </label>

                        <button type="submit" disabled={savingEntry} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium disabled:opacity-60">
                          {savingEntry ? 'Adding ledger item...' : 'Add ledger item'}
                        </button>
                      </form>
                    </article>

                    <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                      <div className="flex items-end justify-between gap-4 border-b app-divider pb-4">
                        <div>
                          <p className="app-kicker">Recent ledger movement</p>
                          <h3 className="mt-2 text-xl font-semibold">Resolve balance without leaving the tenancy</h3>
                        </div>
                        <Link href="/records/rent" className="app-secondary-button rounded-full px-3 py-2 text-sm font-medium">
                          Deep rent workspace
                        </Link>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedEntries.length === 0 ? (
                          <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No ledger items are linked yet.</div>
                        ) : (
                          selectedEntries.map((item) => (
                            <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-stone-900">{formatLabel(item.entry_type)} • {formatLabel(item.category)}</p>
                                  <p className="mt-1 text-sm text-stone-600">Due {formatDate(item.due_date)} • {item.reference || 'No reference'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-stone-900">{formatMoney(item.amount)}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">{item.status}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.status === 'open' && (
                                  <button onClick={() => void handleSetEntryStatus(item.id, 'cleared')} disabled={updatingEntryId === item.id} className="app-secondary-button rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60">
                                    Mark cleared
                                  </button>
                                )}
                                {item.status !== 'void' && (
                                  <button onClick={() => void handleSetEntryStatus(item.id, 'void')} disabled={updatingEntryId === item.id} className="app-secondary-button rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60">
                                    Void
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  </div>
                )}

                {workspaceFocus === 'lease' && (
                  <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                    <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                      <p className="app-kicker">Lease Console</p>
                      <h3 className="mt-2 text-xl font-semibold">Book the next lifecycle action here</h3>
                      <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="app-kicker">Term dates</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {formatDate(selectedTenancy.start_date)} to {formatDate(selectedTenancy.end_date)}
                        </p>
                        <p className="mt-2 text-sm text-stone-600">Due events: {selectedHealth.dueEvents}</p>
                      </div>

                      <form className="mt-5 space-y-4" onSubmit={handleCreateLifecycleEvent}>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Related case</span>
                          <select value={resolvedSelectedCaseId} onChange={(event) => setSelectedCaseId(event.target.value)} className="app-field text-sm outline-none">
                            <option value="">No linked case</option>
                            {selectedCases.map((caseItem) => (
                              <option key={caseItem.id} value={caseItem.id}>
                                {(caseItem.case_number || caseItem.id).slice(0, 18)} • {formatLabel(caseItem.case_type)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Event type</span>
                          <select value={lifecycleType} onChange={(event) => setLifecycleType(event.target.value)} className="app-field text-sm outline-none">
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
                          <input type="date" value={scheduledForInput} onChange={(event) => setScheduledForInput(event.target.value)} className="app-field text-sm outline-none" />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Notes</span>
                          <textarea value={lifecycleNote} onChange={(event) => setLifecycleNote(event.target.value)} className="app-field min-h-[120px] text-sm outline-none" placeholder="Context for renewal, notice, inspection, or move-out." />
                        </label>

                        <button type="submit" disabled={savingLifecycle} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium disabled:opacity-60">
                          {savingLifecycle ? 'Adding lifecycle event...' : 'Add lifecycle event'}
                        </button>
                      </form>
                    </article>

                    <article className="rounded-[1.6rem] border border-stone-200 bg-white/92 p-5">
                      <div className="flex items-end justify-between gap-4 border-b app-divider pb-4">
                        <div>
                          <p className="app-kicker">Lifecycle queue</p>
                          <h3 className="mt-2 text-xl font-semibold">Run renewal and move-out work in one panel</h3>
                        </div>
                        <Link href="/records/lease-lifecycle" className="app-secondary-button rounded-full px-3 py-2 text-sm font-medium">
                          Deep lifecycle workspace
                        </Link>
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedEvents.length === 0 ? (
                          <div className="app-empty-state rounded-[1.3rem] p-4 text-sm">No lifecycle events are linked yet.</div>
                        ) : (
                          selectedEvents.map((item) => (
                            <div key={item.id} className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getLifecycleTone(item.status)}`}>
                                  {formatLabel(item.status)}
                                </span>
                                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700">
                                  {formatLabel(item.event_type)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm text-stone-700">
                                {item.status === 'completed' ? `Completed ${formatDate(item.completed_at)}` : `Scheduled ${formatDate(item.scheduled_for)}`}
                              </p>
                              {item.note && <p className="mt-2 text-sm text-stone-600">{item.note}</p>}
                              {item.status !== 'completed' && item.status !== 'cancelled' && (
                                <div className="mt-3">
                                  <button onClick={() => void handleCompleteLifecycleEvent(item.id)} disabled={completingEventId === item.id} className="app-secondary-button rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60">
                                    {completingEventId === item.id ? 'Completing...' : 'Mark complete'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="app-surface rounded-[2rem] p-5">
            <p className="app-kicker">Operator Context</p>
            <h2 className="mt-2 text-2xl font-semibold">{getOperatorLabel(operator)}</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              Work from one joined-up tenancy view. Use the embedded money, lifecycle, and casework consoles before stepping into a specialist page.
            </p>

            <div className="mt-5 space-y-3">
              {[
                { label: 'Reporting', href: '/records/reporting', body: 'Portfolio-wide operating pressure and money posture.' },
                { label: 'Properties', href: '/records/properties', body: 'Property-level drill-down when tenancy context is not enough.' },
                { label: 'Contractors', href: '/records/contractors', body: 'Supplier relationships and maintenance delivery detail.' },
                { label: 'New Business', href: '/records/onboarding', body: 'Invite and configure access for new users.' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="block rounded-[1.3rem] border border-stone-200 bg-white/92 p-4 hover:border-stone-400 hover:bg-stone-50">
                  <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
