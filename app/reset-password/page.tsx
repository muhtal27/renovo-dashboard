'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setMessage('This password reset link is invalid or has expired. Request a new one from the login page.')
        setLoading(false)
        return
      }

      setReady(true)
      setLoading(false)
    }

    void checkRecoverySession()
  }, [])

  async function handleUpdatePassword() {
    if (!password || !confirmPassword) {
      setMessage('Enter and confirm your new password.')
      return
    }

    if (password.length < 8) {
      setMessage('Use at least 8 characters for your new password.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Password confirmation does not match.')
      return
    }

    setSaving(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage('Password updated. Redirecting you to sign in...')
    setSaving(false)
    window.setTimeout(() => {
      router.replace('/login')
      router.refresh()
    }, 1200)
  }

  return (
    <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-2xl">
        <section className="app-surface rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Password recovery</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a new password</h1>
            </div>
            <Link href="/login" className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium">
              Back to login
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-stone-600">Checking recovery link...</div>
          ) : ready ? (
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="app-field w-full text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="app-field w-full text-sm outline-none"
                />
              </label>

              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={saving}
                className="app-primary-button rounded-2xl px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Updating password...' : 'Update password'}
              </button>
            </div>
          ) : null}

          {message && (
            <div className="app-card-muted mt-4 rounded-2xl px-4 py-3 text-sm text-stone-700">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
