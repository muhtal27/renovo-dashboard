import type { Metadata } from 'next'
import { DisputeListClient } from '@/app/(operator)/disputes/_components/dispute-list-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Disputes | Renovo AI',
}

export default async function DisputesPage() {
  const context = await requireOperatorTenant('/disputes')
  const cases = await getEotCaseListSnapshot(context).catch(() => null)
  const disputedCases = cases?.filter((c) => c.status === 'disputed') ?? null

  return <DisputeListClient initialCases={disputedCases} />
}
