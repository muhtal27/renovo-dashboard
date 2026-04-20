'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/ui'

// Prototype ref: public/demo.html:286-289 (CSS), demo.html:1413 (showToast),
// demo.html:4804 (renderToasts).

export type ToastTone = 'default' | 'success' | 'error'

type ToastEntry = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_LIFETIME_MS = 3000

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const nextIdRef = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback<ToastContextValue['showToast']>((message, tone = 'default') => {
    const id = nextIdRef.current++
    setToasts((prev) => [...prev, { id, message, tone }])
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), TOAST_LIFETIME_MS))
    return () => {
      for (const timer of timers) clearTimeout(timer)
    }
  }, [toasts, dismiss])

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              className={cn('toast', t.tone !== 'default' && t.tone)}
            >
              {t.tone === 'success' ? (
                <CheckCircle className="h-4 w-4" strokeWidth={2} />
              ) : t.tone === 'error' ? (
                <XCircle className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Info className="h-4 w-4" strokeWidth={2} />
              )}
              <span>{t.message}</span>
            </button>
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
