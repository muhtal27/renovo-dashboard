import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { IntelligenceClient } from './intelligence-client'

export const metadata: Metadata = {
  title: 'Intelligence | Renovo AI',
}

export default async function IntelligencePage() {
  await requireOperatorPermission('/intelligence', OPERATOR_PERMISSIONS.VIEW_REPORTING)

  return <IntelligenceClient />
}
