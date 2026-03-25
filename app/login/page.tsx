'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { syncBrowserSupabaseSessionCookie } from '@/lib/supabase-session'

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
    title: 'Claim output',
    body: 'Approved decisions turn into claim ready line items.',
  },
]

export default function LoginPage() {
  const [mode, setMode] = useState<'sign_in' | 'sign_up' | 'reset'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingSignUp, setLoadingSignUp] = useState(false)
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)
  const [returnTo] = useState(() => {
    if (typeof window === 'undefined') return '/eot'

    const nextReturnTo = new URLSearchParams(window.location.search).get('returnTo')
    return nextReturnTo && nextReturnTo.startsWith('/') ? nextReturnTo : '/eot'
  })

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      syncBrowserSupabaseSessionCookie(session)

      if (!session?.user) return

      window.location.href = returnTo
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncBrowserSupabaseSessionCookie(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [returnTo])

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) {
      setError('Enter your email and password to sign in.')
      return
    }

    setLoadingPassword(true)
    setMessage(null)
    setError(null)
    setMagicSent(false)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email or password not recognised. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoadingPassword(false)
      return
    }

    syncBrowserSupabaseSessionCookie(data.session)
    window.location.href = returnTo
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError('Enter your email address to receive a magic link.')
      return
    }

    setLoadingMagicLink(true)
    setMessage(null)
    setError(null)
    setMagicSent(false)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window === 'undefined'
            ? undefined
            : `${window.location.origin}/login?returnTo=${returnTo}`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setError("We couldn't send a magic link to that address. Please check your email and try again.")
      setLoadingMagicLink(false)
      return
    }

    setMagicSent(true)
    setLoadingMagicLink(false)
  }

  async function handleSignUp() {
    if (!email.trim() || !password || !confirmPassword) {
      setMessage('Enter your email, password, and confirmation to create an account.')
      return
    }

    if (password.length < 8) {
      setMessage('Use at least 8 characters for your password.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Password confirmation does not match.')
      return
    }

    setLoadingSignUp(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: typeof window === 'undefined' ? undefined : `${window.location.origin}/login`,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoadingSignUp(false)
      return
    }

    setMessage(
      'Account created. Check your email to confirm it. Access will only work after the agency links this account to the correct workspace.'
    )
    setLoadingSignUp(false)
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setMessage('Enter your email address to reset your password.')
      return
    }

    setLoadingReset(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window === 'undefined' ? undefined : `${window.location.origin}/reset-password`,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoadingReset(false)
      return
    }

    setMessage('Password reset email sent. Use the link in your inbox to choose a new password.')
    setLoadingReset(false)
  }

  return (
    <main className="marketing-page min-h-screen bg-[#faf8f5] py-8 text-[#0f0e0d] md:py-10">
      <div className="marketing-frame grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_460px]">
        <section className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] md:p-10">
          <p className="app-kicker">Renovo</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,2.9rem)] leading-[1.08]">
            Workspace sign-in
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#3d3b37] md:text-lg">
            The end-of-tenancy decision engine for letting agencies.
          </p>

          <div className="mt-8 rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-5">
            <p className="app-kicker">Inside the workspace</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowStages.map((item) => (
              <div key={item.step} className="border-l border-[rgba(15,14,13,0.12)] pl-4 first:border-l-0 first:pl-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7a7670]">
                  Step {item.step}
                </p>
                <h2 className="mt-2 text-base">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#3d3b37]">{item.body}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Sign Up' : 'Reset Password'}
              </p>
              <h2 className="mt-2 text-3xl tracking-tight md:text-[2.6rem]">
                {mode === 'sign_in'
                  ? 'Enter the workspace'
                  : mode === 'sign_up'
                    ? 'Create your account'
                    : 'Recover your password'}
              </h2>
            </div>
            <Link
              href="/"
              className="app-secondary-button rounded px-4 py-2 text-sm font-medium"
            >
              Back to Renovo
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#3d3b37]">
            {mode === 'sign_in' &&
              'Password is fastest if you already have one. Magic link is useful when you are signing in on a new device.'}
            {mode === 'sign_up' &&
              'Create your sign-in first. Workspace access still needs to be linked by your agency before you can enter the product.'}
            {mode === 'reset' &&
              'Send yourself a password reset link, then choose a new password from the recovery screen.'}
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {[
              ['sign_in', 'Sign in'],
              ['sign_up', 'Sign up'],
              ['reset', 'Forgot password'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value as 'sign_in' | 'sign_up' | 'reset')
                  setMessage(null)
                  setError(null)
                  setMagicSent(false)
                }}
                className={`rounded px-4 py-2.5 text-sm font-medium ${
                  mode === value ? 'app-pill-active' : 'app-pill'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] p-4">
            <p className="text-sm font-medium text-[#0f0e0d]">
              {mode === 'sign_in' && 'For approved property managers'}
              {mode === 'sign_up' && 'Create a sign-in before your access is linked'}
              {mode === 'reset' && 'Recover the password for your approved Renovo email'}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#3d3b37]">
              {mode === 'sign_in' &&
                'If your email is linked correctly, Renovo will send you straight to the right workspace after sign-in.'}
              {mode === 'sign_up' &&
                'If your agency has not linked your role yet, you will not be able to enter a workspace until they do.'}
              {mode === 'reset' &&
                'Use the same email that was approved for Renovo access so the reset links back to the correct sign-in.'}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setMagicSent(false)
                }}
                placeholder="your@email.co.uk"
                className="app-field text-sm outline-none"
              />
            </label>

            {mode !== 'reset' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Password</span>
                <input
                  type="password"
                  autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'sign_up' ? 'Create a password' : 'Enter your password'}
                  className="app-field text-sm outline-none"
                />
              </label>
            )}

            {mode === 'sign_up' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="app-field text-sm outline-none"
                />
              </label>
            )}
          </div>

          {mode === 'sign_in' && error ? (
            <div
              aria-live="polite"
              className="mt-4 rounded-lg border border-[#efc7c7] bg-[#fcebeb] px-4 py-3 text-sm text-[#8d2e2e]"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            {mode === 'sign_in' && (
              <>
                <button
                  onClick={handlePasswordSignIn}
                  disabled={loadingPassword || loadingMagicLink}
                  className="app-primary-button rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
                >
                  {loadingPassword ? 'Signing in...' : 'Sign in with password'}
                </button>

                {magicSent ? (
                  <div className="rounded-lg border border-[#b9e3d7] bg-[#e1f5ee] px-4 py-3.5 text-sm font-medium text-[#0c5946]">
                    ✓ Magic link sent - check your inbox
                  </div>
                ) : (
                  <button
                    onClick={handleMagicLink}
                    disabled={loadingPassword || loadingMagicLink}
                    className="app-secondary-button rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
                  >
                    {loadingMagicLink ? 'Sending...' : 'Email me a magic link'}
                  </button>
                )}
              </>
            )}

            {mode === 'sign_up' && (
              <button
                onClick={handleSignUp}
                disabled={loadingSignUp}
                className="app-primary-button rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {loadingSignUp ? 'Creating account...' : 'Create account'}
              </button>
            )}

            {mode === 'reset' && (
              <button
                onClick={handleResetPassword}
                disabled={loadingReset}
                className="app-primary-button rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {loadingReset ? 'Sending reset...' : 'Send password reset email'}
              </button>
            )}
          </div>

          {message && (
            <div
              aria-live="polite"
              className="mt-4 rounded-lg border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] px-4 py-3 text-sm text-[#3d3b37]"
            >
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
