import { chromium } from 'playwright'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons')
const FEATURED_DIR = path.join(PUBLIC_DIR, 'linkedin-featured')

const MARK_SVG = `
  <svg class="mark" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="em-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
    </defs>
    <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" />
    <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" />
    <rect x="34" y="86" width="80" height="18" rx="9" fill="url(#em-grad)" />
    <rect x="34.5" y="86.5" width="79" height="2" rx="1" fill="#ffffff" fill-opacity="0.35" />
  </svg>
`

const squareHtml = ({ size, markPercent }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${size}px;height:${size}px;overflow:hidden;background:#05070f}
  .tile{
    width:100%;height:100%;
    background:linear-gradient(180deg,#0a0e1a 0%,#05070f 100%);
    box-shadow:inset 0 0 0 1px rgba(16,185,129,0.18),inset 0 1px 0 rgba(255,255,255,0.04);
    display:flex;align-items:center;justify-content:center;
  }
  .mark{width:${markPercent}%;height:${markPercent}%;display:block}
</style></head><body><div class="tile">${MARK_SVG}</div></body></html>`

const bannerHtml = ({ width, height, tagline }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${width}px;height:${height}px;overflow:hidden;background:#05070f;color:#fff;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .tile{
    width:100%;height:100%;
    background:linear-gradient(180deg,#0a0e1a 0%,#05070f 100%);
    box-shadow:inset 0 0 0 1px rgba(16,185,129,0.18),inset 0 1px 0 rgba(255,255,255,0.04);
    display:flex;align-items:center;gap:64px;padding:96px 112px;
    position:relative;
  }
  .tile::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(60% 80% at 18% 50%,rgba(16,185,129,0.16),transparent 60%);
    pointer-events:none;
  }
  .mark{width:240px;height:240px;flex-shrink:0;display:block;position:relative;z-index:1}
  .copy{position:relative;z-index:1}
  .copy h1{font-size:96px;font-weight:700;letter-spacing:-2.5px;line-height:1;margin-bottom:24px}
  .copy h1 .ai{color:#34d399}
  .copy p{font-size:34px;font-weight:500;color:rgba(255,255,255,0.78);letter-spacing:-0.5px;line-height:1.25;max-width:640px}
</style></head><body><div class="tile">${MARK_SVG}<div class="copy"><h1>Renovo <span class="ai">AI</span></h1><p>${tagline}</p></div></div></body></html>`

const targets = [
  { name: 'icon-192', file: path.join(ICONS_DIR, 'icon-192.png'), w: 192, h: 192, type: 'png', html: squareHtml({ size: 192, markPercent: 62.5 }) },
  { name: 'icon-512', file: path.join(ICONS_DIR, 'icon-512.png'), w: 512, h: 512, type: 'png', html: squareHtml({ size: 512, markPercent: 62.5 }) },
  { name: 'icon-maskable-512', file: path.join(ICONS_DIR, 'icon-maskable-512.png'), w: 512, h: 512, type: 'png', html: squareHtml({ size: 512, markPercent: 50 }) },
  { name: 'apple-touch-icon', file: path.join(ICONS_DIR, 'apple-touch-icon.png'), w: 180, h: 180, type: 'png', html: squareHtml({ size: 180, markPercent: 62.5 }) },
  { name: 'og-image', file: path.join(PUBLIC_DIR, 'og-image.jpg'), w: 1200, h: 630, type: 'jpeg', quality: 96, html: bannerHtml({ width: 1200, height: 630, tagline: 'EOT automation for UK letting agencies' }) },
  { name: '01-marketing-hero', file: path.join(FEATURED_DIR, '01-marketing-hero.jpg'), w: 1200, h: 628, type: 'jpeg', quality: 96, html: bannerHtml({ width: 1200, height: 628, tagline: 'EOT automation for UK letting agencies' }) },
]

await mkdir(ICONS_DIR, { recursive: true })
await mkdir(FEATURED_DIR, { recursive: true })

const tmpDir = path.join(tmpdir(), `renovo-pwa-icons-${Date.now()}`)
await mkdir(tmpDir, { recursive: true })

const browser = await chromium.launch()

try {
  for (const t of targets) {
    const tmpHtml = path.join(tmpDir, `${t.name}.html`)
    await writeFile(tmpHtml, t.html, 'utf-8')

    const context = await browser.newContext({
      viewport: { width: t.w, height: t.h },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()

    await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(400)

    const screenshotOpts = { path: t.file, type: t.type, fullPage: false, omitBackground: false }
    if (t.type === 'jpeg') screenshotOpts.quality = t.quality
    await page.screenshot(screenshotOpts)
    console.log(`${t.name}: wrote ${t.file}`)

    await context.close()
  }
} finally {
  await browser.close()
  await rm(tmpDir, { recursive: true, force: true })
}
