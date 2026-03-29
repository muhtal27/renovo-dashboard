import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getResolvedSendOutRecipient,
  getSendOutDeliveryState,
  getSendOutQueueSummary,
  getSendOutReadiness,
} from '@/lib/operator-send-out-queue'
import type { CheckoutWorkspaceEmailDraftRecord } from '@/lib/operator-checkout-workspace-types'

const BASE_CONTEXT = {
  checkoutCase: {
    landlordEmail: 'landlord@example.com',
    tenantEmail: 'tenant@example.com',
  },
  workspace: {
    tenant: {
      email: 'tenant-workspace@example.com',
    },
  },
}

function createDraft(
  overrides: Partial<CheckoutWorkspaceEmailDraftRecord> = {}
): CheckoutWorkspaceEmailDraftRecord {
  return {
    id: 'draft-1',
    caseId: 'case-1',
    draftType: 'landlord_recommendation',
    subject: 'Checkout recommendation',
    body: 'Structured body',
    attachmentDocumentIds: [],
    sentAt: null,
    sentTo: null,
    status: 'draft',
    createdAt: '2026-03-29T10:00:00.000Z',
    updatedAt: '2026-03-29T10:00:00.000Z',
    ...overrides,
  }
}

test('queue completion only counts drafts that are actually sent', () => {
  const sentDraft = createDraft({
    id: 'draft-sent',
    sentAt: '2026-03-29T12:00:00.000Z',
    status: 'sent',
  })
  const readyDraft = createDraft({
    id: 'draft-ready',
    draftType: 'tenant_charges',
  })

  const summary = getSendOutQueueSummary({
    data: BASE_CONTEXT,
    drafts: [sentDraft, readyDraft],
    outboundConfigured: true,
  })

  assert.equal(summary.sentCount, 1)
  assert.equal(summary.readyCount, 1)
  assert.equal(summary.notice.title, 'Outbound queue ready')
})

test('ready drafts are not counted as complete until they are sent', () => {
  const readyDraft = createDraft({
    id: 'draft-ready',
    draftType: 'tenant_charges',
  })

  assert.equal(
    getSendOutReadiness({
      data: BASE_CONTEXT,
      draft: readyDraft,
      outboundConfigured: true,
    }),
    100
  )

  assert.deepEqual(
    getSendOutDeliveryState(readyDraft, BASE_CONTEXT, { outboundConfigured: true }),
    {
      kind: 'ready',
      label: 'Ready for handoff',
      tone: 'accepted',
    }
  )

  const summary = getSendOutQueueSummary({
    data: BASE_CONTEXT,
    drafts: [readyDraft],
    outboundConfigured: true,
  })

  assert.equal(summary.sentCount, 0)
  assert.equal(summary.readyCount, 1)
  assert.equal(summary.notice.title, 'Outbound queue ready')
})

test('sent drafts remain fully complete without an active outbound webhook', () => {
  const sentDraft = createDraft({
    id: 'draft-sent',
    sentAt: '2026-03-29T12:00:00.000Z',
    sentTo: 'sent@example.com',
    status: 'sent',
  })

  assert.equal(
    getSendOutReadiness({
      data: BASE_CONTEXT,
      draft: sentDraft,
      outboundConfigured: false,
    }),
    100
  )

  assert.deepEqual(
    getSendOutDeliveryState(sentDraft, BASE_CONTEXT, { outboundConfigured: false }),
    {
      kind: 'sent',
      label: 'Sent',
      tone: 'sent',
    }
  )
})

test('all sent drafts are treated as complete', () => {
  const sentDraft = createDraft({
    id: 'draft-sent',
    sentAt: '2026-03-29T12:00:00.000Z',
    status: 'sent',
  })

  const summary = getSendOutQueueSummary({
    data: BASE_CONTEXT,
    drafts: [sentDraft],
    outboundConfigured: true,
  })

  assert.equal(summary.sentCount, 1)
  assert.equal(summary.readyCount, 0)
  assert.equal(summary.notice.title, 'Outbound queue complete')
})

test('recipient resolution falls back to the tenant workspace email for tenant charge drafts', () => {
  const recipient = getResolvedSendOutRecipient(
    createDraft({
      draftType: 'tenant_charges',
    }),
    {
      checkoutCase: {
        landlordEmail: 'landlord@example.com',
        tenantEmail: null,
      },
      workspace: {
        tenant: {
          email: 'fallback-tenant@example.com',
        },
      },
    }
  )

  assert.equal(recipient, 'fallback-tenant@example.com')
})
