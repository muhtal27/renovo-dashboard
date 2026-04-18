import { getPostHogClient } from '@/lib/posthog-server'
import { getServerDistinctId } from '@/lib/posthog-distinct-id'
import { EVENTS, type ProductEvent } from '@/lib/analytics'

type BaseProps = Record<string, string | number | boolean | null | undefined>

type CaptureOptions = {
  event: ProductEvent
  userId?: string | null
  tenantId?: string | null
  properties?: BaseProps
  groups?: Record<string, string>
}

export { EVENTS }

/**
 * Server-side event capture. Uses the authenticated `userId` when available,
 * otherwise falls back to the PostHog browser cookie (anonymous distinct_id)
 * so events remain stitched to the same person across client/server.
 */
export async function captureServerEvent({
  event,
  userId = null,
  tenantId = null,
  properties,
  groups,
}: CaptureOptions) {
  const distinctId = await getServerDistinctId(userId)
  const client = getPostHogClient()
  client.capture({
    distinctId,
    event,
    properties,
    groups: {
      ...(tenantId ? { tenant: tenantId } : {}),
      ...groups,
    },
  })
}
