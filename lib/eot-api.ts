'use client'

import type {
  CreateEotCaseInput,
  CreateEotEvidenceInput,
  CreateEotMessageInput,
  EotCase,
  EotCaseSubmission,
  EotCaseListItem,
  EotCaseTimelineItem,
  EotCaseWorkspace,
  EotCaseWorkspaceSummary,
  EotDocument,
  EotEvidence,
  EotIssue,
  EotMessage,
  EotTenancyListItem,
  UpsertEotIssueInput,
  EotSectionPage,
} from '@/lib/eot-types'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  searchParams?: Record<string, string | number | null | undefined>
}

export class EotApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'EotApiError'
    this.status = status
  }
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestUrl = new URL(path, window.location.origin)

  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value == null) {
      continue
    }

    requestUrl.searchParams.set(key, String(value))
  }

  const response = await fetch(requestUrl.toString(), {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : `Request failed with status ${response.status}.`
    throw new EotApiError(detail, response.status)
  }

  return payload as T
}

export function listEotTenancies() {
  return requestJson<EotTenancyListItem[]>('/api/eot/tenancies')
}

export function getEotTenancy(tenancyId: string) {
  return requestJson<EotTenancyListItem>(`/api/eot/tenancies/${tenancyId}`)
}

export function listEotCases() {
  return requestJson<EotCaseListItem[]>('/api/eot/cases')
}

export function getEotCaseWorkspace(caseId: string) {
  return requestJson<EotCaseWorkspace>(`/api/eot/cases/${caseId}`)
}

export function getEotCaseWorkspaceSummary(caseId: string) {
  return requestJson<EotCaseWorkspaceSummary>(`/api/eot/cases/${caseId}/summary`)
}

type PageOptions = {
  offset?: number
  limit?: number
}

export function listEotCaseEvidence(caseId: string, options: PageOptions = {}) {
  return requestJson<EotSectionPage<EotEvidence>>(`/api/eot/cases/${caseId}/evidence`, {
    searchParams: options,
  })
}

export function listEotCaseIssues(caseId: string) {
  return requestJson<EotIssue[]>(`/api/eot/cases/${caseId}/issues`)
}

export function listEotCaseMessages(caseId: string, options: PageOptions = {}) {
  return requestJson<EotSectionPage<EotMessage>>(`/api/eot/cases/${caseId}/messages`, {
    searchParams: options,
  })
}

export function listEotCaseDocuments(caseId: string, options: PageOptions = {}) {
  return requestJson<EotSectionPage<EotDocument>>(`/api/eot/cases/${caseId}/documents`, {
    searchParams: options,
  })
}

export function getEotCaseTimeline(caseId: string) {
  return requestJson<EotCaseTimelineItem[]>(`/api/eot/cases/${caseId}/timeline`)
}

export function getEotCaseSubmission(caseId: string) {
  return requestJson<EotCaseSubmission>(`/api/eot/cases/${caseId}/submission`)
}

export function assignEotCase(caseId: string, assignedTo: string | null) {
  return requestJson<EotCase>(`/api/eot/cases/${caseId}/assign`, {
    method: 'PATCH',
    body: { assigned_to: assignedTo },
  })
}

export function createEotCase(input: CreateEotCaseInput) {
  return requestJson<EotCaseWorkspace>('/api/eot/cases', {
    method: 'POST',
    body: input,
  })
}

export function createEotEvidence(input: CreateEotEvidenceInput) {
  return requestJson<EotEvidence>('/api/eot/evidence', {
    method: 'POST',
    body: input,
  })
}

export function upsertEotIssue(input: UpsertEotIssueInput) {
  return requestJson<EotIssue>('/api/eot/issues', {
    method: 'POST',
    body: input,
  })
}

export function createEotMessage(input: CreateEotMessageInput) {
  return requestJson<unknown>('/api/eot/messages', {
    method: 'POST',
    body: input,
  })
}

export function getEotAnalyticsDashboard(days: number = 30) {
  return requestJson<import('@/lib/eot-types').EotAnalyticsDashboard>(
    '/api/eot/reports/analytics',
    { searchParams: { days } },
  )
}
