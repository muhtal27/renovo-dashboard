import type { Metadata } from 'next'
import { ReportsClient } from '@/app/(operator)/reports/_components/reports-client'
import { getEotReportSummary } from '@/lib/eot-server-data'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Reports | Renovo AI',
}

export default async function ReportsPage() {
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
