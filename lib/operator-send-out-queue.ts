import type { CheckoutWorkspaceEmailDraftRecord } from '@/lib/operator-checkout-workspace-types'
import { getCheckoutEmailDraftRecipient } from '@/lib/operator-checkout-workspace-helpers'

type SendOutQueueContext = {
  checkoutCase?: {
    landlordEmail: string | null
    tenantEmail: string | null
  } | null
  workspace: {
    tenant: {
      email: string | null
    }
  }
}

type SendOutQueueNotice = {
  body: string
  title: string
  tone: 'info' | 'success' | 'warning'
}

export type SendOutDeliveryState = {
  kind: 'needs_review' | 'queued_locally' | 'ready' | 'sent'
  label: 'Needs review' | 'Queued locally' | 'Ready for handoff' | 'Sent'
  tone: 'accepted' | 'pending' | 'sent' | 'warning'
}

export function getResolvedSendOutRecipient(
  draft: CheckoutWorkspaceEmailDraftRecord,
  data: SendOutQueueContext
) {
  return getCheckoutEmailDraftRecipient(draft, data)
}

export function getSendOutDeliveryState(
  draft: CheckoutWorkspaceEmailDraftRecord,
  data: SendOutQueueContext,
  {
    outboundConfigured,
  }: {
    outboundConfigured: boolean
  }
): SendOutDeliveryState {
  const recipient = getResolvedSendOutRecipient(draft, data)
  const hasSubject = Boolean(draft.subject?.trim())
  const hasBody = Boolean(draft.body.trim())

  if (draft.status === 'sent') {
    return {
      kind: 'sent',
      label: 'Sent',
      tone: 'sent',
    }
  }

  if (!recipient || !hasSubject || !hasBody) {
    return {
      kind: 'needs_review',
      label: 'Needs review',
      tone: 'warning',
    }
  }

  if (!outboundConfigured) {
    return {
      kind: 'queued_locally',
      label: 'Queued locally',
      tone: 'pending',
    }
  }

  return {
    kind: 'ready',
    label: 'Ready for handoff',
    tone: 'accepted',
  }
}

export function getSendOutReadiness({
  data,
  draft,
  outboundConfigured,
}: {
  data: SendOutQueueContext
  draft: CheckoutWorkspaceEmailDraftRecord | null
  outboundConfigured: boolean
}) {
  if (!draft) {
    return 0
  }

  if (draft.status === 'sent') {
    return 100
  }

  const checks = [
    outboundConfigured,
    Boolean(getResolvedSendOutRecipient(draft, data)),
    Boolean(draft.subject?.trim()),
    Boolean(draft.body.trim()),
  ]
  const completed = checks.filter(Boolean).length

  return Math.round((completed / checks.length) * 100)
}

export function getSendOutQueueSummary({
  data,
  drafts,
  outboundConfigured,
}: {
  data: SendOutQueueContext
  drafts: CheckoutWorkspaceEmailDraftRecord[]
  outboundConfigured: boolean
}) {
  const sentCount = drafts.filter((draft) => draft.status === 'sent').length
  const readyCount = drafts.filter((draft) => {
    return getSendOutDeliveryState(draft, data, { outboundConfigured }).kind === 'ready'
  }).length
  const unresolvedRecipientCount = drafts.filter((draft) => {
    return !getResolvedSendOutRecipient(draft, data)
  }).length

  let notice: SendOutQueueNotice

  if (drafts.length === 0) {
    notice = {
      body: 'There are no send-out drafts yet. As negotiation outputs are prepared, they will appear here for delivery handoff.',
      title: 'No outbound queue yet',
      tone: 'info',
    }
  } else if (sentCount === drafts.length) {
    notice = {
      body: 'Every current draft is already recorded as sent in the structured workspace delivery log.',
      title: 'Outbound queue complete',
      tone: 'success',
    }
  } else if (!outboundConfigured) {
    notice = {
      body: 'Drafts stay inside the checkout workspace until an outbound webhook is configured for this dashboard deployment.',
      title: 'Outbound delivery integration not configured',
      tone: 'warning',
    }
  } else if (sentCount + readyCount === drafts.length) {
    notice = {
      body: 'Every remaining unsent draft has enough information for external handoff through the configured outbound delivery endpoint.',
      title: 'Outbound queue ready',
      tone: 'success',
    }
  } else {
    notice = {
      body: 'Some drafts still need recipient or content review before they are ready for external delivery.',
      title: 'Outbound queue needs review',
      tone: 'warning',
    }
  }

  return {
    notice,
    readyCount,
    sentCount,
    unresolvedRecipientCount,
  }
}
