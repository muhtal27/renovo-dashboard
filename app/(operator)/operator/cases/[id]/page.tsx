import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckoutCaseWorkspace } from '@/app/(operator)/operator/cases/[id]/_components/checkout-case-workspace'
import { getOperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace'
import { isOperatorCaseWorkspaceNotFoundError } from '@/lib/operator-case-workspace'
import { normalizeWorkspaceStep } from '@/lib/operator-checkout-workspace-types'

export const metadata: Metadata = {
  title: 'Operator Case Workspace | Renovo AI',
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
  const initialStep = normalizeWorkspaceStep(Array.isArray(stepValue) ? stepValue[0] : stepValue)
  const data = await getOperatorCheckoutWorkspaceData(id).catch((error) => {
    if (isOperatorCaseWorkspaceNotFoundError(error)) {
      notFound()
    }

    throw error
  })

  return <CheckoutCaseWorkspace data={data} initialTab={initialStep} />
}
