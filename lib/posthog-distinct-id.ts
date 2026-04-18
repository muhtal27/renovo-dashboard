import { cookies } from 'next/headers'

const FALLBACK_ID = 'anonymous'

function parsePosthogCookieValue(value: string | undefined): string | null {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    const parsed = JSON.parse(decoded) as { distinct_id?: unknown }
    return typeof parsed.distinct_id === 'string' ? parsed.distinct_id : null
  } catch {
    return null
  }
}

/**
 * Read the PostHog distinct_id from the request cookies. PostHog stores it in
 * a cookie named `ph_<TOKEN>_posthog` with a JSON-encoded object.
 *
 * Pass `userId` (Supabase auth user ID) as a preferred identifier when you
 * have an authenticated session — it collapses client + server events onto
 * the same person after `posthog.identify()` runs.
 */
export async function getServerDistinctId(preferredUserId?: string | null) {
  if (preferredUserId) return preferredUserId

  const store = await cookies()
  for (const cookie of store.getAll()) {
    if (cookie.name.startsWith('ph_') && cookie.name.endsWith('_posthog')) {
      const id = parsePosthogCookieValue(cookie.value)
      if (id) return id
    }
  }
  return FALLBACK_ID
}
