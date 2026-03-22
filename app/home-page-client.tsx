'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import HomepageDemo from '@/app/components/HomepageDemo'
import { PublicHome } from '@/app/public-home'
import { OperatorNav } from '@/app/operator-nav'
import { OperatorSessionState } from '@/app/operator-session-state'

type CaseRow = {
  id: string
  case_number: string
  summary: string | null
  case_type: string | null
  priority: string | null
  status: string | null
  needs_human_handoff: boolean | null
  handoff_reason: string | null
  contact_name: string | null
  contact_phone: string | null
  postcode: string | null
  assigned_user_name: string | null
  assigned_user_id?: string | null
  created_at: string | null
  last_customer_message_at: string | null
  tenancy_id?: string | null
  property_id?: string | null
  next_action_at?: string | null
  waiting_on?: WaitingOn | null
  waiting_reason?: string | null
}

type MessageRow = {
  id: string
  message_text: string | null
  sender_type: string | null
  direction: string | null
  channel: string | null
  created_at: string | null
}

type QueueTenancyRow = {
  id: string
  property_id: string | null
  status: string | null
  tenancy_status: string | null
  end_date: string | null
}

type QueueRentEntryRow = {
  id: string
  tenancy_id: string | null
  case_id: string | null
  entry_type: string | null
  status: string | null
  amount: number | string | null
  due_date: string | null
  posted_at: string | null
  category: string | null
}

type QueueLeaseEventRow = {
  id: string
  tenancy_id: string | null
  case_id: string | null
  event_type: string | null
  status: string | null
  scheduled_for: string | null
  completed_at: string | null
}

type QueueDepositClaimRow = {
  id: string
  tenancy_id: string | null
  case_id: string | null
  claim_status: string | null
  disputed_amount: number | string | null
  total_claim_amount: number | string | null
  updated_at: string | null
}

type QueueMaintenanceRow = {
  id: number
  case_id: string | null
  tenancy_id: string | null
  property_id: string | null
  issue_type: string | null
  priority: string | null
  status: string | null
  scheduled_for: string | null
  updated_at: string | null
}

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

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string
  coverage_area: string | null
  emergency_callout: boolean
  is_active: boolean
}

type MaintenanceJobRow = {
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

type QueueCallRow = {
  id: string
  created_at: string | null
  last_event_at: string | null
  direction: string | null
  status: string | null
  outcome: string | null
}

type QueueActivityItem = {
  id: string
  sortAt: string | null
  label: string
  meta: string
  body: string
  tone: string
  href?: string
}

type SelectedCaseContextRow = {
  id: string
  tenancy_id: string | null
  property_id: string | null
  contact_id: string | null
}

type UserRow = {
  id: string
  full_name: string
}

type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'
type FollowUpRow = {
  id: string
  next_action_at: string | null
  waiting_on: WaitingOn | null
  waiting_reason: string | null
}
type MaintenancePulseRow = {
  status: string
  landlord_approval_required: boolean
  scheduled_for: string | null
}
	type CompliancePulseRow = {
	  status: string
	}
	type OperationsPulseState = {
	  maintenanceLive: number
	  maintenanceApproval: number
	  maintenanceScheduled: number
	  complianceRisk: number
	  complianceSoon: number
	}
	type QueueTab =
	  | 'jobs'
	  | 'all'
  | 'due_now'
  | 'overdue'
  | 'due_today'
  | 'waiting'
  | 'pickup'
  | 'urgent'
  | 'complaints'
  | 'unassigned'
  | 'recent'
  | 'no_next_step'

type JobSlaTab = 'all' | 'approval_aging' | 'overdue_visit' | 'no_contractor' | 'urgent'
type InboxDensity = 'comfortable' | 'compact'

type QueueFilterState = {
  search: string
  statusFilter: string
  priorityFilter: string
  tab: QueueTab
}

const WAITING_ON_LABELS: Record<WaitingOn, string> = {
  none: 'No one',
  tenant: 'Tenant',
  landlord: 'Landlord',
  contractor: 'Contractor',
  internal: 'Internal team',
}

function badgeClass(value: string | null, type: 'priority' | 'status' | 'handoff') {
  if (type === 'priority') {
    if (value === 'urgent') return 'bg-red-100 text-red-700 border-red-200'
    if (value === 'high') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (value === 'medium') return 'bg-sky-100 text-sky-700 border-sky-200'
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  if (type === 'status') {
    if (value === 'open') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (value === 'in_progress') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (value === 'resolved') return 'bg-violet-100 text-violet-700 border-violet-200'
    if (value === 'closed') return 'bg-stone-200 text-stone-700 border-stone-300'
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  return 'bg-rose-100 text-rose-700 border-rose-200'
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

function formatMoney(value: number | string | null | undefined) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : 0

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatLabel(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

function buildAddress(property: PropertyRow | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.phone || contact.email || 'Unknown'
}

function isOpenMaintenance(status: string) {
  return !['completed', 'cancelled'].includes(status)
}

function needsMaintenanceApproval(job: Pick<MaintenanceJobRow, 'status' | 'landlord_approval_required'>) {
  return job.status === 'awaiting_approval' || job.landlord_approval_required
}

const APPROVAL_AGING_HOURS = 24

function isApprovalAging(job: Pick<MaintenanceJobRow, 'updated_at' | 'created_at' | 'status' | 'landlord_approval_required'>) {
  if (!needsMaintenanceApproval(job)) return false
  const base = job.updated_at ?? job.created_at
  if (!base) return false
  const ageMs = Date.now() - new Date(base).getTime()
  return ageMs >= APPROVAL_AGING_HOURS * 60 * 60 * 1000
}

function isOverdueVisit(job: Pick<MaintenanceJobRow, 'status' | 'scheduled_for'>) {
  if (!job.scheduled_for) return false
  if (['completed', 'cancelled'].includes(job.status)) return false
  return new Date(job.scheduled_for).getTime() < Date.now()
}

function formatShortDateTime(value: string | null) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildFollowUpIso(daysFromNow: number, hour = 9, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function toLocalDatetimeInputValue(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromLocalDatetimeInputValue(value: string) {
  if (!value.trim()) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getFollowUpState(item: Pick<CaseRow, 'next_action_at' | 'waiting_on' | 'waiting_reason'>) {
  const waitingOn = item.waiting_on && item.waiting_on !== 'none' ? item.waiting_on : null
  const waitingLabel = waitingOn ? WAITING_ON_LABELS[waitingOn] : null
  const waitingReason = item.waiting_reason?.trim() || null

  if (item.next_action_at) {
    const dueAt = new Date(item.next_action_at)
    const now = new Date()

    if (dueAt.getTime() <= now.getTime()) {
      return {
        bucket: 'overdue' as const,
        label: 'Follow-up overdue',
        detail: `Due ${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • waiting on ${waitingLabel.toLowerCase()}` : ''}`,
        className: 'border-red-200 bg-red-50 text-red-700',
      }
    }

    if (isSameLocalDay(dueAt, now)) {
      return {
        bucket: 'today' as const,
        label: 'Due today',
        detail: `${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • waiting on ${waitingLabel.toLowerCase()}` : ''}`,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      }
    }

    return {
      bucket: 'future' as const,
      label: 'Next step booked',
      detail: `${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • waiting on ${waitingLabel.toLowerCase()}` : ''}`,
      className: 'border-sky-200 bg-sky-50 text-sky-800',
    }
  }

  if (waitingLabel) {
    return {
      bucket: 'waiting' as const,
      label: `Waiting on ${waitingLabel.toLowerCase()}`,
      detail: waitingReason || 'No timed follow-up is set yet.',
      className: 'border-stone-200 bg-stone-50 text-stone-700',
    }
  }

  return {
    bucket: 'none' as const,
    label: 'No next step set',
    detail: 'Set a follow-up date or a waiting status so this case does not drift.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  }
}

function getQueueRank(item: CaseRow) {
  const followUp = getFollowUpState(item)

  if (followUp.bucket === 'overdue') return 0
  if (followUp.bucket === 'today') return 1
  if (item.priority === 'urgent') return 2
  if (item.priority === 'high') return 3
  if (item.needs_human_handoff) return 4
  if (followUp.bucket === 'waiting') return 5
  if (followUp.bucket === 'future') return 6
  return 7
}

function compareCasesForQueue(left: CaseRow, right: CaseRow) {
  const rankDiff = getQueueRank(left) - getQueueRank(right)
  if (rankDiff !== 0) return rankDiff

  const leftActivity = new Date(left.last_customer_message_at ?? left.created_at ?? 0).getTime()
  const rightActivity = new Date(right.last_customer_message_at ?? right.created_at ?? 0).getTime()

  return leftActivity - rightActivity
}

function getResponseHealth(priority: string | null, lastCustomerMessageAt: string | null) {
  if (!lastCustomerMessageAt) {
    return {
      label: 'No customer wait',
      detail: 'Nothing inbound is currently waiting for a reply.',
      className: 'border-stone-200 bg-stone-50 text-stone-700',
    }
  }

  const ageHours = (Date.now() - new Date(lastCustomerMessageAt).getTime()) / 3600000
  const threshold = priority === 'urgent' ? 1 : priority === 'high' ? 4 : 12

  if (ageHours >= threshold) {
    return {
      label: 'Needs attention',
      detail: 'The customer has been waiting longer than the target response window.',
      className: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  return {
    label: 'Healthy',
    detail: 'The latest customer activity is still within the response window.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
}


function matchesQueueFilters(item: CaseRow, filters: QueueFilterState) {
  const q = filters.search.trim().toLowerCase()
  const followUp = getFollowUpState(item)

  const matchesSearch =
    q === '' ||
    item.case_number?.toLowerCase().includes(q) ||
    item.summary?.toLowerCase().includes(q) ||
    item.case_type?.toLowerCase().includes(q) ||
    item.contact_name?.toLowerCase().includes(q) ||
    item.contact_phone?.toLowerCase().includes(q) ||
    item.postcode?.toLowerCase().includes(q) ||
    item.waiting_reason?.toLowerCase().includes(q)

  const matchesStatus = filters.statusFilter === 'all' || item.status === filters.statusFilter
  const matchesPriority =
    filters.priorityFilter === 'all' || item.priority === filters.priorityFilter

  const matchesTab =
    filters.tab === 'all' ||
    (filters.tab === 'due_now' &&
      (followUp.bucket === 'overdue' || followUp.bucket === 'today')) ||
    (filters.tab === 'overdue' && followUp.bucket === 'overdue') ||
    (filters.tab === 'due_today' && followUp.bucket === 'today') ||
    (filters.tab === 'waiting' && followUp.bucket === 'waiting') ||
    (filters.tab === 'pickup' &&
      (!item.assigned_user_name || item.needs_human_handoff || item.priority === 'urgent')) ||
    (filters.tab === 'urgent' && item.priority === 'urgent') ||
    (filters.tab === 'complaints' && item.case_type === 'complaint') ||
    (filters.tab === 'unassigned' && !item.assigned_user_name) ||
    (filters.tab === 'recent' && !!item.last_customer_message_at) ||
    (filters.tab === 'no_next_step' && followUp.bucket === 'none')

  return matchesSearch && matchesStatus && matchesPriority && matchesTab
}

export default function HomePage() {
  const router = useRouter()
  const queuePanelRef = useRef<HTMLElement | null>(null)

  const { operator, authLoading, authError } = useOperatorGate({
    unauthenticatedMode: 'allow-null',
  })
  const [cases, setCases] = useState<CaseRow[]>([])
  const [jobs, setJobs] = useState<MaintenanceJobRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [contractors, setContractors] = useState<ContractorRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [selectedCaseTenancies, setSelectedCaseTenancies] = useState<QueueTenancyRow[]>([])
  const [selectedCaseCalls, setSelectedCaseCalls] = useState<QueueCallRow[]>([])
  const [selectedCaseMaintenance, setSelectedCaseMaintenance] = useState<QueueMaintenanceRow[]>([])
  const [selectedCaseRentEntries, setSelectedCaseRentEntries] = useState<QueueRentEntryRow[]>([])
  const [selectedCaseLeaseEvents, setSelectedCaseLeaseEvents] = useState<QueueLeaseEventRow[]>([])
  const [selectedCaseDepositClaims, setSelectedCaseDepositClaims] = useState<QueueDepositClaimRow[]>([])
  const [selectedCaseContext, setSelectedCaseContext] = useState<SelectedCaseContextRow | null>(null)

  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [caseContextLoading, setCaseContextLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [tab, setTab] = useState<QueueTab>('jobs')
  const [jobSlaTab, setJobSlaTab] = useState<JobSlaTab>('all')
  const [inboxDensity, setInboxDensity] = useState<InboxDensity>(() => {
    if (typeof window === 'undefined') return 'comfortable'
    const saved = window.localStorage.getItem('maintenance_inbox_density')
    return saved === 'compact' || saved === 'comfortable' ? saved : 'comfortable'
  })
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const [followUpAvailable, setFollowUpAvailable] = useState(true)
  const [creatingLedger, setCreatingLedger] = useState(false)
  const [creatingRenewal, setCreatingRenewal] = useState(false)
  const [creatingMaintenance, setCreatingMaintenance] = useState(false)
  const [operationsPulse, setOperationsPulse] = useState<OperationsPulseState>({
	    maintenanceLive: 0,
	    maintenanceApproval: 0,
	    maintenanceScheduled: 0,
	    complianceRisk: 0,
	    complianceSoon: 0,
	  })
  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadCasesAndUsers = useEffectEvent(async (options?: { preserveLoading?: boolean }) => {
    if (!operatorUserId) return

    if (!options?.preserveLoading) {
      setLoading(true)
    }

    const [
      { data: caseData, error: caseError },
      { data: userData, error: userError },
      { data: contactsData, error: contactsError },
      { data: propertiesData, error: propertiesError },
      { data: contractorsData, error: contractorsError },
      { data: jobsData, error: jobsError },
    ] =
      await Promise.all([
        supabase
          .from('v_cases_list')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('users_profiles')
          .select('id, full_name')
          .eq('is_active', true)
          .order('full_name', { ascending: true }),
        supabase
          .from('contacts')
          .select('id, full_name, phone, email, company_name')
          .order('updated_at', { ascending: false })
          .limit(1200),
        supabase
          .from('properties')
          .select('id, address_line_1, address_line_2, city, postcode')
          .order('updated_at', { ascending: false })
          .limit(1200),
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
          .limit(250),
      ])

    const firstError = [caseError, userError, contactsError, propertiesError, contractorsError, jobsError].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const rows = (caseData || []) as CaseRow[]
    let mergedRows = rows

    if (rows.length > 0) {
      const { data: followUpData, error: followUpError } = await supabase
        .from('cases')
        .select('id, next_action_at, waiting_on, waiting_reason')
        .in('id', rows.map((item) => item.id))

      if (followUpError) {
        setFollowUpAvailable(false)
      } else {
        setFollowUpAvailable(true)
        const followUpMap = new Map(
          ((followUpData || []) as FollowUpRow[]).map((item) => [item.id, item])
        )

        mergedRows = rows.map((item) => {
          const followUp = followUpMap.get(item.id)

          return {
            ...item,
            next_action_at: followUp?.next_action_at ?? null,
            waiting_on: followUp?.waiting_on ?? 'none',
            waiting_reason: followUp?.waiting_reason ?? null,
          }
        })
      }
    } else {
      setFollowUpAvailable(true)
    }

    const jobRows = (jobsData || []) as MaintenanceJobRow[]
    const nextSelectedJobId =
      selectedJobId !== null && jobRows.some((item) => item.id === selectedJobId)
        ? selectedJobId
        : (jobRows[0]?.id ?? null)
    const nextSelectedJob = nextSelectedJobId !== null ? jobRows.find((item) => item.id === nextSelectedJobId) ?? null : null

    setCases(mergedRows)
    setJobs(jobRows)
    setUsers((userData || []) as UserRow[])
    setContacts((contactsData || []) as ContactRow[])
    setProperties((propertiesData || []) as PropertyRow[])
    setContractors((contractorsData || []) as ContractorRow[])

    setSelectedJobId(nextSelectedJobId)

    setSelectedCaseId((current) => {
      const nextFromJobs = nextSelectedJob?.case_id ?? null
      const nextFromCases = mergedRows[0]?.id ?? null

      if (tab === 'jobs') return nextFromJobs ?? nextFromCases

      return current && mergedRows.some((item) => item.id === current) ? current : nextFromCases
    })
    setLoading(false)
  })

  function setInboxDensityPersisted(density: InboxDensity) {
    setInboxDensity(density)
    if (typeof window === 'undefined') return
    window.localStorage.setItem('maintenance_inbox_density', density)
  }

  const loadMessagesForCase = useEffectEvent(async (caseId: string) => {
    setMessagesLoading(true)

    const { data, error: messagesError } = await supabase
      .from('messages')
      .select('id, message_text, sender_type, direction, channel, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      setActionMessage(`Error loading messages: ${messagesError.message}`)
      setMessagesLoading(false)
      return
    }

    setMessages((data || []) as MessageRow[])
    setMessagesLoading(false)
  })

  const loadSelectedCaseContext = useEffectEvent(async (caseId: string) => {
    setCaseContextLoading(true)

    const { data: baseCase, error: baseCaseError } = await supabase
      .from('cases')
      .select('id, tenancy_id, property_id, contact_id')
      .eq('id', caseId)
      .maybeSingle()

    if (baseCaseError) {
      setActionMessage(`Error loading CRM context: ${baseCaseError.message}`)
      setCaseContextLoading(false)
      return
    }

    setSelectedCaseContext((baseCase as SelectedCaseContextRow) ?? null)

    const tenancyResponse = baseCase?.tenancy_id
      ? supabase
          .from('tenancies')
          .select('id, property_id, status, tenancy_status, end_date')
          .eq('id', baseCase.tenancy_id)
      : baseCase?.property_id
        ? supabase
            .from('tenancies')
            .select('id, property_id, status, tenancy_status, end_date')
            .eq('property_id', baseCase.property_id)
            .order('updated_at', { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [], error: null })

    const { data: tenancyData, error: tenancyError } = await tenancyResponse

    if (tenancyError) {
      setActionMessage(`Error loading tenancy context: ${tenancyError.message}`)
      setCaseContextLoading(false)
      return
    }

    const safeTenancies = (tenancyData || []) as QueueTenancyRow[]
    const tenancyIds = Array.from(new Set(safeTenancies.map((item) => item.id).filter(Boolean)))

    const rentEntriesResponse = tenancyIds.length
      ? supabase
          .from('rent_ledger_entries')
          .select('id, tenancy_id, case_id, entry_type, status, amount, due_date, posted_at, category')
          .in('tenancy_id', tenancyIds)
          .order('posted_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null })

    const leaseEventsResponse = tenancyIds.length
      ? supabase
          .from('lease_lifecycle_events')
          .select('id, tenancy_id, case_id, event_type, status, scheduled_for, completed_at')
          .in('tenancy_id', tenancyIds)
          .order('scheduled_for', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null })

    const depositClaimsResponse = tenancyIds.length
      ? supabase
          .from('deposit_claims')
          .select('id, tenancy_id, case_id, claim_status, disputed_amount, total_claim_amount, updated_at')
          .in('tenancy_id', tenancyIds)
          .order('updated_at', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null })

    const [
      { data: callData, error: callError },
      { data: maintenanceData, error: maintenanceError },
      { data: rentEntriesData, error: rentEntriesError },
      { data: leaseEventsData, error: leaseEventsError },
      { data: depositClaimsData, error: depositClaimsError },
    ] = await Promise.all([
      supabase
        .from('call_sessions')
        .select('id, created_at, last_event_at, direction, status, outcome')
        .eq('case_id', caseId)
        .order('last_event_at', { ascending: false })
        .limit(6),
      supabase
        .from('maintenance_requests')
        .select('id, case_id, tenancy_id, property_id, issue_type, priority, status, scheduled_for, updated_at')
        .eq('case_id', caseId)
        .order('updated_at', { ascending: false })
        .limit(6),
      rentEntriesResponse,
      leaseEventsResponse,
      depositClaimsResponse,
    ])

    if (callError || maintenanceError || rentEntriesError || leaseEventsError || depositClaimsError) {
      setActionMessage(
        `Error loading CRM context: ${
          callError?.message ||
          maintenanceError?.message ||
          rentEntriesError?.message ||
          leaseEventsError?.message ||
          depositClaimsError?.message ||
          'Unknown error'
        }`
      )
      setCaseContextLoading(false)
      return
    }

    setSelectedCaseTenancies(safeTenancies)
    setSelectedCaseCalls((callData || []) as QueueCallRow[])
    setSelectedCaseMaintenance((maintenanceData || []) as QueueMaintenanceRow[])
    setSelectedCaseRentEntries((rentEntriesData || []) as QueueRentEntryRow[])
    setSelectedCaseLeaseEvents((leaseEventsData || []) as QueueLeaseEventRow[])
    setSelectedCaseDepositClaims((depositClaimsData || []) as QueueDepositClaimRow[])
    setCaseContextLoading(false)
  })

	  const loadOperationsPulse = useEffectEvent(async () => {
	    const [maintenanceResponse, complianceResponse] = await Promise.all([
	      supabase
	        .from('maintenance_requests')
	        .select('status, landlord_approval_required, scheduled_for')
	        .limit(1000),
	      supabase.from('compliance_records').select('status').limit(1000),
	    ])

	    if (maintenanceResponse.error || complianceResponse.error) {
	      return
	    }

	    const maintenanceRows = (maintenanceResponse.data || []) as MaintenancePulseRow[]
	    const complianceRows = (complianceResponse.data || []) as CompliancePulseRow[]

	    setOperationsPulse({
	      maintenanceLive: maintenanceRows.filter(
	        (request) => !['completed', 'cancelled'].includes(request.status)
	      ).length,
      maintenanceApproval: maintenanceRows.filter(
        (request) =>
          request.status === 'awaiting_approval' || request.landlord_approval_required
      ).length,
      maintenanceScheduled: maintenanceRows.filter(
        (request) =>
          ['approved', 'scheduled', 'in_progress'].includes(request.status) &&
          !!request.scheduled_for
      ).length,
      complianceRisk: complianceRows.filter((record) =>
        ['expired', 'missing'].includes(record.status)
      ).length,
	      complianceSoon: complianceRows.filter((record) =>
	        ['expiring', 'pending'].includes(record.status)
	      ).length,
	    })
	  })

  useEffect(() => {
    if (!operatorUserId) return

    async function loadCases() {
      setError(null)
      await loadCasesAndUsers()
    }

    loadCases()
  }, [operatorUserId])

  useEffect(() => {
    if (!operatorUserId) return
    void loadOperationsPulse()
  }, [operatorUserId])

  useEffect(() => {
    if (!selectedCaseId || !operatorUserId) {
      return
    }

    async function loadCaseWorkspace() {
      const caseId = selectedCaseId
      if (!caseId) return
      await Promise.all([loadMessagesForCase(caseId), loadSelectedCaseContext(caseId)])
    }

    loadCaseWorkspace()
  }, [selectedCaseId, operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])
  const contractorById = useMemo(
    () => new Map(contractors.map((contractor) => [contractor.id, contractor])),
    [contractors]
  )

  const selectedJob = useMemo(
    () => (selectedJobId !== null ? jobs.find((job) => job.id === selectedJobId) ?? null : null),
    [jobs, selectedJobId]
  )

  useEffect(() => {
    if (!operatorUserId) return

    let liveTimeout: ReturnType<typeof setTimeout> | null = null

    function showLiveMessage(message: string) {
      setLiveMessage(message)

      if (liveTimeout) {
        clearTimeout(liveTimeout)
      }

      liveTimeout = setTimeout(() => {
        setLiveMessage(null)
      }, 2500)
    }

    const queueChannel = supabase
      .channel(`dashboard-queue-${operatorUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        async () => {
          await loadCasesAndUsers({ preserveLoading: true })
          showLiveMessage('Queue refreshed from live case updates.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async () => {
          await loadCasesAndUsers({ preserveLoading: true })
          showLiveMessage('Queue refreshed from live message activity.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users_profiles' },
        async () => {
          await loadCasesAndUsers({ preserveLoading: true })
          showLiveMessage('Manager list refreshed.')
        }
      )

    queueChannel.subscribe()

    return () => {
      if (liveTimeout) {
        clearTimeout(liveTimeout)
      }

      supabase.removeChannel(queueChannel)
    }
  }, [operatorUserId])

  useEffect(() => {
    if (!selectedCaseId || !operatorUserId) return

    let liveTimeout: ReturnType<typeof setTimeout> | null = null

    function showLiveMessage(message: string) {
      setLiveMessage(message)

      if (liveTimeout) {
        clearTimeout(liveTimeout)
      }

      liveTimeout = setTimeout(() => {
        setLiveMessage(null)
      }, 2500)
    }

    const messageChannel = supabase
      .channel(`dashboard-case-${selectedCaseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${selectedCaseId}`,
        },
        async () => {
          await loadMessagesForCase(selectedCaseId)
          await loadSelectedCaseContext(selectedCaseId)
          await loadCasesAndUsers({ preserveLoading: true })
          showLiveMessage('Timeline refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions', filter: `case_id=eq.${selectedCaseId}` },
        async () => {
          await loadSelectedCaseContext(selectedCaseId)
          showLiveMessage('Call context refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests', filter: `case_id=eq.${selectedCaseId}` },
        async () => {
          await loadSelectedCaseContext(selectedCaseId)
          showLiveMessage('Maintenance context refreshed live.')
        }
      )

    messageChannel.subscribe()

    return () => {
      if (liveTimeout) {
        clearTimeout(liveTimeout)
      }

      supabase.removeChannel(messageChannel)
    }
  }, [selectedCaseId, operatorUserId])

  const kpis = useMemo(() => {
    if (tab === 'jobs') {
      return {
        total: jobs.length,
        open: jobs.filter((job) => isOpenMaintenance(job.status)).length,
        urgent: jobs.filter((job) => job.priority === 'urgent').length,
        handoff: jobs.filter((job) => needsMaintenanceApproval(job)).length,
        unassigned: jobs.filter((job) => !job.contractor_id).length,
      }
    }

    return {
      total: cases.length,
      open: cases.filter((item) => item.status === 'open').length,
      urgent: cases.filter((item) => item.priority === 'urgent').length,
      handoff: cases.filter((item) => item.needs_human_handoff).length,
      unassigned: cases.filter((item) => !item.assigned_user_name).length,
    }
  }, [cases, jobs, tab])

  const todayAgenda = useMemo(() => {
    if (tab === 'jobs') {
      const items = jobs
        .filter((job) => {
          if (!isOpenMaintenance(job.status)) return false
          if (job.priority === 'urgent') return true
          if (needsMaintenanceApproval(job)) return true
          if (job.status === 'scheduled') return true
          return false
        })
        .sort((left, right) => {
          const leftRank = left.priority === 'urgent' ? 0 : needsMaintenanceApproval(left) ? 1 : left.status === 'scheduled' ? 2 : 3
          const rightRank = right.priority === 'urgent' ? 0 : needsMaintenanceApproval(right) ? 1 : right.status === 'scheduled' ? 2 : 3
          if (leftRank !== rightRank) return leftRank - rightRank

          const leftTime = new Date(left.scheduled_for ?? left.updated_at ?? left.created_at ?? 0).getTime()
          const rightTime = new Date(right.scheduled_for ?? right.updated_at ?? right.created_at ?? 0).getTime()
          return leftTime - rightTime
        })
        .slice(0, 8)

      const dueNowCount = jobs.filter((job) => needsMaintenanceApproval(job)).length
      const scheduledCount = jobs.filter((job) => job.status === 'scheduled' || job.status === 'approved' || job.status === 'in_progress').length
      const awaitingOwnerCount = jobs.filter((job) => !job.contractor_id).length

      return {
        dueNowCount,
        scheduledCount,
        awaitingOwnerCount,
        items: items.map((job) => {
          const property = job.property_id ? propertyById.get(job.property_id) ?? null : null
          const contractor = job.contractor_id ? contractorById.get(job.contractor_id) ?? null : null
          const lane = job.priority === 'urgent' ? 'Urgent repair' : needsMaintenanceApproval(job) ? 'Approval needed' : job.status === 'scheduled' ? 'Booked visit' : 'Live job'

          return {
            id: String(job.id),
            caseNumber: `JOB-${job.id}`,
            title: job.description?.trim() || `${formatLabel(job.issue_type)} maintenance`,
            lane,
            timing: job.scheduled_for ? formatShortDateTime(job.scheduled_for) : formatRelativeTime(job.updated_at ?? job.created_at),
            owner: contractor?.company_name?.trim() || 'Unassigned',
            meta: buildAddress(property),
            href: job.case_id ? `/cases/${job.case_id}` : undefined,
          }
        }),
      }
    }

    const items = cases
      .filter((item) => {
        const followUp = getFollowUpState(item)
        return (
          followUp.bucket === 'overdue' ||
          followUp.bucket === 'today' ||
          item.status === 'scheduled' ||
          item.priority === 'urgent' ||
          !!item.last_customer_message_at
        )
      })
      .sort((left, right) => {
        const leftFollowUp = getFollowUpState(left)
        const rightFollowUp = getFollowUpState(right)
        const leftRank = leftFollowUp.bucket === 'overdue' ? 0 : leftFollowUp.bucket === 'today' ? 1 : left.priority === 'urgent' ? 2 : left.status === 'scheduled' ? 3 : 4
        const rightRank = rightFollowUp.bucket === 'overdue' ? 0 : rightFollowUp.bucket === 'today' ? 1 : right.priority === 'urgent' ? 2 : right.status === 'scheduled' ? 3 : 4
        if (leftRank !== rightRank) return leftRank - rightRank

        const leftTime = new Date(left.next_action_at ?? left.last_customer_message_at ?? left.created_at ?? 0).getTime()
        const rightTime = new Date(right.next_action_at ?? right.last_customer_message_at ?? right.created_at ?? 0).getTime()
        return leftTime - rightTime
      })
      .slice(0, 8)

    const dueNowCount = cases.filter((item) => {
      const bucket = getFollowUpState(item).bucket
      return bucket === 'overdue' || bucket === 'today'
    }).length

    const scheduledCount = cases.filter((item) => item.status === 'scheduled').length
    const awaitingOwnerCount = cases.filter((item) => !item.assigned_user_name || item.needs_human_handoff).length

    return {
      dueNowCount,
      scheduledCount,
      awaitingOwnerCount,
      items: items.map((item) => {
        const followUp = getFollowUpState(item)
        const timing = item.next_action_at
          ? formatShortDateTime(item.next_action_at)
          : item.last_customer_message_at
            ? `Latest reply ${formatRelativeTime(item.last_customer_message_at)}`
            : formatRelativeTime(item.created_at)

        const lane = followUp.bucket === 'overdue' || followUp.bucket === 'today'
          ? followUp.label
          : item.status === 'scheduled'
            ? 'Scheduled work'
            : item.priority === 'urgent'
              ? 'Urgent review'
              : 'Fresh inbound'

        return {
          id: item.id,
          caseNumber: item.case_number,
          title: item.summary || item.contact_name || item.contact_phone || 'Case activity',
          lane,
          timing,
          owner: item.assigned_user_name || 'Unassigned',
          meta: `${item.case_type || 'general'} • ${item.postcode || 'no postcode'}`,
          href: `/cases/${item.id}`,
        }
      }),
    }
  }, [cases, contractorById, jobs, propertyById, tab])

	  const operationsPulseCards = useMemo(
	    () => [
	      {
        label: 'Maintenance',
        value: operationsPulse.maintenanceLive,
        helper:
          operationsPulse.maintenanceApproval > 0
            ? `${operationsPulse.maintenanceApproval} waiting approval`
            : `${operationsPulse.maintenanceScheduled} scheduled`,
        tone:
          operationsPulse.maintenanceApproval > 0
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-sky-200 bg-sky-50 text-sky-900',
      },
      {
        label: 'Compliance',
        value: operationsPulse.complianceRisk,
        helper:
          operationsPulse.complianceSoon > 0
            ? `${operationsPulse.complianceSoon} expiring soon`
            : 'No pending pressure',
        tone:
          operationsPulse.complianceRisk > 0
            ? 'border-red-200 bg-red-50 text-red-900'
            : 'border-emerald-200 bg-emerald-50 text-emerald-900',
	      },
	    ],
	    [operationsPulse]
	  )


  const kpiCards = useMemo(
    () => [
      {
        label: tab === 'jobs' ? 'Live jobs' : 'Live cases',
        value: kpis.total,
        tone: 'border-stone-200 bg-stone-50 text-stone-900',
        helper: tab === 'jobs' ? 'Everything visible right now' : 'Everything visible right now',
        actionLabel: 'Open whole queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: tab === 'jobs' ? 'jobs' : 'all',
        } satisfies QueueFilterState,
      },
      {
        label: tab === 'jobs' ? 'Open jobs' : 'Open cases',
        value: kpis.open,
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        helper: tab === 'jobs' ? 'Jobs still being worked' : 'Cases still being worked',
        actionLabel: tab === 'jobs' ? 'Show open jobs' : 'Show open cases',
        filters: {
          search: '',
          statusFilter: 'open',
          priorityFilter: 'all',
          tab: tab === 'jobs' ? 'jobs' : 'all',
        } satisfies QueueFilterState,
      },
      {
        label: 'Urgent',
        value: kpis.urgent,
        tone: 'border-red-200 bg-red-50 text-red-800',
        helper: tab === 'jobs' ? 'Jobs needing attention first' : 'Cases needing attention first',
        actionLabel: tab === 'jobs' ? 'Show urgent jobs' : 'Show urgent queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'urgent',
          tab: tab === 'jobs' ? 'jobs' : 'urgent',
        } satisfies QueueFilterState,
      },
      {
        label: tab === 'jobs' ? 'Unassigned contractor' : 'Unassigned',
        value: kpis.unassigned,
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        helper: tab === 'jobs' ? 'No contractor set yet' : 'No owner set yet',
        actionLabel: tab === 'jobs' ? 'Show unassigned jobs' : 'Show unassigned queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: tab === 'jobs' ? 'jobs' : 'unassigned',
        } satisfies QueueFilterState,
      },
    ],
    [kpis, tab]
  )

  const caseById = useMemo(() => new Map(cases.map((item) => [item.id, item])), [cases])

  const jobSlaCounts = useMemo(() => {
    return {
      all: jobs.length,
      approval_aging: jobs.filter((job) => isApprovalAging(job)).length,
      overdue_visit: jobs.filter((job) => isOverdueVisit(job)).length,
      no_contractor: jobs.filter((job) => isOpenMaintenance(job.status) && !job.contractor_id).length,
      urgent: jobs.filter((job) => job.priority === 'urgent' && isOpenMaintenance(job.status)).length,
    }
  }, [jobs])

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()

    return jobs
      .filter((job) => {
        if (jobSlaTab === 'approval_aging' && !isApprovalAging(job)) return false
        if (jobSlaTab === 'overdue_visit' && !isOverdueVisit(job)) return false
        if (jobSlaTab === 'no_contractor' && !!job.contractor_id) return false
        if (jobSlaTab === 'urgent' && job.priority !== 'urgent') return false

        if (priorityFilter !== 'all' && job.priority !== priorityFilter) return false
        if (statusFilter !== 'all' && job.status !== statusFilter) return false

        if (!query) return true

        const property = job.property_id ? propertyById.get(job.property_id) ?? null : null
        const reporter = job.reported_by_contact_id ? contactById.get(job.reported_by_contact_id) ?? null : null
        const contractor = job.contractor_id ? contractorById.get(job.contractor_id) ?? null : null
        const linkedCase = job.case_id ? caseById.get(job.case_id) ?? null : null

        return (
          String(job.id).includes(query) ||
          formatLabel(job.issue_type).toLowerCase().includes(query) ||
          job.subcategory?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          buildAddress(property).toLowerCase().includes(query) ||
          getContactName(reporter).toLowerCase().includes(query) ||
          contractor?.company_name?.toLowerCase().includes(query) ||
          contractor?.primary_trade?.toLowerCase().includes(query) ||
          linkedCase?.case_number?.toLowerCase().includes(query) ||
          linkedCase?.postcode?.toLowerCase().includes(query)
        )
      })
      .sort((left, right) => {
        const leftTime = new Date(left.updated_at ?? left.created_at ?? 0).getTime()
        const rightTime = new Date(right.updated_at ?? right.created_at ?? 0).getTime()
        return rightTime - leftTime
      })
  }, [caseById, contactById, contractorById, jobSlaTab, jobs, priorityFilter, propertyById, search, statusFilter])

  const filteredCases = useMemo(() => {
    return cases
      .filter((item) => matchesQueueFilters(item, { search, statusFilter, priorityFilter, tab }))
      .sort(compareCasesForQueue)
  }, [cases, search, statusFilter, priorityFilter, tab])

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === selectedCaseId) || null,
    [cases, selectedCaseId]
  )

  const selectedCaseResponseHealth = useMemo(
    () =>
      getResponseHealth(
        selectedCase?.priority ?? null,
        selectedCase?.last_customer_message_at ?? null
      ),
    [selectedCase]
  )

  const selectedCaseLastActivity = useMemo(
    () => formatRelativeTime(selectedCase?.last_customer_message_at ?? selectedCase?.created_at ?? null),
    [selectedCase]
  )

  const selectedCaseFollowUp = useMemo(
    () =>
      getFollowUpState({
        next_action_at: selectedCase?.next_action_at ?? null,
        waiting_on: selectedCase?.waiting_on ?? 'none',
        waiting_reason: selectedCase?.waiting_reason ?? null,
      }),
    [selectedCase]
  )

  const selectedTimelinePreview = useMemo(() => messages.slice(-4).reverse(), [messages])

  const selectedCaseContextSummary = useMemo(
    () => ({
      openCharges: selectedCaseRentEntries.filter(
        (entry) => entry.status === 'open' && entry.entry_type === 'charge'
      ).length,
      dueLeaseEvents: selectedCaseLeaseEvents.filter((event) => event.status === 'due').length,
      maintenanceLive: selectedCaseMaintenance.filter(
        (item) => !['completed', 'cancelled'].includes(item.status || '')
      ).length,
      disputedDeposits: selectedCaseDepositClaims.filter(
        (claim) => claim.claim_status === 'disputed'
      ).length,
    }),
    [selectedCaseDepositClaims, selectedCaseLeaseEvents, selectedCaseMaintenance, selectedCaseRentEntries]
  )

  const selectedCaseActivityFeed = useMemo<QueueActivityItem[]>(() => {
    const items: QueueActivityItem[] = []

    for (const message of selectedTimelinePreview) {
      items.push({
        id: `message-${message.id}`,
        sortAt: message.created_at,
        label: `${formatLabel(message.direction)} message`,
        meta: [message.channel || 'message', message.sender_type || 'unknown sender'].join(' • '),
        body: message.message_text || '-',
        tone:
          message.direction === 'outbound'
            ? 'border-sky-200 bg-sky-50'
            : message.direction === 'internal'
              ? 'border-stone-200 bg-stone-50'
              : 'border-emerald-200 bg-emerald-50',
        href: selectedCase ? `/cases/${selectedCase.id}` : undefined,
      })
    }

    for (const call of selectedCaseCalls) {
      items.push({
        id: `call-${call.id}`,
        sortAt: call.last_event_at || call.created_at,
        label: `${formatLabel(call.direction)} call`,
        meta: [formatLabel(call.status), call.outcome ? formatLabel(call.outcome) : null].filter(Boolean).join(' • '),
        body: 'Call activity linked to this case.',
        tone:
          call.status === 'completed'
            ? 'border-sky-200 bg-sky-50'
            : call.status === 'failed' || call.status === 'abandoned'
              ? 'border-red-200 bg-red-50'
              : 'border-emerald-200 bg-emerald-50',
        href: '/calls',
      })
    }

    for (const item of selectedCaseMaintenance) {
      items.push({
        id: `maintenance-${item.id}`,
        sortAt: item.updated_at || item.scheduled_for,
        label: `${formatLabel(item.issue_type)} maintenance`,
        meta: [formatLabel(item.status), item.priority ? `${formatLabel(item.priority)} priority` : null].filter(Boolean).join(' • '),
        body: 'Maintenance workflow is linked to this case.',
        tone:
          item.status === 'completed'
            ? 'border-emerald-200 bg-emerald-50'
            : item.status === 'awaiting_approval'
              ? 'border-amber-200 bg-amber-50'
              : 'border-sky-200 bg-sky-50',
      })
    }

    for (const entry of selectedCaseRentEntries.slice(0, 3)) {
      items.push({
        id: `rent-${entry.id}`,
        sortAt: entry.posted_at || entry.due_date,
        label: `${formatLabel(entry.entry_type)} ledger item`,
        meta: [formatMoney(entry.amount), formatLabel(entry.status), entry.category ? formatLabel(entry.category) : null].filter(Boolean).join(' • '),
        body: 'Tenancy ledger movement visible from the queue.',
        tone:
          entry.status === 'open' && entry.entry_type === 'charge'
            ? 'border-red-200 bg-red-50'
            : entry.status === 'cleared'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50',
      })
    }

    for (const event of selectedCaseLeaseEvents.slice(0, 3)) {
      items.push({
        id: `lease-${event.id}`,
        sortAt: event.completed_at || event.scheduled_for,
        label: `${formatLabel(event.event_type)} lease event`,
        meta: [formatLabel(event.status), event.scheduled_for ? formatShortDateTime(event.scheduled_for) : null].filter(Boolean).join(' • '),
        body: 'Lease lifecycle activity tied to this tenancy.',
        tone:
          event.status === 'due'
            ? 'border-red-200 bg-red-50'
            : event.status === 'completed'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-sky-200 bg-sky-50',
      })
    }

    for (const claim of selectedCaseDepositClaims.slice(0, 2)) {
      items.push({
        id: `deposit-${claim.id}`,
        sortAt: claim.updated_at,
        label: 'Deposit claim',
        meta: [formatLabel(claim.claim_status), formatMoney(claim.disputed_amount || claim.total_claim_amount)].join(' • '),
        body: claim.claim_status === 'disputed' ? 'Deposit issue needs review.' : 'Deposit activity recorded.',
        tone:
          claim.claim_status === 'disputed'
            ? 'border-red-200 bg-red-50'
            : claim.claim_status === 'resolved'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50',
      })
    }

    return items
      .sort((left, right) => {
        const leftTime = left.sortAt ? new Date(left.sortAt).getTime() : 0
        const rightTime = right.sortAt ? new Date(right.sortAt).getTime() : 0
        return rightTime - leftTime
      })
      .slice(0, 8)
  }, [
    selectedCase,
    selectedCaseCalls,
    selectedCaseDepositClaims,
    selectedCaseLeaseEvents,
    selectedCaseMaintenance,
    selectedCaseRentEntries,
    selectedTimelinePreview,
  ])

  function prefetchCaseDetail(caseId: string | null) {
    if (!caseId) return
    router.prefetch(`/cases/${caseId}`)
  }

  function focusQueue(nextFilters: Partial<QueueFilterState>) {
    const filters: QueueFilterState = {
      search: nextFilters.search ?? '',
      statusFilter: nextFilters.statusFilter ?? 'all',
      priorityFilter: nextFilters.priorityFilter ?? 'all',
      tab: nextFilters.tab ?? 'all',
    }

    setSearch(filters.search)
    setStatusFilter(filters.statusFilter)
    setPriorityFilter(filters.priorityFilter)
    setTab(filters.tab)

    if (filters.tab === 'jobs') {
      const nextJobs = jobs
        .filter((job) => {
          if (filters.priorityFilter !== 'all' && job.priority !== filters.priorityFilter) return false
          if (filters.statusFilter !== 'all' && job.status !== filters.statusFilter) return false
          return true
        })
        .sort((left, right) => {
          const leftTime = new Date(left.updated_at ?? left.created_at ?? 0).getTime()
          const rightTime = new Date(right.updated_at ?? right.created_at ?? 0).getTime()
          return rightTime - leftTime
        })

      const first = nextJobs[0] ?? null
      setSelectedJobId(first?.id ?? null)
      setSelectedCaseId(first?.case_id ?? null)
      return
    }

    const nextQueue = cases.filter((item) => matchesQueueFilters(item, filters)).sort(compareCasesForQueue)

    if (nextQueue[0]?.id) {
      setSelectedCaseId(nextQueue[0].id)
      prefetchCaseDetail(nextQueue[0].id)
    } else {
      setSelectedCaseId(null)
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        queuePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  async function patchSelectedCase(updates: Partial<CaseRow> & Record<string, unknown>, success: string) {
    if (!selectedCase) return

    setActionLoading(true)
    setActionMessage(null)

    const now = new Date().toISOString()
    const payload = {
      ...updates,
      updated_at: now,
      last_activity_at: now,
    }

    const { error: updateError } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', selectedCase.id)

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setActionLoading(false)
      return
    }

    setCases((previous) =>
      previous.map((item) => {
        if (item.id !== selectedCase.id) return item

        const assignedUser =
          'assigned_user_id' in updates
            ? users.find((user) => user.id === updates.assigned_user_id)?.full_name ||
              getOperatorLabel(operator)
            : item.assigned_user_name

        return {
          ...item,
          ...updates,
          assigned_user_name: assignedUser,
        } as CaseRow
      })
    )

    setActionMessage(success)
    setActionLoading(false)
  }

  async function patchSelectedJob(
    updates: Partial<MaintenanceJobRow> & Record<string, unknown>,
    success: string
  ) {
    if (!selectedJob) return

    setActionLoading(true)
    setActionMessage(null)

    const now = new Date().toISOString()
    const payload = {
      ...updates,
      updated_at: now,
    }

    const { data, error: updateError } = await supabase
      .from('maintenance_requests')
      .update(payload)
      .eq('id', selectedJob.id)
      .select(
        'id, created_at, case_id, property_id, tenancy_id, reported_by_contact_id, issue_type, subcategory, description, access_notes, priority, status, contractor_id, scheduled_for, completed_at, landlord_approval_required, estimated_cost, final_cost, updated_at'
      )
      .single()

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setActionLoading(false)
      return
    }

    setJobs((previous) =>
      previous.map((item) => (item.id === selectedJob.id ? ({ ...item, ...(data as MaintenanceJobRow) } as MaintenanceJobRow) : item))
    )

    setActionMessage(success)
    setActionLoading(false)
  }

  async function handleAssignToMe() {
    if (!operator?.profile?.id) {
      setActionMessage('Your signed-in account is missing an active users_profiles record.')
      return
    }

    await patchSelectedCase(
      { assigned_user_id: operator.profile.id },
      `Assigned to ${getOperatorLabel(operator)}.`
    )
  }

  async function handleMarkInProgress() {
    await patchSelectedCase({ status: 'in_progress' }, 'Case marked as in progress.')
  }

  async function handleResolve() {
    await patchSelectedCase({ status: 'resolved' }, 'Case marked as resolved.')
  }

  async function handleSetNextStep(daysFromNow: number, successMessage: string) {
    await patchSelectedCase(
      {
        next_action_at: buildFollowUpIso(daysFromNow),
      },
      successMessage
    )
  }

  async function handleAssignContractor(contractorId: string | null) {
    await patchSelectedJob(
      { contractor_id: contractorId },
      contractorId ? 'Contractor assigned.' : 'Contractor cleared.'
    )
  }

  async function handleRequestLandlordApproval() {
    await patchSelectedJob(
      { status: 'awaiting_approval', landlord_approval_required: true },
      'Landlord approval requested.'
    )
  }

  async function handleBookVisit(formData: FormData) {
    const scheduledFor = String(formData.get('scheduled_for') || '').trim()
    if (!scheduledFor) {
      setActionMessage('Choose a visit date/time first.')
      return
    }

    const iso = fromLocalDatetimeInputValue(scheduledFor)
    if (!iso) {
      setActionMessage('Invalid visit date/time.')
      return
    }

    await patchSelectedJob(
      { scheduled_for: iso, status: 'scheduled' },
      'Visit booked.'
    )
  }

  async function handleMarkJobComplete() {
    const now = new Date().toISOString()
    await patchSelectedJob(
      { status: 'completed', completed_at: now },
      'Job marked complete.'
    )
  }

  async function handleSetWaitingOn(waitingOn: WaitingOn, waitingReason: string, successMessage: string) {
    await patchSelectedCase(
      {
        waiting_on: waitingOn,
        waiting_reason: waitingReason,
        next_action_at: buildFollowUpIso(2),
      },
      successMessage
    )
  }

  async function handleClearNextStep() {
    await patchSelectedCase(
      {
        next_action_at: null,
        waiting_on: 'none',
        waiting_reason: null,
      },
      'Next step cleared.'
    )
  }

  async function handleAssigneeChange(nextAssignedUserId: string) {
    const assignedUser = nextAssignedUserId.trim()

    await patchSelectedCase(
      { assigned_user_id: assignedUser || null },
      assignedUser ? 'Case owner updated.' : 'Case unassigned.'
    )
  }

  async function handleCustomFollowUpSubmit(formData: FormData) {
    const nextActionAt = fromLocalDatetimeInputValue(String(formData.get('next_action_at') || ''))
    const waitingOn = String(formData.get('waiting_on') || 'none') as WaitingOn
    const waitingReason = String(formData.get('waiting_reason') || '').trim() || null

    await patchSelectedCase(
      {
        next_action_at: nextActionAt,
        waiting_on: waitingOn,
        waiting_reason: waitingReason,
      },
      'Follow-up plan updated.'
    )
  }

  async function handleCreateLedgerItem(formData: FormData) {
    if (!selectedCase || !selectedCaseContext?.tenancy_id) {
      setActionMessage('This case is not linked to a tenancy yet, so no accounts item can be created from the queue.')
      return
    }

    const amount = Number(String(formData.get('amount') || ''))
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage('Enter a valid amount before creating an accounts item.')
      return
    }

    setCreatingLedger(true)
    setActionMessage(null)

    const entryType = String(formData.get('entry_type') || 'charge')
    const dueDate = String(formData.get('due_date') || '').trim() || null
    const reference = String(formData.get('reference') || '').trim() || null

    const { data, error } = await supabase
      .from('rent_ledger_entries')
      .insert({
        tenancy_id: selectedCaseContext.tenancy_id,
        case_id: selectedCase.id,
        entry_type: entryType,
        category: entryType === 'payment' ? 'payment' : 'rent',
        status: entryType === 'payment' || entryType === 'credit' ? 'cleared' : 'open',
        amount,
        due_date: dueDate,
        reference,
        notes: `Created from queue for ${selectedCase.case_number}.`,
        period_start: entryType === 'charge' ? dueDate : null,
        period_end: entryType === 'charge' ? dueDate : null,
      })
      .select('id, tenancy_id, case_id, entry_type, status, amount, due_date, posted_at, category')
      .single()

    if (error) {
      setActionMessage(`Error: ${error.message}`)
      setCreatingLedger(false)
      return
    }

    setSelectedCaseRentEntries((current) => [data as QueueRentEntryRow, ...current])
    setActionMessage('Accounts item created.')
    setCreatingLedger(false)
  }

  async function handleCreateRenewalEvent(formData: FormData) {
    if (!selectedCase || !selectedCaseContext?.tenancy_id) {
      setActionMessage('This case is not linked to a tenancy yet, so no end of tenancy event can be created from the queue.')
      return
    }

    const scheduledFor = String(formData.get('scheduled_for') || '').trim()
    if (!scheduledFor) {
      setActionMessage('Choose a target date before creating an end of tenancy event.')
      return
    }

    setCreatingRenewal(true)
    setActionMessage(null)

    const eventType = String(formData.get('event_type') || 'renewal_review')
    const note = String(formData.get('note') || '').trim() || null
    const status = scheduledFor <= new Date().toISOString().slice(0, 10) ? 'due' : 'planned'

    const { data, error } = await supabase
      .from('lease_lifecycle_events')
      .insert({
        tenancy_id: selectedCaseContext.tenancy_id,
        case_id: selectedCase.id,
        event_type: eventType,
        status,
        scheduled_for: scheduledFor,
        source: 'manual',
        note,
      })
      .select('id, tenancy_id, case_id, event_type, status, scheduled_for, completed_at')
      .single()

    if (error) {
      setActionMessage(`Error: ${error.message}`)
      setCreatingRenewal(false)
      return
    }

    setSelectedCaseLeaseEvents((current) => [data as QueueLeaseEventRow, ...current])
    setActionMessage('End of tenancy event created.')
    setCreatingRenewal(false)
  }

  async function handleCreateMaintenanceRequest(formData: FormData) {
    if (!selectedCase || !selectedCaseContext?.property_id) {
      setActionMessage('This case is not linked to a property yet, so no maintenance request can be created from the queue.')
      return
    }

    const issueType = String(formData.get('issue_type') || '').trim()
    const description = String(formData.get('description') || '').trim()

    if (!issueType || !description) {
      setActionMessage('Add an issue type and short description before creating a maintenance request.')
      return
    }

    setCreatingMaintenance(true)
    setActionMessage(null)

    const priority = String(formData.get('priority') || 'medium')

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        case_id: selectedCase.id,
        property_id: selectedCaseContext.property_id,
        tenancy_id: selectedCaseContext.tenancy_id,
        reported_by_contact_id: selectedCaseContext.contact_id,
        issue_type: issueType,
        description,
        priority,
        status: 'reported',
        landlord_approval_required: false,
      })
      .select('id, case_id, tenancy_id, property_id, issue_type, priority, status, scheduled_for, updated_at')
      .single()

    if (error) {
      setActionMessage(`Error: ${error.message}`)
      setCreatingMaintenance(false)
      return
    }

    setSelectedCaseMaintenance((current) => [data as QueueMaintenanceRow, ...current])
    setActionMessage('Maintenance request created.')
    setCreatingMaintenance(false)
  }

  useEffect(() => {
    if (!selectedCaseId) return
    router.prefetch(`/cases/${selectedCaseId}`)
  }, [router, selectedCaseId])

  if (authLoading && !operator?.authUser) {
    return <PublicHome productDemo={<HomepageDemo />} />
  }

  if (authLoading) {
    return operator?.authUser ? (
      <OperatorSessionState authLoading={authLoading} />
    ) : (
      <PublicHome productDemo={<HomepageDemo />} />
    )
  }

  if (!operator?.authUser) {
    return <PublicHome productDemo={<HomepageDemo />} />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav />

        <div className="space-y-6">
          <section className="app-surface-strong overflow-hidden rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="app-kicker">Maintenance Operations</p>
                <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                  {liveMessage || 'Live updates connected'}
                </span>
              </div>

            </div>

            <h1 className="mt-4 max-w-5xl text-3xl font-semibold tracking-tight md:text-[3.1rem] md:leading-[1.04]">
              Run the maintenance inbox from one operating desk
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
              Triage repairs, approvals, booked visits, and blocked jobs without bouncing between screens. Keep the desk practical: less drift, faster assignment, and clearer next actions.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <article className="rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Due now</p>
                <p className="mt-2 text-2xl font-semibold">{todayAgenda.dueNowCount}</p>
                <p className="mt-1 text-xs opacity-80">Jobs and callbacks that should be touched today</p>
              </article>
              <article className="rounded-[1.2rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Scheduled</p>
                <p className="mt-2 text-2xl font-semibold">{todayAgenda.scheduledCount}</p>
                <p className="mt-1 text-xs opacity-80">Booked repairs and planned visits</p>
              </article>
              <article className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Unowned</p>
                <p className="mt-2 text-2xl font-semibold">{todayAgenda.awaitingOwnerCount}</p>
                <p className="mt-1 text-xs opacity-80">Jobs still waiting on an accountable owner</p>
              </article>
            </div>

	            <section className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white/82 p-4 backdrop-blur">
	              <div className="flex flex-col gap-3 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
	                <div>
	                  <p className="app-kicker">Operations pulse</p>
	                  <h2 className="mt-2 text-lg font-semibold">Maintenance and compliance at a glance</h2>
	                </div>
	                <div className="text-sm text-stone-500">Use these as health signals, then drive the work from the inbox below</div>
	              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {operationsPulseCards.map((card) => (
                  <article
                    key={card.label}
                    className={`rounded-[1.25rem] border p-4 ${card.tone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{card.label}</p>
                        <p className="mt-2 text-sm leading-6 opacity-80">{card.helper}</p>
                      </div>
                      <span className="text-2xl font-semibold leading-none">{card.value}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => focusQueue(card.filters)}
                  className={`rounded-[1.4rem] border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${card.tone}`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                    {card.label}
                  </div>
                  <div className="mt-2 text-[2rem] font-semibold leading-none">{card.value}</div>
                  <p className="mt-2 text-sm opacity-80">{card.helper}</p>
                </button>
              ))}
            </div>

            <section className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white/82 p-4 backdrop-blur">
              <div className="flex flex-col gap-3 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="app-kicker">Today diary</p>
                  <h2 className="mt-2 text-lg font-semibold">Appointments, booked work, and fresh replies in one list</h2>
                </div>
                <div className="text-sm text-stone-500">Built from next-step dates, scheduled jobs, and live inbound activity</div>
              </div>

              {todayAgenda.items.length === 0 ? (
                <div className="app-empty-state mt-4 rounded-[1.4rem] p-6 text-sm">
                  Nothing needs diary attention right now. Work straight from the live maintenance list below.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {todayAgenda.items.map((item) =>
                    item.href ? (
                      <Link
                        key={item.id}
                        href={item.href}
                        onMouseEnter={() => {
                          if (!item.href?.startsWith('/cases/')) return
                          prefetchCaseDetail(item.href.slice('/cases/'.length))
                        }}
                        className="rounded-[1.2rem] border border-stone-200 bg-stone-50/90 p-4 transition hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900">{item.caseNumber}</p>
                            <p className="mt-1 text-sm leading-6 text-stone-700">{item.title}</p>
                          </div>
                          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700">
                            {item.lane}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                          <span>{item.timing}</span>
                          <span>Owner {item.owner}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-stone-500">{item.meta}</p>
                      </Link>
                    ) : (
                      <article
                        key={item.id}
                        className="rounded-[1.2rem] border border-stone-200 bg-stone-50/90 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900">{item.caseNumber}</p>
                            <p className="mt-1 text-sm leading-6 text-stone-700">{item.title}</p>
                          </div>
                          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700">
                            {item.lane}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                          <span>{item.timing}</span>
                          <span>Owner {item.owner}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-stone-500">{item.meta}</p>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </section>
        </div>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading the queue...
          </div>
        )}
        {pageError && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {pageError}
          </div>
        )}

        {!loading && !pageError && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
            <section
              ref={queuePanelRef}
              className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:max-h-[calc(100vh-3rem)] xl:flex-col"
            >
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="app-kicker">Live work list</p>
                    <h2 className="mt-2 text-xl font-semibold">Choose the next job from the maintenance inbox</h2>
                    <p className="mt-1 text-sm text-stone-600">
                      Keep job triage on the left and the working context on the right so the desk behaves like a real maintenance operation.
                    </p>
                    {!followUpAvailable && (
                      <p className="mt-2 text-xs text-stone-500">
                        Run the latest Supabase migration to enable follow-up tracking in the queue.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {tab === 'jobs' && (
                      <button
                        type="button"
                        onClick={() => setInboxDensityPersisted(inboxDensity === 'compact' ? 'comfortable' : 'compact')}
                        className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
                        aria-pressed={inboxDensity === 'compact'}
                      >
                        {inboxDensity === 'compact' ? 'Compact' : 'Comfortable'}
                      </button>
                    )}
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                      {tab === 'jobs' ? filteredJobs.length : filteredCases.length}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      onClick={() => setTab('jobs')}
                      aria-pressed={tab === 'jobs'}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium ${
                        tab === 'jobs' ? 'app-pill-active' : 'app-pill'
                      }`}
                    >
                      Jobs
                    </button>
                    <button
                      onClick={() => setTab('all')}
                      aria-pressed={tab !== 'jobs'}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium ${
                        tab !== 'jobs' ? 'app-pill-active' : 'app-pill'
                      }`}
                    >
                      Queue
                    </button>
                  </div>

                  {tab === 'jobs' ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {[
                        ['all', `All (${jobSlaCounts.all})`],
                        ['approval_aging', `Approval aging (${jobSlaCounts.approval_aging})`],
                        ['overdue_visit', `Overdue visit (${jobSlaCounts.overdue_visit})`],
                        ['no_contractor', `No contractor (${jobSlaCounts.no_contractor})`],
                        ['urgent', `Urgent (${jobSlaCounts.urgent})`],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setJobSlaTab(value as JobSlaTab)}
                          aria-pressed={jobSlaTab === value}
                          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium ${
                            jobSlaTab === value ? 'app-pill-active' : 'app-pill'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {[
                        ['all', 'All queue'],
                        ...(followUpAvailable
                          ? [
                              ['due_now', 'Due now'],
                              ['overdue', 'Overdue'],
                              ['due_today', 'Due today'],
                              ['waiting', 'Waiting'],
                            ]
                          : []),
                        ['pickup', 'Pick up next'],
                        ['urgent', 'Urgent'],
                        ['complaints', 'Escalations'],
                        ['unassigned', 'Unassigned'],
                        ['recent', 'Recent'],
                        ...(followUpAvailable ? [['no_next_step', 'No next step']] : []),
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => setTab(value as QueueTab)}
                          aria-pressed={tab === value}
                          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium ${
                            tab === value ? 'app-pill-active' : 'app-pill'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="block lg:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Search inbox</span>
                    <input
                      type="text"
                      placeholder={
                        tab === 'jobs'
                          ? 'Search by job, issue, contractor, contact, or postcode'
                          : 'Search by case, summary, contact, phone, or postcode'
                      }
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="app-field text-sm outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Status</span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="app-select text-sm"
                    >
                      <option value="all">All statuses</option>
                      {tab === 'jobs' ? (
                        <>
                          <option value="reported">Reported</option>
                          <option value="triaged">Triaged</option>
                          <option value="quote_requested">Quote requested</option>
                          <option value="awaiting_approval">Awaiting approval</option>
                          <option value="approved">Approved</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      ) : (
                        <>
                          <option value="open">Open</option>
                          <option value="triaged">Triaged</option>
                          <option value="awaiting_info">Awaiting info</option>
                          <option value="awaiting_landlord">Awaiting landlord</option>
                          <option value="awaiting_contractor">Awaiting contractor</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Priority</span>
                    <select
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                      className="app-select text-sm"
                    >
                      <option value="all">All priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="max-h-[74vh] space-y-3 overflow-y-auto pr-1 pb-6 md:pb-4 xl:max-h-none xl:min-h-0 xl:flex-1 xl:pb-2">
                {tab === 'jobs' &&
                  filteredJobs.map((job) => {
                    const selected = job.id === selectedJobId
                    const property = job.property_id ? propertyById.get(job.property_id) ?? null : null
                    const contractor = job.contractor_id ? contractorById.get(job.contractor_id) ?? null : null
                    const linkedCase = job.case_id ? caseById.get(job.case_id) ?? null : null
                    const approvalNeeded = needsMaintenanceApproval(job)

                    return (
                      <button
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id)
                          setSelectedCaseId(job.case_id ?? null)
                        }}
                        aria-pressed={selected}
                        className={`w-full rounded-[1.45rem] border text-left transition ${
                          selected
                            ? 'app-selected-card'
                            : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        <div className={`flex items-start justify-between gap-3 ${inboxDensity === 'compact' ? 'p-3' : 'p-3.5'}`}>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold md:text-[15px]">{formatLabel(job.issue_type)} maintenance</span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${selected ? 'app-selected-chip' : badgeClass(job.priority, 'priority')}`}>
                                {job.priority || 'unknown'}
                              </span>
                              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${selected ? 'app-selected-chip' : badgeClass(job.status, 'status')}`}>
                                {job.status || 'unknown'}
                              </span>
                              {approvalNeeded && (
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${selected ? 'app-selected-chip' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                                  approval
                                </span>
                              )}
                              {job.scheduled_for && (
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${selected ? 'app-selected-chip' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>
                                  booked
                                </span>
                              )}
                            </div>
                            <p className={`mt-2 line-clamp-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                              {job.description?.trim() || 'No description yet'}
                            </p>
                            <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                              <span className="rounded-full border border-current/15 px-2.5 py-1">{buildAddress(property)}</span>
                              <span className="rounded-full border border-current/15 px-2.5 py-1">
                                Contractor: {contractor?.company_name?.trim() || contractor?.primary_trade || 'Unassigned'}
                              </span>
                              {linkedCase?.case_number && (
                                <span className="rounded-full border border-current/15 px-2.5 py-1">
                                  {linkedCase.case_number}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`text-right text-[11px] ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                            <div>Updated</div>
                            <div className="mt-1 font-medium text-stone-700">
                              {formatRelativeTime(job.updated_at ?? job.created_at)}
                            </div>
                            <div className="mt-3">Visit</div>
                            <div className="mt-1 font-medium text-stone-700">
                              {job.scheduled_for ? formatShortDateTime(job.scheduled_for) : 'Not booked'}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}

                {tab !== 'jobs' &&
                  filteredCases.map((item) => {
                  const selected = item.id === selectedCaseId
                  const responseHealth = getResponseHealth(item.priority, item.last_customer_message_at)
                  const followUp = getFollowUpState(item)

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCaseId(item.id)}
                      onMouseEnter={() => prefetchCaseDetail(item.id)}
                      onFocus={() => prefetchCaseDetail(item.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.45rem] border p-3.5 text-left transition ${
                        selected
                          ? 'app-selected-card'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_168px] sm:items-start">
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3 sm:block">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold md:text-[15px]">{item.case_number}</span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                    selected ? 'app-selected-chip' : badgeClass(item.priority, 'priority')
                                  }`}
                                >
                                  {item.priority || 'unknown'}
                                </span>
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                    selected ? 'app-selected-chip' : badgeClass(item.status, 'status')
                                  }`}
                                >
                                  {item.status || 'unknown'}
                                </span>
                              </div>
                              <p
                                className={`mt-2 line-clamp-2 text-sm leading-6 ${
                                  selected ? 'text-stone-700' : 'text-stone-600'
                                }`}
                              >
                                {item.summary || 'No summary yet'}
                              </p>
                            </div>

                            <div className={`text-right text-[11px] sm:hidden ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                              <div>Last activity</div>
                              <div className="mt-1 font-medium text-stone-700">
                                {formatRelativeTime(item.last_customer_message_at ?? item.created_at)}
                              </div>
                            </div>
                          </div>

                          <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            <span className="rounded-full border border-current/15 px-2.5 py-1">
                              {item.case_type || 'General'}
                            </span>
                            <span className="rounded-full border border-current/15 px-2.5 py-1">
                              {item.contact_name || item.contact_phone || 'Unknown contact'}
                            </span>
                            <span className="rounded-full border border-current/15 px-2.5 py-1">
                              {item.postcode || 'No postcode'}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                            {item.needs_human_handoff && (
                              <span
                                className={`rounded-full border px-2.5 py-1 font-medium ${
                                  selected ? 'app-selected-chip' : badgeClass(item.handoff_reason, 'handoff')
                                }`}
                              >
                                {item.handoff_reason || 'handoff'}
                              </span>
                            )}

                            <span className={`${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                              Owner: {item.assigned_user_name || 'Unassigned'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 sm:border-l sm:border-stone-200 sm:pl-4">
                          <div className={`hidden text-right text-[11px] sm:block ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                            <div>Last activity</div>
                            <div className="mt-1 font-medium text-stone-700">
                              {formatRelativeTime(item.last_customer_message_at ?? item.created_at)}
                            </div>
                          </div>

                          <div
                            className={`rounded-[1rem] border px-3 py-2 text-xs ${
                              selected ? 'app-selected-chip' : responseHealth.className
                            }`}
                          >
                            <div className="font-medium">{responseHealth.label}</div>
                          </div>
                          {followUpAvailable && (
                            <div className={`rounded-[1rem] border px-3 py-2 text-xs ${followUp.className}`}>
                              <div className="font-medium">{followUp.label}</div>
                              <div className="mt-1 opacity-80">{followUp.detail}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}

                {tab === 'jobs' && filteredJobs.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No maintenance jobs match the current filters. Try widening the search or clearing a filter.
                  </div>
                )}

                {tab !== 'jobs' && filteredCases.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No jobs match the current filters. Try widening the search or clearing a
                    filter.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedCase && !selectedJob ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a job from the left to see the working summary here.
                </div>
              ) : (
                <div>
                  {tab === 'jobs' && selectedJob && (
                    <section className="mb-6 rounded-[1.7rem] border border-stone-200 bg-white/80 p-5">
                      <p className="app-kicker">Maintenance job actions</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">
                          {formatLabel(selectedJob.issue_type)} maintenance
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(selectedJob.priority, 'priority')}`}>
                          {selectedJob.priority}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClass(selectedJob.status, 'status')}`}>
                          {selectedJob.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-stone-700">Assign contractor</span>
                          <select
                            value={selectedJob.contractor_id ?? ''}
                            onChange={(event) => void handleAssignContractor(event.target.value || null)}
                            disabled={actionLoading}
                            className="app-select w-full text-sm"
                          >
                            <option value="">Unassigned</option>
                            {contractors
                              .filter((item) => item.is_active)
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.company_name || item.primary_trade}
                                </option>
                              ))}
                          </select>
                        </label>

                        <div className="grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => void handleRequestLandlordApproval()}
                            disabled={actionLoading}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Request approval
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMarkJobComplete()}
                            disabled={actionLoading}
                            className="app-primary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Mark complete
                          </button>
                        </div>

                        <form
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleBookVisit(new FormData(event.currentTarget))
                          }}
                          className="rounded-[1.4rem] border border-stone-200 bg-white/70 p-4"
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Book visit
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
                            <input
                              type="datetime-local"
                              name="scheduled_for"
                              defaultValue={toLocalDatetimeInputValue(selectedJob.scheduled_for)}
                              className="app-field w-full text-sm outline-none"
                            />
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                            >
                              Save booking
                            </button>
                          </div>
                        </form>

                        {selectedJob.case_id ? (
                          <div className="rounded-[1.4rem] border border-stone-200 bg-white/70 p-4 text-sm text-stone-600">
                            This job is linked to a case. Use the case controls below for follow-ups and communication.
                          </div>
                        ) : (
                          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            This job is not linked to a case yet. Create/link a case to enable messages and follow-up tracking.
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {selectedCase ? (
                    <>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <p className="app-kicker">Selected Job</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{selectedCase.case_number}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(selectedCase.priority, 'priority')}`}>
                          {selectedCase.priority || 'unknown'}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(selectedCase.status, 'status')}`}>
                          {selectedCase.status || 'unknown'}
                        </span>
                        {selectedCase.needs_human_handoff && (
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(selectedCase.handoff_reason, 'handoff')}`}>
                            {selectedCase.handoff_reason || 'handoff'}
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedCase.summary || 'No summary provided yet for this job.'}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Contact
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {selectedCase.contact_name || selectedCase.contact_phone || 'Unknown'}
                          </p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Postcode
                          </p>
                          <p className="mt-2 text-sm text-stone-800">{selectedCase.postcode || '-'}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Owner
                          </p>
                          <p className="mt-2 text-sm text-stone-800">
                            {selectedCase.assigned_user_name || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`rounded-[1.5rem] border p-4 ${selectedCaseResponseHealth.className}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Job health</p>
                        <p className="mt-2 text-lg font-semibold">{selectedCaseResponseHealth.label}</p>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                          {selectedCaseResponseHealth.detail}
                        </p>
                        <p className="mt-3 text-xs opacity-80">Latest activity: {selectedCaseLastActivity}</p>
                      </div>

                      {followUpAvailable && (
                        <div className={`rounded-[1.5rem] border p-4 ${selectedCaseFollowUp.className}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Next step</p>
                          <p className="mt-2 text-lg font-semibold">{selectedCaseFollowUp.label}</p>
                          <p className="mt-2 text-sm leading-6 opacity-85">
                            {selectedCaseFollowUp.detail}
                          </p>
                        </div>
                      )}

                      <Link
                        href={`/cases/${selectedCase.id}`}
                        className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open full job workspace
                      </Link>
                    </div>
                  </div>
                    </>
                  ) : (
                    <div className="app-empty-state flex min-h-[40vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                      Select a job with a linked case to see messages, follow-ups, and tenancy context here.
                    </div>
                  )}

                  {selectedCase && (
                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Fast actions</p>
                        <div className="mt-4 flex flex-col gap-3">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Case owner</span>
                            <select
                              value={selectedCase.assigned_user_id || ''}
                              onChange={(event) => void handleAssigneeChange(event.target.value)}
                              disabled={actionLoading}
                              className="app-select w-full text-sm"
                            >
                              <option value="">Unassigned</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            onClick={handleAssignToMe}
                            disabled={actionLoading || !operator.profile}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Assign this job to me
                          </button>
                          <button
                            onClick={handleMarkInProgress}
                            disabled={actionLoading}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Mark job in progress
                          </button>
                          <button
                            onClick={handleResolve}
                            disabled={actionLoading}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Mark job resolved
                          </button>
                        </div>

                        {actionMessage && (
                          <div className="app-card-muted mt-4 rounded-2xl px-4 py-3 text-sm text-stone-700">
                            {actionMessage}
                          </div>
                        )}
                      </section>

                      {followUpAvailable && (
                        <section className="app-card-muted rounded-[1.6rem] p-5">
                          <p className="app-kicker">Job shortcuts</p>
                          <div className="mt-4 grid gap-3">
                            <button
                              onClick={() => handleSetNextStep(0, 'Follow-up set for later today.')}
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                            >
                              Set today callback
                            </button>
                            <button
                              onClick={() => handleSetNextStep(1, 'Follow-up set for tomorrow morning.')}
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                            >
                              Set tomorrow callback
                            </button>
                            <button
                              onClick={() =>
                                handleSetWaitingOn(
                                  'tenant',
                                  'Awaiting tenant reply or access confirmation.',
                                  'Queued as waiting on tenant.'
                                )
                              }
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                            >
                              Waiting on tenant
                            </button>
                            <button
                              onClick={() =>
                                handleSetWaitingOn(
                                  'landlord',
                                  'Awaiting landlord approval or instruction.',
                                  'Queued as waiting on landlord.'
                                )
                              }
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                            >
                              Waiting on landlord
                            </button>
                            <button
                              onClick={handleClearNextStep}
                              disabled={actionLoading}
                              className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                            >
                              Clear next step
                            </button>
                          </div>

                          <form
                            key={selectedCase.id}
                            onSubmit={(event) => {
                              event.preventDefault()
                              void handleCustomFollowUpSubmit(new FormData(event.currentTarget))
                            }}
                            className="mt-4 space-y-3 rounded-[1.4rem] border border-stone-200 bg-white/80 p-4"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Custom job plan
                            </div>
                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-stone-700">Next action at</span>
                              <input
                                type="datetime-local"
                                name="next_action_at"
                                defaultValue={toLocalDatetimeInputValue(selectedCase.next_action_at ?? null)}
                                className="app-field w-full text-sm outline-none"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-stone-700">Waiting on</span>
                              <select
                                name="waiting_on"
                                defaultValue={selectedCase.waiting_on ?? 'none'}
                                className="app-select w-full text-sm"
                              >
                                <option value="none">No waiting status</option>
                                <option value="tenant">Tenant</option>
                                <option value="landlord">Landlord</option>
                                <option value="contractor">Contractor</option>
                                <option value="internal">Internal team</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-sm font-medium text-stone-700">Waiting reason</span>
                              <input
                                type="text"
                                name="waiting_reason"
                                defaultValue={selectedCase.waiting_reason ?? ''}
                                placeholder="Why is this blocked?"
                                className="app-field w-full text-sm outline-none"
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="app-primary-button inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                            >
                              Save job plan
                            </button>
                          </form>
                        </section>
                      )}

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Create from queue</p>
                        <div className="mt-4 space-y-4">
                          <form
                            key={`${selectedCase.id}-ledger`}
                            onSubmit={(event) => {
                              event.preventDefault()
                              void handleCreateLedgerItem(new FormData(event.currentTarget))
                            }}
                            className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Accounts item
                            </div>
                            <div className="mt-3 grid gap-3">
                              <select name="entry_type" defaultValue="charge" className="app-select w-full text-sm">
                                <option value="charge">Charge</option>
                                <option value="payment">Payment</option>
                                <option value="credit">Credit</option>
                                <option value="adjustment">Adjustment</option>
                              </select>
                              <input name="amount" type="number" min="0" step="0.01" placeholder="Amount" className="app-field w-full text-sm outline-none" />
                              <input name="due_date" type="date" className="app-field w-full text-sm outline-none" />
                              <input name="reference" type="text" placeholder="Reference" className="app-field w-full text-sm outline-none" />
                              <button
                                type="submit"
                                disabled={creatingLedger}
                                className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                              >
                                {creatingLedger ? 'Creating accounts item...' : 'Create accounts item'}
                              </button>
                            </div>
                          </form>

                          <form
                            key={`${selectedCase.id}-renewal`}
                            onSubmit={(event) => {
                              event.preventDefault()
                              void handleCreateRenewalEvent(new FormData(event.currentTarget))
                            }}
                            className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              End of tenancy event
                            </div>
                            <div className="mt-3 grid gap-3">
                              <select name="event_type" defaultValue="renewal_review" className="app-select w-full text-sm">
                                <option value="renewal_review">Renewal review</option>
                                <option value="notice_served">Notice served</option>
                                <option value="rent_review">Rent review</option>
                                <option value="move_out">Move out</option>
                                <option value="deposit_return">Deposit return</option>
                              </select>
                              <input name="scheduled_for" type="date" className="app-field w-full text-sm outline-none" />
                              <input name="note" type="text" placeholder="Note" className="app-field w-full text-sm outline-none" />
                              <button
                                type="submit"
                                disabled={creatingRenewal}
                                className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                              >
                                {creatingRenewal ? 'Creating end of tenancy event...' : 'Create end of tenancy event'}
                              </button>
                            </div>
                          </form>

                          <form
                            key={`${selectedCase.id}-maintenance`}
                            onSubmit={(event) => {
                              event.preventDefault()
                              void handleCreateMaintenanceRequest(new FormData(event.currentTarget))
                            }}
                            className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4"
                          >
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Maintenance request
                            </div>
                            <div className="mt-3 grid gap-3">
                              <input name="issue_type" type="text" placeholder="Issue type" className="app-field w-full text-sm outline-none" />
                              <select name="priority" defaultValue="medium" className="app-select w-full text-sm">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                              <textarea name="description" rows={3} placeholder="Short description" className="app-field w-full text-sm outline-none" />
                              <button
                                type="submit"
                                disabled={creatingMaintenance}
                                className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                              >
                                {creatingMaintenance ? 'Creating maintenance request...' : 'Create maintenance request'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Job snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-center justify-between gap-4">
                            <dt>Type</dt>
                            <dd className="font-medium text-stone-900">{selectedCase.case_type || '-'}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt>Created</dt>
                            <dd className="font-medium text-stone-900">
                              {selectedCase.created_at
                                ? new Date(selectedCase.created_at).toLocaleString()
                                : '-'}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt>Last customer message</dt>
                            <dd className="font-medium text-stone-900">
                              {selectedCase.last_customer_message_at
                                ? new Date(selectedCase.last_customer_message_at).toLocaleString()
                                : '-'}
                            </dd>
                          </div>
                          {followUpAvailable && (
                            <div className="flex items-center justify-between gap-4">
                              <dt>Next step</dt>
                              <dd className="text-right font-medium text-stone-900">
                                {selectedCase.next_action_at
                                  ? formatShortDateTime(selectedCase.next_action_at)
                                  : 'Not set'}
                              </dd>
                            </div>
                          )}
                          {followUpAvailable && (
                            <div className="flex items-center justify-between gap-4">
                              <dt>Waiting on</dt>
                              <dd className="text-right font-medium text-stone-900">
                                {WAITING_ON_LABELS[selectedCase.waiting_on ?? 'none']}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </section>
                    </div>

                    <section className="app-card-muted rounded-[1.6rem] p-5">
                      <div className="flex flex-col gap-3 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="app-kicker">Maintenance thread</p>
                          <h3 className="mt-2 text-xl font-semibold">Joined-up job context</h3>
                          <p className="mt-2 max-w-2xl text-sm text-stone-600">
                            Messages are now mixed with tenancy accounts, maintenance, end of tenancy, deposit, and phone support signals so the inbox behaves more like a real maintenance control desk.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                            {selectedCaseContextSummary.openCharges} open charges
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            {selectedCaseContextSummary.maintenanceLive} live maintenance
                          </div>
                          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                            {selectedCaseContextSummary.dueLeaseEvents} end of tenancy due
                          </div>
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                            {selectedCaseContextSummary.disputedDeposits} deposit disputes
                          </div>
                        </div>
                      </div>

                      {(messagesLoading || caseContextLoading) && (
                        <div className="mt-5 text-sm text-stone-500">Refreshing CRM thread...</div>
                      )}

                      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.4fr]">
                        <div className="space-y-3">
                          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
                            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                              Linked tenancy context
                            </div>
                            <div className="mt-3 space-y-3 text-sm text-stone-700">
                              <div className="flex items-center justify-between gap-3">
                                <span>Tenancies</span>
                                <span className="font-medium text-stone-900">{selectedCaseTenancies.length}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Phone support linked</span>
                                <span className="font-medium text-stone-900">{selectedCaseCalls.length}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Deposit claims</span>
                                <span className="font-medium text-stone-900">{selectedCaseDepositClaims.length}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span>Tenancy end</span>
                                <span className="font-medium text-stone-900">
                                  {selectedCaseTenancies[0]?.end_date ? formatShortDateTime(selectedCaseTenancies[0].end_date) : 'Not set'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
                            Open the full job for notes, outbound sending, and deeper timeline controls.
                          </div>
                        </div>

                        <div className="space-y-4">
                          {!messagesLoading && !caseContextLoading && selectedCaseActivityFeed.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No CRM activity has been recorded for this job yet.
                            </div>
                          )}

                          {selectedCaseActivityFeed.map((item) => (
                            <article key={item.id} className={`rounded-[1.4rem] border p-4 ${item.tone}`}>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                                    <span>{item.label}</span>
                                    {item.meta && <span>{item.meta}</span>}
                                  </div>
                                  <p className="mt-3 text-sm leading-7 text-stone-800">{item.body}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3 text-xs text-stone-500">
                                  <span>{item.sortAt ? new Date(item.sortAt).toLocaleString() : '-'}</span>
                                  {item.href && (
                                    <Link href={item.href} className="font-medium text-stone-700 underline-offset-4 hover:underline">
                                      Open
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
