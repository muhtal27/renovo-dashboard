import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Disputes | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DisputesPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/disputes')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Disputes"
      pageDescription="Review disputed cases, contested issues, and the evidence-backed narratives needed for resolution."
      searchPlaceholder="Search disputes by property, tenant, issue, severity, or dispute state"
      searchTargetPath="/disputes"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Disputes' }]}
    >
      <EotPortfolioClient mode="disputes" />
    </OperatorLayout>
  )
}
