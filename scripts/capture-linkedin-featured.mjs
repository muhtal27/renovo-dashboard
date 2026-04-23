import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'linkedin-featured')
const DEMO = 'file://' + path.join(ROOT, 'private-content', 'demo.html')
const WEBSITE = 'file://' + path.join(ROOT, 'public', 'website-v2.html')

// LinkedIn Featured tiles display at ~1.91:1 (same as OG). Render at native
// 1200x628 / DPR 1 so LinkedIn doesn't resize before JPEG re-encode — same
// lesson as the banner (one lossy pass, not two).
const WIDTH = 1200
const HEIGHT = 628

const shots = [
  {
    name: '01-marketing-hero',
    url: WEBSITE,
    description: 'Marketing homepage — brand positioning and hero',
  },
  {
    name: '02-portfolio-dashboard',
    url: DEMO + '#dashboard',
    description: 'Operator dashboard — portfolio-level stats and pipeline',
  },
  {
    name: '03-workspace-analysis',
    url: DEMO + '#workspace/CHK-2026-002/analysis',
    unlockAll: true,
    forceAnalysis: true,
    forceStep: 'analysis',
    description: 'AI defect analysis — manager-in-the-loop review',
  },
  {
    name: '04-claim-resolution',
    url: DEMO + '#workspace/CHK-2026-007/refund',
    unlockAll: true,
    forceResolved: true,
    forceStep: 'refund',
    description: 'Resolved claim — audit-ready final statement',
  },
  {
    name: '05-intelligence-layer',
    url: DEMO + '#dashboard',
    nav: 'intelligence',
    description: 'Intelligence layer — scheme outcomes and precedents',
  },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

// Expose internal state on the demo.html runtime so we can force specific views
await context.addInitScript(() => {
  const poll = setInterval(() => {
    try {
      if (typeof state !== 'undefined' && !window.__stateExposed) {
        window.state = state
        window.__stateExposed = true
        clearInterval(poll)
      }
    } catch {}
  }, 50)
})

for (const s of shots) {
  await page.goto(s.url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  if (s.unlockAll) {
    await page.evaluate((opts) => {
      const steps = ['inventory', 'checkout', 'readings', 'analysis', 'deductions', 'negotiation', 'refund']
      steps.forEach((st) => { window.state.wsStepVisited[st] = true })
      window.state.wsAnalysisDone = true
      if (opts.forceAnalysis) {
        // Let the analysis step render its default completed view with AI defects
        window.state.wsDefects = null
      }
      if (opts.forceResolved) {
        window.state.wsResolved = true
        window.state.wsSchemeSubmitted = true
        window.state.wsAdjOutcome = true
      }
      if (opts.forceStep) {
        window.state.wsStep = opts.forceStep
      }
      window.render()
    }, s)
    await page.waitForTimeout(600)
  }

  if (s.nav) {
    await page.evaluate((target) => { window.navigate(target) }, s.nav)
    await page.waitForTimeout(400)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)

  const png = path.join(OUT, s.name + '.png')
  const jpg = path.join(OUT, s.name + '.jpg')
  await page.screenshot({ path: png, type: 'png', fullPage: false })
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 98, fullPage: false })
  console.log(`${s.name}: ${png} + ${jpg}`)
}

await browser.close()
