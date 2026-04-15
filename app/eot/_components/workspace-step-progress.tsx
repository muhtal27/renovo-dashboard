'use client'

import { useCallback } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/ui'
import { WORKSPACE_STEPS, type WorkspaceStep } from '@/lib/mock/report-fixtures'

type StepProgressProps = {
  currentStep: WorkspaceStep
  completedSteps: Set<WorkspaceStep>
  onStepClick: (step: WorkspaceStep) => void
}

export function WorkspaceStepProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: StepProgressProps) {
  const currentIndex = WORKSPACE_STEPS.findIndex((s) => s.key === currentStep)

  return (
    <nav aria-label="Case workflow steps" className="step-progress">
      {WORKSPACE_STEPS.map((step, i) => {
        const isDone = completedSteps.has(step.key)
        const isCurrent = step.key === currentStep
        const isPending = !isDone && !isCurrent

        return (
          <div key={step.key} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div
                className={cn('step-line', isDone || i <= currentIndex ? 'done' : 'pending')}
              />
            )}

            {/* Step dot */}
            <button
              type="button"
              onClick={() => onStepClick(step.key)}
              className={cn(
                'step-dot',
                isDone && 'done',
                isCurrent && 'current',
                isPending && 'pending',
              )}
              aria-label={`${step.label}${isDone ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              title={step.label}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                i + 1
              )}
            </button>

            {/* Label (visible on wider screens) */}
            <span
              className={cn(
                'ml-1.5 hidden text-[11px] font-medium sm:inline',
                isCurrent ? 'text-emerald-700' : isDone ? 'text-zinc-600' : 'text-zinc-400',
              )}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}

/* ── Step content wrapper ────────────────────────────────────── */

export function WorkspaceStepPanel({
  step,
  children,
}: {
  step: WorkspaceStep
  children: React.ReactNode
}) {
  const stepConfig = WORKSPACE_STEPS.find((s) => s.key === step)

  return (
    <div className="animate-fade-in-up" role="tabpanel" aria-label={stepConfig?.label}>
      {children}
    </div>
  )
}
