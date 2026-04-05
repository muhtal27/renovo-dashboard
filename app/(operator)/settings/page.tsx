import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'
import { SettingsTabs } from './settings-tabs'

export const metadata: Metadata = {
  title: 'Settings | Renovo AI',
}

export default async function SettingsPage() {
  await requireOperatorPermission('/settings', OPERATOR_PERMISSIONS.MANAGE_SETTINGS)

  return <SettingsTabs />
}
