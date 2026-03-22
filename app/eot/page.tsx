import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import EotCasesClientPage from '@/app/eot/page-client'
import { listEndOfTenancyCases } from '@/lib/end-of-tenancy/queries'
import {
  parseSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
} from '@/lib/supabase-session'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'EOT Cases | Renovo',
}

export default async function EotCasesPage() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    redirect('/login?returnTo=/eot')
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(sessionCookie.access_token)

  if (authError || !user) {
    redirect('/login?returnTo=/eot')
  }

  let initialItems: Awaited<ReturnType<typeof listEndOfTenancyCases>> | undefined

  try {
    initialItems = await listEndOfTenancyCases({ limit: 250 })
  } catch {
    initialItems = undefined
  }

  return <EotCasesClientPage initialItems={initialItems} />
}
