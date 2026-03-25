import type { EotCaseListItem, EotCaseWorkspace, EotIssue, EotRecommendation } from '@/lib/eot-types'

export type EotPortfolio = {
  cases: EotCaseListItem[]
  workspaces: EotCaseWorkspace[]
}

export function byLastActivityDesc<T extends { last_activity_at: string }>(left: T, right: T) {
  return new Date(right.last_activity_at).getTime() - new Date(left.last_activity_at).getTime()
}

export function sortWorkspacesByLastActivity(workspaces: EotCaseWorkspace[]) {
  return [...workspaces].sort((left, right) => byLastActivityDesc(left.case, right.case))
}

export function getAttentionScore(workspace: EotCaseWorkspace) {
  let score = 0
  const staleDays = getDaysSince(workspace.case.last_activity_at)

  if (workspace.case.priority === 'high') score += 4
  if (workspace.case.status === 'disputed') score += 4
  if (workspace.case.status === 'review') score += 3
  if (workspace.case.status === 'ready_for_claim' && !workspace.claim) score += 3
  if (workspace.case.status === 'collecting_evidence' && workspace.evidence.length < 2) score += 2
  if (workspace.issues.some((issue) => issue.severity === 'high' && issue.status !== 'resolved')) score += 2
  if (staleDays >= 10) score += 3
  if (staleDays >= 5) score += 2

  return score
}

export function getDaysSince(value: string | null | undefined) {
  if (!value) return 0
  const diff = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function buildStatusBreakdown(cases: EotCaseListItem[]) {
  return cases.reduce<Record<string, number>>((accumulator, caseItem) => {
    accumulator[caseItem.status] = (accumulator[caseItem.status] ?? 0) + 1
    return accumulator
  }, {})
}

export function buildIssueSeverityBreakdown(workspaces: EotCaseWorkspace[]) {
  return workspaces.flatMap((workspace) => workspace.issues).reduce<Record<string, number>>((accumulator, issue) => {
    accumulator[issue.severity] = (accumulator[issue.severity] ?? 0) + 1
    return accumulator
  }, {})
}

export function buildEvidenceTypeBreakdown(workspaces: EotCaseWorkspace[]) {
  return workspaces.flatMap((workspace) => workspace.evidence).reduce<Record<string, number>>((accumulator, evidence) => {
    accumulator[evidence.type] = (accumulator[evidence.type] ?? 0) + 1
    return accumulator
  }, {})
}

export function getPortfolioStats(cases: EotCaseListItem[], workspaces: EotCaseWorkspace[]) {
  const activeCases = cases.filter((caseItem) => caseItem.status !== 'resolved')
  const readyForClaim = cases.filter((caseItem) => caseItem.status === 'ready_for_claim')
  const disputed = cases.filter((caseItem) => caseItem.status === 'disputed')
  const totalEvidence = workspaces.reduce((total, workspace) => total + workspace.evidence.length, 0)
  const totalIssues = workspaces.reduce((total, workspace) => total + workspace.issues.length, 0)
  const resolvedIssues = workspaces.reduce(
    (total, workspace) => total + workspace.issues.filter((issue) => issue.status === 'resolved').length,
    0
  )
  const claimAmount = workspaces.reduce((total, workspace) => total + Number(workspace.claim?.total_amount ?? 0), 0)

  return {
    activeCases: activeCases.length,
    totalCases: cases.length,
    readyForClaim: readyForClaim.length,
    disputed: disputed.length,
    totalEvidence,
    totalIssues,
    resolvedIssues,
    claimAmount,
    averageEvidencePerCase: cases.length ? totalEvidence / cases.length : 0,
  }
}

export function getCasesRequiringAttention(workspaces: EotCaseWorkspace[], limit = 5) {
  return [...workspaces]
    .sort((left, right) => getAttentionScore(right) - getAttentionScore(left))
    .slice(0, limit)
}

export function buildRecentActivity(workspaces: EotCaseWorkspace[], limit = 8) {
  return sortWorkspacesByLastActivity(workspaces).slice(0, limit).map((workspace) => {
    const latestEvidence = workspace.evidence.at(-1)
    const latestIssue = [...workspace.issues].sort(
      (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    )[0]
    const latestMessage = workspace.messages.at(-1)

    const candidates = [
      latestEvidence
        ? {
            timestamp: latestEvidence.created_at,
            title: 'Evidence added',
            detail: `${workspace.property.name} · ${latestEvidence.area || latestEvidence.type}`,
          }
        : null,
      latestIssue
        ? {
            timestamp: latestIssue.updated_at,
            title: `Issue ${latestIssue.status === 'resolved' ? 'resolved' : 'updated'}`,
            detail: `${workspace.property.name} · ${latestIssue.title}`,
          }
        : null,
      latestMessage
        ? {
            timestamp: latestMessage.created_at,
            title: 'Case note added',
            detail: `${workspace.property.name} · ${latestMessage.sender_type}`,
          }
        : null,
    ].filter(Boolean) as Array<{ timestamp: string; title: string; detail: string }>

    const latest = candidates.sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )[0]

    return {
      id: workspace.case.id,
      timestamp: latest?.timestamp ?? workspace.case.last_activity_at,
      title: latest?.title ?? 'Case updated',
      detail: latest?.detail ?? `${workspace.property.name} · ${workspace.tenancy.tenant_name}`,
    }
  })
}

export function flattenEvidence(workspaces: EotCaseWorkspace[]) {
  return workspaces.flatMap((workspace) =>
    workspace.evidence.map((evidence) => ({
      ...evidence,
      caseId: workspace.case.id,
      caseStatus: workspace.case.status,
      casePriority: workspace.case.priority,
      propertyName: workspace.property.name,
      propertyReference: workspace.property.reference,
      tenantName: workspace.tenancy.tenant_name,
    }))
  )
}

export function flattenIssues(workspaces: EotCaseWorkspace[]) {
  return workspaces.flatMap((workspace) =>
    workspace.issues.map((issue) => ({
      ...issue,
      caseId: workspace.case.id,
      caseStatus: workspace.case.status,
      casePriority: workspace.case.priority,
      propertyName: workspace.property.name,
      tenantName: workspace.tenancy.tenant_name,
    }))
  )
}

export function flattenRecommendations(workspaces: EotCaseWorkspace[]) {
  return workspaces.flatMap((workspace) =>
    workspace.issues
      .filter((issue) => issue.recommendation)
      .map((issue) => ({
        issue,
        recommendation: issue.recommendation as EotRecommendation,
        caseId: workspace.case.id,
        caseStatus: workspace.case.status,
        propertyName: workspace.property.name,
        tenantName: workspace.tenancy.tenant_name,
      }))
  )
}

export function getClaimReadiness(workspace: EotCaseWorkspace) {
  if (workspace.claim) {
    return {
      label: 'Claim generated',
      description: 'Output pack is available for review and export.',
      tone: 'ready',
    } as const
  }

  if (workspace.case.status === 'ready_for_claim') {
    return {
      label: 'Awaiting output',
      description: 'Case is marked ready but a formal claim pack has not been generated.',
      tone: 'attention',
    } as const
  }

  return {
    label: 'In preparation',
    description: 'Evidence and issue review are still in progress.',
    tone: 'default',
  } as const
}

export function buildWorkspaceTimeline(workspace: EotCaseWorkspace) {
  const events = [
    {
      id: `${workspace.case.id}-case`,
      timestamp: workspace.case.created_at,
      title: 'Case created',
      detail: workspace.case.summary?.trim() || 'Initial case intake logged.',
      meta: workspace.property.name,
      tone: 'accent' as const,
    },
    ...workspace.evidence.map((evidence) => ({
      id: evidence.id,
      timestamp: evidence.created_at,
      title: 'Evidence logged',
      detail: `${evidence.area || 'General'} · ${evidence.type}`,
      meta: evidence.uploaded_by,
      tone: 'default' as const,
    })),
    ...workspace.issues.map((issue) => ({
      id: issue.id,
      timestamp: issue.updated_at,
      title: issue.status === 'resolved' ? 'Issue resolved' : 'Issue assessed',
      detail: issue.title,
      meta: issue.severity,
      tone: issue.severity === 'high' ? ('danger' as const) : ('warning' as const),
    })),
    ...workspace.messages.map((message) => ({
      id: message.id,
      timestamp: message.created_at,
      title: 'Case note',
      detail: message.content,
      meta: message.sender_type,
      tone: 'default' as const,
    })),
  ]

  return events
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 10)
}

export function getOpenHighSeverityIssues(issues: EotIssue[]) {
  return issues.filter((issue) => issue.severity === 'high' && issue.status !== 'resolved')
}
