'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const hiddenRoutes = new Set(['/login'])

export default function SessionFab() {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!pathname || hiddenRoutes.has(pathname)) {
    return null
  }

  async function handleSignOut() {
    setSigningOut(true)
    setError(null)

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setError(signOutError.message)
      setSigningOut(false)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-2 md:right-6 md:top-6">
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="rounded-full border border-stone-200 bg-white/95 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm backdrop-blur disabled:cursor-not-allowed disabled:opacity-60"
      >
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
      {error && (
        <div className="max-w-xs rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}
    </div>
  )
}
