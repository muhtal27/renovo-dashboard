'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { syncBrowserSupabaseSessionCookie } from '@/lib/supabase-session'

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

      syncBrowserSupabaseSessionCookie(session)

      if (!session?.user) {
        setMessage('This password reset link is invalid or has expired. Request a new one from the login page.')
        setLoading(false)
        return
      }

      setReady(true)
      setLoading(false)
    }

    void checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncBrowserSupabaseSessionCookie(session)
    })

    return () => {
      subscription.unsubscribe()
    }
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
    <main className="marketing-page min-h-screen bg-[#fcfbf9] py-8 text-[#0f0e0d] md:py-10">
      <div className="marketing-frame max-w-[920px]">
        <section className="rounded-xl border border-[rgba(15,14,13,0.1)] bg-white p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="app-kicker">Password recovery</p>
              <h1 className="mt-2 text-3xl tracking-tight">Choose a new password</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#3d3b37]">
                Set a new password for your Renovo workspace account, then return to sign-in.
              </p>
            </div>
            <Link href="/login" className="app-secondary-button rounded px-4 py-2 text-sm font-medium">
              Back to login
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 text-sm text-[#3d3b37]">Checking recovery link...</div>
          ) : ready ? (
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d3b37]">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="app-field w-full text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#3d3b37]">Confirm password</span>
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
                className="app-primary-button rounded px-4 py-3.5 text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Updating password...' : 'Update password'}
              </button>
            </div>
          ) : null}

          {message && (
            <div className="mt-4 rounded-lg border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] px-4 py-3 text-sm text-[#3d3b37]">
              {message}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
