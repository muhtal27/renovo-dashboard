import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotPortfolioSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Disputes | Renovo',
}

export default async function DisputesPage() {
  const context = await requireOperatorTenant('/disputes')
  const initialSnapshot = await getEotPortfolioSnapshot(context).catch(() => null)

  return <EotPortfolioClient mode="disputes" initialSnapshot={initialSnapshot} />
}
