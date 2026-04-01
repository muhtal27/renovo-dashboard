import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { MembersPanel } from './members-panel'

export const metadata: Metadata = {
  title: 'Team Members | Renovo AI',
}

export default async function MembersPage() {
  await requireOperatorPermission('/settings/members', OPERATOR_PERMISSIONS.MANAGE_USERS)

  return <MembersPanel />
}
