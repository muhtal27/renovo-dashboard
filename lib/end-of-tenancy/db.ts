import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Client } from 'pg'

let envLoaded = false
const DB_CONNECTION_ENV_KEYS = ['SUPABASE_DB_URL', 'DATABASE_URL', 'POSTGRES_URL'] as const

type DbConnectionEnvKey = (typeof DB_CONNECTION_ENV_KEYS)[number]

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return

  const raw = fs.readFileSync(filePath, 'utf8')

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function ensureServerEnvLoaded() {
  if (envLoaded) return

  const cwd = process.cwd()
  loadEnvFile(path.join(cwd, '.env.local'))
  loadEnvFile(path.join(cwd, '.env.admin.local'))
  envLoaded = true
}

function getDbConnectionConfig() {
  ensureServerEnvLoaded()

  const availableKeys = DB_CONNECTION_ENV_KEYS.filter(
    (key) => typeof process.env[key] === 'string' && process.env[key]?.length
  )
  const selectedKey = availableKeys[0]

  if (!selectedKey) {
    throw new Error(
      'Missing SUPABASE_DB_URL (or DATABASE_URL / POSTGRES_URL). Multi-step end-of-tenancy workflows require direct database access for transactions.'
    )
  }

  return {
    selectedKey,
    availableKeys,
    connectionString: process.env[selectedKey] as string,
  }
}

export type EndOfTenancyDbClient = Client

export function getEndOfTenancyDbConnectionDebugInfo(): {
  selectedKey: DbConnectionEnvKey | null
  availableKeys: DbConnectionEnvKey[]
} {
  ensureServerEnvLoaded()

  const availableKeys = DB_CONNECTION_ENV_KEYS.filter(
    (key) => typeof process.env[key] === 'string' && process.env[key]?.length
  )

  return {
    selectedKey: availableKeys[0] ?? null,
    availableKeys,
  }
}

export async function withEndOfTenancyTransaction<T>(
  work: (client: EndOfTenancyDbClient) => Promise<T>
) {
  const connection = getDbConnectionConfig()
  const client = new Client({
    connectionString: connection.connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown database connection error.'
    throw new Error(
      `Unable to connect to the transaction database using ${connection.selectedKey}. Available DB env keys: ${connection.availableKeys.join(', ')}. ${reason}`
    )
  }

  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}
