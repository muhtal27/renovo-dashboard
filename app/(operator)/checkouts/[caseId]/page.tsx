import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { getEotCaseWorkspaceSummarySnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

// Lazy-load the 2 000-line workspace client so the initial JS bundle for
// this route stays small.  The server still fetches initialWorkspace data
// during render, which is passed through once the dynamic chunk arrives.
const EotWorkspaceClient = dynamic(
  () =>
    import('@/app/eot/_components/eot-workspace-client').then(
      (mod) => mod.EotWorkspaceClient
    ),
  {
    loading: () => (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-4">
          <SkeletonPanel className="h-20" />
          <SkeletonPanel className="h-[400px]" />
          <SkeletonPanel className="h-[300px]" />
        </div>
        <div className="space-y-4">
          <SkeletonPanel className="h-[200px]" />
          <SkeletonPanel className="h-[150px]" />
        </div>
      </div>
    ),
    ssr: false,
  }
)

export const metadata: Metadata = {
  title: 'Checkout Workspace | Renovo AI',
}

type PageProps = {
  params: Promise<{
    caseId: string
  }>
}

export default async function EotCasePage({ params }: PageProps) {
  const context = await requireOperatorTenant('/checkouts')
  const { caseId } = await params
  const initialWorkspace = await getEotCaseWorkspaceSummarySnapshot(context, caseId).catch(() => null)

  return (
    <EotWorkspaceClient
      caseId={caseId}
      defaultActor={context.user.email ?? context.user.id}
      initialWorkspace={initialWorkspace}
    />
  )
}
