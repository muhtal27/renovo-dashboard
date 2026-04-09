import type { Metadata } from 'next'
import { BillingPageClient } from './billing-client'

export const metadata: Metadata = {
  title: 'Billing | Renovo AI',
}

export default function BillingPage() {
  return <BillingPageClient />
}
