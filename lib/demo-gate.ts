import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const DEMO_ACCESS_COOKIE = 'renovo_demo_access'
// 30 days — the demo is evergreen, but a bounded TTL caps cookie-harvest
// replay risk and gives us a natural re-capture point for engaged leads.
export const DEMO_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 30

type TokenPayload = {
  email: string
  issuedAt: number
}

function requireSecret(): string {
  const secret =
    process.env.DEMO_ACCESS_SECRET?.trim() ||
    process.env.EOT_INTERNAL_AUTH_SECRET?.trim()

  if (!secret) {
    throw new Error('Missing DEMO_ACCESS_SECRET.')
  }

  return secret
}

function sign(encodedPayload: string): string {
  return createHmac('sha256', requireSecret())
    .update(encodedPayload)
    .digest('base64url')
}

export function issueDemoAccessToken(email: string): string {
  const payload: TokenPayload = {
    email: email.toLowerCase(),
    issuedAt: Math.floor(Date.now() / 1000),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export function verifyDemoAccessToken(token: string | undefined | null): TokenPayload | null {
  if (!token) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = sign(encodedPayload)
  const provided = Buffer.from(signature, 'base64url')
  const expected = Buffer.from(expectedSignature, 'base64url')

  if (provided.length !== expected.length) return null
  if (!timingSafeEqual(provided, expected)) return null

  let payload: TokenPayload
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload
  } catch {
    return null
  }

  if (typeof payload.email !== 'string' || typeof payload.issuedAt !== 'number') return null

  const ageSeconds = Math.floor(Date.now() / 1000) - payload.issuedAt
  if (ageSeconds < 0 || ageSeconds > DEMO_ACCESS_TTL_SECONDS) return null

  return payload
}

// SHA-256(secret || ip). Lets us detect repeat abuse without persisting
// raw IPs — can't be reversed without the server secret.
export function hashIpForLogging(ip: string): string {
  return createHash('sha256').update(`${requireSecret()}:${ip}`).digest('hex')
}
