'use client'

import { EmptyState } from '@/app/operator-ui'
import {
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceProgressBar,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type {
  CheckoutWorkspaceDetectorRecord,
  CheckoutWorkspaceKeyRecord,
  CheckoutWorkspaceParkingRecord,
  CheckoutWorkspaceUtilityRecord,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

function formatMeterValue(value: number | null) {
  if (value == null) {
    return '—'
  }

  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

function getUtilityTone(value: CheckoutWorkspaceUtilityRecord['utilityType']) {
  switch (value) {
    case 'electricity':
      return 'info' as const
    case 'gas':
      return 'warning' as const
    case 'water':
      return 'landlord' as const
    case 'oil':
      return 'maintenance' as const
    default:
      return 'neutral' as const
  }
}

function getKeyStatusTone(value: CheckoutWorkspaceKeyRecord['status']) {
  switch (value) {
    case 'returned':
      return 'accepted' as const
    case 'outstanding':
      return 'overdue' as const
    case 'not_applicable':
    default:
      return 'neutral' as const
  }
}

function getDetectorTone(value: CheckoutWorkspaceDetectorRecord['detectorType']) {
  switch (value) {
    case 'smoke_alarm':
      return 'info' as const
    case 'heat_detector':
      return 'warning' as const
    case 'co_detector':
    default:
      return 'maintenance' as const
  }
}

function getBooleanTone(value: boolean | null) {
  if (value === true) {
    return 'accepted' as const
  }

  if (value === false) {
    return 'fail' as const
  }

  return 'neutral' as const
}

function getParkingTone(status: CheckoutWorkspaceParkingRecord['status']) {
  return getKeyStatusTone(status)
}

export function CaseUtilities({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const utilityReadingsCaptured = data.utilities.filter((utility) => {
    return utility.readingCheckout != null
  }).length
  const returnedKeySets = data.keys.filter((keySet) => keySet.status === 'returned').length
  const testedDetectors = data.detectors.filter((detector) => detector.tested).length
  const passedComplianceItems = data.compliance.filter((item) => item.passed === true).length
  const handoverChecklistCount = [
    data.utilities.length > 0,
    returnedKeySets === data.keys.length && data.keys.length > 0,
    testedDetectors === data.detectors.length && data.detectors.length > 0,
    passedComplianceItems === data.compliance.length && data.compliance.length > 0,
    Boolean(data.councilTax?.councilNotified),
    data.parking?.status === 'returned' || data.parking?.status === 'not_applicable',
  ].filter(Boolean).length
  const hasUtilitiesData =
    data.utilities.length > 0 ||
    data.keys.length > 0 ||
    data.detectors.length > 0 ||
    data.compliance.length > 0 ||
    Boolean(data.councilTax) ||
    Boolean(data.parking)

  return (
    <div className="space-y-4">
      {!hasUtilitiesData ? (
        <WorkspaceNotice
          body="No structured utilities, keys, detector, compliance, council, or parking records have been captured for this case yet."
          title="Utilities and handover data not populated yet"
          tone="info"
        />
      ) : null}

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <WorkspaceMetricCard
          detail={`${utilityReadingsCaptured}/${data.utilities.length || 0} checkout readings captured`}
          label="Utilities tracked"
          tone={data.utilities.length > 0 ? 'info' : 'default'}
          value={data.utilities.length}
        />
        <WorkspaceMetricCard
          detail={`${returnedKeySets}/${data.keys.length || 0} key sets returned`}
          label="Keys returned"
          tone={
            data.keys.length > 0 && returnedKeySets === data.keys.length ? 'success' : 'warning'
          }
          value={`${returnedKeySets}/${data.keys.length}`}
        />
        <WorkspaceMetricCard
          detail={`${testedDetectors}/${data.detectors.length || 0} tested · ${passedComplianceItems}/${data.compliance.length || 0} compliant`}
          label="Safety coverage"
          tone={
            data.detectors.length > 0 || data.compliance.length > 0 ? 'warning' : 'default'
          }
          value={`${testedDetectors + passedComplianceItems}`}
        />
        <WorkspaceMetricCard
          detail={`${handoverChecklistCount}/6 handover checkpoints ready`}
          label="Handover readiness"
          tone={handoverChecklistCount >= 5 ? 'success' : handoverChecklistCount >= 3 ? 'warning' : 'default'}
          value={`${handoverChecklistCount}/6`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Utility readings</h3>

          <div className="mt-2">
            {data.utilities.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Utility</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="right">Check-in</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="right">Checkout</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="right">Usage</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Serial</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Location</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {data.utilities.map((utility) => (
                    <WorkspaceTableRow key={utility.id}>
                      <WorkspaceTableCell emphasis="strong">
                        <WorkspaceBadge
                          label={formatEnumLabel(utility.utilityType)}
                          tone={getUtilityTone(utility.utilityType)}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="right" emphasis="mono">
                        {formatMeterValue(utility.readingCheckin)}
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="right" emphasis="mono">
                        {formatMeterValue(utility.readingCheckout)}
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="right" emphasis="mono">
                        {formatMeterValue(utility.usageCalculated)}
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>
                        {utility.serialNumber || 'Not recorded'}
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>
                        {utility.meterLocation || 'Not recorded'}
                      </WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="No structured utility readings have been added yet."
                title="No utility readings recorded"
              />
            )}
          </div>
        </section>

        <div className="border-l-2 border-zinc-200 pl-4">
          <h3 className="text-sm font-semibold text-zinc-950">Handover summary</h3>

          <div className="mt-2 space-y-4">
            <WorkspaceProgressBar
              label="Utilities captured"
              max={Math.max(data.utilities.length, 1)}
              tone={utilityReadingsCaptured === data.utilities.length && data.utilities.length > 0 ? 'success' : 'info'}
              value={utilityReadingsCaptured}
              valueLabel={`${utilityReadingsCaptured}/${data.utilities.length}`}
            />
            <WorkspaceProgressBar
              label="Keys returned"
              max={Math.max(data.keys.length, 1)}
              tone={returnedKeySets === data.keys.length && data.keys.length > 0 ? 'success' : 'warning'}
              value={returnedKeySets}
              valueLabel={`${returnedKeySets}/${data.keys.length}`}
            />
            <WorkspaceProgressBar
              label="Detectors tested"
              max={Math.max(data.detectors.length, 1)}
              tone={testedDetectors === data.detectors.length && data.detectors.length > 0 ? 'success' : 'warning'}
              value={testedDetectors}
              valueLabel={`${testedDetectors}/${data.detectors.length}`}
            />
            <WorkspaceProgressBar
              label="Compliance passed"
              max={Math.max(data.compliance.length, 1)}
              tone={passedComplianceItems === data.compliance.length && data.compliance.length > 0 ? 'success' : 'warning'}
              value={passedComplianceItems}
              valueLabel={`${passedComplianceItems}/${data.compliance.length}`}
            />

            <div className="space-y-3 border-t border-zinc-200 pt-4">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Council notified</dt>
                <dd className="text-right text-sm font-semibold text-zinc-950">
                  {data.councilTax?.councilNotified ? 'Yes' : data.councilTax ? 'No' : 'Not recorded'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-sm text-zinc-500">Parking status</dt>
                <dd className="text-right text-sm font-semibold text-zinc-950">
                  {data.parking ? formatEnumLabel(data.parking.status) : 'Not recorded'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Keys & parking</h3>

          <div className="mt-2 space-y-4">
            {data.keys.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Key set</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="center">Count</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Notes</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {data.keys.map((keySet) => (
                    <WorkspaceTableRow key={keySet.id}>
                      <WorkspaceTableCell emphasis="strong">{keySet.setName}</WorkspaceTableCell>
                      <WorkspaceTableCell align="center">{keySet.keyCount}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <WorkspaceBadge
                          label={formatEnumLabel(keySet.status)}
                          tone={getKeyStatusTone(keySet.status)}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>{keySet.details || 'No notes'}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="No structured key handover records have been added yet."
                title="No key records"
              />
            )}

            <div className="border border-zinc-200 bg-zinc-50/70 px-5 py-5">
              <p className="text-sm font-semibold tracking-[-0.02em] text-zinc-950">Parking</p>
              {data.parking ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <WorkspaceBadge
                      label={formatEnumLabel(data.parking.status)}
                      tone={getParkingTone(data.parking.status)}
                    />
                    {data.parking.zone ? (
                      <WorkspaceBadge label={`Zone ${data.parking.zone}`} tone="neutral" />
                    ) : null}
                  </div>
                  <dl className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm text-zinc-500">Permit number</dt>
                      <dd className="text-right text-sm font-semibold text-zinc-950">
                        {data.parking.permitNumber || 'Not recorded'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-sm text-zinc-500">Updated</dt>
                      <dd className="text-right text-sm font-semibold text-zinc-950">
                        {formatDate(data.parking.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  No parking handover record has been captured for this case.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-200 pb-4">
          <h3 className="text-sm font-semibold text-zinc-950">Safety & compliance</h3>

          <div className="mt-2 space-y-4">
            {data.detectors.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Detector</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Location</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Tested</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell align="right">Expiry</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {data.detectors.map((detector) => (
                    <WorkspaceTableRow key={detector.id}>
                      <WorkspaceTableCell emphasis="strong">
                        <WorkspaceBadge
                          label={formatEnumLabel(detector.detectorType)}
                          tone={getDetectorTone(detector.detectorType)}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>{detector.location || 'Not recorded'}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <WorkspaceBadge
                          label={detector.tested ? 'Tested' : 'Not tested'}
                          tone={detector.tested ? 'accepted' : 'warning'}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell align="right">
                        {detector.expiryDate ? formatDate(detector.expiryDate) : 'Not recorded'}
                      </WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="No detector testing records have been added yet."
                title="No detector records"
              />
            )}

            {data.compliance.length > 0 ? (
              <WorkspaceTable>
                <thead>
                  <tr>
                    <WorkspaceTableHeaderCell>Check item</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                    <WorkspaceTableHeaderCell>Notes</WorkspaceTableHeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {data.compliance.map((item) => (
                    <WorkspaceTableRow key={item.id}>
                      <WorkspaceTableCell emphasis="strong">{item.checkItem}</WorkspaceTableCell>
                      <WorkspaceTableCell>
                        <WorkspaceBadge
                          label={
                            item.passed == null
                              ? 'Not assessed'
                              : item.passed
                                ? 'Passed'
                                : 'Failed'
                          }
                          tone={getBooleanTone(item.passed)}
                        />
                      </WorkspaceTableCell>
                      <WorkspaceTableCell>{item.notes || 'No notes'}</WorkspaceTableCell>
                    </WorkspaceTableRow>
                  ))}
                </tbody>
              </WorkspaceTable>
            ) : (
              <EmptyState
                body="No structured compliance checks have been added yet."
                title="No compliance checks"
              />
            )}
          </div>
        </section>
      </div>

      <section className="border-b border-zinc-200 pb-4">
        <h3 className="text-sm font-semibold text-zinc-950">Council tax handover</h3>

        <div className="mt-2">
          {data.councilTax ? (
            <div className="flex items-end gap-8">
              <WorkspaceMetricCard
                detail="Recorded council for the tenancy end handover."
                label="Council"
                tone="default"
                value={data.councilTax.councilName || 'Not recorded'}
              />
              <WorkspaceMetricCard
                detail="Council tax band captured for the property."
                label="Band"
                tone="default"
                value={data.councilTax.band || 'Not recorded'}
              />
              <WorkspaceMetricCard
                detail="Tenancy end date passed to council handover."
                label="Tenancy end"
                tone="default"
                value={data.councilTax.tenancyEndDate ? formatDate(data.councilTax.tenancyEndDate) : 'Not recorded'}
              />
              <WorkspaceMetricCard
                detail={data.councilTax.notifiedAt ? `Notified ${formatDate(data.councilTax.notifiedAt)}` : 'Notification timestamp missing'}
                label="Council notified"
                tone={data.councilTax.councilNotified ? 'success' : 'warning'}
                value={data.councilTax.councilNotified ? 'Yes' : 'No'}
              />
            </div>
          ) : (
            <EmptyState
              body="No council tax handover data has been captured for this case."
              title="No council tax record"
            />
          )}
        </div>
      </section>
    </div>
  )
}
