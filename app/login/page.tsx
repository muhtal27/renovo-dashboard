'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const UNLINKED_ACCOUNT_MESSAGE =
  'This email is not linked to a Renovo workspace yet. Ask an administrator to set up your access.'

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
    body: 'Approved decisions turn into claim-ready line items.',
  },
]

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode] = useState<'sign_in' | 'sign_up' | 'reset'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingSignUp, setLoadingSignUp] = useState(false)
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [returnTo] = useState(() => {
    if (typeof window === 'undefined') return '/eot'

    const nextReturnTo = new URLSearchParams(window.location.search).get('returnTo')
    return nextReturnTo && nextReturnTo.startsWith('/') ? nextReturnTo : '/eot'
  })

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      window.location.href = returnTo
    }

    void checkSession()
  }, [returnTo, router])

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password to sign in.')
      return
    }

    setLoadingPassword(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoadingPassword(false)
      return
    }

    window.location.href = returnTo
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setMessage('Enter your email address to receive a magic link.')
      return
    }

    setLoadingMagicLink(true)
    setMessage(null)

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
      const normalizedMessage = error.message.toLowerCase()

      if (
        normalizedMessage.includes('signups not allowed') ||
        normalizedMessage.includes('user not found') ||
        normalizedMessage.includes('otp')
      ) {
        setMessage(UNLINKED_ACCOUNT_MESSAGE)
      } else {
        setMessage(`Error: ${error.message}`)
      }

      setLoadingMagicLink(false)
      return
    }

    setMessage('Magic link sent. Check your email to continue.')
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
    <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.1fr)_460px]">
        <section className="app-surface-strong rounded-[2.2rem] p-8 md:p-10">
          <p className="app-kicker">Renovo</p>
          <p className="mt-5 max-w-3xl text-base leading-8 text-stone-600 md:text-lg">
            The end-of-tenancy decision engine for letting agencies.
          </p>

          <div className="mt-8 grid gap-3 xl:grid-cols-4">
            {workflowStages.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-4 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Step {item.step}
                </p>
                <h2 className="mt-2 text-base font-semibold text-stone-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="app-surface rounded-[2.2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Sign Up' : 'Reset Password'}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-[2.6rem]">
                {mode === 'sign_in'
                  ? 'Enter the workspace'
                  : mode === 'sign_up'
                    ? 'Create your account'
                    : 'Recover your password'}
              </h2>
            </div>
            <Link
              href="/"
              className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
            >
              Back to Renovo
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-stone-600">
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
                }}
                className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                  mode === value ? 'app-pill-active' : 'app-pill'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50/85 p-4">
            <p className="text-sm font-medium text-stone-900">
              {mode === 'sign_in' && 'For approved property managers'}
              {mode === 'sign_up' && 'Create a sign-in before your access is linked'}
              {mode === 'reset' && 'Recover the password for your approved Renovo email'}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
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
              <span className="mb-2 block text-sm font-medium text-stone-700">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.co.uk"
                className="app-field text-sm outline-none"
              />
            </label>

            {mode !== 'reset' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Password</span>
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
                <span className="mb-2 block text-sm font-medium text-stone-700">Confirm password</span>
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

          <div className="mt-6 grid gap-3">
            {mode === 'sign_in' && (
              <>
                <button
                  onClick={handlePasswordSignIn}
                  disabled={loadingPassword || loadingMagicLink}
                  className="app-primary-button rounded-2xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
                >
                  {loadingPassword ? 'Signing in...' : 'Sign in with password'}
                </button>

                <button
                  onClick={handleMagicLink}
                  disabled={loadingPassword || loadingMagicLink}
                  className="app-secondary-button rounded-2xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
                >
                  {loadingMagicLink ? 'Sending...' : 'Email me a magic link'}
                </button>
              </>
            )}

            {mode === 'sign_up' && (
              <button
                onClick={handleSignUp}
                disabled={loadingSignUp}
                className="app-primary-button rounded-2xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {loadingSignUp ? 'Creating account...' : 'Create account'}
              </button>
            )}

            {mode === 'reset' && (
              <button
                onClick={handleResetPassword}
                disabled={loadingReset}
                className="app-primary-button rounded-2xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {loadingReset ? 'Sending reset...' : 'Send password reset email'}
              </button>
            )}
          </div>

          {message && (
            <div
              aria-live="polite"
              className="app-card-muted mt-4 rounded-2xl px-4 py-3 text-sm text-stone-700"
            >
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
