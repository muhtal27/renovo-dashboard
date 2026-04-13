import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ReportsClient } from '@/app/(operator)/reports/_components/reports-client'
import { getEotReportSummary, getEotAnalyticsDashboard } from '@/lib/eot-server-data'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Reports | Renovo AI',
}

async function ReportsContent() {
  const context = await requireOperatorPermission('/reports', OPERATOR_PERMISSIONS.VIEW_REPORTING)

  const [initialSummary, initialAnalytics] = await Promise.all([
    getEotReportSummary(context).catch((error) => ({
      data: null as null,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load the reporting summary.',
    })),
    getEotAnalyticsDashboard(context).catch(() => null),
  ])

  if ('error' in initialSummary) {
    return <ReportsClient error={initialSummary.error} />
  }

  return (
    <ReportsClient
      initialSummary={initialSummary}
      initialAnalytics={initialAnalytics}
    />
  )
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 w-32 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-50" />
            </div>
          </div>
          <div className="h-10 animate-pulse rounded-[10px] bg-zinc-50" />
          <div className="grid gap-4 xl:grid-cols-2">
            <SkeletonPanel className="h-[200px]" />
            <SkeletonPanel className="h-[200px]" />
          </div>
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  )
}
