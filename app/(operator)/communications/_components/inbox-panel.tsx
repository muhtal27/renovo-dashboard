'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Mail,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import type {
  InboxMessage,
  InboxFilterChannel,
  ComposeMessageInput,
} from '@/lib/communication-hub-types'

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                           */
/* ────────────────────────────────────────────────────────────────── */

function getInitials(message: InboxMessage): string {
  if (message.tenant_name && message.sender_type === 'tenant') {
    return message.tenant_name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  if (message.sender_type === 'manager') return 'OP'
  if (message.sender_type === 'landlord') return 'LL'
  return message.sender_type.slice(0, 2).toUpperCase()
}

function getSenderName(message: InboxMessage): string {
  if (message.sender_type === 'tenant' && message.tenant_name) return message.tenant_name
  if (message.sender_type === 'manager') return 'Operator'
  if (message.sender_type === 'landlord') return 'Landlord'
  return formatEnumLabel(message.sender_type)
}

function getAvatarColors(senderType: string) {
  switch (senderType) {
    case 'tenant':
      return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' }
    case 'landlord':
      return { bg: 'bg-sky-100', text: 'text-sky-600' }
    case 'manager':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600' }
    default:
      return { bg: 'bg-zinc-100', text: 'text-zinc-500' }
  }
}

const CHANNEL_FILTERS: { value: InboxFilterChannel; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'manager', label: 'Manager' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
]

/* ────────────────────────────────────────────────────────────────── */
/*  Compose form                                                      */
/* ────────────────────────────────────────────────────────────────── */

function ComposeForm({
  onClose,
  onSent,
}: {
  onClose: () => void
  onSent: () => void
}) {
  const [caseId, setCaseId] = useState('')
  const [recipientType, setRecipientType] = useState<'tenant' | 'landlord'>('tenant')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!caseId.trim() || !content.trim()) {
      toast.error('Case ID and message content are required.')
      return
    }

    setSending(true)
    try {
      const payload: ComposeMessageInput = {
        case_id: caseId.trim(),
        recipient_type: recipientType,
        subject: subject.trim() || undefined,
        content: content.trim(),
      }

      const res = await fetch('/api/operator/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }

      toast.success('Message sent successfully.')
      onSent()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">Compose Message</h3>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Case ID
          </label>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder="Enter case ID"
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Recipient
            </label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as 'tenant' | 'landlord')}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Optional subject"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            rows={5}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !caseId.trim() || !content.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Message row (HTML-matching inbox style)                           */
/* ────────────────────────────────────────────────────────────────── */

function MessageRow({
  message,
  onSelect,
}: {
  message: InboxMessage
  onSelect: () => void
}) {
  const colors = getAvatarColors(message.sender_type)
  const initials = getInitials(message)
  const senderName = getSenderName(message)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full gap-3 border-b border-zinc-100 px-4 py-3.5 text-left transition hover:bg-zinc-50 last:border-b-0"
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          colors.bg,
          colors.text,
        )}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-zinc-900">{senderName}</span>
          <span className="shrink-0 text-[11px] text-zinc-400">{relativeTime(message.created_at)}</span>
        </div>
        <div className="mt-0.5 truncate text-[13px] font-medium text-zinc-700">
          {message.property_address || 'Unknown property'}
        </div>
        <div className="mt-0.5 truncate text-xs text-zinc-400">
          {message.content}
        </div>
      </div>
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Conversation detail (chat bubble view)                            */
/* ────────────────────────────────────────────────────────────────── */

function ConversationDetail({
  messages,
  caseId,
  onBack,
}: {
  messages: InboxMessage[]
  caseId: string
  onBack: () => void
}) {
  const [replyContent, setReplyContent] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyRecipient, setReplyRecipient] = useState<'tenant' | 'landlord'>('tenant')
  const scrollRef = useRef<HTMLDivElement>(null)

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const property = sorted[0]?.property_address || 'Unknown property'
  const tenant = sorted[0]?.tenant_name
  const caseStatus = sorted[0]?.case_status

  // Determine default recipient
  useEffect(() => {
    const lastMsg = sorted[sorted.length - 1]
    if (lastMsg?.sender_type === 'tenant') setReplyRecipient('tenant')
    else if (lastMsg?.sender_type === 'landlord') setReplyRecipient('landlord')
  }, [caseId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  async function handleSend() {
    if (!replyContent.trim()) return
    setReplySending(true)
    try {
      const payload: ComposeMessageInput = {
        case_id: caseId,
        recipient_type: replyRecipient,
        content: replyContent.trim(),
      }
      const res = await fetch('/api/operator/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }
      toast.success('Reply sent')
      setReplyContent('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply.')
    } finally {
      setReplySending(false)
    }
  }

  // Participants
  const participants = [...new Set(sorted.map((m) => m.sender_type))]

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{property}</h2>
          <p className="text-sm text-zinc-500">
            {tenant || 'Unknown tenant'} &bull; {caseId}
          </p>
        </div>
        <Link
          href={`/operator/cases/${caseId}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          Open Case
        </Link>
      </div>

      {/* Main grid: chat + sidebar */}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Chat thread */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5" style={{ maxHeight: 480 }}>
            <div className="space-y-4">
              {sorted.map((msg) => {
                const isOp = msg.sender_type === 'manager'
                return (
                  <div
                    key={msg.id}
                    className={cn('flex flex-col', isOp ? 'items-end' : 'items-start')}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-[11px] font-semibold',
                          isOp
                            ? 'text-emerald-700'
                            : msg.sender_type === 'tenant'
                              ? 'text-fuchsia-600'
                              : 'text-sky-600',
                        )}
                      >
                        {getSenderName(msg)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {relativeTime(msg.created_at)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed',
                        isOp
                          ? 'rounded-br-sm bg-emerald-600 text-white'
                          : msg.sender_type === 'tenant'
                            ? 'rounded-bl-sm border border-zinc-200 bg-zinc-50 text-zinc-900'
                            : msg.sender_type === 'landlord'
                              ? 'rounded-bl-sm border border-sky-100 bg-sky-50 text-zinc-900'
                              : 'rounded-bl-sm border border-amber-100 bg-amber-50 text-zinc-900',
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reply */}
          <div className="border-t border-zinc-100 px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Reply to:</span>
              <button
                type="button"
                onClick={() => setReplyRecipient('tenant')}
                className={cn(
                  'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium transition',
                  replyRecipient === 'tenant'
                    ? 'bg-fuchsia-100 text-fuchsia-700'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
                )}
              >
                Tenant
              </button>
              <button
                type="button"
                onClick={() => setReplyRecipient('landlord')}
                className={cn(
                  'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium transition',
                  replyRecipient === 'landlord'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
                )}
              >
                Landlord
              </button>
            </div>
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your reply..."
                className="h-[38px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={replySending || !replyContent.trim()}
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className={cn('h-3.5 w-3.5', replySending && 'animate-pulse')} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: case details + participants */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
            <h4 className="mb-3 text-sm font-semibold text-zinc-950">Case Details</h4>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Case ID</p>
                <p className="mt-0.5 text-sm text-zinc-900">{caseId}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Property</p>
                <p className="mt-0.5 text-sm text-zinc-900">{property}</p>
              </div>
              {tenant && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Tenant</p>
                  <p className="mt-0.5 text-sm text-zinc-900">{tenant}</p>
                </div>
              )}
              {caseStatus && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge label={formatEnumLabel(caseStatus)} tone={caseStatus} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
            <h4 className="mb-3 text-sm font-semibold text-zinc-950">Participants</h4>
            <div className="space-y-3">
              {participants.map((type) => {
                const msg = sorted.find((m) => m.sender_type === type)
                const colors = getAvatarColors(type)
                const name =
                  type === 'tenant' && msg?.tenant_name
                    ? msg.tenant_name
                    : type === 'manager'
                      ? 'Operator'
                      : type === 'landlord'
                        ? 'Landlord'
                        : formatEnumLabel(type)
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold',
                        colors.bg,
                        colors.text,
                      )}
                    >
                      {name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{name}</p>
                      <p className="text-[11px] text-zinc-400">{formatEnumLabel(type)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function InboxPanel() {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<InboxFilterChannel>('all')
  const [search, setSearch] = useState('')
  const [composing, setComposing] = useState(false)
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (channel !== 'all') params.set('channel', channel)
      params.set('limit', '50')

      const res = await fetch(`/api/operator/communications?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = (await res.json()) as { messages: InboxMessage[]; total: number }
      setMessages(data.messages)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load messages.')
    } finally {
      setLoading(false)
    }
  }, [channel])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const filteredMessages = search.trim()
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(search.toLowerCase()) ||
          m.property_address?.toLowerCase().includes(search.toLowerCase()) ||
          m.tenant_name?.toLowerCase().includes(search.toLowerCase())
      )
    : messages

  // If a conversation is active, show the detail view
  if (activeConvoId) {
    const caseMessages = messages.filter((m) => m.case_id === activeConvoId)
    return (
      <ConversationDetail
        messages={caseMessages}
        caseId={activeConvoId}
        onBack={() => setActiveConvoId(null)}
      />
    )
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {CHANNEL_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setChannel(f.value)}
              className={cn(
                'inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition',
                channel === f.value
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-zinc-400">{total} messages</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="h-8 w-56 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Send className="h-3 w-3" />
            Compose
          </button>
        </div>
      </div>

      {/* Compose form */}
      {composing && (
        <ComposeForm onClose={() => setComposing(false)} onSent={fetchMessages} />
      )}

      {/* Message list */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer flex gap-3 border-b border-zinc-100 px-4 py-3.5 last:border-b-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-100" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-28 rounded bg-zinc-100" />
                  <div className="h-3 w-12 rounded bg-zinc-100" />
                </div>
                <div className="mt-2 h-3.5 w-3/4 rounded bg-zinc-100" />
                <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-50" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <EmptyState
            title="No messages found"
            body={
              search
                ? 'No messages match your search. Try adjusting the filters.'
                : 'Messages from tenants, landlords, and managers will appear here.'
            }
            action={
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                <Mail className="h-3.5 w-3.5" />
                Send a message
              </button>
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white" style={{ overflow: 'hidden' }}>
          {filteredMessages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              onSelect={() => setActiveConvoId(message.case_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
