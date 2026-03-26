import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotPortfolioClient } from '@/app/eot/_components/eot-portfolio-client'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Reports | Renovo',
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReportsPage({ searchParams }: PageProps) {
  await requireOperatorPermission('/reports', OPERATOR_PERMISSIONS.VIEW_REPORTING)
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Reports / Analytics"
      pageDescription="Portfolio analytics for workflow mix, issue severity, evidence composition, and generated output value."
      searchPlaceholder="Search reports by property, tenant, workflow state, or recommendation"
      searchTargetPath="/reports"
      initialSearchValue={initialSearchValue}
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Reports / Analytics' }]}
    >
      <EotPortfolioClient mode="reports" />
    </OperatorLayout>
  )
}
