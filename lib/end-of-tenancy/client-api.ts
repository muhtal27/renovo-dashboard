'use client'

import { supabase } from '@/lib/supabase'

export async function endOfTenancyApiRequest<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  const accessToken = session?.access_token

  if (!accessToken) {
    throw new Error('Missing operator session.')
  }

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
    throw new Error(data?.error || 'Request failed.')
  }

  return data as T
}
