import type { Metadata } from 'next'
import { EotWorkspaceClient } from '@/app/eot/_components/eot-workspace-client'
import { getEotCaseWorkspaceSnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Checkout Workspace | Renovo',
}

type PageProps = {
  params: Promise<{
    caseId: string
  }>
}

export default async function EotCasePage({ params }: PageProps) {
  const context = await requireOperatorTenant('/eot')
  const { caseId } = await params
  const initialWorkspace = await getEotCaseWorkspaceSnapshot(context, caseId).catch(() => null)

  return (
    <EotWorkspaceClient
      caseId={caseId}
      defaultActor={context.user.email ?? context.user.id}
      initialWorkspace={initialWorkspace}
    />
  )
}
