'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOperatorLabel,
  getSessionUser,
  type CurrentOperator,
} from '@/lib/operator'
import { resolveWorkspaceForUser } from '@/lib/portal'
import { supabase } from '@/lib/supabase'
import { PublicHome } from '@/app/public-home'
import { OperatorNav } from '@/app/operator-nav'

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
type ViewingPulseRow = {
  status: string
  booked_slot: string | null
}
type DepositPulseRow = {
  claim_status: string
}
type OperationsPulseState = {
  maintenanceLive: number
  maintenanceApproval: number
  maintenanceScheduled: number
  complianceRisk: number
  complianceSoon: number
  viewingRequested: number
  viewingBooked: number
  depositActive: number
  depositDisputed: number
}
type QueueTab =
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

function formatShortDateTime(value: string | null) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cases, setCases] = useState<CaseRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [tab, setTab] = useState<QueueTab>('all')
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const [followUpAvailable, setFollowUpAvailable] = useState(true)
  const [operationsPulse, setOperationsPulse] = useState<OperationsPulseState>({
    maintenanceLive: 0,
    maintenanceApproval: 0,
    maintenanceScheduled: 0,
    complianceRisk: 0,
    complianceSoon: 0,
    viewingRequested: 0,
    viewingBooked: 0,
    depositActive: 0,
    depositDisputed: 0,
  })
  const operatorUserId = operator?.authUser?.id ?? null

  const loadCasesAndUsers = useEffectEvent(async (options?: { preserveLoading?: boolean }) => {
    if (!operatorUserId) return

    if (!options?.preserveLoading) {
      setLoading(true)
    }

    const [{ data: caseData, error: caseError }, { data: userData, error: userError }] =
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
      ])

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    if (userError) {
      setError(userError.message)
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

    setCases(mergedRows)
    setUsers((userData || []) as UserRow[])
    setSelectedCaseId((current) =>
      current && mergedRows.some((item) => item.id === current) ? current : (mergedRows[0]?.id ?? null)
    )
    setLoading(false)
  })

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

  const loadOperationsPulse = useEffectEvent(async () => {
    const [
      maintenanceResponse,
      complianceResponse,
      viewingsResponse,
      depositsResponse,
    ] = await Promise.all([
      supabase
        .from('maintenance_requests')
        .select('status, landlord_approval_required, scheduled_for')
        .limit(1000),
      supabase.from('compliance_records').select('status').limit(1000),
      supabase.from('viewing_requests').select('status, booked_slot').limit(1000),
      supabase.from('deposit_claims').select('claim_status').limit(1000),
    ])

    if (
      maintenanceResponse.error ||
      complianceResponse.error ||
      viewingsResponse.error ||
      depositsResponse.error
    ) {
      return
    }

    const maintenanceRows = (maintenanceResponse.data || []) as MaintenancePulseRow[]
    const complianceRows = (complianceResponse.data || []) as CompliancePulseRow[]
    const viewingRows = (viewingsResponse.data || []) as ViewingPulseRow[]
    const depositRows = (depositsResponse.data || []) as DepositPulseRow[]

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
      viewingRequested: viewingRows.filter((request) => request.status === 'requested').length,
      viewingBooked: viewingRows.filter((request) => !!request.booked_slot).length,
      depositActive: depositRows.filter((claim) =>
        !['draft', 'resolved', 'cancelled'].includes(claim.claim_status)
      ).length,
      depositDisputed: depositRows.filter((claim) => claim.claim_status === 'disputed').length,
    })
  })

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const workspace = await resolveWorkspaceForUser(userId)

      if (workspace.destination && workspace.destination !== '/') {
        router.replace(workspace.destination)
        return
      }

      const profile = workspace.operatorProfile

      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return {
          ...current,
          profile,
        }
      })

      if (!profile) {
        setError('Your account is not linked to the operator workspace.')
        return
      }

      if (profile.is_active === false) {
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

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      try {
        const user = await getSessionUser()

        if (cancelled) return

        if (!user) {
          setOperator(null)
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
        router.replace('/')
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
      setMessages([])
      return
    }

    async function loadMessages() {
      const caseId = selectedCaseId
      if (!caseId) return
      await loadMessagesForCase(caseId)
    }

    loadMessages()
  }, [selectedCaseId, operatorUserId])

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
          showLiveMessage('Operator list refreshed.')
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
          await loadCasesAndUsers({ preserveLoading: true })
          showLiveMessage('Timeline refreshed live.')
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
    return {
      total: cases.length,
      open: cases.filter((item) => item.status === 'open').length,
      urgent: cases.filter((item) => item.priority === 'urgent').length,
      handoff: cases.filter((item) => item.needs_human_handoff).length,
      unassigned: cases.filter((item) => !item.assigned_user_name).length,
    }
  }, [cases])

  const postureSummary = useMemo(() => {
    const points: string[] = []

    if (kpis.urgent > 0) {
      points.push(`${kpis.urgent} urgent case${kpis.urgent === 1 ? '' : 's'} need close attention.`)
    }

    if (kpis.unassigned > 0) {
      points.push(
        `${kpis.unassigned} case${kpis.unassigned === 1 ? ' is' : 's are'} still unassigned.`
      )
    }

    if (operationsPulse.maintenanceApproval > 0) {
      points.push(
        `${operationsPulse.maintenanceApproval} maintenance job${operationsPulse.maintenanceApproval === 1 ? ' is' : 's are'} waiting on approval.`
      )
    }

    if (operationsPulse.complianceRisk > 0) {
      points.push(
        `${operationsPulse.complianceRisk} compliance record${operationsPulse.complianceRisk === 1 ? '' : 's'} are already expired or missing.`
      )
    }

    if (operationsPulse.depositDisputed > 0) {
      points.push(
        `${operationsPulse.depositDisputed} deposit claim${operationsPulse.depositDisputed === 1 ? ' is' : 's are'} disputed.`
      )
    }

    if (!points.length) {
      return 'The queue is calm right now. There are no urgent cases, approvals waiting, or active compliance risks in the visible ops layers.'
    }

    return points.join(' ')
  }, [kpis, operationsPulse])

  const todayDeskColumns = useMemo(() => {
    const followUps = cases
      .filter((item) => {
        const bucket = getFollowUpState(item).bucket
        return bucket === 'overdue' || bucket === 'today'
      })
      .sort((left, right) => {
        const leftTime = new Date(left.next_action_at ?? left.created_at ?? 0).getTime()
        const rightTime = new Date(right.next_action_at ?? right.created_at ?? 0).getTime()
        return leftTime - rightTime
      })
      .slice(0, 4)

    const freshInbound = cases
      .filter((item) => !!item.last_customer_message_at)
      .sort((left, right) => {
        const leftTime = new Date(left.last_customer_message_at ?? 0).getTime()
        const rightTime = new Date(right.last_customer_message_at ?? 0).getTime()
        return rightTime - leftTime
      })
      .slice(0, 4)

    const needsPickup = cases
      .filter((item) => !item.assigned_user_name || item.needs_human_handoff || item.priority === 'urgent')
      .sort(compareCasesForQueue)
      .slice(0, 4)

    return [
      {
        label: 'Today diary',
        helper: 'Follow-ups that should not slip today',
        empty: 'Nothing is due today or overdue right now.',
        tone: 'border-amber-200 bg-amber-50/80',
        items: followUps.map((item) => {
          const followUp = getFollowUpState(item)
          return {
            id: item.id,
            caseNumber: item.case_number,
            title: item.contact_name || item.contact_phone || 'Unknown contact',
            detail: followUp.label,
            meta: followUp.detail,
          }
        }),
      },
      {
        label: 'Fresh inbound',
        helper: 'Recent customer activity worth checking first',
        empty: 'No recent inbound activity is standing out right now.',
        tone: 'border-sky-200 bg-sky-50/80',
        items: freshInbound.map((item) => ({
          id: item.id,
          caseNumber: item.case_number,
          title: item.summary || item.contact_name || 'Recent customer activity',
          detail: item.contact_name || item.contact_phone || item.case_type || 'Case activity',
          meta: `Last customer activity ${formatRelativeTime(item.last_customer_message_at)}`,
        })),
      },
      {
        label: 'Pickup next',
        helper: 'Unowned or handoff work needing a human decision',
        empty: 'Everything visible already has an owner and no flagged handoff.',
        tone: 'border-rose-200 bg-rose-50/80',
        items: needsPickup.map((item) => ({
          id: item.id,
          caseNumber: item.case_number,
          title: item.summary || item.contact_name || 'Case needs pickup',
          detail:
            item.needs_human_handoff
              ? item.handoff_reason || 'Needs operator review'
              : item.assigned_user_name || 'Unassigned',
          meta: `${item.priority || 'unknown'} priority • ${item.case_type || 'general'}`,
        })),
      },
    ]
  }, [cases])

  const deskFocusCards = useMemo(() => {
    const dueNow = cases.filter((item) => {
      const bucket = getFollowUpState(item).bucket
      return bucket === 'overdue' || bucket === 'today'
    }).length

    const freshInbound = cases.filter((item) => !!item.last_customer_message_at).length

    const pickupNext = cases.filter(
      (item) => !item.assigned_user_name || item.needs_human_handoff || item.priority === 'urgent'
    ).length

    return [
      {
        label: 'Due now',
        value: dueNow,
        helper: dueNow > 0 ? 'Follow-ups that should be touched today' : 'No follow-ups are slipping right now',
        tone: 'border-amber-200 bg-amber-50/90 text-amber-900',
        actionLabel: dueNow > 0 ? 'Open due now queue' : 'Review whole queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: dueNow > 0 && followUpAvailable ? 'due_now' : 'all',
        } satisfies QueueFilterState,
      },
      {
        label: 'Fresh inbound',
        value: freshInbound,
        helper:
          freshInbound > 0
            ? 'Recent customer updates are waiting in the queue'
            : 'No recent customer replies are stacking up',
        tone: 'border-sky-200 bg-sky-50/90 text-sky-900',
        actionLabel: freshInbound > 0 ? 'Open recent activity' : 'Review whole queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: freshInbound > 0 ? 'recent' : 'all',
        } satisfies QueueFilterState,
      },
      {
        label: 'Pickup next',
        value: pickupNext,
        helper:
          pickupNext > 0
            ? 'Unassigned or handoff work needs a human owner'
            : 'Everything visible already has a clear owner',
        tone: 'border-rose-200 bg-rose-50/90 text-rose-900',
        actionLabel: pickupNext > 0 ? 'Open needs pickup queue' : 'Review whole queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: pickupNext > 0 ? 'pickup' : 'all',
        } satisfies QueueFilterState,
      },
    ]
  }, [cases, followUpAvailable])

  const operationsPulseCards = useMemo(
    () => [
      {
        href: '/records/maintenance',
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
        href: '/records/compliance',
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
      {
        href: '/records/viewings',
        label: 'Viewings',
        value: operationsPulse.viewingRequested,
        helper:
          operationsPulse.viewingBooked > 0
            ? `${operationsPulse.viewingBooked} already booked`
            : 'No booked slots visible',
        tone: 'border-sky-200 bg-sky-50 text-sky-900',
      },
      {
        href: '/records/deposits',
        label: 'Deposits',
        value: operationsPulse.depositActive,
        helper:
          operationsPulse.depositDisputed > 0
            ? `${operationsPulse.depositDisputed} disputed`
            : 'No disputes flagged',
        tone:
          operationsPulse.depositDisputed > 0
            ? 'border-rose-200 bg-rose-50 text-rose-900'
            : 'border-stone-200 bg-stone-50 text-stone-900',
      },
    ],
    [operationsPulse]
  )


  const kpiCards = useMemo(
    () => [
      {
        label: 'Queue size',
        value: kpis.total,
        tone: 'border-stone-200 bg-stone-50 text-stone-900',
        helper: 'All active cases in view',
        actionLabel: 'Open whole queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: 'all',
        } satisfies QueueFilterState,
      },
      {
        label: 'Need replies',
        value: kpis.open,
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        helper: 'Open work still in motion',
        actionLabel: 'Show open cases',
        filters: {
          search: '',
          statusFilter: 'open',
          priorityFilter: 'all',
          tab: 'all',
        } satisfies QueueFilterState,
      },
      {
        label: 'Urgent now',
        value: kpis.urgent,
        tone: 'border-red-200 bg-red-50 text-red-800',
        helper: 'Highest priority items',
        actionLabel: 'Show urgent queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'urgent',
          tab: 'urgent',
        } satisfies QueueFilterState,
      },
      {
        label: 'Unowned',
        value: kpis.unassigned,
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        helper: 'Cases needing an operator',
        actionLabel: 'Show unassigned queue',
        filters: {
          search: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          tab: 'unassigned',
        } satisfies QueueFilterState,
      },
    ],
    [kpis]
  )

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

    const nextQueue = cases
      .filter((item) => matchesQueueFilters(item, filters))
      .sort(compareCasesForQueue)

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

  async function handleSignOut() {
    setSigningOut(true)
    setActionMessage(null)

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setActionMessage(`Error: ${signOutError.message}`)
      setSigningOut(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  useEffect(() => {
    if (!selectedCaseId) return
    router.prefetch(`/cases/${selectedCaseId}`)
  }, [router, selectedCaseId])

  if (authLoading && !operator?.authUser) {
    return <PublicHome />
  }

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
    return <PublicHome />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="queue" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="space-y-6">
            <section className="app-surface-strong overflow-hidden rounded-[2rem] p-5 md:p-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="app-kicker">Renovo Lettings Ops</p>
                    <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                      {liveMessage || 'Live updates connected'}
                    </span>
                  </div>

                  <h1 className="mt-4 max-w-5xl text-3xl font-semibold tracking-tight md:text-[3.3rem] md:leading-[1.02]">
                    Work the queue with less friction
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                    Prioritise what needs a human, keep replies moving, and use the wider ops
                    workspaces only when the queue is not the right lens.
                  </p>
                </div>

                <section className="rounded-[1.6rem] border border-stone-200 bg-white/78 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="app-kicker">Shift focus</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        The quickest signals to act on before you settle into the queue.
                      </p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                      Live
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {deskFocusCards.map((card) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => focusQueue(card.filters)}
                        className={`w-full rounded-[1.2rem] border px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${card.tone}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                              {card.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 opacity-80">{card.helper}</p>
                          </div>
                          <span className="text-2xl font-semibold leading-none">{card.value}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-medium opacity-80">
                          <span>{card.actionLabel}</span>
                          <span aria-hidden="true">Open queue</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

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
                    <p className="mt-3 text-xs font-medium opacity-80">{card.actionLabel}</p>
                  </button>
                ))}
              </div>

              <section className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white/82 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="app-kicker">Workspace Lanes</p>
                    <h2 className="mt-2 text-lg font-semibold">Keep the main routes visible while you work</h2>
                  </div>
                  <div className="text-sm text-stone-500">Built so the CRM, calls, knowledge, and reporting are never hidden</div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Calls inbox', href: '/calls', body: 'Review active sessions, voicemail outcomes, and flagged call summaries.' },
                    { label: 'Tenancy CRM', href: '/records', body: 'Run the tenancy lifecycle, rent pressure, lease events, and live cases together.' },
                    { label: 'Knowledge', href: '/knowledge', body: 'Ground Annabelle in approved Scotland-specific answers before wider handling.' },
                    { label: 'Reporting', href: '/records/reporting', body: 'Read portfolio pressure, approvals, risk, and leadership visibility in one place.' },
                  ].map((lane) => (
                    <Link
                      key={lane.label}
                      href={lane.href}
                      className="rounded-[1.25rem] border border-stone-200 bg-stone-50/90 p-4 transition hover:-translate-y-0.5 hover:border-stone-400 hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-stone-900">{lane.label}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{lane.body}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-[1.6rem] border border-stone-200 bg-white/82 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="app-kicker">Today Desk</p>
                    <h2 className="mt-2 text-lg font-semibold">Use the open space as a working diary</h2>
                  </div>
                  <div className="text-sm text-stone-500">
                    Live from queue state, follow-up dates, and customer activity
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  {todayDeskColumns.map((column) => (
                    <section
                      key={column.label}
                      className={`rounded-[1.35rem] border p-4 ${column.tone}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{column.label}</p>
                          <p className="mt-1 text-xs leading-5 text-stone-600">{column.helper}</p>
                        </div>
                        <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-stone-600">
                          {column.items.length}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {column.items.length === 0 && (
                          <div className="rounded-[1rem] border border-stone-200 bg-white/85 p-3 text-sm text-stone-600">
                            {column.empty}
                          </div>
                        )}

                        {column.items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/cases/${item.id}`}
                            onMouseEnter={() => prefetchCaseDetail(item.id)}
                            className="block rounded-[1rem] border border-stone-200 bg-white/92 p-3 transition hover:border-stone-400 hover:bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-stone-900">{item.caseNumber}</p>
                                <p className="mt-1 text-sm leading-6 text-stone-700">{item.title}</p>
                              </div>
                            </div>
                            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                              {item.detail}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-stone-500">{item.meta}</p>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            </section>
          </div>

          <aside className="app-surface-strong rounded-[2rem] p-5 xl:sticky xl:top-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="app-kicker">Signed In</p>
                <h2 className="mt-2 truncate text-xl font-semibold">
                  {getOperatorLabel(operator)}
                </h2>
                <p className="mt-1 truncate text-sm text-stone-600">
                  {operator.authUser.email || 'No email on account'}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="app-secondary-button rounded-full px-3.5 py-2 text-sm font-medium disabled:opacity-60"
              >
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>

            <Link
              href="/calls"
              className="app-primary-button mt-5 inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
            >
              Calls inbox
            </Link>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <Link
                href="/knowledge"
                className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.3rem] px-4 py-3 text-sm font-medium"
              >
                Knowledge
              </Link>

              <Link
                href="/records"
                className="app-secondary-button inline-flex w-full items-center justify-center rounded-[1.3rem] px-4 py-3 text-sm font-medium"
              >
                CRM
              </Link>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-medium">Today’s posture</p>
              <p className="mt-2 leading-6 text-sky-900/80">{postureSummary}</p>
            </div>

            <div className="app-card-muted mt-4 rounded-[1.4rem] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-stone-900">Operations pulse</p>
                <span className="text-xs text-stone-500">Jump straight in</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {operationsPulseCards.map((card) => (
                  <Link
                    key={card.label}
                    href={card.href}
                    className={`rounded-[1.25rem] border p-3 transition hover:-translate-y-0.5 ${card.tone}`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold">{card.value}</div>
                    <p className="mt-1 text-xs opacity-80">{card.helper}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="app-card-muted mt-4 rounded-[1.4rem] p-4">
              <p className="text-sm font-medium text-stone-900">Useful defaults</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-600">
                <li>Keep the selected case open here while triaging similar inbound work.</li>
                <li>Use “Assign to me” when you intend to own the follow-through.</li>
                <li>Use the pulse cards when the work is really maintenance, compliance, viewings, or deposit ops.</li>
              </ul>
            </div>
          </aside>
        </div>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading the queue...
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,430px)_minmax(0,1fr)]">
            <section
              ref={queuePanelRef}
              className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:max-h-[calc(100vh-3rem)] xl:flex-col"
            >
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="app-kicker">Live Queue</p>
                    <h2 className="mt-2 text-xl font-semibold">Choose the next case</h2>
                    <p className="mt-1 text-sm text-stone-600">
                      Selected cases prefetch in the background for a faster open.
                    </p>
                    {!followUpAvailable && (
                      <p className="mt-2 text-xs text-stone-500">
                        Run the latest Supabase migration to enable follow-up tracking in the queue.
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                    {filteredCases.length}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" aria-label="Queue tabs">
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
                    ['pickup', 'Needs pickup'],
                    ['urgent', 'Urgent first'],
                    ['complaints', 'Complaints'],
                    ['unassigned', 'Unassigned'],
                    ['recent', 'Recent activity'],
                    ...(followUpAvailable ? [['no_next_step', 'No next step']] : []),
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTab(value as QueueTab)}
                      aria-pressed={tab === value}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                        tab === value ? 'app-pill-active' : 'app-pill'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.7fr))]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Search queue</span>
                    <input
                      type="text"
                      placeholder="Search by case, summary, contact, phone, or postcode"
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
                {filteredCases.map((item) => {
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

                {filteredCases.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No cases match the current filters. Try widening the search or clearing a
                    filter.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedCase ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a case from the left to see the working summary here.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <p className="app-kicker">Selected Case</p>
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
                        {selectedCase.summary || 'No summary provided yet for this case.'}
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Response health</p>
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
                        Open full case workspace
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Fast actions</p>
                        <div className="mt-4 flex flex-col gap-3">
                          <button
                            onClick={handleAssignToMe}
                            disabled={actionLoading || !operator.profile}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Assign this case to me
                          </button>
                          <button
                            onClick={handleMarkInProgress}
                            disabled={actionLoading}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Mark as in progress
                          </button>
                          <button
                            onClick={handleResolve}
                            disabled={actionLoading}
                            className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                          >
                            Mark as resolved
                          </button>
                        </div>

                        {actionMessage && (
                          <div className="app-card-muted mt-4 rounded-2xl px-4 py-3 text-sm text-stone-700">
                            {actionMessage}
                          </div>
                        )}
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Case snapshot</p>
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
                      <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="app-kicker">Latest conversation</p>
                          <h3 className="mt-2 text-xl font-semibold">Recent messages on this case</h3>
                        </div>
                        {messagesLoading && (
                          <div className="text-sm text-stone-500">Refreshing timeline...</div>
                        )}
                      </div>

                      <div className="mt-5 space-y-4">
                        {!messagesLoading && messages.length === 0 && (
                          <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                            No messages yet for this case.
                          </div>
                        )}

                        {selectedTimelinePreview.map((message) => (
                          <article key={message.id} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 p-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                              <span>{message.direction || 'activity'}</span>
                              <span>{message.channel || 'unknown channel'}</span>
                              <span>{message.sender_type || 'unknown sender'}</span>
                            </div>
                            <p className="mt-3 text-sm leading-7 text-stone-800">
                              {message.message_text || '-'}
                            </p>
                            <p className="mt-3 text-xs text-stone-400">
                              {message.created_at
                                ? new Date(message.created_at).toLocaleString()
                                : '-'}
                            </p>
                          </article>
                        ))}

                        {messages.length > 4 && (
                          <div className="app-card-muted rounded-[1.4rem] px-4 py-3 text-sm text-stone-600">
                            Showing the latest 4 messages here. Open the full case workspace for the
                            full timeline, notes, and send tools.
                          </div>
                        )}
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
