import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { EotWorkspaceClient } from '@/app/eot/_components/eot-workspace-client'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Case Workspace | Renovo',
}

type PageProps = {
  params: Promise<{
    caseId: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EotCasePage({ params, searchParams }: PageProps) {
  const { user } = await requireOperatorTenant('/eot')
  const { caseId } = await params
  const resolvedSearchParams = await searchParams
  const searchValue = resolvedSearchParams.search
  const initialSearchValue = Array.isArray(searchValue) ? searchValue[0] ?? '' : searchValue ?? ''

  return (
    <OperatorLayout
      pageTitle="Case workspace"
      pageDescription="Review live evidence, issues, recommendations, claim structure, and communication in a single operator workspace."
      searchPlaceholder="Filter this case by issue, evidence, recommendation, or message"
      searchTargetPath={`/eot/${caseId}`}
      initialSearchValue={initialSearchValue}
      breadcrumbs={[
        { label: 'Overview', href: '/overview' },
        { label: 'Cases', href: '/eot' },
        { label: 'Case workspace' },
      ]}
    >
      <EotWorkspaceClient
        caseId={caseId}
        defaultActor={user.email ?? user.id}
      />
    </OperatorLayout>
  )
}
