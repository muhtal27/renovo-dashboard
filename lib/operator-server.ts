import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'
import {
  parseSupabaseSessionCookie,
  serializeSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
  SUPABASE_SESSION_COOKIE_MAX_AGE,
} from '@/lib/supabase-session'

export async function requireOperatorUser(returnTo: string) {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const authClient = getSupabaseServerAuthClient()
  let activeSession = sessionCookie
  let userResponse = await authClient.auth.getUser(sessionCookie.access_token)

  if (userResponse.error || !userResponse.data.user) {
    const refreshResponse = await authClient.auth.refreshSession({
      refresh_token: sessionCookie.refresh_token,
    })

    const refreshedSession = refreshResponse.data.session

    if (!refreshResponse.error && refreshedSession) {
      activeSession = {
        access_token: refreshedSession.access_token,
        refresh_token: refreshedSession.refresh_token,
        expires_at: refreshedSession.expires_at ?? undefined,
      }

      cookieStore.set(
        SUPABASE_SESSION_COOKIE,
        serializeSupabaseSessionCookie(activeSession),
        {
          path: '/',
          maxAge: SUPABASE_SESSION_COOKIE_MAX_AGE,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        }
      )

      userResponse = await authClient.auth.getUser(activeSession.access_token)
    }
  }

  if (userResponse.error || !userResponse.data.user) {
    cookieStore.set(SUPABASE_SESSION_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  return userResponse.data.user
}
