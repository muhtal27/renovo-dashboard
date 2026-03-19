'use client'

import { useEffect, useEffectEvent, useState } from 'react'
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
  missingProfileMessage,
  sessionErrorMessage = 'Unable to load operator session.',
  refreshErrorMessage = 'Unable to refresh operator session.',
  unauthenticatedMode = 'redirect',
}: UseOperatorGateOptions = {}) {
  const router = useRouter()
  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const hydrateOperator = useEffectEvent(async (user: User) => {
    setOperator({
      authUser: user,
      profile: null,
    })

    try {
      const profile = await getOperatorProfile(user.id)

      setOperator({
        authUser: user,
        profile,
      })

      if (!profile && missingProfileMessage) {
        setAuthError(missingProfileMessage)
        return
      }

      if (profile?.is_active === false) {
        setAuthError('Your operator profile is inactive. Please contact an administrator.')
        return
      }

      setAuthError(null)
    } catch (profileError) {
      setAuthError(
        profileError instanceof Error ? profileError.message : 'Unable to load operator profile.'
      )
    }
  })

  useEffect(() => {
    let cancelled = false

    async function applyUser(user: User | null, failureMessage: string) {
      if (cancelled) return

      if (!user) {
        setOperator(null)
        setAuthError(null)
        setAuthLoading(false)

        if (unauthenticatedMode === 'redirect') {
          router.replace('/login')
        }

        return
      }

      try {
        await hydrateOperator(user)
      } catch (authError) {
        if (!cancelled) {
          setAuthError(authError instanceof Error ? authError.message : failureMessage)
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
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

        await applyUser(session?.user ?? null, sessionErrorMessage)
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
      void applyUser(session?.user ?? null, refreshErrorMessage)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [refreshErrorMessage, router, sessionErrorMessage, unauthenticatedMode])

  return {
    operator,
    authLoading,
    authError,
  }
}
