import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { InventoryFeedbackClient } from './inventory-feedback-client'

export const metadata: Metadata = {
  title: 'Inventory Feedback | Renovo AI',
}

export default async function InventoryFeedbackPage() {
  await requireOperatorTenant('/inventory-feedback')

  return <InventoryFeedbackClient />
}
