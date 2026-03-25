import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Overview | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OverviewPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/overview')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Overview"
      pageDescription="Executive summary of the live end-of-tenancy portfolio, workflow pressure, and operator attention queue."
      searchPlaceholder="Search portfolio activity, properties, tenants, or workflow states"
      searchTargetPath="/overview"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview' }]}
    >
      <EotPortfolioClient mode="overview" />
    </OperatorLayout>
  )
}
