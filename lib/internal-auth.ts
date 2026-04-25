import { cache } from 'react'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { readOperatorSessionIfNeeded } from '@/lib/operator-session-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

// Cached per-request so a page + its children don't each hit the DB.
const getAllowedEmails = cache(async (): Promise<Set<string>> => {
  try {
    const supabase = getSupabaseServiceRoleClient()
    const { data, error } = await supabase
      .from('finance_allowed_emails')
      .select('email')

    if (error) {
      console.error('internal-auth: failed to load allowlist', error.message)
      return new Set()
    }

    return new Set((data ?? []).map((row) => row.email.toLowerCase()))
  } catch (err) {
    console.error('internal-auth: allowlist lookup threw', err)
    return new Set()
  }
})

async function resolveInternalUser(): Promise<User | null> {
  const session = await readOperatorSessionIfNeeded()
  if (!session.ok) return null

  const email = session.user.email?.toLowerCase()
  if (!email) return null

  const allowed = await getAllowedEmails()
  if (!allowed.has(email)) return null

  return session.user
}

export async function getInternalUser(): Promise<User | null> {
  return resolveInternalUser()
}

// Internal routes are invisible to non-team users: 404 rather than redirect.
export async function requireInternalUser(): Promise<User> {
  const user = await resolveInternalUser()
  if (!user) {
    notFound()
  }
  return user
}

type InternalApiAuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

export async function requireInternalUserForApi(): Promise<InternalApiAuthResult> {
  const user = await resolveInternalUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not found.' }, { status: 404 }),
    }
  }
  return { ok: true, user }
}
