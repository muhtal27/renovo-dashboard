const DEFAULT_RETURN_TO = '/checkouts'

export function normalizeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_TO
) {
  if (!value) {
    return fallback
  }

  // Only allow same-origin absolute paths. Reject scheme-relative targets such as //example.com.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }

  return value
}

export function getReturnToFromSearch(search: string, fallback = DEFAULT_RETURN_TO) {
  return normalizeReturnTo(new URLSearchParams(search).get('returnTo'), fallback)
}
