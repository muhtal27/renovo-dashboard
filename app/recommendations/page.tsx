import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Recommendations | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/recommendations')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Recommendations"
      pageDescription="Review charge decisions, rationale, and estimated cost across the live case portfolio."
      searchPlaceholder="Search recommendation rationale, issue titles, properties, or tenants"
      searchTargetPath="/recommendations"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Recommendations' }]}
    >
      <EotPortfolioClient mode="recommendations" />
    </OperatorLayout>
  )
}
