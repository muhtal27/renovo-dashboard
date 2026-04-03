'use client'

import { useEffect, useState } from 'react'

export function ServiceWorkerRegistration() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 15 seconds
      const interval = setInterval(() => registration.update(), 15_000)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New version available
            setWaitingWorker(newWorker)
            setShowUpdate(true)
          }
        })
      })

      return () => clearInterval(interval)
    })

    // Reload when new SW takes over
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  if (!showUpdate) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-sm rounded-lg border border-zinc-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4">
      <p className="text-sm font-medium text-zinc-950">Update available</p>
      <p className="mt-1 text-xs text-zinc-500">
        A new version of Renovo AI is ready.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            waitingWorker?.postMessage('SKIP_WAITING')
            setShowUpdate(false)
          }}
          className="rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Update now
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Later
        </button>
      </div>
    </div>
  )
}
