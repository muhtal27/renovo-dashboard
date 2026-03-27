import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotPortfolioSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Overview | Renovo',
}

export default async function OverviewPage() {
  const context = await requireOperatorTenant('/overview')
  const initialSnapshot = await getEotPortfolioSnapshot(context).catch(() => null)

  return <EotPortfolioClient mode="overview" initialSnapshot={initialSnapshot} />
}
