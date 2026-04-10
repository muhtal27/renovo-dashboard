import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { normalizeCommunicationHubTab } from '@/lib/communication-hub-types'
import { CommunicationHub } from './_components/communication-hub'

export const metadata: Metadata = {
  title: 'Communications | Renovo AI',
}

type PageProps = {
  searchParams: Promise<{
    tab?: string | string[]
  }>
}

export default async function CommunicationsPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/communications')
  const resolvedParams = await searchParams
  const tabValue = resolvedParams.tab
  const initialTab = normalizeCommunicationHubTab(
    Array.isArray(tabValue) ? tabValue[0] : tabValue
  )

  return <CommunicationHub initialTab={initialTab} />
}
