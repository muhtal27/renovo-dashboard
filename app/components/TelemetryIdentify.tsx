'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import type { CurrentOperator } from '@/lib/operator-types'

type Props = {
  operator: CurrentOperator
}

export function TelemetryIdentify({ operator }: Props) {
  const userId = operator.authUser?.id ?? null
  const email = operator.authUser?.email ?? null
  const tenantId = operator.membership?.tenant_id ?? null
  const role = operator.membership?.role ?? null

  useEffect(() => {
    if (!userId) return

    const personProps = {
      ...(email ? { email } : {}),
      ...(tenantId ? { tenant_id: tenantId } : {}),
      ...(role ? { role } : {}),
    }

    posthog.identify(userId, personProps)
    Sentry.setUser({ id: userId, ...(email ? { email } : {}) })

    if (tenantId) {
      posthog.group('tenant', tenantId)
      Sentry.setTag('tenant_id', tenantId)
    }
    if (role) {
      Sentry.setTag('role', role)
    }
  }, [userId, email, tenantId, role])

  return null
}
