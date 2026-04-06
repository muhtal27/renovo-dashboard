/**
 * Performance stress test: checkout page load under concurrent operator load.
 *
 * Scenarios covered:
 *   1. Single operator cold load of /checkouts (list page)
 *   2. Single operator cold load of /operator/cases/[caseId] (workspace)
 *   3. Navigation cycle: list → workspace → list → workspace
 *   4. Concurrent operators loading workspaces simultaneously
 *   5. Mixed: some operators on list, some on workspace, with refreshes
 *
 * Metrics captured per navigation:
 *   - TTFB (responseEnd - requestStart from Performance API)
 *   - DOMContentLoaded
 *   - Full load (load event)
 *   - First Contentful Paint (FCP)
 *   - Largest Contentful Paint (LCP)
 *   - Server timing from [perf] console logs
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=https://preview.renovoai.co.uk npx playwright test tests/perf/ --project=chromium
 *   Or locally:
 *   npx playwright test tests/perf/ --project=chromium
 */

import { expect, test, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PerfTimings = {
  url: string
  ttfb: number
  domContentLoaded: number
  fullLoad: number
  fcp: number | null
  lcp: number | null
  serverLogs: string[]
}

async function captureTimings(page: Page, url: string): Promise<PerfTimings> {
  const consoleLines: string[] = []
  const handler = (msg: import('@playwright/test').ConsoleMessage) => {
    const text = msg.text()
    if (text.includes('[perf]')) consoleLines.push(text)
  }
  page.on('console', handler)

  await page.goto(url, { waitUntil: 'load' })

  const timings = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] as PerformancePaintTiming | undefined
    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : -1,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : -1,
      fullLoad: nav ? Math.round(nav.loadEventEnd - nav.startTime) : -1,
      fcp: fcp ? Math.round(fcp.startTime) : null,
    }
  })

  // LCP requires a PerformanceObserver; wrap in try/catch because the
  // execution context can be destroyed if the page navigates (e.g. redirect).
  let lcp: number | null = null
  try {
    lcp = await page.evaluate(() =>
      new Promise<number | null>((resolve) => {
        let lastLcp: number | null = null
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              lastLcp = Math.round(entry.startTime)
            }
          })
          observer.observe({ type: 'largest-contentful-paint', buffered: true })
          setTimeout(() => {
            observer.disconnect()
            resolve(lastLcp)
          }, 500)
        } catch {
          resolve(null)
        }
      })
    )
  } catch {
    // Context destroyed by navigation — LCP unavailable for this load
  }

  page.off('console', handler)

  return {
    url,
    ...timings,
    lcp,
    serverLogs: consoleLines,
  }
}

function logTimings(label: string, t: PerfTimings) {
  console.log(
    `[perf-test] ${label} | ttfb=${t.ttfb}ms dom=${t.domContentLoaded}ms load=${t.fullLoad}ms fcp=${t.fcp ?? '?'}ms lcp=${t.lcp ?? '?'}ms`
  )
  for (const line of t.serverLogs) {
    console.log(`  server: ${line}`)
  }
}

/**
 * Resolve a case ID for workspace tests.
 *
 * Priority:
 *   1. PERF_CASE_ID env var (always works, even when the API is unavailable)
 *   2. Fetch from /api/eot/cases using the browser session cookies
 *   3. Scrape a link from the rendered /checkouts page
 *
 * Returns null only if all three fail.
 */
async function findFirstCaseId(page: Page): Promise<string | null> {
  // 1. Explicit env var — fastest, works in any environment
  const envCaseId = process.env.PERF_CASE_ID
  if (envCaseId) return envCaseId

  // 2. Fetch the cases API directly (avoids depending on client-side rendering)
  try {
    const res = await page.goto('/api/eot/cases', { waitUntil: 'domcontentloaded' })
    if (res && res.status() === 200) {
      const body = await page.locator('body').textContent()
      const cases = JSON.parse(body ?? '[]') as Array<{ id?: string }>
      if (cases[0]?.id) {
        // Navigate away so the next test starts clean
        await page.goto('about:blank')
        return cases[0].id
      }
    }
  } catch {
    // API not available — fall through
  }

  // 3. Scrape the list page DOM for a case link
  await page.goto('/checkouts', { waitUntil: 'domcontentloaded' })
  const caseLink = page.locator('a[href*="/operator/cases/"]').first()
  try {
    await caseLink.waitFor({ timeout: 10_000 })
  } catch {
    return null
  }
  const href = await caseLink.getAttribute('href')
  if (!href) return null
  const match = href.match(/\/checkouts\/([a-f0-9-]+)/)
  return match?.[1] ?? null
}

// ---------------------------------------------------------------------------
// Scenario 1: Single operator cold-loads /checkouts
// ---------------------------------------------------------------------------

test.describe('perf: checkout list', () => {
  test('cold load /checkouts', async ({ page }) => {
    const t = await captureTimings(page, '/checkouts')
    logTimings('/checkouts cold', t)
    expect(t.ttfb).toBeLessThan(3000)
    expect(t.fullLoad).toBeLessThan(8000)
  })

  test('warm load /checkouts (second visit)', async ({ page }) => {
    // First load warms caches
    await page.goto('/checkouts', { waitUntil: 'load' })
    // Navigate away
    await page.goto('/settings', { waitUntil: 'load' })
    // Second load
    const t = await captureTimings(page, '/checkouts')
    logTimings('/checkouts warm', t)
    expect(t.ttfb).toBeLessThan(2000)
  })
})

// ---------------------------------------------------------------------------
// Scenario 2: Single operator cold-loads /operator/cases/[caseId]
// ---------------------------------------------------------------------------

test.describe('perf: checkout workspace', () => {
  test('cold load workspace page', async ({ page }) => {
    const caseId = await findFirstCaseId(page)
    test.skip(!caseId, 'No cases found for tenant')

    const t = await captureTimings(page, `/operator/cases/${caseId}`)
    logTimings(`/operator/cases/${caseId} cold`, t)
    expect(t.ttfb).toBeLessThan(3000)
    expect(t.fullLoad).toBeLessThan(8000)
  })
})

// ---------------------------------------------------------------------------
// Scenario 3: List → Workspace → List → Workspace navigation cycle
// ---------------------------------------------------------------------------

test.describe('perf: navigation cycle', () => {
  test('list → workspace → list → workspace', async ({ page }) => {
    const results: PerfTimings[] = []

    // Load list
    results.push(await captureTimings(page, '/checkouts'))

    // Find a case
    const caseId = await findFirstCaseId(page)
    test.skip(!caseId, 'No cases found for tenant')

    // Navigate to workspace
    results.push(await captureTimings(page, `/operator/cases/${caseId}`))

    // Back to list
    results.push(await captureTimings(page, '/checkouts'))

    // Back to workspace
    results.push(await captureTimings(page, `/operator/cases/${caseId}`))

    for (const [i, t] of results.entries()) {
      logTimings(`nav-cycle step ${i + 1}`, t)
    }

    // Second visit should be faster than first
    expect(results[3].ttfb).toBeLessThanOrEqual(results[1].ttfb * 1.5 + 100)
  })
})

// ---------------------------------------------------------------------------
// Scenario 4: Concurrent operators loading workspaces
//
// Playwright runs each test in its own browser context (isolated cookies,
// cache, etc.), simulating separate operators. We use test.describe.parallel
// so they run at the same time.
// ---------------------------------------------------------------------------

test.describe('perf: concurrent workspace loads', () => {
  // Playwright's parallel mode runs tests in this block concurrently
  test.describe.configure({ mode: 'parallel' })

  for (let i = 0; i < 5; i++) {
    test(`operator ${i + 1} loads workspace`, async ({ page }) => {
      const caseId = await findFirstCaseId(page)
      test.skip(!caseId, 'No cases found for tenant')

      const t = await captureTimings(page, `/operator/cases/${caseId}`)
      logTimings(`concurrent operator ${i + 1}`, t)
      expect(t.ttfb).toBeLessThan(5000)
    })
  }
})

// ---------------------------------------------------------------------------
// Scenario 5: Mixed load — some on list, some on workspace, with refreshes
// ---------------------------------------------------------------------------

test.describe('perf: mixed operator behavior', () => {
  test.describe.configure({ mode: 'parallel' })

  test('operator A: list page with refresh', async ({ page }) => {
    const t1 = await captureTimings(page, '/checkouts')
    logTimings('mixed-A load', t1)
    // Simulate a manual refresh after 2s
    await page.waitForTimeout(2000)
    const t2 = await captureTimings(page, '/checkouts')
    logTimings('mixed-A refresh', t2)
  })

  test('operator B: workspace deep session', async ({ page }) => {
    const caseId = await findFirstCaseId(page)
    test.skip(!caseId, 'No cases found for tenant')

    const t = await captureTimings(page, `/operator/cases/${caseId}`)
    logTimings('mixed-B workspace', t)
    // Stay on page for 5s (simulates reading)
    await page.waitForTimeout(5000)
    // Soft reload (React Query background refetch would fire at 60s, but
    // we test a manual reload)
    const t2 = await captureTimings(page, `/operator/cases/${caseId}`)
    logTimings('mixed-B workspace reload', t2)
  })

  test('operator C: rapid list-workspace toggle', async ({ page }) => {
    for (let cycle = 0; cycle < 3; cycle++) {
      const t1 = await captureTimings(page, '/checkouts')
      logTimings(`mixed-C cycle ${cycle + 1} list`, t1)

      const caseId = await findFirstCaseId(page)
      test.skip(!caseId, 'No cases found for tenant')

      const t2 = await captureTimings(page, `/operator/cases/${caseId}`)
      logTimings(`mixed-C cycle ${cycle + 1} workspace`, t2)
    }
  })
})
