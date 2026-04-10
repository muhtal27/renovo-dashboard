'use client'

import { useEffect, useState } from 'react'

/**
 * Shows a subtle banner when the user loses internet connection,
 * and a brief "Back online" confirmation when it reconnects.
 */
export function ConnectionStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'recovered'>('online')

  useEffect(() => {
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null

    function goOffline() {
      if (recoveryTimer) clearTimeout(recoveryTimer)
      setStatus('offline')
    }

    function goOnline() {
      setStatus('recovered')
      recoveryTimer = setTimeout(() => setStatus('online'), 3000)
    }

    // Check initial state
    if (!navigator.onLine) setStatus('offline')

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      if (recoveryTimer) clearTimeout(recoveryTimer)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (status === 'online') return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[99998] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors duration-300 ${
        status === 'offline'
          ? 'bg-zinc-900 text-white'
          : 'bg-emerald-600 text-white'
      }`}
      style={{ paddingTop: `max(8px, env(safe-area-inset-top))` }}
    >
      {status === 'offline' ? (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          No internet connection
        </>
      ) : (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
          Back online
        </>
      )}
    </div>
  )
}
