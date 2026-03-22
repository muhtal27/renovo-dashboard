import { withEndOfTenancyTransaction } from '@/lib/end-of-tenancy/db'
import type {
  JsonValue,
  MoveOutChecklistItemKey,
  MoveOutChecklistItemRow,
  MoveOutChecklistItemStatus,
  MoveOutTrackerActorType,
  MoveOutTrackerEventType,
  MoveOutTrackerPublicStatus,
  MoveOutTrackerStage,
} from '@/lib/end-of-tenancy/types'
import {
  assertMoveOutChecklistItemKey,
  assertMoveOutChecklistItemStatus,
  assertMoveOutTrackerEventType,
  assertNonEmptyString,
  assertOptionalString,
} from '@/lib/end-of-tenancy/validation'

type TransactionClient = {
  query: <T = unknown>(text: string, values?: unknown[]) => Promise<{ rows: T[]; rowCount: number | null }>
}

type SyncTrackerEventInput = {
  actorType?: MoveOutTrackerActorType
  actorUserId?: string | null
  eventType: MoveOutTrackerEventType
  title: string
  detail?: string | null
  metadata?: JsonValue
  isPortalVisible?: boolean
  sourceTable?: string | null
  sourceRecordId?: string | null
}

type SyncMoveOutTrackerOptions = {
  client?: TransactionClient
  event?: SyncTrackerEventInput
}

type UpdateMoveOutChecklistItemInput = {
  endOfTenancyCaseId: string
  itemKey: MoveOutChecklistItemKey
  status: MoveOutChecklistItemStatus
  operatorUserId: string
  notes?: string | null
  sourceTable?: string | null
  sourceRecordId?: string | null
}

const HANDOVER_ITEM_KEYS: MoveOutChecklistItemKey[] = [
  'keys',
  'parking_permits',
  'utility_readings',
  'council_tax',
  'forwarding_address',
]

function toCount(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
  }
  return 0
}

function checklistLabel(itemKey: MoveOutChecklistItemKey) {
  switch (itemKey) {
    case 'keys':
      return 'Keys'
    case 'parking_permits':
      return 'Parking permits'
    case 'utility_readings':
      return 'Utility readings'
    case 'council_tax':
      return 'Council tax'
    case 'forwarding_address':
      return 'Forwarding address'
    case 'checkout_evidence':
      return 'Checkout evidence'
    case 'ai_review':
      return 'AI review'
    case 'claim_readiness':
      return 'Claim readiness'
    default:
      return itemKey
  }
}

function stageLabel(stage: MoveOutTrackerStage) {
  switch (stage) {
    case 'notice_received':
      return 'Notice received'
    case 'move_out_date_confirmed':
      return 'Move-out date confirmed'
    case 'handover_items_in_progress':
      return 'Handover items in progress'
    case 'checkout_review_in_progress':
      return 'Checkout review in progress'
    case 'claim_settlement_being_prepared':
      return 'Claim / settlement being prepared'
    case 'completed':
      return 'Completed'
    default:
      return stage
  }
}

function normalisePortalVisibility(event?: SyncTrackerEventInput) {
  if (!event) return false
  return event.isPortalVisible === true
}

async function ensureTracker(client: TransactionClient, endOfTenancyCaseId: string) {
  const result = await client.query<{ tracker_id: string }>(
    'select public.ensure_move_out_tracker_for_end_of_tenancy_case($1) as tracker_id',
    [endOfTenancyCaseId]
  )

  return result.rows[0]?.tracker_id ?? null
}

async function updateAutoChecklistState(
  client: TransactionClient,
  trackerId: string,
  derived: {
    documentsCount: number
    hasAiReview: boolean
    acceptedRecommendations: number
    lineItemsCount: number
    workflowStatus: string
  }
) {
  const updates: Array<{
    itemKey: MoveOutChecklistItemKey
    status: MoveOutChecklistItemStatus
  }> = [
    {
      itemKey: 'checkout_evidence',
      status: derived.documentsCount > 0 ? 'complete' : 'not_started',
    },
    {
      itemKey: 'ai_review',
      status: derived.hasAiReview ? 'complete' : 'not_started',
    },
    {
      itemKey: 'claim_readiness',
      status:
        derived.workflowStatus === 'ready_for_claim' || derived.lineItemsCount > 0
          ? 'complete'
          : derived.acceptedRecommendations > 0
            ? 'in_progress'
            : 'not_started',
    },
  ]

  for (const update of updates) {
    await client.query(
      `
        update public.move_out_checklist_items
        set
          status = $3,
          updated_at = now()
        where move_out_tracker_id = $1
          and item_key = $2
          and status <> 'blocked'
      `,
      [trackerId, update.itemKey, update.status]
    )
  }
}

function determineTrackerState(input: {
  workflowStatus: string | null
  moveOutDate: string | null
  blockedItemsCount: number
  waitingItemsCount: number
  handoverStartedCount: number
  documentsCount: number
  extractionsCount: number
  issuesCount: number
  recommendationsCount: number
  acceptedRecommendations: number
  latestRecommendationStatus: string | null
  lineItemsCount: number
  firstBlockedItemKey: MoveOutChecklistItemKey | null
  firstWaitingItemKey: MoveOutChecklistItemKey | null
}) {
  let stage: MoveOutTrackerStage = 'notice_received'
  let publicStatus: MoveOutTrackerPublicStatus = 'waiting'
  let nextActionTitle = 'Confirm the move-out date'
  let nextActionDetail = 'The move-out journey has started, but the move-out date still needs to be confirmed.'

  if (input.workflowStatus === 'closed') {
    stage = 'completed'
    publicStatus = 'completed'
    nextActionTitle = 'Move-out workflow completed'
    nextActionDetail = 'The move-out journey has reached its final completed state.'
    return { stage, publicStatus, nextActionTitle, nextActionDetail }
  }

  if (input.workflowStatus === 'ready_for_claim' || input.lineItemsCount > 0 || input.acceptedRecommendations > 0) {
    stage = 'claim_settlement_being_prepared'
    publicStatus = input.workflowStatus === 'needs_manual_review' || input.blockedItemsCount > 0 ? 'blocked' : 'in_progress'
    nextActionTitle =
      input.workflowStatus === 'ready_for_claim'
        ? 'Prepare the final claim or settlement output'
        : 'Convert approved decisions into claim output'
    nextActionDetail =
      input.lineItemsCount > 0
        ? 'The claim structure is in place. Prepare the final claim or settlement communication next.'
        : 'An approved recommendation exists. Convert it into claim line items to prepare the settlement output.'
    return { stage, publicStatus, nextActionTitle, nextActionDetail }
  }

  if (
    input.documentsCount > 0 ||
    input.extractionsCount > 0 ||
    input.issuesCount > 0 ||
    input.recommendationsCount > 0 ||
    ['evidence_ready', 'recommendation_drafted', 'review_pending', 'needs_manual_review'].includes(
      input.workflowStatus || ''
    )
  ) {
    stage = 'checkout_review_in_progress'
    publicStatus =
      input.workflowStatus === 'needs_manual_review' || input.blockedItemsCount > 0
        ? 'blocked'
        : input.waitingItemsCount > 0 || input.latestRecommendationStatus === 'pending_review'
          ? 'waiting'
          : 'in_progress'

    if (input.workflowStatus === 'needs_manual_review') {
      nextActionTitle = 'Resolve the manual review blocker'
      nextActionDetail =
        input.firstBlockedItemKey != null
          ? `${checklistLabel(input.firstBlockedItemKey)} is blocked and needs an operator decision.`
          : 'A manual review state is active. Resolve the blocker before progressing toward claim output.'
    } else if (input.recommendationsCount === 0) {
      nextActionTitle = 'Draft a recommendation'
      nextActionDetail = 'Evidence and issues are in place. Draft a reviewable recommendation next.'
    } else if (input.latestRecommendationStatus === 'draft') {
      nextActionTitle = 'Submit the recommendation for review'
      nextActionDetail = 'A draft recommendation exists. Submit it so an operator can review and approve or send it back.'
    } else if (['pending_review', 'reviewed'].includes(input.latestRecommendationStatus || '')) {
      nextActionTitle = 'Approve or send back the recommendation'
      nextActionDetail = 'The recommendation is waiting on explicit operator review.'
    } else {
      nextActionTitle = 'Keep checkout review moving'
      nextActionDetail = 'Continue the checkout review until a clear recommendation is ready.'
    }

    return { stage, publicStatus, nextActionTitle, nextActionDetail }
  }

  if (input.handoverStartedCount > 0) {
    stage = 'handover_items_in_progress'
    publicStatus =
      input.blockedItemsCount > 0 ? 'blocked' : input.waitingItemsCount > 0 ? 'waiting' : 'in_progress'
    nextActionTitle =
      input.firstBlockedItemKey != null
        ? `Resolve ${checklistLabel(input.firstBlockedItemKey)}`
        : input.firstWaitingItemKey != null
          ? `Chase ${checklistLabel(input.firstWaitingItemKey)}`
          : 'Complete the handover items'
    nextActionDetail =
      input.firstBlockedItemKey != null
        ? `${checklistLabel(input.firstBlockedItemKey)} is currently blocked and needs follow-up.`
        : input.firstWaitingItemKey != null
          ? `${checklistLabel(input.firstWaitingItemKey)} is still waiting on confirmation.`
          : 'Keys, permits, utilities, council tax, and forwarding details should be confirmed before checkout review begins.'
    return { stage, publicStatus, nextActionTitle, nextActionDetail }
  }

  if (input.moveOutDate) {
    stage = 'move_out_date_confirmed'
    publicStatus = 'in_progress'
    nextActionTitle = 'Start the handover checklist'
    nextActionDetail = 'The move-out date is confirmed. Work through keys, permits, utilities, council tax, and forwarding details next.'
    return { stage, publicStatus, nextActionTitle, nextActionDetail }
  }

  return { stage, publicStatus, nextActionTitle, nextActionDetail }
}

async function syncMoveOutTrackerProgressInTransaction(
  client: TransactionClient,
  endOfTenancyCaseId: string,
  event?: SyncTrackerEventInput
) {
  const trackerId = await ensureTracker(client, endOfTenancyCaseId)

  if (!trackerId) {
    throw new Error(`Unable to ensure move-out tracker for end-of-tenancy case ${endOfTenancyCaseId}.`)
  }

  const derivedResult = await client.query<{
    workflow_status: string | null
    move_out_date: string | null
    documents_count: string | number
    extractions_count: string | number
    issues_count: string | number
    recommendations_count: string | number
    accepted_recommendations: string | number
    line_items_count: string | number
    has_ai_review: boolean | null
  }>(
    `
      select
        eot.workflow_status,
        eot.move_out_date::text as move_out_date,
        (select count(*) from public.case_documents cd where cd.case_id = eot.case_id) as documents_count,
        (
          select count(*)
          from public.document_extractions de
          join public.case_documents cd on cd.id = de.case_document_id
          where cd.case_id = eot.case_id
        ) as extractions_count,
        (
          select count(*)
          from public.end_of_tenancy_issues issue_item
          where issue_item.end_of_tenancy_case_id = eot.id
        ) as issues_count,
        (
          select count(*)
          from public.decision_recommendations rec
          where rec.end_of_tenancy_case_id = eot.id
        ) as recommendations_count,
        (
          select count(*)
          from public.decision_recommendations rec
          where rec.end_of_tenancy_case_id = eot.id
            and rec.recommendation_status = 'accepted'
        ) as accepted_recommendations,
        (
          select count(*)
          from public.deposit_claim_line_items line_item
          where line_item.decision_recommendation_id in (
            select rec.id
            from public.decision_recommendations rec
            where rec.end_of_tenancy_case_id = eot.id
          )
        ) as line_items_count,
        (
          exists (
            select 1
            from public.decision_recommendations rec
            where rec.end_of_tenancy_case_id = eot.id
              and rec.ai_run_id is not null
          )
          or exists (
            select 1
            from public.end_of_tenancy_issues issue_item
            where issue_item.end_of_tenancy_case_id = eot.id
              and issue_item.identified_by_ai_run_id is not null
          )
        ) as has_ai_review
      from public.end_of_tenancy_cases eot
      where eot.id = $1
      limit 1
    `,
    [endOfTenancyCaseId]
  )

  const derived = derivedResult.rows[0]

  if (!derived) {
    throw new Error(`End-of-tenancy case ${endOfTenancyCaseId} was not found.`)
  }

  await updateAutoChecklistState(client, trackerId, {
    documentsCount: toCount(derived.documents_count),
    hasAiReview: derived.has_ai_review === true,
    acceptedRecommendations: toCount(derived.accepted_recommendations),
    lineItemsCount: toCount(derived.line_items_count),
    workflowStatus: derived.workflow_status ?? 'evidence_pending',
  })

  const trackerStateResult = await client.query<{
    current_stage: MoveOutTrackerStage
    blocked_items_count: string | number
    waiting_items_count: string | number
    handover_started_count: string | number
    latest_recommendation_status: string | null
    first_blocked_item_key: MoveOutChecklistItemKey | null
    first_waiting_item_key: MoveOutChecklistItemKey | null
  }>(
    `
      select
        tracker.current_stage,
        (
          select count(*)
          from public.move_out_checklist_items item
          where item.move_out_tracker_id = tracker.id
            and item.status = 'blocked'
        ) as blocked_items_count,
        (
          select count(*)
          from public.move_out_checklist_items item
          where item.move_out_tracker_id = tracker.id
            and item.status = 'waiting'
        ) as waiting_items_count,
        (
          select count(*)
          from public.move_out_checklist_items item
          where item.move_out_tracker_id = tracker.id
            and item.item_key = any($2::text[])
            and item.status <> 'not_started'
        ) as handover_started_count,
        (
          select rec.recommendation_status
          from public.decision_recommendations rec
          where rec.end_of_tenancy_case_id = $1
          order by rec.created_at desc
          limit 1
        ) as latest_recommendation_status,
        (
          select item.item_key
          from public.move_out_checklist_items item
          where item.move_out_tracker_id = tracker.id
            and item.status = 'blocked'
          order by item.created_at
          limit 1
        ) as first_blocked_item_key,
        (
          select item.item_key
          from public.move_out_checklist_items item
          where item.move_out_tracker_id = tracker.id
            and item.status = 'waiting'
          order by item.created_at
          limit 1
        ) as first_waiting_item_key
      from public.move_out_trackers tracker
      where tracker.id = $3
      limit 1
    `,
    [endOfTenancyCaseId, HANDOVER_ITEM_KEYS, trackerId]
  )

  const trackerState = trackerStateResult.rows[0]

  if (!trackerState) {
    throw new Error(`Move-out tracker ${trackerId} was not found.`)
  }

  const next = determineTrackerState({
    workflowStatus: derived.workflow_status,
    moveOutDate: derived.move_out_date,
    blockedItemsCount: toCount(trackerState.blocked_items_count),
    waitingItemsCount: toCount(trackerState.waiting_items_count),
    handoverStartedCount: toCount(trackerState.handover_started_count),
    documentsCount: toCount(derived.documents_count),
    extractionsCount: toCount(derived.extractions_count),
    issuesCount: toCount(derived.issues_count),
    recommendationsCount: toCount(derived.recommendations_count),
    acceptedRecommendations: toCount(derived.accepted_recommendations),
    latestRecommendationStatus: trackerState.latest_recommendation_status,
    lineItemsCount: toCount(derived.line_items_count),
    firstBlockedItemKey: trackerState.first_blocked_item_key,
    firstWaitingItemKey: trackerState.first_waiting_item_key,
  })

  await client.query(
    `
      update public.move_out_trackers
      set
        current_stage = $2,
        public_status = $3,
        next_action_title = $4,
        next_action_detail = $5,
        last_event_at = now(),
        completed_at = case when $2 = 'completed' then coalesce(completed_at, now()) else null end,
        updated_at = now()
      where id = $1
    `,
    [trackerId, next.stage, next.publicStatus, next.nextActionTitle, next.nextActionDetail]
  )

  if (trackerState.current_stage !== next.stage) {
    await client.query(
      `
        insert into public.move_out_tracker_events (
          move_out_tracker_id,
          actor_type,
          event_type,
          title,
          detail,
          metadata,
          is_portal_visible
        )
        values ($1, 'system', 'stage_changed', $2, $3, $4::jsonb, true)
      `,
      [
        trackerId,
        `Progress moved to ${stageLabel(next.stage)}`,
        next.nextActionDetail,
        JSON.stringify({
          stage: next.stage,
          public_status: next.publicStatus,
        }),
      ]
    )
  }

  if (event) {
    await client.query(
      `
        insert into public.move_out_tracker_events (
          move_out_tracker_id,
          actor_user_id,
          actor_type,
          source_table,
          source_record_id,
          event_type,
          title,
          detail,
          metadata,
          is_portal_visible
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      `,
      [
        trackerId,
        event.actorUserId ?? null,
        event.actorType ?? 'system',
        event.sourceTable ?? null,
        event.sourceRecordId ?? null,
        event.eventType,
        event.title,
        event.detail ?? null,
        JSON.stringify(event.metadata ?? {}),
        normalisePortalVisibility(event),
      ]
    )
  }
}

export async function syncMoveOutTrackerProgress(
  endOfTenancyCaseId: string,
  options?: SyncMoveOutTrackerOptions
) {
  assertNonEmptyString(endOfTenancyCaseId, 'endOfTenancyCaseId')

  if (options?.event) {
    assertMoveOutTrackerEventType(options.event.eventType, 'event.eventType')
    assertNonEmptyString(options.event.title, 'event.title')
    assertOptionalString(options.event.detail, 'event.detail')
    assertOptionalString(options.event.actorUserId, 'event.actorUserId')
    assertOptionalString(options.event.sourceTable, 'event.sourceTable')
    assertOptionalString(options.event.sourceRecordId, 'event.sourceRecordId')
  }

  if (options?.client) {
    await syncMoveOutTrackerProgressInTransaction(options.client, endOfTenancyCaseId, options.event)
    return
  }

  await withEndOfTenancyTransaction(async (client) => {
    await syncMoveOutTrackerProgressInTransaction(client, endOfTenancyCaseId, options?.event)
  })
}

export async function updateMoveOutChecklistItem(input: UpdateMoveOutChecklistItemInput) {
  assertNonEmptyString(input.endOfTenancyCaseId, 'endOfTenancyCaseId')
  assertMoveOutChecklistItemKey(input.itemKey, 'itemKey')
  assertMoveOutChecklistItemStatus(input.status, 'status')
  assertNonEmptyString(input.operatorUserId, 'operatorUserId')
  assertOptionalString(input.notes, 'notes')
  assertOptionalString(input.sourceTable, 'sourceTable')
  assertOptionalString(input.sourceRecordId, 'sourceRecordId')

  return withEndOfTenancyTransaction(async (client) => {
    const trackerId = await ensureTracker(client, input.endOfTenancyCaseId)

    if (!trackerId) {
      throw new Error(`Unable to ensure move-out tracker for end-of-tenancy case ${input.endOfTenancyCaseId}.`)
    }

    const result = await client.query<MoveOutChecklistItemRow>(
      `
        update public.move_out_checklist_items
        set
          status = $3,
          notes = $4,
          completed_by_user_id = case when $3 = 'complete' then $5::uuid else null end,
          source_table = coalesce($6, source_table),
          source_record_id = coalesce($7, source_record_id),
          updated_at = now()
        where move_out_tracker_id = $1
          and item_key = $2
        returning
          id,
          move_out_tracker_id,
          item_key,
          audience,
          status,
          is_required,
          notes,
          completed_at,
          completed_by_user_id,
          source_table,
          source_record_id,
          created_at,
          updated_at
      `,
      [
        trackerId,
        input.itemKey,
        input.status,
        input.notes ?? null,
        input.operatorUserId,
        input.sourceTable ?? null,
        input.sourceRecordId ?? null,
      ]
    )

    if (!result.rows[0]) {
      throw new Error(`Checklist item ${input.itemKey} was not found on this move-out tracker.`)
    }

    await syncMoveOutTrackerProgressInTransaction(client, input.endOfTenancyCaseId, {
      actorType: 'user',
      actorUserId: input.operatorUserId,
      eventType: 'checklist_updated',
      title: `${checklistLabel(input.itemKey)} updated`,
      detail: `Checklist item marked ${input.status.replace(/_/g, ' ')}.`,
      metadata: {
        item_key: input.itemKey,
        status: input.status,
      },
      isPortalVisible: HANDOVER_ITEM_KEYS.includes(input.itemKey),
      sourceTable: input.sourceTable ?? null,
      sourceRecordId: input.sourceRecordId ?? null,
    })

    return result.rows[0]
  })
}

export type { UpdateMoveOutChecklistItemInput }
