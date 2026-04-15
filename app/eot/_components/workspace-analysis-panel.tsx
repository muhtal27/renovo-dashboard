'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Loader,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/ui'

/* ── Analysis stage config ────────────────────────────────────── */

type AnalysisStage = {
  key: string
  label: string
  description: string
  icon: typeof Sparkles
  durationMs: number
}

const ANALYSIS_STAGES: AnalysisStage[] = [
  {
    key: 'scanning',
    label: 'Scanning Documents',
    description: 'Extracting text and images from inventory reports',
    icon: Brain,
    durationMs: 2200,
  },
  {
    key: 'identifying',
    label: 'Identifying Issues',
    description: 'Comparing check-in and check-out conditions',
    icon: AlertTriangle,
    durationMs: 2800,
  },
  {
    key: 'assessing',
    label: 'Assessing Liability',
    description: 'Evaluating fair wear and tear against tenancy terms',
    icon: Sparkles,
    durationMs: 2400,
  },
  {
    key: 'generating',
    label: 'Generating Recommendations',
    description: 'Producing defect cards with cost estimates and rationale',
    icon: CheckCircle,
    durationMs: 1800,
  },
]

/* ── Stage progress item ──────────────────────────────────────── */

function AnalysisStageItem({
  stage,
  status,
}: {
  stage: AnalysisStage
  status: 'pending' | 'active' | 'complete'
}) {
  const Icon = stage.icon

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
          status === 'complete'
            ? 'bg-emerald-100 text-emerald-600'
            : status === 'active'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-zinc-100 text-zinc-400',
        )}
      >
        {status === 'active' ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : status === 'complete' ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[13px] font-medium',
            status === 'complete'
              ? 'text-emerald-700'
              : status === 'active'
                ? 'text-zinc-900'
                : 'text-zinc-400',
          )}
        >
          {stage.label}
        </p>
        <p className="text-[11px] text-zinc-500">{stage.description}</p>
      </div>
      {status === 'complete' && (
        <span className="shrink-0 text-[10px] font-medium text-emerald-600">
          Done
        </span>
      )}
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

export function WorkspaceAnalysisPanel({
  onComplete,
}: {
  onComplete?: () => void
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(-1)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Auto-advance through stages (demo simulation)
  useEffect(() => {
    if (!hasStarted || analysisComplete) return
    if (currentStageIndex >= ANALYSIS_STAGES.length - 1) {
      setAnalysisComplete(true)
      onComplete?.()
      return
    }

    const nextStage = ANALYSIS_STAGES[currentStageIndex + 1]
    const timer = setTimeout(() => {
      setCurrentStageIndex((prev) => prev + 1)
    }, nextStage.durationMs)

    return () => clearTimeout(timer)
  }, [currentStageIndex, hasStarted, analysisComplete, onComplete])

  const handleStartAnalysis = useCallback(() => {
    setHasStarted(true)
    setCurrentStageIndex(0)
    setAnalysisComplete(false)
  }, [])

  const overallProgress = analysisComplete
    ? 100
    : currentStageIndex < 0
      ? 0
      : Math.round(((currentStageIndex + 1) / ANALYSIS_STAGES.length) * 100)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-zinc-900">AI Analysis</h4>
          </div>
          {!hasStarted && (
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Run Analysis
            </button>
          )}
          {analysisComplete && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle className="h-3 w-3" />
              Complete
            </span>
          )}
        </div>

        {hasStarted && (
          <>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Progress</span>
                <span className="font-semibold tabular-nums">{overallProgress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Stage list */}
            <div className="mt-4 divide-y divide-zinc-100">
              {ANALYSIS_STAGES.map((stage, i) => (
                <AnalysisStageItem
                  key={stage.key}
                  stage={stage}
                  status={
                    i < currentStageIndex
                      ? 'complete'
                      : i === currentStageIndex
                        ? analysisComplete
                          ? 'complete'
                          : 'active'
                        : 'pending'
                  }
                />
              ))}
            </div>
          </>
        )}

        {!hasStarted && (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <p className="text-sm text-emerald-800">
              AI analysis will scan all uploaded evidence, compare check-in and check-out conditions,
              identify defects, assess liability, and generate cost recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Results summary (shown after completion) */}
      {analysisComplete && (
        <div className="animate-fade-in-up space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-zinc-900">7</p>
              <p className="text-xs text-zinc-500">Defects Found</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-emerald-600">87%</p>
              <p className="text-xs text-zinc-500">Avg Confidence</p>
            </div>
            <div className="stat-card text-center">
              <p className="text-2xl font-bold text-zinc-900">£1,105</p>
              <p className="text-xs text-zinc-500">Total Estimated</p>
            </div>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-[13px] font-medium text-sky-900">
              Analysis complete — proceed to the Review step to evaluate each defect.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
