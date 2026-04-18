import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { getPostHogClient } from '@/lib/posthog-server'
import { getServerDistinctId } from '@/lib/posthog-distinct-id'

/**
 * Client-side feature flag hook. Re-renders when flags load.
 * Returns `undefined` during initial fetch, then `boolean | string`.
 *
 *   const showNewWorkspace = useFeatureFlag('new-workspace')
 *   if (showNewWorkspace === undefined) return <Skeleton />
 *   return showNewWorkspace ? <NewWorkspace /> : <OldWorkspace />
 */
export function useFeatureFlag(key: string) {
  const [value, setValue] = useState<boolean | string | undefined>(() =>
    typeof window === 'undefined' ? undefined : posthog.getFeatureFlag(key),
  )

  useEffect(() => {
    setValue(posthog.getFeatureFlag(key))
    return posthog.onFeatureFlags(() => {
      setValue(posthog.getFeatureFlag(key))
    })
  }, [key])

  return value
}

/**
 * Server-side feature flag evaluation for use in Server Components, Route
 * Handlers, or Server Actions. Pair `userId` with `tenantId` so rollouts can
 * target either individual users or whole tenants.
 */
export async function getServerFeatureFlag(
  key: string,
  options: { userId?: string | null; tenantId?: string | null } = {},
) {
  const distinctId = await getServerDistinctId(options.userId)
  const client = getPostHogClient()
  return client.getFeatureFlag(key, distinctId, {
    groups: options.tenantId ? { tenant: options.tenantId } : undefined,
  })
}
