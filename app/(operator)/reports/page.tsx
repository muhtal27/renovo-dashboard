import type { Metadata } from 'next'
import { EotReportsClient } from '@/app/eot/_components/eot-reports-client'
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
        : 'Unable to load the end-of-tenancy portfolio.',
  }))

  if ('error' in initialSummary) {
    return <EotReportsClient error={initialSummary.error} />
  }

  return <EotReportsClient initialSummary={initialSummary} />
}
