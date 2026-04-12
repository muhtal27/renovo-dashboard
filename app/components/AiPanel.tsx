'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/ui'

type AiMessage = {
  role: 'user' | 'bot'
  text: string
}

const INITIAL_MESSAGE: AiMessage = {
  role: 'bot',
  text: "Hi! I'm Renovo AI. I can help you draft deduction letters, analyse cases, or find guidance. What would you like to do?",
}

const DEFAULT_SUGGESTIONS = [
  'Show case pipeline',
  'Draft report summary',
  'Find high-priority cases',
]

export function AiPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [messages, setMessages] = useState<AiMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `I'll help you with that. This feature is coming soon — for now, you can use the workspace tools to ${trimmed.toLowerCase().includes('draft') ? 'generate AI drafts' : trimmed.toLowerCase().includes('case') ? 'review cases in the pipeline' : 'explore your portfolio'}.`,
        },
      ])
    }, 800)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault()
        sendMessage(input)
      }
    },
    [input, sendMessage]
  )

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/20 xl:hidden"
          onClick={onClose}
        />
      ) : null}

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-full max-w-[400px] flex-col border-l border-zinc-200 bg-white shadow-lg transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <Bot className="h-4 w-4" />
          </span>
          <h3 className="flex-1 text-sm font-semibold text-zinc-900">Renovo AI</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Beta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                msg.role === 'bot'
                  ? 'self-start rounded-tl-sm border border-zinc-200 bg-zinc-50 text-zinc-700'
                  : 'self-end rounded-br-sm bg-emerald-600 text-white'
              )}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {DEFAULT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-zinc-100 px-5 py-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask Renovo AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-[38px] flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="inline-flex h-[38px] items-center justify-center rounded-lg bg-emerald-600 px-3 text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}
