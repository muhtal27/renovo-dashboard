'use client'

import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import type { AuthSession } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'
import { getReturnToFromSearch } from '@/lib/return-to'
import { supabase } from '@/lib/supabase'
import {
  clearLegacySupabaseBrowserAuthArtifacts,
  readLegacyBrowserSupabaseSession,
  toMinimalSupabaseSession,
} from '@/lib/supabase-session'
import type { CurrentOperator } from '@/lib/operator-types'

function BrandMark() {
  return (
    <span className="nav-logo" aria-hidden="true">
      <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" opacity="0.55" />
        <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" opacity="0.8" />
        <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
      </svg>
    </span>
  )
}

export default function LoginPage() {
  const handledSessionRef = useRef<string | null>(null)
  const [loadingSSO, setLoadingSSO] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnTo] = useState(() => {
    if (typeof window === 'undefined') return '/dashboard'

    return getReturnToFromSearch(window.location.search)
  })

  async function establishOperatorSession(session: Partial<AuthSession> | null | undefined) {
    const minimalSession = toMinimalSupabaseSession(session)

    if (!minimalSession) {
      return false
    }

    const sessionKey = `${minimalSession.access_token}:${minimalSession.expires_at ?? ''}`

    if (handledSessionRef.current === sessionKey) {
      return true
    }

    const response = await fetch('/api/operator/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(minimalSession),
    })

    if (!response.ok) {
      return false
    }

    handledSessionRef.current = sessionKey
    clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)

    const operator = (await response.json().catch(() => null)) as CurrentOperator | null
    const userId = session?.user?.id
    const userEmail = session?.user?.email
    const tenantId = operator?.membership?.tenant_id ?? null
    const role = operator?.membership?.role ?? null

    if (userId) {
      posthog.identify(userId, {
        ...(userEmail ? { email: userEmail } : {}),
        ...(tenantId ? { tenant_id: tenantId } : {}),
        ...(role ? { role } : {}),
      })
      Sentry.setUser({ id: userId, ...(userEmail ? { email: userEmail } : {}) })
    }
    if (tenantId) {
      posthog.group('tenant', tenantId)
      Sentry.setTag('tenant_id', tenantId)
    }
    if (role) {
      Sentry.setTag('role', role)
    }
    posthog.capture('login_completed', { provider: 'microsoft' })

    return true
  }

  useEffect(() => {
    async function checkSession() {
      clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)

      const currentSessionResponse = await fetch('/api/operator/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (currentSessionResponse.ok) {
        window.location.href = returnTo
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user && (await establishOperatorSession(session))) {
        window.location.href = returnTo
        return
      }

      const legacySession = readLegacyBrowserSupabaseSession(process.env.NEXT_PUBLIC_SUPABASE_URL)
      if (legacySession && (await establishOperatorSession(legacySession))) {
        window.location.href = returnTo
      }
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return

      if (await establishOperatorSession(session)) {
        window.location.href = returnTo
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [returnTo])

  async function handleSSO() {
    setLoadingSSO(true)
    setError(null)
    posthog.capture('login_sso_initiated', { provider: 'microsoft' })

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo:
          typeof window === 'undefined'
            ? undefined
            : `${window.location.origin}/login?returnTo=${encodeURIComponent(returnTo)}`,
        scopes: 'openid profile email',
      },
    })

    if (error) {
      setError('Could not start Microsoft sign-in. Please try again.')
      setLoadingSSO(false)
    }
  }

  return (
    <div className="marketing-page login-page">
      <div className="ambient">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
        <div className="grid-dots" />
      </div>

      <nav className="nav" aria-label="Sign in">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <BrandMark />
            <span className="brand-name">Renovo AI</span>
          </Link>
          <div className="nav-right">
            <Link href="/" className="sign-in">
              ← Back to site
            </Link>
          </div>
        </div>
      </nav>

      <main className="login-main">
        <section className="login-card form-card">
          <div className="login-kicker hero-kicker">
            <span className="hero-pulse" aria-hidden="true" />
            Workspace sign-in
          </div>
          <h1 className="login-title">Enter the workspace</h1>
          <p className="login-sub">
            Use your organisation&apos;s Microsoft account to sign in. You&apos;ll be routed to the right workspace automatically.
          </p>

          {error ? (
            <div className="login-error" aria-live="polite">
              {error}
            </div>
          ) : null}

          <button
            onClick={handleSSO}
            disabled={loadingSSO}
            className="login-sso submit-btn"
          >
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            {loadingSSO ? 'Redirecting…' : 'Sign in with Microsoft'}
          </button>

          <p className="login-fine form-fine">
            Approved property managers only. Access is SSO-gated via your company directory.
          </p>

          <div className="login-help">
            <span>Need access?</span>
            <Link href="/book-demo">Book a demo</Link>
            <span aria-hidden="true">·</span>
            <Link href="/contact">Contact us</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
