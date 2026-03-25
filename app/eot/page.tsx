import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotCaseListClient } from '@/app/eot/_components/eot-case-list-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Cases | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EotCasesPage({ searchParams }: PageProps) {
  await requireOperatorTenant('/eot')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Cases"
      pageDescription="Operational case queue with live end-of-tenancy workflow state, priority signals, and fast access into the workspace."
      searchPlaceholder="Search live cases by property, tenant, status, priority, or case ID"
      searchTargetPath="/eot"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Cases' }]}
    >
      <EotCaseListClient />
    </OperatorLayout>
  )
}
