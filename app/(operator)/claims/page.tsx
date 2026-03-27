import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotPortfolioSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Submissions | Renovo',
}

export default async function ClaimsPage() {
  const context = await requireOperatorTenant('/claims')
  const initialSnapshot = await getEotPortfolioSnapshot(context).catch(() => null)

  return <EotPortfolioClient mode="claims" initialSnapshot={initialSnapshot} />
}
