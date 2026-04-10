'use client'

import { useState } from 'react'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

export function MessageThreadCard({
  workspace,
  showCompose = false,
}: {
  workspace: OperatorCaseWorkspaceData
  showCompose?: boolean
}) {
  const router = useRouter()
  const [composing, setComposing] = useState(false)
  const [recipientType, setRecipientType] = useState<'tenant' | 'landlord'>('tenant')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!content.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/operator/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: workspace.case.id,
          recipient_type: recipientType,
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }

      toast.success('Message sent.')
      setContent('')
      setComposing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const hasMessages = workspace.messages.length > 0

  return (
    <div className="overflow-hidden border border-zinc-200 bg-white">
      {/* Message list */}
      {hasMessages ? (
        workspace.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'border-b border-zinc-200 px-5 py-4 last:border-b-0',
              message.sender_type === 'tenant'
                ? 'bg-fuchsia-50/20'
                : message.sender_type === 'landlord'
                  ? 'bg-sky-50/20'
                  : 'bg-white'
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={formatEnumLabel(message.sender_type)} tone={message.sender_type} />
              <span className="text-xs uppercase tracking-[0.08em] text-zinc-400">
                {formatDateTime(message.created_at)}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900 [overflow-wrap:anywhere]">{message.sender_id}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
              {message.content}
            </p>
          </div>
        ))
      ) : (
        <EmptyState
          title="No messages yet"
          body="Internal notes and stakeholder communication will appear here."
          action={
            showCompose ? (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Start a conversation
              </button>
            ) : undefined
          }
        />
      )}

      {/* Compose area */}
      {showCompose ? (
        composing ? (
          <div className="border-t border-zinc-200 bg-zinc-50/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                New message
              </p>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as 'tenant' | 'landlord')}
                className="h-7 border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
              >
                <option value="tenant">To tenant</option>
                <option value="landlord">To landlord</option>
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="mt-2 w-full border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposing(false)
                  setContent('')
                }}
                className="inline-flex h-8 items-center border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !content.trim()}
                className="inline-flex h-8 items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Send
              </button>
            </div>
          </div>
        ) : hasMessages ? (
          <div className="border-t border-zinc-200 px-5 py-3">
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
            >
              <MessageSquare className="h-3 w-3" />
              Reply
            </button>
          </div>
        ) : null
      ) : null}
    </div>
  )
}
