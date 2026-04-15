'use client'

import { useCallback, useState } from 'react'
import type { EotDefect, EotLiability } from '@/lib/eot-types'
import { updateDefects } from '@/lib/eot-api'
import { DefectReviewCard, DefectSummaryBar } from './workspace-defect-review'

type DefectReviewPanelProps = {
  caseId: string
  initialDefects: EotDefect[]
}

/**
 * Wrapper panel that manages defect review state.
 * Reads initial defects from Supabase (passed as props), writes mutations back via API.
 */
export function DefectReviewPanel({ caseId, initialDefects }: DefectReviewPanelProps) {
  const [defects, setDefects] = useState<EotDefect[]>(initialDefects)

  const persistDefectUpdate = useCallback(
    (id: string, patch: Partial<Pick<EotDefect, 'operator_liability' | 'adjusted_cost' | 'excluded' | 'reviewed'>>) => {
      updateDefects(caseId, [{
        defect_id: id,
        operator_liability: patch.operator_liability,
        adjusted_cost: patch.adjusted_cost,
        excluded: patch.excluded,
        reviewed: patch.reviewed,
      }]).catch((err) => {
        console.error('Failed to persist defect update', err)
      })
    },
    [caseId],
  )

  const handleLiabilityChange = useCallback(
    (id: string, liability: EotLiability) => {
      setDefects((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, operator_liability: liability } : d,
        ),
      )
      persistDefectUpdate(id, { operator_liability: liability })
    },
    [persistDefectUpdate],
  )

  const handleCostAdjust = useCallback(
    (id: string, cost: number | null) => {
      setDefects((prev) =>
        prev.map((d) => (d.id === id ? { ...d, adjusted_cost: cost } : d)),
      )
      persistDefectUpdate(id, { adjusted_cost: cost })
    },
    [persistDefectUpdate],
  )

  const handleToggleExclude = useCallback(
    (id: string) => {
      setDefects((prev) => {
        const defect = prev.find((d) => d.id === id)
        const nextExcluded = defect ? !defect.excluded : false
        persistDefectUpdate(id, { excluded: nextExcluded })
        return prev.map((d) =>
          d.id === id ? { ...d, excluded: nextExcluded } : d,
        )
      })
    },
    [persistDefectUpdate],
  )

  const handleMarkReviewed = useCallback(
    (id: string) => {
      setDefects((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, reviewed: true, reviewed_at: new Date().toISOString() } : d,
        ),
      )
      persistDefectUpdate(id, { reviewed: true })
    },
    [persistDefectUpdate],
  )

  return (
    <div className="space-y-4">
      <DefectSummaryBar defects={defects} />
      {defects.map((defect) => (
        <DefectReviewCard
          key={defect.id}
          defect={defect}
          onLiabilityChange={handleLiabilityChange}
          onCostAdjust={handleCostAdjust}
          onToggleExclude={handleToggleExclude}
          onMarkReviewed={handleMarkReviewed}
        />
      ))}
    </div>
  )
}
