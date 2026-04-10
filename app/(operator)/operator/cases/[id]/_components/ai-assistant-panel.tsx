'use client'

import { FileText, Loader2, Scale, Send, BookOpen, RefreshCw, Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceNotice,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDateTime } from '@/app/eot/_components/eot-ui'
import type { AIDraftType, OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

const DRAFT_TYPES: {
  type: AIDraftType
  label: string
  description: string
  icon: typeof Scale
}[] = [
  {
    type: 'liability_assessment',
    label: 'Liability Assessment',
    description: 'Formal assessment of tenant vs landlord liability for each defect, with legal reasoning.',
    icon: Scale,
  },
  {
    type: 'proposed_charges',
    label: 'Proposed Charges',
    description: 'Structured charges schedule with line items, amounts, and justifications.',
    icon: FileText,
  },
  {
    type: 'tenant_negotiation',
    label: 'Tenant Negotiation Letter',
    description: 'Professional email to the tenant explaining charges and their right to dispute.',
    icon: Send,
  },
  {
    type: 'combined_report',
    label: 'Combined EOT Report',
    description: 'Comprehensive report combining all issues for landlord review or adjudication.',
    icon: BookOpen,
  },
]

function getDraftTypeTone(type: AIDraftType) {
  switch (type) {
    case 'liability_assessment': return 'info' as const
    case 'proposed_charges': return 'warning' as const
    case 'tenant_negotiation': return 'active' as const
    case 'combined_report': return 'processed' as const
  }
}

export function AIAssistantPanel({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [generating, setGenerating] = useState<AIDraftType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDraftType, setSelectedDraftType] = useState<AIDraftType | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const hasAnalysis = ['review', 'draft_sent', 'ready_for_claim', 'submitted', 'resolved', 'disputed'].includes(
    data.workspace.case.status
  )
  const hasDefects = data.defects.length > 0
  const hasIssues = data.workspace.issues.length > 0
  const canGenerate = hasAnalysis || hasDefects || hasIssues

  const existingDrafts = data.aiDrafts ?? []
  const selectedDraft = selectedDraftType
    ? existingDrafts.find((d) => d.draftType === selectedDraftType)
    : null

  async function handleGenerate(draftType: AIDraftType) {
    setGenerating(draftType)
    setError(null)
    setSelectedDraftType(draftType)
    try {
      const response = await fetch(`/api/operator/cases/${caseId}/ai-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_type: draftType }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || err?.error || 'Failed to generate draft.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate draft.')
    } finally {
      setGenerating(null)
    }
  }

  async function handleCopy(draftId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(draftId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">AI Assistant</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Generate professional documents powered by AI. Each draft uses the full case data
          including defects, issues, recommendations, and financial position.
        </p>
      </section>

      {!canGenerate ? (
        <WorkspaceNotice
          body="Run the AI analysis first to identify defects and generate recommendations. The assistant needs analysis data to produce accurate drafts."
          title="Analysis required"
          tone="warning"
        />
      ) : null}

      {/* Draft type cards */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Generate documents</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DRAFT_TYPES.map((item) => {
            const existing = existingDrafts.find((d) => d.draftType === item.type)
            const isGenerating = generating === item.type
            const Icon = item.icon
            return (
              <div
                key={item.type}
                className={
                  'border px-4 py-4 transition-colors ' +
                  (selectedDraftType === item.type
                    ? 'border-zinc-950 bg-zinc-50/60'
                    : 'border-zinc-200 hover:border-zinc-300')
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100">
                    <Icon className="h-4 w-4 text-zinc-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-950">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{item.description}</p>
                    {existing ? (
                      <div className="mt-2 flex items-center gap-2">
                        <WorkspaceBadge label="Generated" tone={getDraftTypeTone(item.type)} />
                        <span className="text-[11px] text-zinc-400">
                          {formatDateTime(existing.generatedAt)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <WorkspaceActionButton
                    disabled={!canGenerate || isGenerating || generating !== null}
                    tone="primary"
                    onClick={() => handleGenerate(item.type)}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : existing ? (
                      <RefreshCw className="h-3.5 w-3.5" />
                    ) : null}
                    {existing ? 'Regenerate' : 'Generate'}
                  </WorkspaceActionButton>
                  {existing ? (
                    <WorkspaceActionButton
                      tone="secondary"
                      onClick={() => setSelectedDraftType(item.type)}
                    >
                      View
                    </WorkspaceActionButton>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {/* Draft preview */}
      {selectedDraft ? (
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-950">
              {selectedDraft.title || DRAFT_TYPES.find((d) => d.type === selectedDraftType)?.label}
            </h3>
            <div className="flex items-center gap-2">
              <WorkspaceBadge
                label={DRAFT_TYPES.find((d) => d.type === selectedDraftType)?.label ?? ''}
                tone={getDraftTypeTone(selectedDraft.draftType)}
              />
              <button
                className="flex items-center gap-1.5 rounded border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                onClick={() => handleCopy(selectedDraft.id, selectedDraft.content)}
                type="button"
              >
                {copiedId === selectedDraft.id ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 max-h-[600px] overflow-y-auto border border-zinc-200 bg-white px-6 py-5">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-700 [overflow-wrap:anywhere]">
              {selectedDraft.content}
            </pre>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Generated {formatDateTime(selectedDraft.generatedAt)} — AI-generated content should be reviewed before sharing.
          </p>
        </section>
      ) : existingDrafts.length > 0 ? (
        <WorkspaceNotice
          body="Select a document type above and click View to preview the generated content."
          title="Drafts available"
          tone="info"
        />
      ) : null}

      {/* Summary of all generated drafts */}
      {existingDrafts.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Generated documents</h3>
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Document</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Generated</th>
                </tr>
              </thead>
              <tbody>
                {existingDrafts.map((draft) => {
                  const config = DRAFT_TYPES.find((d) => d.type === draft.draftType)
                  return (
                    <tr
                      key={draft.id}
                      className="cursor-pointer border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/50"
                      onClick={() => setSelectedDraftType(draft.draftType)}
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-950">
                        {draft.title || config?.label}
                      </td>
                      <td className="px-4 py-2.5">
                        <WorkspaceBadge
                          label={config?.label ?? draft.draftType}
                          tone={getDraftTypeTone(draft.draftType)}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-500">
                        {formatDateTime(draft.generatedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
