'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { getOperatorLabel } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorNav } from '@/app/operator-nav'
import { OperatorSessionState } from '@/app/operator-session-state'

type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'voicemail'
  | 'abandoned'
type CallDirection = 'inbound' | 'outbound'
type CallUrgency = 'low' | 'medium' | 'high' | 'urgent'
type CallTab = 'all' | 'active' | 'completed' | 'review' | 'unlinked' | 'missed'
type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'

type CallSessionRow = {
  id: string
  created_at: string | null
  updated_at: string | null
  started_at: string | null
  ended_at: string | null
  last_event_at: string | null
  direction: CallDirection | null
  status: CallStatus | null
  urgency: CallUrgency | null
  external_call_id: string | null
  vapi_assistant_id: string | null
  caller_phone: string | null
  contact_id: string | null
  property_id: string | null
  case_id: string | null
  assigned_user_id: string | null
  intent: string | null
  intent_confidence: number | null
  outcome: string | null
  ai_summary: string | null
  transcript: string | null
  recording_url: string | null
  needs_operator_review: boolean | null
  review_reason: string | null
  contact?: {
    full_name: string | null
  } | null
}

type SupabaseCallSessionRow = Omit<CallSessionRow, 'contact'> & {
  contact?: { full_name: string | null } | { full_name: string | null }[] | null
}

type CallEventRow = {
  id: string
  created_at: string | null
  event_type: string
  message_text: string | null
  payload: Record<string, unknown> | null
}

type UserRow = {
  id: string
  full_name: string
}

type CaseOption = {
  id: string
  case_number: string | null
  summary: string | null
  next_action_at: string | null
  waiting_on: WaitingOn | null
  waiting_reason: string | null
  status: string | null
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

function formatShortDateTime(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isActiveCall(status: CallStatus | null) {
  return status === 'in_progress' || status === 'ringing' || status === 'initiated'
}

function isCompletedCall(status: CallStatus | null) {
  return status === 'completed'
}

function isMissedCall(status: CallStatus | null) {
  return status === 'failed' || status === 'voicemail' || status === 'abandoned'
}

function isToday(value: string | null) {
  if (!value) return false

  const date = new Date(value)
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return date >= start && date < end
}

function getCallStatusClass(status: CallStatus | null) {
  if (status === 'in_progress' || status === 'ringing' || status === 'initiated') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (status === 'failed' || status === 'abandoned') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'voicemail') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'completed') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getUrgencyClass(value: CallUrgency | null) {
  if (value === 'urgent') return 'border-red-200 bg-red-50 text-red-700'
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (value === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

function getReviewState(call: Pick<CallSessionRow, 'needs_operator_review' | 'review_reason' | 'case_id'>) {
  if (call.needs_operator_review) {
    return {
      label: 'Needs operator review',
      detail: call.review_reason || 'This session was flagged for human follow-up.',
      className: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  if (!call.case_id) {
    return {
      label: 'No linked case',
      detail: 'Link this session to an existing case or create a new one from the workflow layer.',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    }
  }

  return {
    label: 'Structured and linked',
    detail: 'This call already has a case link and no manual review flag.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
}

function formatIntentConfidence(value: number | null) {
  if (value === null || value === undefined) return 'Unknown confidence'
  return `${Math.round(value * 100)}% confidence`
}

function getCaseNextStepSummary(item: Pick<CaseOption, 'next_action_at' | 'waiting_on' | 'waiting_reason'> | null) {
  if (!item) return 'No linked case'

  const waitingOn = item.waiting_on && item.waiting_on !== 'none' ? WAITING_ON_LABELS[item.waiting_on] : null
  const waitingReason = item.waiting_reason?.trim() || null

  if (item.next_action_at) {
    return `Next step ${formatShortDateTime(item.next_action_at)}${waitingOn ? ` • ${waitingOn.toLowerCase()}` : ''}`
  }

  if (waitingOn) {
    return waitingReason ? `${waitingOn} • ${waitingReason}` : waitingOn
  }

  return 'No next step set'
}

function normalizeCallSessionRows(rows: SupabaseCallSessionRow[]) {
  return rows.map((row) => ({
    ...row,
    contact: Array.isArray(row.contact) ? (row.contact[0] ?? null) : (row.contact ?? null),
  }))
}

export default function CallsPage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [calls, setCalls] = useState<CallSessionRow[]>([])
  const [events, setEvents] = useState<CallEventRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [cases, setCases] = useState<CaseOption[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<CallTab>('all')
  const [search, setSearch] = useState('')
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [savingLink, setSavingLink] = useState(false)
  const [savingReview, setSavingReview] = useState(false)
  const [savingAssignee, setSavingAssignee] = useState(false)

  const [linkedCaseId, setLinkedCaseId] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')
  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadCalls = useEffectEvent(async (options?: { preserveLoading?: boolean }) => {
    if (!operatorUserId) return

    if (!options?.preserveLoading) {
      setLoading(true)
    }
    setError(null)

    const [
      { data: callData, error: callError },
      { data: userData, error: userError },
      { data: caseData, error: caseError },
    ] = await Promise.all([
      supabase
        .from('call_sessions')
        .select(`
          id,
          created_at,
          updated_at,
          started_at,
          ended_at,
          last_event_at,
          direction,
          status,
          urgency,
          external_call_id,
          vapi_assistant_id,
          caller_phone,
          contact_id,
          property_id,
          case_id,
          assigned_user_id,
          intent,
          intent_confidence,
          outcome,
          ai_summary,
          transcript,
          recording_url,
          needs_operator_review,
          review_reason,
          contact:contacts(full_name)
        `)
        .order('last_event_at', { ascending: false })
        .limit(120),
      supabase
        .from('users_profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name', { ascending: true }),
      supabase
        .from('cases')
        .select('id, case_number, summary, next_action_at, waiting_on, waiting_reason, status')
        .order('last_activity_at', { ascending: false })
        .limit(200),
    ])

    if (callError) {
      setError(callError.message)
      setLoading(false)
      return
    }

    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    const nextCalls = normalizeCallSessionRows((callData || []) as SupabaseCallSessionRow[])
    setCalls(nextCalls)
    setUsers((userData || []) as UserRow[])
    setCases((caseData || []) as CaseOption[])
    setSelectedCallId((current) =>
      current && nextCalls.some((item) => item.id === current) ? current : (nextCalls[0]?.id ?? null)
    )
    setLoading(false)
  })

  const loadEventsForCall = useEffectEvent(async (callId: string) => {
    setEventsLoading(true)

    const { data, error: eventError } = await supabase
      .from('call_events')
      .select('id, created_at, event_type, message_text, payload')
      .eq('call_session_id', callId)
      .order('created_at', { ascending: true })

    if (eventError) {
      setActionMessage(`Error loading call events: ${eventError.message}`)
      setEventsLoading(false)
      return
    }

    setEvents((data || []) as CallEventRow[])
    setEventsLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId || authError) return
    void loadCalls()
  }, [authError, operatorUserId])

  useEffect(() => {
    if (!selectedCallId || !operatorUserId) {
      setEvents([])
      return
    }

    void loadEventsForCall(selectedCallId)
  }, [selectedCallId, operatorUserId])

  useEffect(() => {
    if (!operatorUserId) return

    let liveTimeout: ReturnType<typeof setTimeout> | null = null

    function showLiveMessage(message: string) {
      setLiveMessage(message)
      if (liveTimeout) clearTimeout(liveTimeout)
      liveTimeout = setTimeout(() => setLiveMessage(null), 2500)
    }

    const callsChannel = supabase
      .channel(`calls-inbox-${operatorUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions' },
        async () => {
          await loadCalls({ preserveLoading: true })
          showLiveMessage('Calls inbox refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_events' },
        async () => {
          await loadCalls({ preserveLoading: true })
          if (selectedCallId) {
            await loadEventsForCall(selectedCallId)
          }
          showLiveMessage('Call events refreshed live.')
        }
      )

    callsChannel.subscribe()

    return () => {
      if (liveTimeout) clearTimeout(liveTimeout)
      supabase.removeChannel(callsChannel)
    }
  }, [operatorUserId, selectedCallId])

  const caseById = useMemo(() => new Map(cases.map((item) => [item.id, item])), [cases])

  const filteredCalls = useMemo(() => {
    const query = search.trim().toLowerCase()

    return calls.filter((call) => {
      const linkedCase = call.case_id ? caseById.get(call.case_id) ?? null : null
      const matchesSearch =
        query === '' ||
        call.contact?.full_name?.toLowerCase().includes(query) ||
        call.caller_phone?.toLowerCase().includes(query) ||
        call.intent?.toLowerCase().includes(query) ||
        call.ai_summary?.toLowerCase().includes(query) ||
        call.review_reason?.toLowerCase().includes(query) ||
        call.external_call_id?.toLowerCase().includes(query) ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        linkedCase?.summary?.toLowerCase().includes(query) ||
        linkedCase?.waiting_reason?.toLowerCase().includes(query)

      const matchesTab =
        tab === 'all' ||
        (tab === 'active' && isActiveCall(call.status)) ||
        (tab === 'completed' && isCompletedCall(call.status)) ||
        (tab === 'review' && !!call.needs_operator_review) ||
        (tab === 'unlinked' && !call.case_id) ||
        (tab === 'missed' && isMissedCall(call.status))

      return matchesSearch && matchesTab
    })
  }, [calls, caseById, search, tab])

  const selectedCall = useMemo(
    () => calls.find((item) => item.id === selectedCallId) || null,
    [calls, selectedCallId]
  )

  const selectedLinkedCase = useMemo(
    () => (selectedCall?.case_id ? caseById.get(selectedCall.case_id) ?? null : null),
    [caseById, selectedCall?.case_id]
  )

  const selectedCallReviewState = useMemo(
    () =>
      getReviewState({
        needs_operator_review: selectedCall?.needs_operator_review ?? null,
        review_reason: selectedCall?.review_reason ?? null,
        case_id: selectedCall?.case_id ?? null,
      }),
    [selectedCall]
  )

  const callKpis = useMemo(
    () => ({
      total: calls.length,
      active: calls.filter((call) => isActiveCall(call.status)).length,
      completedToday: calls.filter(
        (call) => isCompletedCall(call.status) && isToday(call.ended_at ?? call.last_event_at ?? call.updated_at)
      ).length,
      review: calls.filter((call) => call.needs_operator_review).length,
      unlinked: calls.filter((call) => !call.case_id).length,
    }),
    [calls]
  )

  useEffect(() => {
    setLinkedCaseId(selectedCall?.case_id || '')
    setAssignedUserId(selectedCall?.assigned_user_id || '')
    setActionMessage(null)
  }, [selectedCall?.assigned_user_id, selectedCall?.case_id, selectedCall?.id])

  async function patchSelectedCall(
    updates: Partial<CallSessionRow> & Record<string, unknown>,
    successMessage: string,
    mode: 'link' | 'review' | 'assignee'
  ) {
    if (!selectedCall) return

    if (mode === 'link') setSavingLink(true)
    if (mode === 'review') setSavingReview(true)
    if (mode === 'assignee') setSavingAssignee(true)
    setActionMessage(null)

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('call_sessions')
      .update({
        ...updates,
        updated_at: now,
        last_event_at: now,
      })
      .eq('id', selectedCall.id)

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setSavingLink(false)
      setSavingReview(false)
      setSavingAssignee(false)
      return
    }

    setCalls((previous) =>
      previous.map((item) =>
        item.id === selectedCall.id
          ? ({ ...item, ...updates, updated_at: now, last_event_at: now } as CallSessionRow)
          : item
      )
    )
    setActionMessage(successMessage)
    setSavingLink(false)
    setSavingReview(false)
    setSavingAssignee(false)
  }

  async function handleAssignToMe() {
    if (!operator?.profile?.id) {
      setActionMessage('Your signed-in account is missing an active users_profiles record.')
      return
    }

    setAssignedUserId(operator.profile.id)
    await patchSelectedCall(
      { assigned_user_id: operator.profile.id },
      `Assigned to ${getOperatorLabel(operator)}.`,
      'assignee'
    )
  }

  async function handleSaveAssignee() {
    await patchSelectedCall(
      { assigned_user_id: assignedUserId || null },
      assignedUserId ? 'Call owner updated.' : 'Call owner cleared.',
      'assignee'
    )
  }

  async function handleSaveLinkedCase() {
    await patchSelectedCall(
      { case_id: linkedCaseId || null },
      linkedCaseId ? 'Linked case updated.' : 'Case link cleared.',
      'link'
    )
  }

  async function handleMarkReviewed() {
    await patchSelectedCall(
      {
        needs_operator_review: false,
        review_reason: null,
      },
      'Review flag cleared.',
      'review'
    )
  }

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="calls" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                {liveMessage || 'Live updates connected'}
              </span>
            </div>
            <p className="app-kicker mt-6">Calls inbox</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Run voice review inside the main operator cockpit
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
              Work from active calls, missed calls, review flags, and unlinked sessions in the same operating language as queue and CRM, so voice work feels like one lane of the same dashboard.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: 'Total calls', value: callKpis.total, tone: 'border-stone-200 bg-stone-50 text-stone-900' },
                  { label: 'Active now', value: callKpis.active, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                  { label: 'Completed today', value: callKpis.completedToday, tone: 'border-sky-200 bg-sky-50 text-sky-900' },
                  { label: 'Need review', value: callKpis.review, tone: 'border-red-200 bg-red-50 text-red-800' },
                  { label: 'Unlinked', value: callKpis.unlinked, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.6rem] border p-4 shadow-sm ${card.tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                  </article>
                ))}
              </div>

            <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 text-sm leading-6 text-stone-600">
              Check active or flagged calls first, link every useful session to a case, and only clear review flags once the next action is clear.
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-4">
              {[
                { label: 'Desk mode', value: 'Voice cockpit', meta: 'Same operator rhythm as queue and CRM.' },
                { label: 'Primary move', value: 'Link and assign', meta: 'Every useful call should end in a case or an owner.' },
                { label: 'Review posture', value: 'Flag before drift', meta: 'Keep human review visible until the next step is explicit.' },
                { label: 'System fit', value: 'One dashboard', meta: 'Calls are another lane inside the same operating layer.' },
              ].map((item) => (
                <article key={item.label} className="rounded-[1.35rem] border border-stone-200 bg-white/88 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.meta}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Inbox Controls</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter down to the calls that need action</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredCalls.length} shown of {calls.length} total
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3" aria-label="Call inbox tabs">
              {[
                ['all', 'All calls'],
                ['active', 'Active'],
                ['completed', 'Completed'],
                ['review', 'Needs review'],
                ['unlinked', 'Unlinked'],
                ['missed', 'Voicemail / failed'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as CallTab)}
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Search calls</span>
              <input
                type="text"
                placeholder="Search by caller, phone, intent, summary, review reason, or external call ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading calls inbox...
          </div>
        )}

        {pageError && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {pageError}
          </div>
        )}

        {!loading && !pageError && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Recent Sessions</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a call from the voice desk</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Sessions refresh live as Annabelle events arrive, but the working panel stays stable so the operator can act quickly.
                </p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredCalls.map((call) => {
                  const selected = call.id === selectedCallId
                  const reviewState = getReviewState(call)
                  const linkedCase = call.case_id ? caseById.get(call.case_id) ?? null : null

                  return (
                    <button
                      key={call.id}
                      onClick={() => setSelectedCallId(call.id)}
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
                              {call.contact?.full_name || call.caller_phone || 'Unknown caller'}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getCallStatusClass(call.status)}`}>
                              {call.status || 'unknown'}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getUrgencyClass(call.urgency)}`}>
                              {call.urgency || 'medium'}
                            </span>
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                            {call.ai_summary || call.intent || 'No summary yet from the call workflow.'}
                          </p>
                        </div>

                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Last update</div>
                          <div className="mt-1 font-medium text-stone-700">
                            {formatRelativeTime(call.last_event_at ?? call.started_at)}
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {call.direction || 'inbound'}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {call.intent || 'Unclassified'}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {linkedCase?.case_number || 'No linked case'}
                        </span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">
                          {call.caller_phone || 'No phone'}
                        </span>
                      </div>

                      <div className={`mt-3 rounded-2xl border border-stone-200/80 px-3 py-2 text-xs ${selected ? 'bg-white/75 text-stone-700' : 'bg-stone-50/80 text-stone-600'}`}>
                        <div className="font-medium text-stone-800">
                          {linkedCase?.case_number || 'No linked case yet'}
                        </div>
                        <div className="mt-1 opacity-80">{getCaseNextStepSummary(linkedCase)}</div>
                      </div>

                      <div className={`mt-4 rounded-2xl border px-3 py-2 text-xs ${reviewState.className}`}>
                        <div className="font-medium">{reviewState.label}</div>
                        <div className="mt-1 opacity-80">{reviewState.detail}</div>
                      </div>
                    </button>
                  )
                })}

                {filteredCalls.length === 0 && (
                  <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">
                    No calls match the current filters. Once Annabelle sessions are ingested, they will
                    land here for review.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedCall ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a call from the left to inspect the summary, transcript, and operator actions.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div>
                      <p className="app-kicker">Selected Call</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">
                          {selectedCall.contact?.full_name || selectedCall.caller_phone || 'Unknown caller'}
                        </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getCallStatusClass(selectedCall.status)}`}>
                          {selectedCall.status || 'unknown'}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getUrgencyClass(selectedCall.urgency)}`}>
                          {selectedCall.urgency || 'medium'}
                        </span>
                        {selectedCall.needs_operator_review && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            Review
                          </span>
                        )}
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {selectedCall.ai_summary || 'No summary has been written yet for this session.'}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Intent
                          </p>
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {selectedCall.intent || 'Unclassified'}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {formatIntentConfidence(selectedCall.intent_confidence)}
                          </p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Started
                          </p>
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {formatShortDateTime(selectedCall.started_at)}
                          </p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Outcome
                          </p>
                          <p className="mt-2 text-sm font-medium text-stone-900">
                            {selectedCall.outcome || 'No outcome yet'}
                          </p>
                        </div>
                      </div>
                    </div>

                      <div className="space-y-4">
                        {selectedLinkedCase && (
                          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Linked case
                            </p>
                            <p className="mt-2 text-lg font-semibold text-stone-900">
                              {selectedLinkedCase.case_number || selectedCall.case_id}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-stone-600">
                              {selectedLinkedCase.summary || 'No case summary yet.'}
                            </p>
                            <div className="mt-3 rounded-2xl border border-stone-200 bg-white/85 px-3 py-2 text-xs text-stone-700">
                              {getCaseNextStepSummary(selectedLinkedCase)}
                            </div>
                          </div>
                        )}

                        <div className={`rounded-[1.5rem] border p-4 ${selectedCallReviewState.className}`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Review state</p>
                          <p className="mt-2 text-lg font-semibold">{selectedCallReviewState.label}</p>
                        <p className="mt-2 text-sm leading-6 opacity-85">
                          {selectedCallReviewState.detail}
                        </p>
                      </div>

                      {selectedCall.case_id && (
                        <Link
                          href={`/cases/${selectedCall.case_id}`}
                          className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                        >
                          Open linked case
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Operator console</p>

                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-stone-700">Assign owner</label>
                            <select
                              value={assignedUserId}
                              onChange={(event) => setAssignedUserId(event.target.value)}
                              className="app-select text-sm"
                            >
                              <option value="">Unassigned</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name}
                                </option>
                              ))}
                            </select>
                            <div className="mt-2 flex flex-col gap-2">
                              <button
                                onClick={() => void handleSaveAssignee()}
                                disabled={savingAssignee}
                                className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                              >
                                {savingAssignee ? 'Saving...' : 'Save owner'}
                              </button>
                              <button
                                onClick={() => void handleAssignToMe()}
                                disabled={savingAssignee || !operator.profile}
                                className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                              >
                                Assign to me
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-stone-700">Link case</label>
                            <select
                              value={linkedCaseId}
                              onChange={(event) => setLinkedCaseId(event.target.value)}
                              className="app-select text-sm"
                            >
                              <option value="">No linked case</option>
                              {cases.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.case_number || item.id}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => void handleSaveLinkedCase()}
                              disabled={savingLink}
                              className="app-secondary-button mt-2 rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                            >
                              {savingLink ? 'Saving...' : 'Save case link'}
                            </button>
                          </div>

                          <div>
                            <button
                              onClick={() => void handleMarkReviewed()}
                              disabled={savingReview || !selectedCall.needs_operator_review}
                              className="app-secondary-button w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                            >
                              {savingReview ? 'Saving...' : 'Clear review flag'}
                            </button>
                          </div>
                        </div>

                        {actionMessage && (
                          <div className="app-card-muted mt-4 rounded-2xl px-4 py-3 text-sm text-stone-700">
                            {actionMessage}
                          </div>
                        )}
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Session facts</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Caller number</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedCall.caller_phone || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>External call ID</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedCall.external_call_id || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Annabelle assistant ID</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {selectedCall.vapi_assistant_id || '-'}
                            </dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Ended</dt>
                            <dd className="text-right font-medium text-stone-900">
                              {formatShortDateTime(selectedCall.ended_at)}
                            </dd>
                          </div>
                        </dl>

                        {selectedCall.recording_url && (
                          <a
                            href={selectedCall.recording_url}
                            target="_blank"
                            rel="noreferrer"
                            className="app-primary-button mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium"
                          >
                            Open recording
                          </a>
                        )}
                      </section>
                    </div>

                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Transcript</p>
                            <h3 className="mt-2 text-xl font-semibold">What the call contained</h3>
                          </div>
                          <div className="text-sm text-stone-500">
                            Last event {formatRelativeTime(selectedCall.last_event_at ?? selectedCall.started_at)}
                          </div>
                        </div>

                        <div className="mt-5 rounded-[1.4rem] border border-stone-200 bg-white/80 p-4 text-sm leading-7 text-stone-800">
                          {selectedCall.transcript || 'No transcript stored yet for this session.'}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Event stream</p>
                            <h3 className="mt-2 text-xl font-semibold">Call timeline</h3>
                          </div>
                          {eventsLoading && (
                            <div className="text-sm text-stone-500">Refreshing events...</div>
                          )}
                        </div>

                        <div className="mt-5 space-y-4">
                          {!eventsLoading && events.length === 0 && (
                            <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                              No call events are stored yet for this session.
                            </div>
                          )}

                          {events.map((event) => (
                            <article
                              key={event.id}
                              className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                                <span>{event.event_type}</span>
                                <span>{formatShortDateTime(event.created_at)}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-800">
                                {event.message_text || 'No event text provided.'}
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
