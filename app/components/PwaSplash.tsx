'use client'

import { useEffect, useState } from 'react'

/**
 * Native-feel splash screen for PWA standalone mode.
 * Shows the app icon + name + spinner on a dark background,
 * then fades out once the app has hydrated.
 * In regular browser mode, never renders (never visible).
 */
export function PwaSplash() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true

    if (!isStandalone) return

    // Show splash in standalone PWA mode
    setVisible(true)

    // Start fade-out after a brief moment to let the app paint
    const timer = setTimeout(() => {
      setFading(true)
      // Remove from DOM after fade completes
      setTimeout(() => setVisible(false), 350)
    }, 300)

    // Safety: always dismiss after 4s
    const safety = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 350)
    }, 4000)

    return () => {
      clearTimeout(timer)
      clearTimeout(safety)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      id="pwa-splash"
      className={fading ? 'hidden' : ''}
    >
      <img src="/renovo-ai-icon.svg" alt="" width={64} height={64} />
      <span className="splash-name">Renovo AI</span>
      <div className="splash-loader" />
    </div>
  )
}
