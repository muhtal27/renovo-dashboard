import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()

const allowedRootDirectories = new Set([
  '.git',
  '.next',
  '.vercel',
  '00-inbox',
  '01-product',
  '02-design',
  '03-engineering',
  '04-data',
  '05-ai',
  '06-operations',
  '07-admin',
  '08-archive',
  'app',
  'backend',
  'lib',
  'node_modules',
  'public',
  'scripts',
  'supabase',
  'tests',
  'types',
])

const allowedRootFiles = new Set([
  '.env',
  '.env.example',
  '.env.local',
  '.env.local.save',
  '.gitignore',
  'AGENTS.md',
  'README.md',
  'README-source-of-truth.md',
  'eslint.config.mjs',
  'next-env.d.ts',
  'next.config.ts',
  'package-lock.json',
  'package.json',
  'postcss.config.mjs',
  'proxy.ts',
  'tsconfig.json',
  'vercel.json',
])

const informationalLocalFiles = new Set([
  '.env',
  '.env.example',
  '.env.local',
  '.env.local.save',
])

function classifyName(name) {
  const lower = name.toLowerCase()
  const ext = path.extname(lower)

  if (lower.includes('prompt') || lower.includes('schema') || lower.includes('eval')) {
    return '05-ai/'
  }

  if (
    lower.includes('spec') ||
    lower.includes('requirement') ||
    lower.includes('workflow') ||
    lower.includes('decision') ||
    lower.includes('roadmap')
  ) {
    return '01-product/'
  }

  if (
    lower.includes('wireframe') ||
    lower.includes('brand') ||
    lower.includes('design') ||
    ['.png', '.jpg', '.jpeg', '.webp', '.fig', '.sketch'].includes(ext)
  ) {
    return '02-design/'
  }

  if (
    ['.csv'].includes(ext) ||
    lower.includes('fixture') ||
    lower.includes('import') ||
    lower.includes('export') ||
    lower.includes('sample')
  ) {
    return '04-data/'
  }

  if (ext === '.sql' || lower.includes('contract') || lower.includes('architecture')) {
    return '03-engineering/'
  }

  if (
    lower.includes('sop') ||
    lower.includes('checklist') ||
    lower.includes('claim') ||
    lower.includes('tenancy')
  ) {
    return '06-operations/'
  }

  if (
    lower.includes('finance') ||
    lower.includes('contract') ||
    lower.includes('invoice') ||
    lower.includes('budget') ||
    lower.includes('planning')
  ) {
    return '07-admin/'
  }

  if (
    lower.includes('backup') ||
    lower.includes('archive') ||
    lower.includes('deprecated') ||
    lower.includes('old') ||
    ['.zip'].includes(ext)
  ) {
    return '08-archive/'
  }

  return '00-inbox/'
}

const entries = fs
  .readdirSync(rootDir, { withFileTypes: true })
  .filter((entry) => entry.name !== '.' && entry.name !== '..')
  .sort((a, b) => a.name.localeCompare(b.name))

const unexpected = []

for (const entry of entries) {
  const { name } = entry

  if (entry.isDirectory()) {
    if (!allowedRootDirectories.has(name)) {
      unexpected.push({
        name,
        type: 'directory',
        suggestion: classifyName(name),
      })
    }
    continue
  }

  if (!allowedRootFiles.has(name)) {
    unexpected.push({
      name,
      type: 'file',
      suggestion: classifyName(name),
    })
  }
}

if (unexpected.length === 0) {
  console.log('Root governance check: OK')
  console.log('No unexpected loose files or directories were found at the repo root.')
  console.log('If you are adding non-runtime material, place it in 00-inbox/ or the matching canonical folder.')
  process.exit(0)
}

console.log('Root governance check: WARN')
console.log('Unexpected loose items were found at the repo root.\n')

for (const item of unexpected) {
  console.log(`- ${item.type}: ${item.name}`)
  console.log(`  Suggested destination: ${item.suggestion}`)
}

const localOnly = Array.from(informationalLocalFiles).filter((name) => fs.existsSync(path.join(rootDir, name)))

if (localOnly.length > 0) {
  console.log('\nAllowed local-only env files present:')
  for (const name of localOnly) {
    console.log(`- ${name}`)
  }
  console.log('These are allowed to remain at the root. Do not inspect or rewrite their secret values in governance work.')
}

process.exitCode = 1
