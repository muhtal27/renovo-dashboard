import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { TeamsPanel } from './teams-panel'

export const metadata: Metadata = {
  title: 'Teams | Renovo AI',
}

export default async function TeamsPage() {
  await requireOperatorPermission('/settings/teams', OPERATOR_PERMISSIONS.MANAGE_USERS)

  return <TeamsPanel />
}
