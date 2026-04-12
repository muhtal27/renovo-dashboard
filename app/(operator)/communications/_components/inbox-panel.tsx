'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail,
  Search,
  RefreshCw,
  ChevronRight,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { cn } from '@/lib/ui'
import type {
  InboxMessage,
  InboxFilterChannel,
  ComposeMessageInput,
} from '@/lib/communication-hub-types'

const CHANNEL_FILTERS: { value: InboxFilterChannel; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'manager', label: 'Manager' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
]

function ComposeForm({
  onClose,
  onSent,
}: {
  onClose: () => void
  onSent: () => void
}) {
  const [caseId, setCaseId] = useState('')
  const [recipientType, setRecipientType] = useState<'tenant' | 'landlord'>(
    'tenant'
  )
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
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Recipient
            </label>
            <select
              value={recipientType}
              onChange={(e) =>
                setRecipientType(e.target.value as 'tenant' | 'landlord')
              }
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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

function MessageRow({
  message,
  selected,
  onSelect,
}: {
  message: InboxMessage
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'modern-table-row flex w-full items-start gap-3 border-b border-zinc-100/80 px-5 py-4 text-left transition last:border-b-0',
        selected && 'bg-sky-50/50'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={formatEnumLabel(message.sender_type)}
            tone={message.sender_type}
          />
          {message.case_status ? (
            <StatusBadge
              label={formatEnumLabel(message.case_status)}
              tone={message.case_status}
              className="text-[10px]"
            />
          ) : null}
          <span className="text-[11px] text-zinc-400">
            {formatDateTime(message.created_at)}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-zinc-900 [overflow-wrap:anywhere]">
          {message.property_address || 'Unknown property'}
        </p>
        {message.tenant_name ? (
          <p className="mt-0.5 text-xs text-zinc-500">{message.tenant_name}</p>
        ) : null}
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600 [overflow-wrap:anywhere]">
          {message.content}
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-300" />
    </button>
  )
}

function MessageDetail({ message }: { message: InboxMessage }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={formatEnumLabel(message.sender_type)}
            tone={message.sender_type}
          />
          <span className="text-xs text-zinc-400">
            {formatDateTime(message.created_at)}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-zinc-950">
          {message.property_address || 'Unknown property'}
        </p>
        {message.tenant_name ? (
          <p className="mt-0.5 text-xs text-zinc-500">
            Tenant: {message.tenant_name}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-zinc-500">
          Sender: {message.sender_id}
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 [overflow-wrap:anywhere]">
          {message.content}
        </p>
      </div>
    </div>
  )
}

export function InboxPanel() {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<InboxFilterChannel>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (channel !== 'all') params.set('channel', channel)
      params.set('limit', '50')

      const res = await fetch(
        `/api/operator/communications?${params.toString()}`
      )
      if (!res.ok) throw new Error('Failed to fetch')

      const data = (await res.json()) as {
        messages: InboxMessage[]
        total: number
      }
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

  const selectedMessage = selectedId
    ? messages.find((m) => m.id === selectedId) ?? null
    : null

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {CHANNEL_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setChannel(f.value)
                setSelectedId(null)
              }}
              className={cn(
                'inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition',
                channel === f.value
                  ? 'border-emerald-600 bg-emerald-600 text-white'
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
              className="h-8 w-56 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
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
      {composing ? (
        <ComposeForm
          onClose={() => setComposing(false)}
          onSent={fetchMessages}
        />
      ) : null}

      {/* Content */}
      {loading ? (
        <div className="space-y-0 rounded-xl border border-zinc-200 bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border-b border-zinc-100/80 px-5 py-4 last:border-b-0"
            >
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded bg-zinc-100" />
                <div className="h-5 w-28 rounded bg-zinc-100" />
              </div>
              <div className="mt-3 h-4 w-3/4 rounded bg-zinc-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-zinc-50" />
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
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Mail className="h-3.5 w-3.5" />
                Send a message
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Message list */}
          <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-2">
            {filteredMessages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                selected={message.id === selectedId}
                onSelect={() => setSelectedId(message.id)}
              />
            ))}
          </div>

          {/* Detail pane */}
          <div className="lg:col-span-3">
            {selectedMessage ? (
              <MessageDetail message={selectedMessage} />
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white">
                <EmptyState
                  title="Select a message"
                  body="Click a message on the left to view details."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
