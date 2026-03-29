'use client'

import { EmptyState } from '@/app/operator-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function CaseTabStub({
  data,
  title,
}: {
  data: OperatorCheckoutWorkspaceData
  title: string
}) {
  return (
    <EmptyState
      title={`${title} tab ready`}
      body={`${title} is scaffolded for ${data.workspace.property.name}. This step only introduces the shell and tab routing; the tab-specific implementation follows in its assigned step.`}
    />
  )
}
