import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CheckoutCaseWorkspace } from '@/app/(operator)/operator/cases/[id]/_components/checkout-case-workspace'
import { getOperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace'
import { isOperatorCaseWorkspaceNotFoundError } from '@/lib/operator-case-workspace'
import { normalizeCheckoutWorkspaceTab } from '@/lib/operator-checkout-workspace-types'

export const metadata: Metadata = {
  title: 'Operator Case Workspace | Renovo',
}

type PageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    tab?: string | string[]
  }>
}

export default async function OperatorCaseWorkspacePage({ params, searchParams }: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const tabValue = resolvedSearchParams.tab
  const initialTab = normalizeCheckoutWorkspaceTab(Array.isArray(tabValue) ? tabValue[0] : tabValue)
  const data = await getOperatorCheckoutWorkspaceData(id).catch((error) => {
    if (isOperatorCaseWorkspaceNotFoundError(error)) {
      notFound()
    }

    throw error
  })

  return <CheckoutCaseWorkspace data={data} initialTab={initialTab} />
}
