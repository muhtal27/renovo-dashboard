'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import {
  getOperatorLabel,
} from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorSessionState } from '@/app/operator-session-state'

type CaseDetail = {
  id: string
  case_number: string | null
  summary: string | null
  case_type: string | null
  priority: string | null
  status: string | null
  needs_human_handoff: boolean | null
  handoff_reason: string | null
  created_at: string | null
  last_customer_message_at: string | null
  assigned_user_id: string | null
  contact_id: string | null
  property_id: string | null
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
  message_type: string | null
  created_at: string | null
}

type UserRow = {
  id: string
  full_name: string
}

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type OutboundWebhookResponse = {
  ok?: boolean
  error?: string
  message?: string
  deduped?: boolean
  message_id?: string
  client_send_key?: string | null
  source_draft_message_id?: string | null
}

type ComposerMode = 'internal' | 'outbound'
type TimelineFilter = 'all' | 'inbound' | 'internal' | 'drafts'
type OutboundChannel = 'sms' | 'whatsapp' | 'email'
type WaitingOn = 'none' | 'tenant' | 'landlord' | 'contractor' | 'internal'
type FollowUpRow = {
  id: string
  next_action_at: string | null
  waiting_on: WaitingOn | null
  waiting_reason: string | null
}

const STATUS_OPTIONS = [
  'open',
  'triaged',
  'awaiting_info',
  'awaiting_landlord',
  'awaiting_contractor',
  'scheduled',
  'in_progress',
  'resolved',
  'closed',
  'cancelled',
]

const OUTBOUND_TEMPLATES = [
  {
    label: 'Acknowledged',
    text: 'Thanks for your message. We have received this and an operator is reviewing the case now.',
  },
  {
    label: 'Need access details',
    text: 'Please confirm access arrangements for the property, including any preferred times and whether keys are required.',
  },
  {
    label: 'Booking update',
    text: 'We are arranging the next step on this case and will update you again as soon as a visit or appointment is confirmed.',
  },
]

const OPERATOR_OUTBOUND_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL || null

const OUTBOUND_CHANNEL_OPTIONS: Array<{ value: OutboundChannel; label: string; hint: string }> = [
  { value: 'sms', label: 'SMS', hint: 'Fast default for tenancy updates' },
  { value: 'whatsapp', label: 'WhatsApp', hint: 'Useful when chat is the active channel' },
  { value: 'email', label: 'Email', hint: 'Best for longer written updates' },
]

const WAITING_ON_OPTIONS: Array<{ value: WaitingOn; label: string; hint: string }> = [
  { value: 'none', label: 'No waiting status', hint: 'Use when the next step is owned internally.' },
  { value: 'tenant', label: 'Waiting on tenant', hint: 'Customer needs to reply or confirm access.' },
  { value: 'landlord', label: 'Waiting on landlord', hint: 'Approval or instruction is still outstanding.' },
  { value: 'contractor', label: 'Waiting on contractor', hint: 'Trade partner needs to confirm or update.' },
  { value: 'internal', label: 'Waiting internally', hint: 'An operator or teammate needs to pick up the next action.' },
]

const DRAFT_PREFIX_PATTERN = /^\[(?:Draft by [^\]]+|Draft)\]\s*/i
const DUPLICATE_SEND_WINDOW_MS = 2 * 60 * 1000
const SEND_CONFIRMATION_TIMEOUT_MS = 12_000
const SEND_CONFIRMATION_POLL_MS = 800
const MESSAGE_SELECT_FIELDS = `
  id,
  message_text,
  sender_type,
  direction,
  channel,
  message_type,
  created_at
`

function normalizeMessageText(value: string | null) {
  return (value || '').replace(DRAFT_PREFIX_PATTERN, '').replace(/\s+/g, ' ').trim()
}

function isActiveOutboundDraft(message: MessageRow) {
  return message.message_type === 'draft'
}

function isSupersededDraft(message: MessageRow) {
  return message.message_type === 'draft_superseded'
}

function isConfirmedOutboundMessage(message: MessageRow) {
  return (
    message.direction === 'outbound' &&
    message.message_type !== 'draft' &&
    message.message_type !== 'draft_superseded'
  )
}

function coerceOutboundChannel(value: string | null): OutboundChannel {
  if (value === 'whatsapp' || value === 'email') return value
  return 'sms'
}

function buildOutboundFingerprint(caseId: string, channel: OutboundChannel, text: string) {
  return `${caseId}::${channel}::${normalizeMessageText(text)}`
}

function findMatchingOutboundMessage(
  items: MessageRow[],
  channel: OutboundChannel,
  messageText: string,
  options?: {
    recentWithinMs?: number
    sentAfter?: string | null
  }
) {
  const normalizedTarget = normalizeMessageText(messageText)

  if (!normalizedTarget) return null

  const now = Date.now()
  const sentAfterThreshold = options?.sentAfter
    ? new Date(options.sentAfter).getTime() - 5000
    : null

  return (
    [...items].reverse().find((message) => {
      if (!isConfirmedOutboundMessage(message)) return false
      if (coerceOutboundChannel(message.channel) !== channel) return false
      if (normalizeMessageText(message.message_text) !== normalizedTarget) return false

      const createdAtMs = message.created_at ? new Date(message.created_at).getTime() : null

      if (
        options?.recentWithinMs &&
        createdAtMs !== null &&
        now - createdAtMs > options.recentWithinMs
      ) {
        return false
      }

      if (sentAfterThreshold !== null && createdAtMs !== null && createdAtMs < sentAfterThreshold) {
        return false
      }

      return true
    }) || null
  )
}

function formatClockTime(value: string | null) {
  if (!value) return 'just now'

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
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

function buildLocalDatetimeInput(daysFromNow: number, hour = 9, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, minute, 0, 0)
  return toLocalDatetimeInputValue(date.toISOString())
}

function getFollowUpState(item: Pick<CaseDetail, 'next_action_at' | 'waiting_on' | 'waiting_reason'>) {
  const waitingOn = item.waiting_on && item.waiting_on !== 'none' ? item.waiting_on : null
  const waitingLabel = waitingOn
    ? WAITING_ON_OPTIONS.find((option) => option.value === waitingOn)?.label ?? 'Waiting'
    : null
  const waitingReason = item.waiting_reason?.trim() || null

  if (item.next_action_at) {
    const dueAt = new Date(item.next_action_at)
    const now = new Date()

    if (dueAt.getTime() <= now.getTime()) {
      return {
        label: 'Follow-up overdue',
        detail: `Due ${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • ${waitingLabel.toLowerCase()}` : ''}`,
        className: 'border-red-200 bg-red-50 text-red-700',
      }
    }

    if (isSameLocalDay(dueAt, now)) {
      return {
        label: 'Due today',
        detail: `${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • ${waitingLabel.toLowerCase()}` : ''}`,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      }
    }

    return {
      label: 'Next step booked',
      detail: `${formatShortDateTime(item.next_action_at)}${waitingLabel ? ` • ${waitingLabel.toLowerCase()}` : ''}`,
      className: 'border-sky-200 bg-sky-50 text-sky-800',
    }
  }

  if (waitingLabel) {
    return {
      label: waitingLabel,
      detail: waitingReason || 'No timed chase is set yet.',
      className: 'border-stone-200 bg-stone-50 text-stone-700',
    }
  }

  return {
    label: 'No next step set',
    detail: 'Set a due date or waiting status so this case does not drift.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  }
}

function generateClientSendKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `send-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function fetchCaseMessages(caseId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT_FIELDS)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []) as MessageRow[]
}

function badgeClass(value: string | null, type: 'priority' | 'status' | 'handoff') {
  if (type === 'priority') {
    if (value === 'urgent') return 'bg-red-100 text-red-700 border-red-200'
    if (value === 'high') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (value === 'medium') return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  if (type === 'status') {
    if (value === 'open') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (value === 'in_progress') return 'bg-sky-100 text-sky-700 border-sky-200'
    if (value === 'resolved') return 'bg-violet-100 text-violet-700 border-violet-200'
    if (value === 'closed') return 'bg-stone-200 text-stone-700 border-stone-300'
    return 'bg-stone-100 text-stone-700 border-stone-200'
  }

  return 'bg-rose-100 text-rose-700 border-rose-200'
}

function getMessageStyle(message: MessageRow) {
  if (isActiveOutboundDraft(message)) {
    return {
      cardClass: 'border-amber-200 bg-amber-50',
      label: 'Outbound draft',
      metaClass: 'text-amber-700',
    }
  }

  if (isSupersededDraft(message)) {
    return {
      cardClass: 'border-stone-200 bg-stone-50',
      label: 'Superseded draft',
      metaClass: 'text-stone-500',
    }
  }

  if (message.message_type === 'note' || message.direction === 'internal') {
    return {
      cardClass: 'border-stone-200 bg-stone-50',
      label: 'Internal note',
      metaClass: 'text-stone-500',
    }
  }

  if (message.direction === 'outbound') {
    return {
      cardClass: 'border-sky-200 bg-sky-50',
      label: 'Outbound sent',
      metaClass: 'text-sky-700',
    }
  }

  return {
    cardClass: 'border-emerald-200 bg-emerald-50',
    label: 'Inbound',
    metaClass: 'text-emerald-700',
  }
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'No activity yet'

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function getSlaTone(lastCustomerMessageAt: string | null, priority: string | null) {
  if (!lastCustomerMessageAt) {
    return {
      label: 'No customer reply waiting',
      className: 'border-stone-200 bg-stone-50 text-stone-700',
    }
  }

  const ageHours = (Date.now() - new Date(lastCustomerMessageAt).getTime()) / 3600000
  const urgentThreshold = priority === 'urgent' ? 1 : priority === 'high' ? 4 : 12

  if (ageHours >= urgentThreshold) {
    return {
      label: 'Needs prompt operator attention',
      className: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  return {
    label: 'Within response window',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { operator, authLoading, authError } = useOperatorGate()
  const [caseItem, setCaseItem] = useState<CaseDetail | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [property, setProperty] = useState<PropertyRow | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [propertyLoading, setPropertyLoading] = useState(false)

  const [status, setStatus] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')

  const [savingStatus, setSavingStatus] = useState(false)
  const [savingAssignee, setSavingAssignee] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingOutbound, setSendingOutbound] = useState(false)
  const [confirmingOutbound, setConfirmingOutbound] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [assigneeMessage, setAssigneeMessage] = useState<string | null>(null)
  const [noteMessage, setNoteMessage] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState<string | null>(null)
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [draftText, setDraftText] = useState('')
  const [nextActionAtInput, setNextActionAtInput] = useState('')
  const [waitingOn, setWaitingOn] = useState<WaitingOn>('none')
  const [waitingReason, setWaitingReason] = useState('')
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [outboundChannel, setOutboundChannel] = useState<OutboundChannel>('sms')
  const [composerMode, setComposerMode] = useState<ComposerMode>('internal')
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all')
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [lastSentSummary, setLastSentSummary] = useState<string | null>(null)
  const [duplicateSendGuard, setDuplicateSendGuard] = useState<string | null>(null)
  const [followUpAvailable, setFollowUpAvailable] = useState(true)
  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadCaseBundle = useEffectEvent(async (options?: { preserveLoading?: boolean }) => {
    if (!operatorUserId) return

    if (!options?.preserveLoading) {
      setLoading(true)
    }
    setError(null)

    const { id } = await params

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        id,
        case_number,
        summary,
        case_type,
        priority,
        status,
        needs_human_handoff,
        handoff_reason,
        created_at,
        last_customer_message_at,
        assigned_user_id,
        contact_id,
        property_id
      `)
      .eq('id', id)
      .single()

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    let nextCase: CaseDetail = {
      ...(caseData as CaseDetail),
      next_action_at: null,
      waiting_on: 'none' as WaitingOn,
      waiting_reason: null,
    }

    const { data: followUpData, error: followUpError } = await supabase
      .from('cases')
      .select('id, next_action_at, waiting_on, waiting_reason')
      .eq('id', id)
      .maybeSingle()

    if (followUpError) {
      setFollowUpAvailable(false)
    } else if (followUpData) {
      setFollowUpAvailable(true)
      nextCase = {
        ...nextCase,
        ...(followUpData as FollowUpRow),
      }
    }

    setCaseItem(nextCase)
    setStatus(nextCase.status || 'open')
    setAssignedUserId(nextCase.assigned_user_id || '')
    setNextActionAtInput(toLocalDatetimeInputValue(nextCase.next_action_at ?? null))
    setWaitingOn(nextCase.waiting_on ?? 'none')
    setWaitingReason(nextCase.waiting_reason ?? '')
    setLoading(false)

    setMessagesLoading(true)
    const [
      { data: messagesData, error: messagesError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase
        .from('messages')
        .select(`
          id,
          message_text,
          sender_type,
          direction,
          channel,
          message_type,
          created_at
        `)
        .eq('case_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('users_profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name', { ascending: true }),
    ])

    if (messagesError) {
      setError(messagesError.message)
      setMessagesLoading(false)
      return
    }

    if (usersError) {
      setError(usersError.message)
      return
    }

    setMessages((messagesData || []) as MessageRow[])
    setMessagesLoading(false)
    setUsers((usersData || []) as UserRow[])

    if (nextCase.contact_id) {
      setContactLoading(true)
      const { data: fetchedContact, error: contactError } = await supabase
        .from('contacts')
        .select('id, full_name, phone, email')
        .eq('id', nextCase.contact_id)
        .single()

      if (contactError) {
        setError(contactError.message)
        setContactLoading(false)
        return
      }

      setContact((fetchedContact as ContactRow) || null)
      setContactLoading(false)
    } else {
      setContact(null)
    }

    if (nextCase.property_id) {
      setPropertyLoading(true)
      const { data: fetchedProperty, error: propertyError } = await supabase
        .from('properties')
        .select('id, address_line_1, address_line_2, city, postcode')
        .eq('id', nextCase.property_id)
        .single()

      if (propertyError) {
        setError(propertyError.message)
        setPropertyLoading(false)
        return
      }

      setProperty((fetchedProperty as PropertyRow) || null)
      setPropertyLoading(false)
    } else {
      setProperty(null)
    }
  })

  const loadMessagesForCurrentCase = useEffectEvent(
    async (caseId: string, options?: { silent?: boolean }) => {
      try {
        const nextMessages = await fetchCaseMessages(caseId)
        setMessages(nextMessages)
        return nextMessages
      } catch (messagesError) {
        if (!options?.silent) {
          setError(messagesError instanceof Error ? messagesError.message : 'Unable to load messages.')
        }
        return null
      }
    }
  )

  useEffect(() => {
    if (!operatorUserId || authError) return

    async function loadCase() {
      setError(null)
      await loadCaseBundle()
    }

    loadCase()
  }, [authError, operatorUserId, params])

  useEffect(() => {
    if (!operatorUserId || !caseItem?.id) return

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

    const caseChannel = supabase
      .channel(`case-detail-${caseItem.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseItem.id}`,
        },
        async () => {
          await loadCaseBundle({ preserveLoading: true })
          showLiveMessage('Case details refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${caseItem.id}`,
        },
        async () => {
          await loadMessagesForCurrentCase(caseItem.id)
          showLiveMessage('Timeline refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users_profiles' },
        async () => {
          await loadCaseBundle({ preserveLoading: true })
          showLiveMessage('Assignee list refreshed live.')
        }
      )

    caseChannel.subscribe()

    return () => {
      if (liveTimeout) {
        clearTimeout(liveTimeout)
      }

      supabase.removeChannel(caseChannel)
    }
  }, [caseItem?.id, operatorUserId])

  useEffect(() => {
    setDuplicateSendGuard(null)
  }, [caseItem?.id, draftText, outboundChannel])

  useEffect(() => {
    setActiveDraftId(null)
  }, [caseItem?.id])

  const internalNotes = useMemo(
    () => messages.filter((message) => message.message_type === 'note' || message.direction === 'internal'),
    [messages]
  )

  const outboundDrafts = useMemo(
    () => messages.filter((message) => isActiveOutboundDraft(message)),
    [messages]
  )

  const supersededDrafts = useMemo(
    () => messages.filter((message) => isSupersededDraft(message)),
    [messages]
  )

  const currentOutboundFingerprint = useMemo(() => {
    if (!caseItem || !draftText.trim()) return null

    return buildOutboundFingerprint(caseItem.id, outboundChannel, draftText)
  }, [caseItem, draftText, outboundChannel])

  const recentMatchingOutbound = useMemo(() => {
    if (!draftText.trim()) return null

    return findMatchingOutboundMessage(messages, outboundChannel, draftText, {
      recentWithinMs: DUPLICATE_SEND_WINDOW_MS,
    })
  }, [draftText, messages, outboundChannel])

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (timelineFilter === 'all') return true
      if (timelineFilter === 'internal') {
        return message.message_type === 'note' || message.direction === 'internal'
      }
      if (timelineFilter === 'drafts') {
        return message.message_type === 'draft'
      }
      if (timelineFilter === 'inbound') {
        return message.direction === 'inbound' || (!message.direction && message.message_type !== 'draft')
      }
      return true
    })
  }, [messages, timelineFilter])

  const lastCustomerActivityLabel = useMemo(
    () => formatRelativeTime(caseItem?.last_customer_message_at ?? null),
    [caseItem?.last_customer_message_at]
  )

  const slaTone = useMemo(
    () => getSlaTone(caseItem?.last_customer_message_at ?? null, caseItem?.priority ?? null),
    [caseItem?.last_customer_message_at, caseItem?.priority]
  )

  const caseFollowUp = useMemo(
    () =>
      getFollowUpState({
        next_action_at: caseItem?.next_action_at ?? null,
        waiting_on: caseItem?.waiting_on ?? 'none',
        waiting_reason: caseItem?.waiting_reason ?? null,
      }),
    [caseItem?.next_action_at, caseItem?.waiting_on, caseItem?.waiting_reason]
  )

  async function addInternalAuditNote(messageText: string) {
    if (!caseItem) return null

    const now = new Date().toISOString()
    const notePrefix = operator ? `[${getOperatorLabel(operator)}] ` : ''

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        case_id: caseItem.id,
        channel: 'internal',
        sender_type: 'user',
        message_text: `${notePrefix}${messageText}`,
        direction: 'internal',
        message_type: 'note',
        created_at: now,
      })
      .select(`
        id,
        message_text,
        sender_type,
        direction,
        channel,
        message_type,
        created_at
      `)
      .single()

    if (insertError) {
      return insertError.message
    }

    setMessages((previous) => [...previous, data as MessageRow])
    return null
  }

  async function supersedeMatchingDrafts(channel: OutboundChannel, messageText: string) {
    const normalizedTarget = normalizeMessageText(messageText)

    const matchingDraftIds = messages
      .filter(
        (message) =>
          isActiveOutboundDraft(message) &&
          coerceOutboundChannel(message.channel) === channel &&
          normalizeMessageText(message.message_text) === normalizedTarget
      )
      .map((message) => message.id)

    if (matchingDraftIds.length === 0) {
      return {
        count: 0,
        error: null as string | null,
      }
    }

    const { error: updateError } = await supabase
      .from('messages')
      .update({ message_type: 'draft_superseded' })
      .in('id', matchingDraftIds)

    if (updateError) {
      return {
        count: 0,
        error: updateError.message,
      }
    }

    setMessages((previous) =>
      previous.map((message) =>
        matchingDraftIds.includes(message.id)
          ? { ...message, message_type: 'draft_superseded' }
          : message
      )
    )

    return {
      count: matchingDraftIds.length,
      error: null as string | null,
    }
  }

  async function waitForSentMessageConfirmation(
    caseId: string,
    channel: OutboundChannel,
    messageText: string,
    sendStartedAt: string,
    expectedMessageId?: string | null
  ) {
    const startedMs = Date.now()

    while (Date.now() - startedMs < SEND_CONFIRMATION_TIMEOUT_MS) {
      try {
        const refreshedMessages = await fetchCaseMessages(caseId)
        setMessages(refreshedMessages)

        if (expectedMessageId) {
          const messageById = refreshedMessages.find((message) => message.id === expectedMessageId) || null

          if (messageById) {
            return messageById
          }
        }

        const confirmedMessage = findMatchingOutboundMessage(
          refreshedMessages,
          channel,
          messageText,
          { sentAfter: sendStartedAt }
        )

        if (confirmedMessage) {
          return confirmedMessage
        }
      } catch {
        return null
      }

      await new Promise((resolve) => window.setTimeout(resolve, SEND_CONFIRMATION_POLL_MS))
    }

    return null
  }

  async function handleStatusUpdate() {
    if (!caseItem) return

    setSavingStatus(true)
    setStatusMessage(null)

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status,
        updated_at: now,
        last_activity_at: now,
      })
      .eq('id', caseItem.id)

    if (updateError) {
      setStatusMessage(`Error: ${updateError.message}`)
      setSavingStatus(false)
      return
    }

    setCaseItem({ ...caseItem, status })
    setStatusMessage('Status updated successfully.')
    setSavingStatus(false)
  }

  async function handleAssigneeUpdate(nextAssignedUserId = assignedUserId) {
    if (!caseItem) return

    setSavingAssignee(true)
    setAssigneeMessage(null)

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('cases')
      .update({
        assigned_user_id: nextAssignedUserId || null,
        updated_at: now,
        last_activity_at: now,
      })
      .eq('id', caseItem.id)

    if (updateError) {
      setAssigneeMessage(`Error: ${updateError.message}`)
      setSavingAssignee(false)
      return
    }

    setAssignedUserId(nextAssignedUserId || '')
    setCaseItem({ ...caseItem, assigned_user_id: nextAssignedUserId || null })
    setAssigneeMessage(
      nextAssignedUserId
        ? 'Assignee updated successfully.'
        : 'Case is now unassigned.'
    )
    setSavingAssignee(false)
  }

  async function handleAssignToMe() {
    if (!operator?.profile?.id) {
      setAssigneeMessage('Your signed-in account is missing an active users_profiles record.')
      return
    }

    await handleAssigneeUpdate(operator.profile.id)
  }

  async function handleFollowUpUpdate(overrides?: {
    nextActionAtInput?: string
    waitingOn?: WaitingOn
    waitingReason?: string
    successMessage?: string
  }) {
    if (!caseItem) return

    const nextInput = overrides?.nextActionAtInput ?? nextActionAtInput
    const nextWaitingOn = overrides?.waitingOn ?? waitingOn
    const nextWaitingReason = overrides?.waitingReason ?? waitingReason
    const nextActionAt = fromLocalDatetimeInputValue(nextInput)

    setSavingFollowUp(true)
    setFollowUpMessage(null)

    const now = new Date().toISOString()
    const payload = {
      next_action_at: nextActionAt,
      waiting_on: nextWaitingOn,
      waiting_reason: nextWaitingReason.trim() || null,
      updated_at: now,
      last_activity_at: now,
    }

    const { error: updateError } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', caseItem.id)

    if (updateError) {
      setFollowUpMessage(`Error: ${updateError.message}`)
      setSavingFollowUp(false)
      return
    }

    setNextActionAtInput(nextInput)
    setWaitingOn(nextWaitingOn)
    setWaitingReason(nextWaitingReason)
    setCaseItem({
      ...caseItem,
      next_action_at: nextActionAt,
      waiting_on: nextWaitingOn,
      waiting_reason: nextWaitingReason.trim() || null,
    })
    setFollowUpMessage(overrides?.successMessage || 'Next step updated.')
    setSavingFollowUp(false)
  }

  async function handleFollowUpShortcut(kind: 'tomorrow' | 'tenant_chase' | 'landlord_waiting' | 'clear') {
    if (kind === 'clear') {
      await handleFollowUpUpdate({
        nextActionAtInput: '',
        waitingOn: 'none',
        waitingReason: '',
        successMessage: 'Next step cleared.',
      })
      return
    }

    if (kind === 'tomorrow') {
      await handleFollowUpUpdate({
        nextActionAtInput: buildLocalDatetimeInput(1, 9, 0),
        successMessage: 'Next step set for tomorrow morning.',
      })
      return
    }

    if (kind === 'tenant_chase') {
      await handleFollowUpUpdate({
        nextActionAtInput: buildLocalDatetimeInput(2, 9, 0),
        waitingOn: 'tenant',
        waitingReason: waitingReason.trim() || 'Awaiting tenant reply or access confirmation.',
        successMessage: 'Tenant chase queued for two days from now.',
      })
      return
    }

    await handleFollowUpUpdate({
      nextActionAtInput: nextActionAtInput || buildLocalDatetimeInput(2, 9, 0),
      waitingOn: 'landlord',
      waitingReason: waitingReason.trim() || 'Awaiting landlord approval or instruction.',
      successMessage: 'Marked as waiting on landlord.',
    })
  }

  async function handleAddNote() {
    if (!caseItem || !noteText.trim()) return

    setSavingNote(true)
    setNoteMessage(null)

    const now = new Date().toISOString()
    const trimmedNote = noteText.trim()
    const notePrefix = operator ? `[${getOperatorLabel(operator)}] ` : ''

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        case_id: caseItem.id,
        channel: 'internal',
        sender_type: 'user',
        message_text: `${notePrefix}${trimmedNote}`,
        direction: 'internal',
        message_type: 'note',
        created_at: now,
      })
      .select(`
        id,
        message_text,
        sender_type,
        direction,
        channel,
        message_type,
        created_at
      `)
      .single()

    if (insertError) {
      setNoteMessage(`Error: ${insertError.message}`)
      setSavingNote(false)
      return
    }

    setMessages((previous) => [...previous, data as MessageRow])
    setNoteText('')
    setNoteMessage('Internal note added.')
    setSavingNote(false)
  }

  async function handleSaveDraft() {
    if (!caseItem || !draftText.trim()) return

    setSavingDraft(true)
    setDraftMessage(null)

    const now = new Date().toISOString()
    const trimmedDraft = draftText.trim()
    const draftPrefix = operator ? `[Draft by ${getOperatorLabel(operator)}] ` : '[Draft] '

    const { data, error: insertError } = await supabase
      .from('messages')
      .insert({
        case_id: caseItem.id,
        channel: outboundChannel,
        sender_type: 'user',
        message_text: `${draftPrefix}${trimmedDraft}`,
        direction: 'outbound',
        message_type: 'draft',
        created_at: now,
      })
      .select(`
        id,
        message_text,
        sender_type,
        direction,
        channel,
        message_type,
        created_at
      `)
      .single()

    if (insertError) {
      setDraftMessage(`Error: ${insertError.message}`)
      setSavingDraft(false)
      return
    }

    setMessages((previous) => [...previous, data as MessageRow])
    setDraftText('')
    setActiveDraftId(null)
    setDraftMessage(`Outbound ${outboundChannel} draft saved. Nothing has been sent yet.`)
    setSavingDraft(false)
  }

  async function handleSendOutbound() {
    if (!caseItem || !draftText.trim()) return

    if (!OPERATOR_OUTBOUND_WEBHOOK_URL) {
      setDraftMessage(
        'Outbound sending is not configured yet. Add NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL before sending live messages.'
      )
      return
    }

    const trimmedDraft = draftText.trim()
    const sendFingerprint = buildOutboundFingerprint(caseItem.id, outboundChannel, trimmedDraft)

    if (recentMatchingOutbound && duplicateSendGuard !== sendFingerprint) {
      setDuplicateSendGuard(sendFingerprint)
      setDraftMessage(
        `This exact ${outboundChannel.toUpperCase()} message was already sent at ${
          recentMatchingOutbound.created_at
            ? new Date(recentMatchingOutbound.created_at).toLocaleString()
            : 'a recent time'
        }. Press send again to confirm a retry.`
      )
      return
    }

    setSendingOutbound(true)
    setConfirmingOutbound(false)
    setDraftMessage(null)
    setLastSentSummary(null)
    setDuplicateSendGuard(null)

    const sendStartedAt = new Date().toISOString()
    const clientSendKey = activeDraftId ? null : generateClientSendKey()

    try {
      const response = await fetch(OPERATOR_OUTBOUND_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_id: caseItem.id,
          message_text: trimmedDraft,
          channel: outboundChannel,
          operator_user_id: operator?.profile?.id || operator?.authUser?.id || '',
          sender_contact_id: contact?.id || caseItem.contact_id || '',
          client_send_key: clientSendKey,
          source_draft_message_id: activeDraftId,
        }),
      })

      const result = (await response.json().catch(() => null)) as OutboundWebhookResponse | null

      if (!response.ok || !result?.ok) {
        const failureReason = result?.error || 'Webhook did not accept the outbound message.'
        setDraftMessage(`Send failed: ${failureReason}`)
        await addInternalAuditNote(
          `Outbound ${outboundChannel.toUpperCase()} send failed. Draft kept for retry. Reason: ${failureReason}`
        )
        return
      }

      setSendingOutbound(false)
      setConfirmingOutbound(true)
      setTimelineFilter('all')
      setDraftMessage('Webhook accepted. Confirming the sent log in the timeline...')

      const confirmedMessage = await waitForSentMessageConfirmation(
        caseItem.id,
        outboundChannel,
        trimmedDraft,
        sendStartedAt,
        result?.message_id || null
      )

      const supersededDraftResult = await supersedeMatchingDrafts(outboundChannel, trimmedDraft)

      setDraftText('')
      setActiveDraftId(null)

      if (confirmedMessage) {
        const summaryParts = [
          result?.deduped
            ? `${outboundChannel.toUpperCase()} already recorded ${formatClockTime(confirmedMessage.created_at)}`
            : `${outboundChannel.toUpperCase()} sent ${formatClockTime(confirmedMessage.created_at)}`,
        ]

        if (supersededDraftResult.count > 0) {
          summaryParts.push(
            `${supersededDraftResult.count} draft${supersededDraftResult.count === 1 ? '' : 's'} archived`
          )
        }

        setLastSentSummary(summaryParts.join(' • '))
        setDraftMessage(
          supersededDraftResult.error
            ? `${result?.deduped ? 'Duplicate send was safely deduped and the existing message is confirmed in the timeline' : 'Sent and confirmed in the timeline'}, but matching drafts could not be archived: ${supersededDraftResult.error}`
            : supersededDraftResult.count > 0
              ? `${result?.deduped ? 'Duplicate send was safely deduped and the existing message is confirmed in the timeline' : 'Sent and confirmed in the timeline'}. ${supersededDraftResult.count} matching saved draft${supersededDraftResult.count === 1 ? ' was' : 's were'} moved out of the active draft list.`
              : result?.deduped
                ? 'Duplicate send was safely deduped and the existing message is confirmed in the timeline.'
                : 'Sent and confirmed in the timeline.'
        )
      } else {
        setLastSentSummary(
          result?.deduped
            ? `${outboundChannel.toUpperCase()} duplicate prevented by backend`
            : `${outboundChannel.toUpperCase()} accepted by n8n`
        )
        setDraftMessage(
          supersededDraftResult.error
            ? `${result?.deduped ? 'Backend dedupe accepted the request' : 'Webhook accepted'}, but the sent row has not appeared in the timeline yet and matching drafts could not be archived: ${supersededDraftResult.error}`
            : supersededDraftResult.count > 0
              ? `${result?.deduped ? 'Backend dedupe accepted the request' : 'Webhook accepted'}. ${supersededDraftResult.count} matching saved draft${supersededDraftResult.count === 1 ? ' was' : 's were'} archived, but the sent row has not appeared in the timeline yet. Wait a moment before retrying.`
              : result?.deduped
                ? 'Backend dedupe accepted the request, but the matching sent row has not appeared in the timeline yet. Wait a moment before retrying.'
                : 'Webhook accepted, but the sent row has not appeared in the timeline yet. Wait a moment before retrying.'
        )
      }
    } catch (sendError) {
      const failureReason =
        sendError instanceof Error ? sendError.message : 'Unknown network error.'
      setDraftMessage(
        `Send failed: ${failureReason}`
      )
      await addInternalAuditNote(
        `Outbound ${outboundChannel.toUpperCase()} send failed. Draft kept for retry. Reason: ${failureReason}`
      )
    } finally {
      setSendingOutbound(false)
      setConfirmingOutbound(false)
    }
  }

  const submitCurrentComposer = useEffectEvent(async () => {
    if (composerMode === 'internal' && noteText.trim() && !savingNote) {
      await handleAddNote()
    }

    if (composerMode === 'outbound' && draftText.trim() && !sendingOutbound && !confirmingOutbound) {
      await handleSendOutbound()
    }
  })

  function applyOutboundTemplate(templateText: string) {
    setComposerMode('outbound')
    setDraftText(templateText)
    setActiveDraftId(null)
    setDraftMessage(null)
  }

  function loadDraftIntoComposer(draft: MessageRow) {
    setComposerMode('outbound')
    setActiveDraftId(draft.id)
    setOutboundChannel(coerceOutboundChannel(draft.channel))
    setDraftText(normalizeMessageText(draft.message_text))
    setDraftMessage('Saved draft loaded into the composer.')
    setLastSentSummary(null)
  }

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isTypingField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault()
        setComposerMode('internal')
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        setComposerMode('outbound')
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
        event.preventDefault()
        void submitCurrentComposer()
        return
      }

      if (isTypingField) return

      if (event.key.toLowerCase() === 'i') {
        setComposerMode('internal')
      }

      if (event.key.toLowerCase() === 'o') {
        setComposerMode('outbound')
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [])

  async function copyToClipboard(value: string | null, label: string) {
    if (!value) {
      setCopyMessage(`No ${label.toLowerCase()} available to copy.`)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`${label} copied.`)
      window.setTimeout(() => setCopyMessage(null), 2000)
    } catch {
      setCopyMessage(`Could not copy ${label.toLowerCase()}.`)
    }
  }

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  if (loading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading case...
          </div>
        </div>
      </main>
    )
  }

  if (pageError) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-red-200 bg-red-50/95 px-6 py-10 text-sm text-red-700">
            Error: {pageError}
          </div>
        </div>
      </main>
    )
  }

  if (!caseItem) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Case not found.
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Back to cases
            </Link>
            <Link
              href="/calls"
              className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Open calls inbox
            </Link>
          </div>

          <div className="app-surface rounded-[1.5rem] px-4 py-3 text-right">
            <div className="app-kicker">Operator</div>
            <div className="mt-1 text-sm font-medium text-stone-900">
              {getOperatorLabel(operator)}
            </div>
            <div className="app-live-pill mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium">
              {liveMessage || 'Live updates connected'}
            </div>
          </div>
        </div>

        <div className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="app-kicker">Case workspace</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{caseItem.case_number}</h1>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(caseItem.priority, 'priority')}`}>
                  {caseItem.priority || 'unknown'}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(caseItem.status, 'status')}`}>
                  {caseItem.status || 'unknown'}
                </span>
                {caseItem.needs_human_handoff && (
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(caseItem.handoff_reason, 'handoff')}`}>
                    {caseItem.handoff_reason || 'handoff'}
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                {caseItem.summary || 'No summary provided'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-3">
                <div className="app-card-muted rounded-[1.4rem] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Current owner
                  </div>
                  <div className="mt-2 text-sm font-medium text-stone-900">
                    {users.find((user) => user.id === assignedUserId)?.full_name || 'Unassigned'}
                  </div>
                </div>
                <div className="app-card-muted rounded-[1.4rem] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Case type
                  </div>
                  <div className="mt-2 text-sm font-medium text-stone-900">
                    {caseItem.case_type || 'General'}
                  </div>
                </div>
                <div className="app-card-muted rounded-[1.4rem] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Timeline entries
                  </div>
                  <div className="mt-2 text-sm font-medium text-stone-900">{messages.length}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
              <div className={`rounded-[1.5rem] border px-4 py-4 ${slaTone.className}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]">Response health</div>
                <div className="mt-2 text-lg font-semibold">{slaTone.label}</div>
                <div className="mt-2 text-sm opacity-80">
                  Last customer activity {lastCustomerActivityLabel}
                </div>
              </div>

              {followUpAvailable && (
                <div className={`rounded-[1.5rem] border px-4 py-4 ${caseFollowUp.className}`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em]">Next step</div>
                  <div className="mt-2 text-lg font-semibold">{caseFollowUp.label}</div>
                  <div className="mt-2 text-sm opacity-85">{caseFollowUp.detail}</div>
                </div>
              )}

              <div className="app-card-muted rounded-[1.5rem] px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Shortcuts</div>
                <div className="mt-2 text-sm leading-6 text-stone-700">`I` note, `O` draft, `Cmd/Ctrl+Enter` save the current workspace action</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <section className="app-surface rounded-[1.8rem] p-6">
              <p className="app-kicker">Case controls</p>
              <h2 className="mt-2 text-xl font-semibold">Keep ownership and status tidy</h2>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-stone-900">Update status</h3>
                  <div className="mt-3 flex flex-col gap-3">
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="app-select"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleStatusUpdate}
                      disabled={savingStatus}
                      className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                    >
                      {savingStatus ? 'Saving...' : 'Save Status'}
                    </button>

                    {statusMessage && <p className="text-sm text-stone-600">{statusMessage}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-stone-900">Assign case</h3>
                  <div className="mt-3 flex flex-col gap-3">
                    <select
                      value={assignedUserId}
                      onChange={(event) => setAssignedUserId(event.target.value)}
                      className="app-select"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => handleAssigneeUpdate()}
                        disabled={savingAssignee}
                        className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                      >
                        {savingAssignee ? 'Saving...' : 'Save Assignee'}
                      </button>

                      <button
                        onClick={handleAssignToMe}
                        disabled={savingAssignee || !operator.profile}
                        className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                      >
                        Assign to Me
                      </button>
                    </div>

                    {assigneeMessage && <p className="text-sm text-stone-600">{assigneeMessage}</p>}
                  </div>
                </div>
              </div>
            </section>

            <section className="app-surface rounded-[1.8rem] p-6">
              <p className="app-kicker">Next step</p>
              <h2 className="mt-2 text-xl font-semibold">Make the follow-through explicit</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Set when this case should be looked at again and who the team is waiting on, so it
                does not rely on operator memory.
              </p>

              {!followUpAvailable ? (
                <div className="app-empty-state mt-5 rounded-[1.6rem] p-5 text-sm">
                  Follow-up tracking will appear here after the latest Supabase migration is applied.
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className={`rounded-[1.5rem] border p-4 ${caseFollowUp.className}`}>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em]">Current state</div>
                      <div className="mt-2 text-lg font-semibold">{caseFollowUp.label}</div>
                      <div className="mt-2 text-sm leading-6 opacity-85">{caseFollowUp.detail}</div>
                    </div>

                    <div className="app-card-muted rounded-[1.5rem] p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        One-click shortcuts
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button
                          onClick={() => void handleFollowUpShortcut('tomorrow')}
                          disabled={savingFollowUp}
                          className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                        >
                          Follow up tomorrow 09:00
                        </button>
                        <button
                          onClick={() => void handleFollowUpShortcut('tenant_chase')}
                          disabled={savingFollowUp}
                          className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                        >
                          Chase tenant in 2 days
                        </button>
                        <button
                          onClick={() => void handleFollowUpShortcut('landlord_waiting')}
                          disabled={savingFollowUp}
                          className="app-secondary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                        >
                          Mark waiting on landlord
                        </button>
                        <button
                          onClick={() => void handleFollowUpShortcut('clear')}
                          disabled={savingFollowUp}
                          className="app-tertiary-button rounded-2xl px-4 py-3 text-left text-sm font-medium disabled:opacity-50"
                        >
                          Clear next step
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Next action due</span>
                      <input
                        type="datetime-local"
                        value={nextActionAtInput}
                        onChange={(event) => setNextActionAtInput(event.target.value)}
                        className="app-field text-sm outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Waiting on</span>
                      <select
                        value={waitingOn}
                        onChange={(event) => setWaitingOn(event.target.value as WaitingOn)}
                        className="app-select text-sm"
                      >
                        {WAITING_ON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">Why this is waiting</span>
                    <textarea
                      value={waitingReason}
                      onChange={(event) => setWaitingReason(event.target.value)}
                      placeholder="Example: landlord approval needed before we can confirm access"
                      rows={3}
                      className="app-textarea outline-none"
                    />
                  </label>

                  <p className="mt-3 text-xs text-stone-500">
                    Current waiting status:{' '}
                    {WAITING_ON_OPTIONS.find((option) => option.value === waitingOn)?.hint}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-stone-600">
                      Save a clear next step whenever you send an update, hand off ownership, or are
                      waiting on someone else.
                    </p>
                    <button
                      onClick={() => void handleFollowUpUpdate()}
                      disabled={savingFollowUp}
                      className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                    >
                      {savingFollowUp ? 'Saving...' : 'Save next step'}
                    </button>
                  </div>

                  {followUpMessage && <p className="mt-3 text-sm text-stone-600">{followUpMessage}</p>}
                </>
              )}
            </section>

            <section className="app-surface rounded-[1.8rem] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="app-kicker">Communication workspace</p>
                  <h2 className="mt-2 text-xl font-semibold">Keep notes private and replies deliberate</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    This area is split so operators can think out loud internally without confusing
                    that with customer-facing messages.
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Keyboard: `I` for internal, `O` for outbound, `Cmd/Ctrl+Enter` to save.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setComposerMode('internal')}
                    aria-pressed={composerMode === 'internal'}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      composerMode === 'internal'
                        ? 'app-pill-active'
                        : 'app-pill'
                    }`}
                  >
                    Internal note
                  </button>
                  <button
                    onClick={() => setComposerMode('outbound')}
                    aria-pressed={composerMode === 'outbound'}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      composerMode === 'outbound'
                        ? 'app-pill-active'
                        : 'app-pill'
                    }`}
                  >
                    Outbound draft
                  </button>
                </div>
              </div>

              {composerMode === 'internal' ? (
                <div className="app-card-muted mt-4 rounded-[1.6rem] p-5">
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Add an internal note for your team..."
                    rows={4}
                    className="app-textarea outline-none"
                  />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-xs text-stone-500">
                      Posting as {getOperatorLabel(operator)}.
                    </p>
                    <button
                      onClick={handleAddNote}
                      disabled={savingNote || !noteText.trim()}
                      className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                  {noteMessage && <p className="mt-3 text-sm text-stone-600">{noteMessage}</p>}
                </div>
              ) : (
                <div className="app-card-warm mt-4 rounded-[1.6rem] p-5">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="flex flex-wrap gap-2">
                      {OUTBOUND_TEMPLATES.map((template) => (
                        <button
                          key={template.label}
                          onClick={() => applyOutboundTemplate(template.text)}
                          className="app-tertiary-button rounded-full px-3 py-1.5 text-sm"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[1.4rem] border border-amber-200 bg-white/90 px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        Send channel
                      </div>
                      <select
                        value={outboundChannel}
                        onChange={(event) => setOutboundChannel(event.target.value as OutboundChannel)}
                        className="app-select mt-2 min-h-0 rounded-xl border-amber-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none"
                      >
                        {OUTBOUND_CHANNEL_OPTIONS.map((channel) => (
                          <option key={channel.value} value={channel.value}>
                            {channel.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 text-xs text-amber-800">
                        {OUTBOUND_CHANNEL_OPTIONS.find((channel) => channel.value === outboundChannel)?.hint}
                      </div>
                    </div>
                  </div>

                  {lastSentSummary && (
                    <div className="mt-4 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {lastSentSummary}
                    </div>
                  )}

                  {recentMatchingOutbound && currentOutboundFingerprint !== duplicateSendGuard && (
                    <div className="mt-4 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      This exact {outboundChannel.toUpperCase()} reply was already logged at{' '}
                      {recentMatchingOutbound.created_at
                        ? new Date(recentMatchingOutbound.created_at).toLocaleString()
                        : 'a recent time'}
                      . Press send once to arm a retry, then send again only if you really want to resend it.
                    </div>
                  )}

                  {duplicateSendGuard && currentOutboundFingerprint === duplicateSendGuard && (
                    <div className="mt-4 rounded-[1.4rem] border border-amber-300 bg-white px-4 py-3 text-sm text-amber-900">
                      Retry confirmation armed for this draft. Press send again now to resend it.
                    </div>
                  )}

                  {activeDraftId && (
                    <div className="mt-4 rounded-[1.4rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                      Loaded from a saved draft. The send request will carry this draft ID so backend dedupe can prevent the same draft being sent twice across tabs or devices.
                    </div>
                  )}

                  <textarea
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                    placeholder={`Draft a customer-facing ${outboundChannel.toUpperCase()} reply. This will be saved only until you send it.`}
                    rows={5}
                    className="app-textarea mt-4 border-amber-200 bg-white outline-none"
                  />
                  <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-xs text-amber-800">
                      Save a draft for later, or send it now on the selected channel.
                    </p>
                    {!OPERATOR_OUTBOUND_WEBHOOK_URL && (
                      <p className="text-xs text-rose-700">
                        Sending is disabled until `NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL` is set.
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleSaveDraft}
                        disabled={savingDraft || sendingOutbound || confirmingOutbound || !draftText.trim()}
                        className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                      >
                        {savingDraft ? 'Saving...' : 'Save Draft'}
                      </button>
                      <button
                        onClick={handleSendOutbound}
                        disabled={
                          sendingOutbound ||
                          confirmingOutbound ||
                          savingDraft ||
                          !draftText.trim() ||
                          !OPERATOR_OUTBOUND_WEBHOOK_URL
                        }
                        className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-50"
                      >
                        {sendingOutbound
                          ? 'Sending...'
                          : confirmingOutbound
                            ? 'Confirming sent log...'
                            : duplicateSendGuard && currentOutboundFingerprint === duplicateSendGuard
                              ? 'Confirm send again'
                              : 'Send message'}
                      </button>
                    </div>
                  </div>
                  {draftMessage && <p className="mt-3 text-sm text-amber-900">{draftMessage}</p>}
                </div>
              )}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="app-card-muted rounded-[1.5rem] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Recent Internal Notes</h3>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      {internalNotes.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {internalNotes.length === 0 && (
                      <div className="app-empty-state rounded-[1.4rem] p-4 text-sm">
                        No internal notes yet.
                      </div>
                    )}

                    {internalNotes.slice(-3).reverse().map((note) => (
                      <div key={note.id} className="rounded-[1.4rem] border border-stone-200 bg-stone-50/90 p-4">
                        <div className="mb-2 text-xs uppercase tracking-wide text-stone-500">
                          Internal note
                        </div>
                        <div className="text-sm leading-6 text-stone-800">{note.message_text || '-'}</div>
                        <div className="mt-3 text-xs text-stone-400">
                          {note.created_at ? new Date(note.created_at).toLocaleString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-amber-900">Saved Outbound Drafts</h3>
                    <span className="text-xs uppercase tracking-wide text-amber-700">
                      {outboundDrafts.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    {outboundDrafts.length === 0 && (
                      <div className="rounded-[1.4rem] border border-dashed border-amber-300 bg-white/90 p-4 text-sm text-amber-800">
                        No outbound drafts yet.
                      </div>
                    )}

                    {outboundDrafts.slice(-3).reverse().map((draft) => (
                      <div key={draft.id} className="rounded-[1.4rem] border border-amber-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-wide text-amber-700">
                            Draft only • not sent • {draft.channel || 'draft'}
                          </div>
                          <button
                            onClick={() => loadDraftIntoComposer(draft)}
                            className="app-tertiary-button rounded-full px-3 py-1 text-xs"
                          >
                            Use draft
                          </button>
                        </div>
                        <div className="text-sm leading-6 text-stone-800">{draft.message_text || '-'}</div>
                        <div className="mt-3 text-xs text-stone-400">
                          {draft.created_at ? new Date(draft.created_at).toLocaleString() : '-'}
                        </div>
                      </div>
                    ))}

                    {supersededDrafts.length > 0 && (
                      <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                        {supersededDrafts.length} older draft{supersededDrafts.length === 1 ? '' : 's'} already moved out of the active draft list after send. They remain visible in the main timeline for audit history.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="app-surface rounded-[1.8rem] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="app-kicker">Timeline</p>
                  <h2 className="mt-2 text-xl font-semibold">Full case activity</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['all', 'All'],
                    ['inbound', 'Inbound'],
                    ['internal', 'Internal'],
                    ['drafts', 'Drafts'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setTimelineFilter(value as TimelineFilter)}
                      aria-pressed={timelineFilter === value}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        timelineFilter === value
                          ? 'app-pill-active'
                          : 'app-pill'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {messagesLoading && (
                <div className="mt-4 text-sm text-stone-500">Loading messages...</div>
              )}

              <div className="mt-4 space-y-4">
                {!messagesLoading && filteredMessages.length === 0 && (
                  <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">
                    No messages match the current timeline filter.
                  </div>
                )}

                {filteredMessages.map((message) => {
                  const style = getMessageStyle(message)

                  return (
                  <div key={message.id} className={`rounded-[1.4rem] border p-4 ${style.cardClass}`}>
                    <div className={`mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide ${style.metaClass}`}>
                      <span>{style.label}</span>
                      <span>{message.channel || '-'}</span>
                      <span>{message.sender_type || '-'}</span>
                      <span>{message.direction || '-'}</span>
                      <span>{message.message_type || '-'}</span>
                    </div>
                    <div className="text-sm leading-6 text-stone-800">{message.message_text || '-'}</div>
                    <div className="mt-3 text-xs text-stone-400">
                      {message.created_at ? new Date(message.created_at).toLocaleString() : '-'}
                    </div>
                  </div>
                )})}
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="app-surface rounded-[1.8rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="app-kicker">Contact</p>
                  <h2 className="text-lg font-semibold">Contact</h2>
                  {copyMessage && <div className="mt-1 text-xs text-stone-500">{copyMessage}</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyToClipboard(contact?.phone || null, 'Phone')}
                    className="app-secondary-button rounded-full px-3 py-1.5 text-sm"
                  >
                    Copy phone
                  </button>
                  <button
                    onClick={() => copyToClipboard(contact?.email || null, 'Email')}
                    className="app-secondary-button rounded-full px-3 py-1.5 text-sm"
                  >
                    Copy email
                  </button>
                </div>
              </div>
              {contactLoading && (
                <div className="mt-4 text-sm text-stone-500">Loading contact...</div>
              )}
              <div className="mt-4 space-y-3 text-sm text-stone-700">
                <div><strong>Name:</strong> {contact?.full_name || '-'}</div>
                <div className="app-card-muted flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                  <div><strong>Phone:</strong> {contact?.phone || '-'}</div>
                  {contact?.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm text-stone-700 underline-offset-4 hover:underline"
                    >
                      Call
                    </a>
                  )}
                </div>
                <div className="app-card-muted flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
                  <div><strong>Email:</strong> {contact?.email || '-'}</div>
                  {contact?.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-stone-700 underline-offset-4 hover:underline"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            </section>

            <section className="app-surface rounded-[1.8rem] p-6">
              <p className="app-kicker">Property</p>
              <h2 className="text-lg font-semibold">Property</h2>
              {propertyLoading && (
                <div className="mt-4 text-sm text-stone-500">Loading property...</div>
              )}
              <div className="mt-4 space-y-3 text-sm text-stone-700">
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Address 1:</strong> {property?.address_line_1 || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Address 2:</strong> {property?.address_line_2 || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>City:</strong> {property?.city || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Postcode:</strong> {property?.postcode || '-'}</div>
              </div>
            </section>

            <section className="app-surface rounded-[1.8rem] p-6">
              <p className="app-kicker">Overview</p>
              <h2 className="mt-2 text-lg font-semibold">Case summary</h2>
              <div className="mt-4 space-y-3 text-sm text-stone-700">
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Case Type:</strong> {caseItem.case_type || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Priority:</strong> {caseItem.priority || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Status:</strong> {caseItem.status || '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Handoff:</strong> {caseItem.needs_human_handoff ? caseItem.handoff_reason || 'Yes' : 'No'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Created:</strong> {caseItem.created_at ? new Date(caseItem.created_at).toLocaleString() : '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Last Customer Message:</strong> {caseItem.last_customer_message_at ? new Date(caseItem.last_customer_message_at).toLocaleString() : '-'}</div>
                <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Last Customer Activity Age:</strong> {lastCustomerActivityLabel}</div>
                {followUpAvailable && (
                  <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Next Action Due:</strong> {caseItem.next_action_at ? formatShortDateTime(caseItem.next_action_at) : '-'}</div>
                )}
                {followUpAvailable && (
                  <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Waiting On:</strong> {WAITING_ON_OPTIONS.find((option) => option.value === (caseItem.waiting_on ?? 'none'))?.label || 'No waiting status'}</div>
                )}
                {followUpAvailable && (
                  <div className="app-card-muted rounded-2xl px-4 py-3"><strong>Waiting Reason:</strong> {caseItem.waiting_reason || '-'}</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
