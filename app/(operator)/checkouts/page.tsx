import { Suspense } from 'react'
import type { Metadata } from 'next'
import { EotCaseListClient } from '@/app/eot/_components/eot-case-list-client'
import { getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Checkouts | Renovo AI',
}

async function CheckoutsList() {
  const context = await requireOperatorTenant('/checkouts')
  const initialCases = await getEotCaseListSnapshot(context).catch(() => null)

  return <EotCaseListClient initialCases={initialCases} />
}

export default function EotCasesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-20" />
          <SkeletonPanel className="h-[400px]" />
        </div>
      }
    >
      <CheckoutsList />
    </Suspense>
  )
}
