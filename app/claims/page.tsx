import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Claims | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ClaimsPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/claims')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Claims / Outputs"
      pageDescription="Monitor claim pack generation, pending outputs, and the final operator review queue."
      searchPlaceholder="Search claim output, property, tenant, or readiness state"
      searchTargetPath="/claims"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Claims / Outputs' }]}
    >
      <EotPortfolioClient mode="claims" />
    </OperatorLayout>
  )
}
