import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Admin | Renovo',
}

export default async function OverviewPage() {
  const context = await requireOperatorTenant('/overview')
  const cases = await getEotCaseListSnapshot(context).catch(() => null)
  const initialSnapshot = cases ? { cases, workspaces: [] } : null

  return <EotPortfolioClient mode="overview" initialSnapshot={initialSnapshot} />
}
