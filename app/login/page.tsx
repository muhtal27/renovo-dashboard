'use client'

import Link from 'next/link'
import type { AuthSession } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { getReturnToFromSearch } from '@/lib/return-to'
import { supabase } from '@/lib/supabase'
import {
  clearLegacySupabaseBrowserAuthArtifacts,
  readLegacyBrowserSupabaseSession,
  toMinimalSupabaseSession,
} from '@/lib/supabase-session'

const workflowStages = [
  {
    step: '01',
    title: 'Evidence',
    body: 'Documents, extracted facts, and tenancy context stay together.',
  },
  {
    step: '02',
    title: 'Issues',
    body: 'Responsibility, severity, and amount pressure stay reviewable.',
  },
  {
    step: '03',
    title: 'Decision',
    body: 'Recommendations and rationale stay visible before approval.',
  },
  {
    step: '04',
    title: 'Submission',
    body: 'Approved decisions turn into submission-ready line items.',
  },
]

export default function LoginPage() {
  const handledSessionRef = useRef<string | null>(null)
  const [loadingSSO, setLoadingSSO] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnTo] = useState(() => {
    if (typeof window === 'undefined') return '/tenancies'

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
    <main className="marketing-page min-h-screen bg-white py-8 text-zinc-950 md:py-10">
      <div className="marketing-frame grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_460px]">
        <section className="rounded-xl border border-zinc-200 bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-10">
          <p className="app-kicker">Renovo AI</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,2.9rem)] leading-[1.08]">
            Workspace sign-in
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
            The end of tenancy decision engine for letting agencies.
          </p>

          <div className="mt-8 rounded-lg border border-zinc-200 bg-slate-50 p-5">
            <p className="app-kicker">Inside the workspace</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowStages.map((item) => (
              <div key={item.step} className="border-l border-zinc-200 pl-4 first:border-l-0 first:pl-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Step {item.step}
                </p>
                <h2 className="mt-2 text-base">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Sign In</p>
              <h2 className="mt-2 text-3xl tracking-tight md:text-[2.6rem]">
                Enter the workspace
              </h2>
            </div>
            <Link
              href="/"
              className="app-secondary-button rounded px-4 py-2 text-sm font-medium"
            >
              Back to Renovo AI
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Use your organisation&apos;s Microsoft account to sign in securely.
          </p>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-zinc-950">For approved property managers</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If your email is linked correctly, Renovo AI will send you straight to the right workspace after sign-in.
            </p>
          </div>

          {error ? (
            <div
              aria-live="polite"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <button
              onClick={handleSSO}
              disabled={loadingSSO}
              className="app-primary-button flex w-full items-center justify-center gap-2.5 rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 21 21" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              {loadingSSO ? 'Redirecting...' : 'Sign in with Microsoft'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
