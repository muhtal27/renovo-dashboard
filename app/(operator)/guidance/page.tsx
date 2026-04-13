import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { GuidanceClient } from './guidance-client'

export const metadata: Metadata = {
  title: 'Guidance | Renovo AI',
}

export default async function GuidancePage() {
  await requireOperatorTenant('/guidance')

  return <GuidanceClient />
}
