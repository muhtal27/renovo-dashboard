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
type QueueTab =
  | 'all'
  | 'overdue'
  | 'due_today'
  | 'waiting'
  | 'urgent'
  | 'complaints'
  | 'unassigned'
  | 'recent'
  | 'no_next_step'

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

export default function HomePage() {
  const router = useRouter()

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

    async function loadCases() {
      setError(null)
      await loadCasesAndUsers()
    }

    loadCases()
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

  const filteredCases = useMemo(() => {
    return cases
      .filter((item) => {
        const q = search.trim().toLowerCase()
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

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter

        const matchesTab =
          tab === 'all' ||
          (tab === 'overdue' && followUp.bucket === 'overdue') ||
          (tab === 'due_today' && followUp.bucket === 'today') ||
          (tab === 'waiting' && followUp.bucket === 'waiting') ||
          (tab === 'urgent' && item.priority === 'urgent') ||
          (tab === 'complaints' && item.case_type === 'complaint') ||
          (tab === 'unassigned' && !item.assigned_user_name) ||
          (tab === 'recent' && !!item.last_customer_message_at) ||
          (tab === 'no_next_step' && followUp.bucket === 'none')

        return matchesSearch && matchesStatus && matchesPriority && matchesTab
      })
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

    router.replace('/login')
    router.refresh()
  }

  useEffect(() => {
    if (!selectedCaseId) return
    router.prefetch(`/cases/${selectedCaseId}`)
  }, [router, selectedCaseId])

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
        <section className="app-surface-strong overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <div>
              <p className="app-kicker">Renovo Lettings Ops</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  Work the queue with less friction
                </h1>
                <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                  {liveMessage || 'Live updates connected'}
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                Prioritise what needs a human, keep replies moving, and open the full case only
                when you need deeper context. This screen is designed to help an operator decide
                quickly and act confidently.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Queue size',
                    value: kpis.total,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                    helper: 'All active cases in view',
                  },
                  {
                    label: 'Need replies',
                    value: kpis.open,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                    helper: 'Open work still in motion',
                  },
                  {
                    label: 'Urgent now',
                    value: kpis.urgent,
                    tone: 'border-red-200 bg-red-50 text-red-800',
                    helper: 'Highest priority items',
                  },
                  {
                    label: 'Unowned',
                    value: kpis.unassigned,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                    helper: 'Cases needing an operator',
                  },
                ].map((card) => (
                  <article
                    key={card.label}
                    className={`rounded-[1.6rem] border p-4 shadow-sm ${card.tone}`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                    <p className="mt-2 text-sm opacity-80">{card.helper}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
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
                Open calls inbox
              </Link>

              <div className="mt-5 rounded-[1.4rem] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <p className="font-medium">Today’s posture</p>
                <p className="mt-2 leading-6 text-sky-900/80">
                  {kpis.urgent > 0
                    ? `${kpis.urgent} urgent case${kpis.urgent === 1 ? '' : 's'} need close attention.`
                    : 'No urgent cases are currently flagged.'}{' '}
                  {kpis.unassigned > 0
                    ? `${kpis.unassigned} case${kpis.unassigned === 1 ? ' is' : 's are'} still unassigned.`
                    : 'Everything in the current queue has an owner.'}
                </p>
              </div>

              <div className="app-card-muted mt-4 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Useful defaults</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Keep the selected case open here while triaging similar inbound work.</li>
                  <li>Use “Assign to me” when you intend to own the follow-through.</li>
                  <li>Open the full case when you need notes, drafts, or contact context.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Queue Controls</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter to the next best piece of work</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Keep filters visible and explicit so operators know exactly why a case is on
                  screen.
                </p>
              </div>

              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredCases.length} shown of {cases.length} total
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Queue tabs">
              {[
                ['all', 'All queue'],
                ...(followUpAvailable
                  ? [
                      ['overdue', 'Overdue'],
                      ['due_today', 'Due today'],
                      ['waiting', 'Waiting'],
                    ]
                  : []),
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

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.7fr))]">
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
        </section>

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
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:max-h-[calc(100vh-3rem)] xl:flex-col">
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
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${
                        selected
                          ? 'app-selected-card'
                          : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{item.case_number}</span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                              selected ? 'app-selected-chip' : badgeClass(item.priority, 'priority')
                            }`}
                            >
                              {item.priority || 'unknown'}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {item.summary || 'No summary yet'}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
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

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                            selected ? 'app-selected-chip' : badgeClass(item.status, 'status')
                          }`}
                        >
                          {item.status || 'unknown'}
                        </span>

                        {item.needs_human_handoff && (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                              selected ? 'app-selected-chip' : badgeClass(item.handoff_reason, 'handoff')
                            }`}
                          >
                            {item.handoff_reason || 'handoff'}
                          </span>
                        )}

                        <span className={`text-[11px] ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          {item.assigned_user_name || 'Unassigned'}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <div className={`rounded-2xl border px-3 py-2 text-xs ${
                          selected ? 'app-selected-chip' : responseHealth.className
                        }`}>
                          {responseHealth.label}
                        </div>
                        {followUpAvailable && (
                          <div className={`rounded-2xl border px-3 py-2 text-xs ${followUp.className}`}>
                            <div className="font-medium">{followUp.label}</div>
                            <div className="mt-1 opacity-80">{followUp.detail}</div>
                          </div>
                        )}
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
