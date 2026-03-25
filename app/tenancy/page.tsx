import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Tenancy | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TenancyPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/tenancy')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Tenancy"
      pageDescription="Cross-case tenancy view covering residents, deposits, property references, and case readiness."
      searchPlaceholder="Search tenancy records by property, tenant, reference, or case state"
      searchTargetPath="/tenancy"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Tenancy' }]}
    >
      <EotPortfolioClient mode="tenancy" />
    </OperatorLayout>
  )
}
