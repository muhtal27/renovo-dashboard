import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ReportsClient } from '@/app/(operator)/reports/_components/reports-client'
import { getEotReportSummary } from '@/lib/eot-server-data'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Reports | Renovo AI',
}

async function ReportsContent() {
  const context = await requireOperatorPermission('/reports', OPERATOR_PERMISSIONS.VIEW_REPORTING)
  const initialSummary = await getEotReportSummary(context).catch((error) => ({
    data: null,
    error:
      error instanceof Error
        ? error.message
        : 'Unable to load the reporting summary.',
  }))

  if ('error' in initialSummary) {
    return <ReportsClient error={initialSummary.error} />
  }

  return <ReportsClient initialSummary={initialSummary} />
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-20" />
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
