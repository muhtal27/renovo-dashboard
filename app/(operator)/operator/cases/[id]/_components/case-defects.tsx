'use client'

import { useState } from 'react'
import { DetailPanel, EmptyState, FilterToolbar, SectionCard } from '@/app/operator-ui'
import {
  ConditionBadge,
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceOptionButton,
  WorkspaceProgressBar,
  WorkspaceSectionTitle,
  WorkspaceSelectableCard,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import {
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { getCheckoutSelectedLiability } from '@/lib/operator-checkout-workspace-helpers'
import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceLiability,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

type DefectFilter = 'all' | 'awaiting_review' | CheckoutWorkspaceLiability

function getLiabilityTone(value: CheckoutWorkspaceLiability | null | undefined) {
  switch (value) {
    case 'tenant':
      return 'tenant' as const
    case 'landlord':
      return 'landlord' as const
    case 'shared':
      return 'shared' as const
    default:
      return 'neutral' as const
  }
}

function getDefectTone(value: CheckoutWorkspaceDefectRecord['defectType']) {
  return value === 'cleaning' ? 'cleaning' : 'maintenance'
}

function getReviewTone(defect: CheckoutWorkspaceDefectRecord) {
  return defect.operatorLiability ? 'accepted' as const : 'review' as const
}

function getRoomLabel(
  roomId: string,
  rooms: OperatorCheckoutWorkspaceData['rooms']
) {
  if (!roomId) {
    return 'Room not linked'
  }

  return rooms.find((room) => room.id === roomId)?.roomName ?? 'Room not linked'
}

function getPrimaryCost(defect: CheckoutWorkspaceDefectRecord) {
  return defect.costAdjusted ?? defect.costEstimate ?? 0
}

function getCostLabel(defect: CheckoutWorkspaceDefectRecord) {
  if (defect.costAdjusted != null) {
    return formatCurrency(defect.costAdjusted)
  }

  if (defect.costEstimate != null) {
    return formatCurrency(defect.costEstimate)
  }

  return 'Not estimated'
}

function getReviewStatusLabel(defect: CheckoutWorkspaceDefectRecord) {
  return defect.operatorLiability ? 'Reviewed' : 'Awaiting review'
}

function matchesFilter(defect: CheckoutWorkspaceDefectRecord, filter: DefectFilter) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'awaiting_review') {
    return !defect.operatorLiability
  }

  return getCheckoutSelectedLiability(defect) === filter
}

function getExposureForLiability(
  defects: CheckoutWorkspaceDefectRecord[],
  liability: CheckoutWorkspaceLiability
) {
  return defects.reduce((sum, defect) => {
    return getCheckoutSelectedLiability(defect) === liability ? sum + getPrimaryCost(defect) : sum
  }, 0)
}

export function CaseDefects({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const [filter, setFilter] = useState<DefectFilter>('all')
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(data.defects[0]?.id ?? null)

  const sortedDefects = [...data.defects].sort((left, right) => {
    const costDifference = getPrimaryCost(right) - getPrimaryCost(left)

    if (costDifference !== 0) {
      return costDifference
    }

    return Date.parse(right.createdAt) - Date.parse(left.createdAt)
  })
  const filteredDefects = sortedDefects.filter((defect) => matchesFilter(defect, filter))
  const selectedDefect =
    filteredDefects.find((defect) => defect.id === selectedDefectId) ??
    sortedDefects.find((defect) => defect.id === selectedDefectId) ??
    filteredDefects[0] ??
    sortedDefects[0] ??
    null
  const reviewedCount = data.defects.filter((defect) => Boolean(defect.operatorLiability)).length
  const aiCoverageCount = data.defects.filter((defect) => Boolean(defect.aiSuggestedLiability)).length
  const totalExposure = data.defects.reduce((sum, defect) => sum + getPrimaryCost(defect), 0)
  const tenantExposure = getExposureForLiability(data.defects, 'tenant')
  const landlordExposure = getExposureForLiability(data.defects, 'landlord')
  const sharedExposure = getExposureForLiability(data.defects, 'shared')
  const roomSummaries = data.rooms
    .map((room) => {
      const roomDefects = data.defects.filter((defect) => defect.roomId === room.id)
      const roomExposure = roomDefects.reduce((sum, defect) => sum + getPrimaryCost(defect), 0)
      const reviewedRoomDefects = roomDefects.filter((defect) => Boolean(defect.operatorLiability)).length

      return {
        id: room.id,
        roomName: room.roomName,
        defectCount: roomDefects.length,
        exposure: roomExposure,
        reviewedCount: reviewedRoomDefects,
        conditionCheckin: room.conditionCheckin,
        conditionCheckout: room.conditionCheckout,
      }
    })
    .filter((room) => room.defectCount > 0)
    .sort((left, right) => right.exposure - left.exposure)

  if (data.defects.length === 0) {
    return (
      <div className="space-y-6">
        <WorkspaceNotice
          body="The workspace is live, but no structured defects have been extracted or recorded for this case yet. When defects appear in the checkout data, this tab will become the operator review surface for liability and cost exposure."
          title="No structured defects yet"
          tone="info"
        />

        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <WorkspaceMetricCard
            detail="Structured defect records currently attached to this case."
            label="Defects"
            tone="default"
            value={0}
          />
          <WorkspaceMetricCard
            detail="Rooms already captured in the structured checkout workspace."
            label="Rooms captured"
            tone={data.rooms.length > 0 ? 'info' : 'warning'}
            value={data.rooms.length}
          />
          <WorkspaceMetricCard
            detail="Structured checkout documents available for later analysis."
            label="Indexed documents"
            tone={data.documents.length > 0 ? 'info' : 'warning'}
            value={data.documents.length}
          />
          <WorkspaceMetricCard
            detail="Existing operator issues still visible outside the structured defect model."
            label="Legacy issues"
            tone={data.workspace.issues.length > 0 ? 'warning' : 'default'}
            value={data.workspace.issues.length}
          />
        </section>

        <EmptyState
          body="No defect records are available yet, so there is nothing to review in this step."
          title="Defect review queue is empty"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <WorkspaceMetricCard
          detail={`${reviewedCount}/${data.defects.length} reviewed`}
          label="Defects"
          tone={reviewedCount === data.defects.length ? 'success' : 'warning'}
          value={data.defects.length}
        />
        <WorkspaceMetricCard
          detail={`${aiCoverageCount}/${data.defects.length} with AI liability`}
          label="AI coverage"
          tone={aiCoverageCount === data.defects.length ? 'success' : 'info'}
          value={`${Math.round((aiCoverageCount / Math.max(data.defects.length, 1)) * 100)}%`}
        />
        <WorkspaceMetricCard
          detail={`${formatCurrency(tenantExposure)} tenant · ${formatCurrency(sharedExposure)} shared`}
          label="Total exposure"
          tone={totalExposure > 0 ? 'warning' : 'default'}
          value={formatCurrency(totalExposure)}
        />
        <WorkspaceMetricCard
          detail={`${roomSummaries.length} rooms with linked defects`}
          label="Landlord exposure"
          tone={landlordExposure > 0 ? 'landlord' : 'default'}
          value={formatCurrency(landlordExposure)}
        />
      </section>

      <SectionCard className="px-6 py-6 md:px-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="min-w-0">
            <div className="flex flex-col gap-2">
              <WorkspaceSectionTitle>Defect queue</WorkspaceSectionTitle>
              <p className="text-sm leading-6 text-slate-600">
                Structured checkout defects ordered by financial exposure so operators can review liability and evidence impact.
              </p>
            </div>

            <FilterToolbar className="mt-5">
              <div className="flex flex-wrap gap-2">
                <WorkspaceOptionButton
                  selected={filter === 'all'}
                  onClick={() => setFilter('all')}
                  tone="neutral"
                >
                  All defects
                </WorkspaceOptionButton>
                <WorkspaceOptionButton
                  selected={filter === 'awaiting_review'}
                  onClick={() => setFilter('awaiting_review')}
                  tone="warning"
                >
                  Awaiting review
                </WorkspaceOptionButton>
                <WorkspaceOptionButton
                  selected={filter === 'tenant'}
                  onClick={() => setFilter('tenant')}
                  tone="tenant"
                >
                  Tenant
                </WorkspaceOptionButton>
                <WorkspaceOptionButton
                  selected={filter === 'shared'}
                  onClick={() => setFilter('shared')}
                  tone="shared"
                >
                  Shared
                </WorkspaceOptionButton>
                <WorkspaceOptionButton
                  selected={filter === 'landlord'}
                  onClick={() => setFilter('landlord')}
                  tone="landlord"
                >
                  Landlord
                </WorkspaceOptionButton>
              </div>
              <WorkspaceBadge
                label={`${filteredDefects.length} visible`}
                tone={filteredDefects.length > 0 ? 'review' : 'neutral'}
              />
            </FilterToolbar>

            {filteredDefects.length > 0 ? (
              <div className="mt-5 space-y-3">
                {filteredDefects.map((defect) => {
                  const selectedLiability = getCheckoutSelectedLiability(defect)
                  const roomLabel = getRoomLabel(defect.roomId, data.rooms)

                  return (
                    <WorkspaceSelectableCard
                      key={defect.id}
                      description={defect.description || 'No description recorded.'}
                      onClick={() => setSelectedDefectId(defect.id)}
                      selected={selectedDefect?.id === defect.id}
                      title={defect.itemName}
                      tone={selectedLiability ? getLiabilityTone(selectedLiability) : 'neutral'}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <WorkspaceBadge label={roomLabel} tone="neutral" />
                        <WorkspaceBadge
                          label={formatEnumLabel(defect.defectType)}
                          tone={getDefectTone(defect.defectType)}
                        />
                        <WorkspaceBadge
                          label={getReviewStatusLabel(defect)}
                          tone={getReviewTone(defect)}
                        />
                        {selectedLiability ? (
                          <WorkspaceBadge
                            label={`Liability: ${formatEnumLabel(selectedLiability)}`}
                            tone={getLiabilityTone(selectedLiability)}
                          />
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-500">
                          {defect.aiSuggestedLiability
                            ? `AI ${formatEnumLabel(defect.aiSuggestedLiability).toLowerCase()}`
                            : 'No AI suggestion'}
                        </span>
                        <span className="font-semibold text-slate-950">{getCostLabel(defect)}</span>
                      </div>
                    </WorkspaceSelectableCard>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                body="No defects match the current filter."
                title="Nothing to show"
                className="mt-5"
              />
            )}
          </div>

          <DetailPanel
            title={selectedDefect ? selectedDefect.itemName : 'Defect detail'}
            description={
              selectedDefect
                ? 'Detailed liability, condition, and cost context for the selected defect.'
                : 'Select a defect to inspect liability and evidence context.'
            }
          >
            {selectedDefect ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <WorkspaceBadge
                    label={getRoomLabel(selectedDefect.roomId, data.rooms)}
                    tone="neutral"
                  />
                  <WorkspaceBadge
                    label={formatEnumLabel(selectedDefect.defectType)}
                    tone={getDefectTone(selectedDefect.defectType)}
                  />
                  <WorkspaceBadge
                    label={getReviewStatusLabel(selectedDefect)}
                    tone={getReviewTone(selectedDefect)}
                  />
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">
                      {selectedDefect.description || 'No description recorded.'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Current condition
                      </p>
                      <div className="mt-2">
                        <ConditionBadge value={selectedDefect.conditionCurrent} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Current cleanliness
                      </p>
                      <div className="mt-2">
                        <ConditionBadge value={selectedDefect.cleanlinessCurrent} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Estimated cost</dt>
                    <dd className="text-right text-sm font-semibold text-slate-950">
                      {selectedDefect.costEstimate == null
                        ? 'Not estimated'
                        : formatCurrency(selectedDefect.costEstimate)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Adjusted cost</dt>
                    <dd className="text-right text-sm font-semibold text-slate-950">
                      {selectedDefect.costAdjusted == null
                        ? 'Not adjusted'
                        : formatCurrency(selectedDefect.costAdjusted)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-slate-500">Review updated</dt>
                    <dd className="text-right text-sm font-semibold text-slate-950">
                      {selectedDefect.reviewedAt
                        ? formatDateTime(selectedDefect.reviewedAt)
                        : 'Awaiting review'}
                    </dd>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      AI suggestion
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {selectedDefect.aiSuggestedLiability ? (
                        <WorkspaceBadge
                          label={formatEnumLabel(selectedDefect.aiSuggestedLiability)}
                          tone={getLiabilityTone(selectedDefect.aiSuggestedLiability)}
                        />
                      ) : (
                        <WorkspaceBadge label="No AI liability yet" tone="neutral" />
                      )}
                      {selectedDefect.aiConfidence != null ? (
                        <WorkspaceBadge
                          label={`${Math.round(selectedDefect.aiConfidence * 100)}% confidence`}
                          tone={selectedDefect.aiConfidence >= 0.75 ? 'accepted' : 'warning'}
                        />
                      ) : null}
                    </div>
                    {selectedDefect.aiReasoning ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                        {selectedDefect.aiReasoning}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        No AI reasoning has been recorded for this defect yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Operator liability
                    </p>
                    <div className="mt-2">
                      {selectedDefect.operatorLiability ? (
                        <WorkspaceBadge
                          label={formatEnumLabel(selectedDefect.operatorLiability)}
                          tone={getLiabilityTone(selectedDefect.operatorLiability)}
                        />
                      ) : (
                        <WorkspaceBadge label="Awaiting operator review" tone="review" />
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                body="Select a defect from the queue to inspect liability, condition, and cost."
                title="No defect selected"
              />
            )}
          </DetailPanel>
        </div>
      </SectionCard>

      <SectionCard className="px-6 py-6 md:px-7">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
          <WorkspaceSectionTitle>Room exposure</WorkspaceSectionTitle>
          <p className="text-sm leading-6 text-slate-600">
            Room-level defect concentration and exposure to support later analysis workflows.
          </p>
        </div>

        <div className="grid gap-6 pt-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {roomSummaries.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Room</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Check-in</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Checkout</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="center">Defects</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="center">Reviewed</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="right">Exposure</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {roomSummaries.map((room) => (
                    <WorkspaceTableRow key={room.id}>
                      <WorkspaceTableCell emphasis="strong">{room.roomName}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <ConditionBadge value={room.conditionCheckin} />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <ConditionBadge value={room.conditionCheckout} />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.defectCount}</WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{room.reviewedCount}</WorkspaceTableCell>
                      <WorkspaceTableCell align="right">{formatCurrency(room.exposure)}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="Defects are present, but none are currently linked to a structured room record."
                title="No room links yet"
              />
            )}
          </div>

          <DetailPanel
            title="Review progress"
            description="Coverage metrics for the structured defects already attached to this case."
          >
            <WorkspaceProgressBar
              label="Operator-reviewed defects"
              max={data.defects.length}
              tone={reviewedCount === data.defects.length ? 'success' : 'warning'}
              value={reviewedCount}
              valueLabel={`${reviewedCount}/${data.defects.length}`}
            />
            <WorkspaceProgressBar
              label="AI liability coverage"
              max={data.defects.length}
              tone={aiCoverageCount === data.defects.length ? 'success' : 'info'}
              value={aiCoverageCount}
              valueLabel={`${aiCoverageCount}/${data.defects.length}`}
            />

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Tenant exposure</dt>
                <dd className="text-right text-sm font-semibold text-slate-950">
                  {formatCurrency(tenantExposure)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Shared exposure</dt>
                <dd className="text-right text-sm font-semibold text-slate-950">
                  {formatCurrency(sharedExposure)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-slate-500">Landlord exposure</dt>
                <dd className="text-right text-sm font-semibold text-slate-950">
                  {formatCurrency(landlordExposure)}
                </dd>
              </div>
            </div>
          </DetailPanel>
        </div>
      </SectionCard>
    </div>
  )
}
