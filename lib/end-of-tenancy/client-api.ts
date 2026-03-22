'use client'

import { supabase } from '@/lib/supabase'

let cachedToken: string | null = null
let cachedTokenExpiresAt = 0

function clearCachedToken() {
  cachedToken = null
  cachedTokenExpiresAt = 0
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    clearCachedToken()
    throw new Error(sessionError.message)
  }

  const accessToken = session?.access_token

  if (!accessToken) {
    clearCachedToken()
    throw new Error('Missing operator session.')
  }

  const sessionExpiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 30_000
  cachedToken = accessToken
  cachedTokenExpiresAt = Math.min(Date.now() + 30_000, sessionExpiresAt)

  return accessToken
}

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(() => {
    clearCachedToken()
  })
}

export async function endOfTenancyApiRequest<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const accessToken = await getAccessToken()

  const response = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json().catch(() => null)) as { error?: string } | null

  if (!response.ok) {
    if (response.status === 401) {
      clearCachedToken()
    }

    throw new Error(data?.error || 'Request failed.')
  }

  return data as T
}
