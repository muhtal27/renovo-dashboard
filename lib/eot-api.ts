'use client'

import type {
  CreateEotCaseInput,
  CreateEotEvidenceInput,
  CreateEotMessageInput,
  EotCaseListItem,
  EotCaseWorkspace,
  EotEvidence,
  EotIssue,
  UpsertEotIssueInput,
} from '@/lib/eot-types'

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  searchParams?: URLSearchParams
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
  const url = options.searchParams?.toString() ? `${path}?${options.searchParams}` : path
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
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

export function listEotCases(tenantId: string) {
  const searchParams = new URLSearchParams({ tenant_id: tenantId })
  return requestJson<EotCaseListItem[]>('/api/eot/cases', { searchParams })
}

export function getEotCaseWorkspace(tenantId: string, caseId: string) {
  const searchParams = new URLSearchParams({ tenant_id: tenantId })
  return requestJson<EotCaseWorkspace>(`/api/eot/cases/${caseId}`, { searchParams })
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
