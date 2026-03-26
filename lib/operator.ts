'use client'

import type { CurrentOperator } from '@/lib/operator-types'

export type { CurrentOperator, OperatorMembership, OperatorProfile } from '@/lib/operator-types'
export { getOperatorLabel } from '@/lib/operator-types'

export async function fetchCurrentOperator() {
  const response = await fetch('/api/operator/session', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('Unable to load your workspace.')
  }

  return (await response.json()) as CurrentOperator
}
