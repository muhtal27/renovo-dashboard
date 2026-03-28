import type { Metadata } from 'next'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Submissions | Renovo',
}

export default async function ClaimsPage() {
  const context = await requireOperatorTenant('/claims')
  const cases = await getEotCaseListSnapshot(context).catch(() => null)
  const initialSnapshot = cases ? { cases, workspaces: [] } : null

  return <EotPortfolioClient mode="claims" initialSnapshot={initialSnapshot} />
}
