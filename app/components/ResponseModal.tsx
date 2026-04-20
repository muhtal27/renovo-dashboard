'use client'

import { useEffect, useRef, useState } from 'react'
import { HelpCircle, Repeat, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/ui'

// Prototype ref: public/demo.html:1578-1607

export type ResponseModalType = 'dispute' | 'counter' | 'query' | 'reject'

export type ResponseModalSubmission =
  | { type: 'counter'; amount: number }
  | { type: 'dispute' | 'query' | 'reject'; text: string }

export type ResponseModalProps = {
  open: boolean
  type: ResponseModalType
  defectTitle: string
  defectAmountLabel: string
  initialValue?: string | number
  onClose: () => void
  onSubmit: (result: ResponseModalSubmission) => void
}

const TITLES: Record<ResponseModalType, string> = {
  dispute: 'Dispute This Charge',
  counter: 'Make a Counter-Offer',
  query: 'Query This Charge',
  reject: 'Reject This Charge',
}

const PLACEHOLDERS: Record<ResponseModalType, string> = {
  dispute: 'Explain why you dispute this charge...',
  counter: '',
  query: 'What would you like to know about this charge?',
  reject: 'Explain why you reject this charge...',
}

const TONE_CLASS: Record<ResponseModalType, { iconColor: string; buttonBg: string; buttonHover: string }> = {
  dispute: {
    iconColor: 'text-rose-600',
    buttonBg: 'bg-rose-500 border-rose-500 text-white',
    buttonHover: 'hover:bg-rose-600 hover:border-rose-600',
  },
  counter: {
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-500 border-amber-500 text-white',
    buttonHover: 'hover:bg-amber-600 hover:border-amber-600',
  },
  query: {
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-500 border-amber-500 text-white',
    buttonHover: 'hover:bg-amber-600 hover:border-amber-600',
  },
  reject: {
    iconColor: 'text-rose-600',
    buttonBg: 'bg-rose-500 border-rose-500 text-white',
    buttonHover: 'hover:bg-rose-600 hover:border-rose-600',
  },
}

const FOOTER_NOTE: Record<ResponseModalType, string> = {
  dispute: 'Your response will be recorded and shared with the managing agent.',
  counter: 'Enter the amount you believe is fair for this item.',
  query: 'Your query will be shared with the managing agent.',
  reject: 'Your response will be recorded and shared with the managing agent.',
}

function ToneIcon({ type, size = 18 }: { type: ResponseModalType; size?: number }) {
  const cls = 'shrink-0'
  switch (type) {
    case 'dispute':
    case 'reject':
      return <XCircle width={size} height={size} className={cls} strokeWidth={2} />
    case 'counter':
      return <Repeat width={size} height={size} className={cls} strokeWidth={2} />
    case 'query':
      return <HelpCircle width={size} height={size} className={cls} strokeWidth={2} />
  }
}

export function ResponseModal({
  open,
  type,
  defectTitle,
  defectAmountLabel,
  initialValue,
  onClose,
  onSubmit,
}: ResponseModalProps) {
  const [value, setValue] = useState<string>(
    initialValue !== undefined && initialValue !== null ? String(initialValue) : ''
  )
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  // Reset the form each time the modal opens for a different defect/type.
  useEffect(() => {
    if (open) {
      setValue(initialValue !== undefined && initialValue !== null ? String(initialValue) : '')
      // Focus after the render cycle.
      requestAnimationFrame(() => firstFieldRef.current?.focus())
    }
  }, [open, type, defectTitle, initialValue])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const tone = TONE_CLASS[type]

  function handleSubmit() {
    if (type === 'counter') {
      const amount = Number(value)
      if (!value || Number.isNaN(amount) || amount < 0) return
      onSubmit({ type: 'counter', amount })
      return
    }
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit({ type, text: trimmed })
  }

  return (
    <div className="config-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="response-modal-title">
      <div
        className="config-modal"
        style={{ width: 440 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="config-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={tone.iconColor}>
              <ToneIcon type={type} size={18} />
            </span>
            <h3 id="response-modal-title">{TITLES[type]}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close"
          >
            <X width={16} height={16} />
          </button>
        </div>

        <div className="config-modal-body">
          <div
            className="flex items-center justify-between"
            style={{
              padding: '10px 12px',
              background: 'var(--zinc-50)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
            }}
          >
            <span className="text-sm font-medium">{defectTitle}</span>
            <span className="text-sm font-semibold tabnum">{defectAmountLabel}</span>
          </div>

          {type === 'counter' ? (
            <>
              <label className="mb-2 block text-sm font-medium">Your counter-offer amount</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-500">£</span>
                <input
                  ref={(el) => { firstFieldRef.current = el }}
                  type="number"
                  min={0}
                  step={0.01}
                  className="form-input flex-1"
                  placeholder="0.00"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleSubmit()
                    }
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">{FOOTER_NOTE.counter}</p>
            </>
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium">
                {type === 'query' ? 'Your question' : 'Your reason'}
              </label>
              <textarea
                ref={(el) => { firstFieldRef.current = el }}
                rows={4}
                className="form-input w-full"
                style={{ resize: 'vertical', padding: 10 }}
                placeholder={PLACEHOLDERS[type]}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <p className="mt-2 text-xs text-muted">{FOOTER_NOTE[type]}</p>
            </>
          )}
        </div>

        <div className="config-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={cn('btn btn-sm', tone.buttonBg, tone.buttonHover)}
          >
            <ToneIcon type={type} size={14} />
            <span>Submit</span>
          </button>
        </div>
      </div>
    </div>
  )
}
