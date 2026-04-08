// Types for the Street.co.uk integration API

export type StreetConnection = {
  id: string
  tenant_id: string
  base_url: string
  label: string | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export type StreetSyncLog = {
  id: string
  connection_id: string
  status: 'running' | 'completed' | 'failed'
  resource: string
  records_created: number
  records_updated: number
  records_skipped: number
  error_message: string | null
  started_at: string
  finished_at: string | null
  created_at: string
}

export type StreetSyncStatus = {
  connected: boolean
  connection: StreetConnection | null
  last_sync_logs: StreetSyncLog[]
}

export type StreetConnectionTestResult = {
  ok: boolean
  detail: string
  branch_count: number | null
}

export type CreateStreetConnectionInput = {
  api_token: string
  base_url?: string
  label?: string
}

export type UpdateStreetConnectionInput = {
  api_token?: string
  base_url?: string
  label?: string
}

export type TriggerStreetSyncInput = {
  resources?: string[] | null
}
