import { Suspense } from 'react'
import type { Metadata } from 'next'
import { DisputeListClient } from '@/app/(operator)/disputes/_components/dispute-list-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Disputes | Renovo AI',
}

async function DisputesList() {
  const context = await requireOperatorTenant('/disputes')
  const cases = await getEotCaseListSnapshot(context).catch(() => null)
  const disputedCases = cases?.filter((c) => c.status === 'disputed') ?? null

  return <DisputeListClient initialCases={disputedCases} />
}

export default function DisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-20" />
          <SkeletonPanel className="h-[400px]" />
        </div>
      }
    >
      <DisputesList />
    </Suspense>
  )
}
