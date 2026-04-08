'use client'

import type {
  CreateStreetConnectionInput,
  StreetConnection,
  StreetConnectionTestResult,
  StreetSyncLog,
  StreetSyncStatus,
  TriggerStreetSyncInput,
  UpdateStreetConnectionInput,
} from '@/lib/street-types'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

class StreetApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'StreetApiError'
    this.status = status
  }
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
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
    throw new StreetApiError(detail, response.status)
  }

  return payload as T
}

// -- Connection management -------------------------------------------------

export function getStreetStatus() {
  return requestJson<StreetSyncStatus>('/api/street/connection')
}

export function createStreetConnection(input: CreateStreetConnectionInput) {
  return requestJson<StreetConnection>('/api/street/connection', {
    method: 'POST',
    body: input,
  })
}

export function updateStreetConnection(input: UpdateStreetConnectionInput) {
  return requestJson<StreetConnection>('/api/street/connection', {
    method: 'PATCH',
    body: input,
  })
}

export async function deleteStreetConnection() {
  await fetch('/api/street/connection', { method: 'DELETE' })
}

export function testStreetConnection() {
  return requestJson<StreetConnectionTestResult>('/api/street/connection/test', {
    method: 'POST',
  })
}

// -- Sync ------------------------------------------------------------------

export function triggerStreetSync(input: TriggerStreetSyncInput = {}) {
  return requestJson<StreetSyncLog[]>('/api/street/sync', {
    method: 'POST',
    body: input,
  })
}

export function getStreetSyncLogs() {
  return requestJson<StreetSyncLog[]>('/api/street/sync/logs')
}
