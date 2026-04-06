'use client'

import { useEffect } from 'react'

/**
 * Native-feel splash screen for PWA standalone mode.
 * Shows the app icon + name + spinner on a dark background,
 * then fades out once the app has hydrated.
 * In regular browser mode, removes itself immediately (never visible).
 */
export function PwaSplash() {
  useEffect(() => {
    const el = document.getElementById('pwa-splash')
    if (!el) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    if (!isStandalone) {
      el.remove()
      return
    }

    function dismiss() {
      if (!el) return
      el.classList.add('hidden')
      setTimeout(() => el.remove(), 350)
    }

    // Dismiss once hydrated (this effect runs after hydration)
    dismiss()
  }, [])

  return null
}
