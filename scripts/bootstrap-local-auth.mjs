import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_TENANT_ID = '019d2215-620d-77c3-aa71-c0b5d517e9f8'
const DEFAULT_EMAIL = 'local-operator@renovo.dev'
const DEFAULT_PASSWORD = 'RenovoLocal123!'
const DEFAULT_FULL_NAME = 'Local Operator'

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName)

  if (!fs.existsSync(filePath)) {
    return
  }

  const contents = fs.readFileSync(filePath, 'utf8')

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    if (!key || process.env[key]) {
      continue
    }

    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')

    process.env[key] = value
  }
}

function readArg(name, fallbackValue) {
  const flag = `--${name}`
  const inlineArg = process.argv.find((value) => value.startsWith(`${flag}=`))

  if (inlineArg) {
    return inlineArg.slice(flag.length + 1)
  }

  const index = process.argv.indexOf(flag)

  if (index >= 0) {
    return process.argv[index + 1] ?? fallbackValue
  }

  return fallbackValue
}

function printUsage() {
  console.log(`Usage: node scripts/bootstrap-local-auth.mjs [options]

Options:
  --email       Dev user email (default: ${DEFAULT_EMAIL})
  --password    Dev user password (default: ${DEFAULT_PASSWORD})
  --full-name   Display name stored in user metadata (default: ${DEFAULT_FULL_NAME})
  --tenant-id   Tenant id stored in user metadata (default: ${DEFAULT_TENANT_ID})
`)
}

loadEnvFile('.env.local')
loadEnvFile('.env')

if (process.argv.includes('--help')) {
  printUsage()
  process.exit(0)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = readArg('email', DEFAULT_EMAIL)
const password = readArg('password', DEFAULT_PASSWORD)
const fullName = readArg('full-name', DEFAULT_FULL_NAME)
const tenantId = readArg(
  'tenant-id',
  process.env.EOT_TENANT_ID ?? process.env.NEXT_PUBLIC_EOT_TENANT_ID ?? DEFAULT_TENANT_ID
)

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.')
  process.exit(1)
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local before running this script.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw error
    }

    const matchedUser =
      data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase()) ?? null

    if (matchedUser) {
      return matchedUser
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function main() {
  const metadata = {
    full_name: fullName,
    role: 'operator',
    tenant_id: tenantId,
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        ...metadata,
      },
    })

    if (error) {
      throw error
    }

    console.log(
      JSON.stringify(
        {
          action: 'updated',
          user_id: data.user.id,
          email,
          password,
          tenant_id: tenantId,
        },
        null,
        2
      )
    )
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (error) {
    throw error
  }

  console.log(
    JSON.stringify(
      {
        action: 'created',
        user_id: data.user.id,
        email,
        password,
        tenant_id: tenantId,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Local auth bootstrap failed: ${message}`)
  process.exit(1)
})
