import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { TeamDetailPanel } from './team-detail-panel'

export const metadata: Metadata = {
  title: 'Team Detail | Renovo AI',
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  await requireOperatorPermission('/teams/teams', OPERATOR_PERMISSIONS.MANAGE_USERS)

  const { teamId } = await params

  return <TeamDetailPanel teamId={teamId} />
}
