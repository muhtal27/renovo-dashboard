import { redirect } from 'next/navigation'

/**
 * Legacy /tenancies/[caseId] route — redirects to the operator
 * checkout workspace at /operator/cases/[caseId].
 */
type PageProps = {
  params: Promise<{
    caseId: string
  }>
}

export default async function LegacyTenancyWorkspacePage({ params }: PageProps) {
  const { caseId } = await params
  redirect(`/operator/cases/${caseId}`)
}
