'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { resolveWorkspaceForUser } from '@/lib/portal'

const UNLINKED_ACCOUNT_MESSAGE =
  'This email is not linked to a Renovo workspace yet. Ask an administrator to set up your access.'

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

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) return

      const workspace = await resolveWorkspaceForUser(session.user.id)

      if (!workspace.destination) {
        await supabase.auth.signOut()
        setMessage(UNLINKED_ACCOUNT_MESSAGE)
        return
      }

      router.replace(workspace.destination)
    }

    void checkSession()
  }, [router])

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password to sign in.')
      return
    }

    setLoadingPassword(true)
    setMessage(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoadingPassword(false)
      return
    }

    const userId = data.user?.id || data.session?.user.id

    if (!userId) {
      setMessage('Signed in, but no matching workspace was found yet.')
      setLoadingPassword(false)
      return
    }

    const workspace = await resolveWorkspaceForUser(userId)

    if (!workspace.destination) {
      await supabase.auth.signOut()
      setMessage(UNLINKED_ACCOUNT_MESSAGE)
      setLoadingPassword(false)
      return
    }

    router.replace(workspace.destination)
    router.refresh()
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
        emailRedirectTo: typeof window === 'undefined' ? undefined : `${window.location.origin}/`,
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
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="app-surface-strong rounded-[2rem] p-8 md:p-10">
          <p className="app-kicker">Renovo Access</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            One calmer front door for operators, tenants, landlords, and contractors
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            Sign in once, then land in the workspace that matches your role. Operators keep the
            queue moving, and customers or contractors can follow live updates without needing to
            chase by phone or email.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Operator workspace',
                body: 'Run the live queue, Annabelle calls, records, maintenance, and compliance from one place.',
              },
              {
                title: 'Customer portals',
                body: 'Tenants and landlords can track live updates and current issues without waiting for a reply.',
              },
              {
                title: 'Contractor access',
                body: 'Give contractors a direct view of assigned jobs, quotes, and access notes when the portal role is ready.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-emerald-200 bg-emerald-50/90 p-5">
            <p className="text-sm font-semibold text-emerald-900">Friendly reminder</p>
            <p className="mt-2 text-sm leading-6 text-emerald-900/80">
              Use the same email as the profile linked to your Supabase account so Renovo can send
              you to the correct workspace after sign-in.
            </p>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">
                {mode === 'sign_in' ? 'Sign In' : mode === 'sign_up' ? 'Sign Up' : 'Reset Password'}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {mode === 'sign_in'
                  ? 'Enter your workspace'
                  : mode === 'sign_up'
                    ? 'Create your account'
                    : 'Recover your password'}
              </h2>
            </div>
            <Link
              href="/"
              className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
            >
              Back
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-stone-600">
            {mode === 'sign_in' &&
              'Password is fastest if you already have one. Magic link is useful on a new device.'}
            {mode === 'sign_up' &&
              'Create your auth account first. Workspace access still needs to be linked by the agency.'}
            {mode === 'reset' &&
              'Send yourself a password reset link, then choose a new password from the recovery screen.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
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
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  mode === value ? 'app-pill-active' : 'app-pill'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@renovo.co.uk"
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
                  {loadingMagicLink ? 'Sending link...' : 'Email me a magic link'}
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
