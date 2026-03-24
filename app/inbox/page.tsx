import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OperatorLayout } from '@/app/operator-layout'
import { buildInboxThreads } from '@/lib/end-of-tenancy/operations'
import {
  listCaseCommunicationRecords,
  listEndOfTenancyCases,
} from '@/lib/end-of-tenancy/queries'
import {
  parseSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
} from '@/lib/supabase-session'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'Inbox | Renovo',
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return 'No recent activity'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function InboxPage() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    redirect('/login?returnTo=/inbox')
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(sessionCookie.access_token)

  if (authError || !user) {
    redirect('/login?returnTo=/inbox')
  }

  const items = await listEndOfTenancyCases({ limit: 250 })
  const communications = await listCaseCommunicationRecords({
    caseIds: items.map((item) => item.case?.id || item.endOfTenancyCase.case_id),
    limit: 500,
  })
  const threads = buildInboxThreads(items, communications)

  return (
    <OperatorLayout
      pageTitle="Inbox"
      pageDescription="Follow outbound messages, inbound replies, and staff-only notes in one audit-friendly queue tied back to the case record."
    >
      <section className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-kicker">Case communication</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Unified communication queue
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              External messages and internal notes remain tied to the case. Unread state and latest
              message timing stay visible from one queue.
            </p>
          </div>
          <Link
            href="/eot"
            className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {threads.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-stone-700">No communication threads yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Messages and internal notes created inside a case will appear here.
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.caseId}
                href={`/cases/${thread.caseId}#communication`}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 transition hover:border-stone-300 hover:bg-stone-50 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {thread.caseNumber} · {thread.propertyAddress}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{thread.latestPreview}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-400">
                    {thread.latestMessageType} · {thread.tenantName} / {thread.landlordName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {thread.unreadCount > 0 ? (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      {thread.unreadCount} unread
                    </span>
                  ) : null}
                  <span className="text-xs text-stone-500">
                    {formatRelativeTime(thread.latestMessageAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </OperatorLayout>
  )
}
