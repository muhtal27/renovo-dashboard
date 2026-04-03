import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { getEotInventoryFeedbackSnapshot } from '@/lib/eot-server-data'
import { InventoryFeedbackClient } from './inventory-feedback-client'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Inventory feedback | Renovo AI',
}

async function InventoryFeedbackList() {
  const context = await requireOperatorTenant('/inventory-feedback')
  const initialData = await getEotInventoryFeedbackSnapshot(context).catch(() => null)

  return <InventoryFeedbackClient initialData={initialData} />
}

export default function InventoryFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-20" />
          <SkeletonPanel className="h-[400px]" />
        </div>
      }
    >
      <InventoryFeedbackList />
    </Suspense>
  )
}
