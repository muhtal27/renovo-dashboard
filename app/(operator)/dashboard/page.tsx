import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { getEotTenancyListSnapshot, getEotCaseListSnapshot } from '@/lib/eot-server-data'
import { DashboardOverviewClient } from './dashboard-overview-client'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Dashboard | Renovo AI',
}

async function DashboardContent() {
  const context = await requireOperatorTenant('/dashboard')
  const [tenancies, cases] = await Promise.all([
    getEotTenancyListSnapshot(context).catch(() => null),
    getEotCaseListSnapshot(context).catch(() => null),
  ])
  const meta = context.user.user_metadata
  const rawName = context.profile?.full_name
    || (typeof meta?.full_name === 'string' ? meta.full_name : null)
    || (typeof meta?.name === 'string' ? meta.name : null)
    || context.user.email
    || ''
  const operatorName = String(rawName).split(' ')[0]

  return <DashboardOverviewClient initialTenancies={tenancies} initialCases={cases} operatorName={operatorName} />
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-24" />
          <SkeletonPanel className="h-[400px]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
