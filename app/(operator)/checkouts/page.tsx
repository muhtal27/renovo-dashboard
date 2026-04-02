import type { Metadata } from 'next'
import { EotCaseListClient } from '@/app/eot/_components/eot-case-list-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Checkouts | Renovo AI',
}

export default async function EotCasesPage() {
  const context = await requireOperatorTenant('/checkouts')
  const initialCases = await getEotCaseListSnapshot(context).catch(() => null)

  return <EotCaseListClient initialCases={initialCases} />
}
