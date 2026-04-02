import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { TenanciesListClient } from './tenancies-list-client'

export const metadata: Metadata = {
  title: 'Tenancies | Renovo AI',
}

export default async function TenanciesPage() {
  await requireOperatorTenant('/tenancies')

  return <TenanciesListClient />
}
