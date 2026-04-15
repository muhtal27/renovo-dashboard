import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EotWorkspaceClient } from '@/app/eot/_components/eot-workspace-client'
import { requireOperatorTenant } from '@/lib/operator-server'
import { EotServerDataError, getEotCaseWorkspaceSummarySnapshot } from '@/lib/eot-server-data'
import type { WorkspaceStep } from '@/lib/eot-types'

export const metadata: Metadata = {
  title: 'Operator Case Workspace | Renovo AI',
}

const VALID_STEPS = new Set<WorkspaceStep>([
  'inventory',
  'readings',
  'analysis',
  'review',
  'deductions',
  'negotiation',
  'refund',
])

const LEGACY_STEP_MAP: Record<string, WorkspaceStep> = {
  overview: 'inventory',
  checkout: 'inventory',
  draft: 'inventory',
  documents: 'inventory',
  'collecting-evidence': 'inventory',
  utilities: 'readings',
  process: 'analysis',
  defects: 'review',
  'draft-sent': 'deductions',
  'send-out': 'deductions',
  sendout: 'deductions',
  'ready-for-claim': 'negotiation',
  submitted: 'refund',
  resolved: 'refund',
  submission: 'refund',
}

function normalizeStep(value: string | undefined): WorkspaceStep | undefined {
  if (!value) return undefined
  const v = value.toLowerCase().trim()
  if (VALID_STEPS.has(v as WorkspaceStep)) return v as WorkspaceStep
  return LEGACY_STEP_MAP[v]
}

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    step?: string | string[]
    tab?: string | string[]
  }>
}

export default async function OperatorCaseWorkspacePage({ params, searchParams }: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams])

  const stepValue = resolvedSearchParams.step ?? resolvedSearchParams.tab
  const initialStep = normalizeStep(Array.isArray(stepValue) ? stepValue[0] : stepValue)

  const context = await requireOperatorTenant(`/operator/cases/${id}`)

  const initialWorkspace = await getEotCaseWorkspaceSummarySnapshot(context, id).catch((error) => {
    if (error instanceof EotServerDataError && error.status === 404) {
      notFound()
    }
    throw error
  })

  const defaultActor = context.profile?.full_name ?? context.user.email ?? 'Operator'

  return (
    <EotWorkspaceClient
      caseId={id}
      defaultActor={defaultActor}
      initialWorkspace={initialWorkspace}
      initialStep={initialStep}
    />
  )
}
