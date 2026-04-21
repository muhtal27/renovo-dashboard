import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = path.resolve(__dirname, 'posts')
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'linkedin-posts')

// LinkedIn square feed post: 1200x1200, DPR 1 (native) — same sharpness
// lesson as the banner. No internal resize before JPEG re-encode.
const WIDTH = 1200
const HEIGHT = 1200

const posts = [
  '00-launch',
  '01-tagline',
  '02-value-prop',
  '03-days-metric',
  '04-award-metric',
  '05-scope',
]

await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

for (const slug of posts) {
  const src = 'file://' + path.join(POSTS_DIR, slug + '.html')
  await page.goto(src, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  const png = path.join(OUT_DIR, slug + '.png')
  const jpg = path.join(OUT_DIR, slug + '.jpg')
  await page.screenshot({ path: png, type: 'png', fullPage: false })
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 98, fullPage: false })
  console.log(`${slug}: ${png} + ${jpg}`)
}

await browser.close()
