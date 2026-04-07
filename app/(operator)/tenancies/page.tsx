import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { getEotTenancyListSnapshot } from '@/lib/eot-server-data'
import { TenanciesPageClient } from './tenancies-page-client'
import { SkeletonPanel } from '@/app/operator-ui'

export const metadata: Metadata = {
  title: 'Tenancies | Renovo AI',
}

async function TenanciesList() {
  const context = await requireOperatorTenant('/tenancies')
  const initialTenancies = await getEotTenancyListSnapshot(context).catch(() => null)

  return <TenanciesPageClient initialTenancies={initialTenancies} />
}

export default function TenanciesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <SkeletonPanel className="h-12" />
          <SkeletonPanel className="h-[400px]" />
        </div>
      }
    >
      <TenanciesList />
    </Suspense>
  )
}
