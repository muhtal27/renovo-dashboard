import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotPortfolioSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Recommendations | Renovo',
}

export default async function RecommendationsPage() {
  const context = await requireOperatorTenant('/recommendations')
  const initialSnapshot = await getEotPortfolioSnapshot(context).catch(() => null)

  return <EotPortfolioClient mode="recommendations" initialSnapshot={initialSnapshot} />
}
