const rateLimitStore = new Map<
  string,
  {
    count: number
    resetAt: number
  }
>()

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (forwardedFor) {
    const firstHop = forwardedFor.split(',')[0]?.trim()
    if (firstHop) return firstHop
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  return realIp || 'unknown'
}

function pruneExpiredBuckets(now: number) {
  if (rateLimitStore.size <= 100) return
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt <= now) rateLimitStore.delete(key)
  }
}

export function rateLimitRequest(request: Request, options: RateLimitOptions) {
  const now = Date.now()
  pruneExpiredBuckets(now)
  const bucketKey = `${options.key}:${getRequestIp(request)}`
  const existing = rateLimitStore.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })

    return {
      allowed: true,
      retryAfterSeconds: 0,
    }
  }

  existing.count += 1
  rateLimitStore.set(bucketKey, existing)

  return {
    allowed: existing.count <= options.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isReasonableText(value: string, { min = 1, max = 2000 }: { min?: number; max?: number }) {
  const trimmed = value.trim()
  return trimmed.length >= min && trimmed.length <= max
}
