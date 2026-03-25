'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { getOperatorProfile, type CurrentOperator } from '@/lib/operator'
import { supabase } from '@/lib/supabase'

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
  const profileRequestIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    function redirectToLogin() {
      const returnTo =
        typeof window === 'undefined'
          ? '/eot'
          : `${window.location.pathname}${window.location.search || ''}`

      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    }

    async function hydrateOperator(user: User) {
      const requestId = ++profileRequestIdRef.current

      try {
        const profile = await getOperatorProfile(user.id)

        if (cancelled || profileRequestIdRef.current !== requestId) {
          return
        }

        setOperator((current) =>
          current?.authUser?.id === user.id
            ? {
                authUser: user,
                profile: profile ?? null,
              }
            : current
        )
      } catch {
        if (cancelled || profileRequestIdRef.current !== requestId) {
          return
        }
      }
    }

    async function applyUser(user: User | null) {
      if (cancelled) return

      if (!user) {
        profileRequestIdRef.current += 1
        setOperator(null)
        setAuthError(null)
        setAuthLoading(false)

        if (unauthenticatedMode === 'redirect') {
          redirectToLogin()
        }

        return
      }

      setOperator({
        authUser: user,
        profile: null,
      })
      setAuthError(null)
      setAuthLoading(false)
      void hydrateOperator(user)
    }

    async function bootstrapAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        await applyUser(session?.user ?? null)
      } catch (authError) {
        if (!cancelled) {
          setAuthError(authError instanceof Error ? authError.message : sessionErrorMessage)
          setAuthLoading(false)
        }
      }
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUser(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router, sessionErrorMessage, unauthenticatedMode])

  return {
    operator,
    authLoading,
    authError,
  }
}
