import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { getEotCaseWorkspaceSummarySnapshot } from '@/lib/eot-server-data'
import { requireOperatorTenant } from '@/lib/operator-server'
import { SkeletonPanel } from '@/app/operator-ui'

function WorkspaceSkeleton() {
  return (
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
  )
}

// Lazy-load the 2 000-line workspace client so the initial JS bundle for
// this route stays small. SSR is enabled so the server-fetched data renders
// real HTML on first paint. The <Suspense> boundary in the page is required
// because the client component uses useSearchParams().
const EotWorkspaceClient = dynamic(
  () =>
    import('@/app/eot/_components/eot-workspace-client').then(
      (mod) => mod.EotWorkspaceClient
    ),
  { loading: () => <WorkspaceSkeleton /> }
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
  const t0 = performance.now()
  const context = await requireOperatorTenant('/checkouts')
  const tAuth = performance.now()
  const { caseId } = await params
  const initialWorkspace = await getEotCaseWorkspaceSummarySnapshot(context, caseId).catch(() => null)
  const tData = performance.now()
  console.log(`[perf] EotCasePage caseId=${caseId} auth=${(tAuth - t0).toFixed(0)}ms data=${(tData - tAuth).toFixed(0)}ms total=${(tData - t0).toFixed(0)}ms`)

  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <EotWorkspaceClient
        caseId={caseId}
        defaultActor={context.user.email ?? context.user.id}
        initialWorkspace={initialWorkspace}
      />
    </Suspense>
  )
}
