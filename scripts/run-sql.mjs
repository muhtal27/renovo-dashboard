import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Client } from 'pg'

function loadEnvFile(filePath) {
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

const cwd = process.cwd()
loadEnvFile(path.join(cwd, '.env.local'))
loadEnvFile(path.join(cwd, '.env.admin.local'))

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  console.error(
    'Missing SUPABASE_DB_URL (or DATABASE_URL / POSTGRES_URL). Add it to .env.admin.local or .env.local.'
  )
  process.exit(1)
}

const args = process.argv.slice(2)
let sql = ''

const fileFlagIndex = args.findIndex((arg) => arg === '--file' || arg === '-f')
if (fileFlagIndex !== -1) {
  const fileArg = args[fileFlagIndex + 1]
  if (!fileArg) {
    console.error('Expected a file path after --file')
    process.exit(1)
  }
  const sqlPath = path.isAbsolute(fileArg) ? fileArg : path.join(cwd, fileArg)
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`)
    process.exit(1)
  }
  sql = fs.readFileSync(sqlPath, 'utf8')
} else if (args.length) {
  sql = args.join(' ')
} else if (!process.stdin.isTTY) {
  sql = fs.readFileSync(0, 'utf8')
}

if (!sql.trim()) {
  console.error('Provide SQL as an argument, via --file, or pipe it on stdin.')
  process.exit(1)
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  const result = await client.query(sql)

  if (result.rows?.length) {
    console.table(result.rows)
  } else {
    console.log(`Query OK. ${result.rowCount ?? 0} row(s) affected.`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  await client.end()
}
