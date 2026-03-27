import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotPortfolioSnapshot } from '@/lib/eot-server-data'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Reports | Renovo',
}

export default async function ReportsPage() {
  const context = await requireOperatorPermission('/reports', OPERATOR_PERMISSIONS.VIEW_REPORTING)
  const initialSnapshot = await getEotPortfolioSnapshot(context).catch(() => null)

  return <EotPortfolioClient mode="reports" initialSnapshot={initialSnapshot} />
}
