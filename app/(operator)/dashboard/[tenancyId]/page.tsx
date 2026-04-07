import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { TenancyDetailClient } from './tenancy-detail-client'

export const metadata: Metadata = {
  title: 'Tenancy detail | Renovo AI',
}

type PageProps = { params: Promise<{ tenancyId: string }> }

export default async function TenancyDetailPage({ params }: PageProps) {
  await requireOperatorTenant('/dashboard')
  const { tenancyId } = await params

  return <TenancyDetailClient tenancyId={tenancyId} />
}
