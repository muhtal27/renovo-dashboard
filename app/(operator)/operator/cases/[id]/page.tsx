import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaseWorkspaceHeader } from '@/app/(operator)/operator/cases/[id]/_components/case-workspace-header'
import { CaseWorkspaceView } from '@/app/(operator)/operator/cases/[id]/_components/case-workspace-view'
import { getEotCaseWorkspace, isOperatorCaseWorkspaceNotFoundError } from '@/lib/operator-case-workspace'

export const metadata: Metadata = {
  title: 'Operator Case Workspace | Renovo',
}

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function OperatorCaseWorkspacePage({ params }: PageProps) {
  const { id } = await params
  const workspace = await getEotCaseWorkspace(id).catch((error) => {
    if (isOperatorCaseWorkspaceNotFoundError(error)) {
      notFound()
    }

    throw error
  })

  return (
    <div className="space-y-6">
      <CaseWorkspaceHeader workspace={workspace} />
      <CaseWorkspaceView workspace={workspace} />
    </div>
  )
}
