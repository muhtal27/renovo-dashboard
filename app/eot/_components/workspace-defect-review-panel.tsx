'use client'

import { useCallback, useState } from 'react'
import { MOCK_DEFECTS, type WorkspaceDefect } from '@/lib/mock/report-fixtures'
import { DefectReviewCard, DefectSummaryBar } from './workspace-defect-review'

/**
 * Wrapper panel that manages defect review state.
 * Uses mock data — swap for real Supabase queries when backend tables are ready.
 */
export function DefectReviewPanel() {
  const [defects, setDefects] = useState<WorkspaceDefect[]>(MOCK_DEFECTS)

  const handleLiabilityChange = useCallback(
    (id: string, liability: WorkspaceDefect['aiLiability']) => {
      setDefects((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, operatorLiability: liability } : d,
        ),
      )
    },
    [],
  )

  const handleCostAdjust = useCallback((id: string, cost: number | null) => {
    setDefects((prev) =>
      prev.map((d) => (d.id === id ? { ...d, adjustedCost: cost } : d)),
    )
  }, [])

  const handleToggleExclude = useCallback((id: string) => {
    setDefects((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, excluded: !d.excluded } : d,
      ),
    )
  }, [])

  const handleMarkReviewed = useCallback((id: string) => {
    setDefects((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, reviewed: true } : d,
      ),
    )
  }, [])

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
