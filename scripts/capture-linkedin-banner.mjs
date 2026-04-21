import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '..', 'public')

// Render at DPR 1 (native pixel size). LinkedIn displays banners at their
// canvas size on desktop, so a native-size upload avoids LinkedIn's internal
// resize step before JPEG re-encode — one lossy pass instead of two.
const targets = [
  {
    name: 'personal banner',
    src: path.resolve(__dirname, 'linkedin-banner.html'),
    png: path.join(OUT_DIR, 'linkedin-banner.png'),
    jpg: path.join(OUT_DIR, 'linkedin-banner.jpg'),
    width: 1584,
    height: 396,
  },
  {
    name: 'company banner',
    src: path.resolve(__dirname, 'linkedin-company-banner.html'),
    png: path.join(OUT_DIR, 'linkedin-company-banner.png'),
    jpg: path.join(OUT_DIR, 'linkedin-company-banner.jpg'),
    width: 1584,
    height: 396,
  },
  {
    name: 'company logo',
    src: path.resolve(__dirname, 'linkedin-company-logo.html'),
    png: path.join(OUT_DIR, 'linkedin-company-logo.png'),
    jpg: path.join(OUT_DIR, 'linkedin-company-logo.jpg'),
    width: 400,
    height: 400,
  },
  {
    name: 'signature logo',
    src: path.resolve(__dirname, 'signature-logo.html'),
    png: path.join(OUT_DIR, 'signature-logo.png'),
    jpg: path.join(OUT_DIR, 'signature-logo.jpg'),
    width: 144,
    height: 144,
  },
]

await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch()

for (const t of targets) {
  const context = await browser.newContext({
    viewport: { width: t.width, height: t.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto('file://' + t.src, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  await page.screenshot({ path: t.png, type: 'png', fullPage: false, omitBackground: false })
  await page.screenshot({ path: t.jpg, type: 'jpeg', quality: 98, fullPage: false })
  console.log(`${t.name}: wrote ${t.png} + ${t.jpg}`)
  await context.close()
}

await browser.close()
