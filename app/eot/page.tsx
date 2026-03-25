import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotCaseListClient } from '@/app/eot/_components/eot-case-list-client'
import { resolveEotTenantId } from '@/lib/eot-server'
import { requireOperatorUser } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Cases | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EotCasesPage({ searchParams }: PageProps) {
  const user = await requireOperatorUser('/eot')
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Cases"
      pageDescription="Live end-of-tenancy case list powered by the FastAPI workflow backend."
      searchPlaceholder="Search live cases by property, tenant, status, or priority"
      searchTargetPath="/eot"
      initialSearchValue={initialSearchValue}
    >
      <EotCaseListClient tenantId={resolveEotTenantId(user)} />
    </OperatorLayout>
  )
}
