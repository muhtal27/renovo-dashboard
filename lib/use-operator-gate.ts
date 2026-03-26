'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clearLegacySupabaseBrowserAuthArtifacts } from '@/lib/supabase-session'
import { fetchCurrentOperator, type CurrentOperator } from '@/lib/operator'

type UseOperatorGateOptions = {
  missingProfileMessage?: string
  sessionErrorMessage?: string
  refreshErrorMessage?: string
  unauthenticatedMode?: 'redirect' | 'allow-null'
}

export function useOperatorGate({
  sessionErrorMessage = 'Unable to load your workspace.',
  unauthenticatedMode = 'redirect',
}: UseOperatorGateOptions = {}) {
  const router = useRouter()
  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    function redirectToLogin() {
      const returnTo =
        typeof window === 'undefined'
          ? '/eot'
          : `${window.location.pathname}${window.location.search || ''}`

      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }

    async function bootstrapAuth() {
      try {
        clearLegacySupabaseBrowserAuthArtifacts(process.env.NEXT_PUBLIC_SUPABASE_URL)
        const currentOperator = await fetchCurrentOperator()

        if (cancelled) return

        setOperator(currentOperator)
        setAuthError(null)
        setAuthLoading(false)

        if (!currentOperator?.authUser && unauthenticatedMode === 'redirect') {
          redirectToLogin()
        }
      } catch (authError) {
        if (!cancelled) {
          setAuthError(authError instanceof Error ? authError.message : sessionErrorMessage)
          setAuthLoading(false)
        }
      }
    }

    void bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [router, sessionErrorMessage, unauthenticatedMode])

  return {
    operator,
    authLoading,
    authError,
  }
}
