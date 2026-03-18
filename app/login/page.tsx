'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { resolveWorkspaceForUser } from '@/lib/portal'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingMagicLink, setLoadingMagicLink] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) return

      const workspace = await resolveWorkspaceForUser(session.user.id)
      router.replace(workspace.destination || '/')
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
    router.replace(workspace.destination || '/')
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
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoadingMagicLink(false)
      return
    }

    setMessage('Magic link sent. Check your email to continue.')
    setLoadingMagicLink(false)
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
              <p className="app-kicker">Sign In</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Enter your workspace</h2>
            </div>
            <Link
              href="/"
              className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium"
            >
              Back
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-stone-600">
            Password is fastest if you already have one. Magic link is useful on a new device.
          </p>

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

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="app-field text-sm outline-none"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
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
