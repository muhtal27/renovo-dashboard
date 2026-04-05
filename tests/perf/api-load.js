/**
 * k6 API load test for Renovo dashboard /api/eot/* endpoints.
 *
 * Traffic model mirrors real operator behaviour on the checkout flow:
 *
 *   Page load (/checkouts):
 *     GET /api/eot/cases           — case list (every operator, every list view)
 *     GET /api/eot/tenancies       — sidebar tenancy list
 *
 *   Page load (/checkouts/[caseId]):
 *     GET /api/eot/cases/{id}/summary   — workspace header + metrics
 *
 *   Section expand (user clicks into workspace tabs):
 *     GET /api/eot/cases/{id}/evidence  — evidence panel
 *     GET /api/eot/cases/{id}/issues    — issues panel
 *     GET /api/eot/cases/{id}/messages  — messages panel
 *     GET /api/eot/cases/{id}/timeline  — timeline panel
 *
 *   Background:
 *     Cases list refetch every 60s (refetchInterval)
 *     Tenancies list refetch every 60s
 *
 * ─────────────────────────────────────────────────────────────────────
 * Prerequisites:
 *   1. Install k6: brew install grafana/k6/k6
 *   2. Set env vars:
 *      BASE_URL        Target (default: http://localhost:3000)
 *      SESSION_COOKIE  URL-encoded renovo-operator-session cookie value
 *      TENANT_COOKIE   renovo-active-tenant-membership cookie value
 *      CASE_ID         A valid case ID for workspace calls
 *      SCENARIO        Run a single scenario: baseline | steady | ramp | spike
 *                      (default: runs all sequentially)
 *
 * Run examples:
 *   # Quick baseline (first pass, ~15s)
 *   k6 run -e SCENARIO=baseline tests/perf/api-load.js
 *
 *   # Full suite (~2 min)
 *   k6 run tests/perf/api-load.js
 *
 *   # Against preview
 *   k6 run -e BASE_URL=https://preview.renovoai.co.uk tests/perf/api-load.js
 *
 *   # Via npm (cookies auto-extracted from Playwright auth state)
 *   npm run perf:api
 * ─────────────────────────────────────────────────────────────────────
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Custom metrics ──────────────────────────────────────────────────

const casesLatency     = new Trend('api_cases_list_ms', true)
const summaryLatency   = new Trend('api_case_summary_ms', true)
const tenanciesLatency = new Trend('api_tenancies_ms', true)
const evidenceLatency  = new Trend('api_evidence_ms', true)
const issuesLatency    = new Trend('api_issues_ms', true)
const messagesLatency  = new Trend('api_messages_ms', true)
const timelineLatency  = new Trend('api_timeline_ms', true)
const errorRate        = new Rate('error_rate')

// ── Config ──────────────────────────────────────────────────────────

const BASE_URL       = __ENV.BASE_URL || 'http://localhost:3000'
const SESSION_COOKIE = __ENV.SESSION_COOKIE || ''
const TENANT_COOKIE  = __ENV.TENANT_COOKIE || ''
const CASE_ID        = __ENV.CASE_ID || ''
const SCENARIO       = __ENV.SCENARIO || 'all'

if (!SESSION_COOKIE) {
  console.warn(
    'SESSION_COOKIE not set — requests will get 401.\n' +
    'Set it via: k6 run -e SESSION_COOKIE=... tests/perf/api-load.js\n' +
    'Or run: npm run perf:api (auto-extracts from Playwright auth state)'
  )
}

// ── Scenarios ───────────────────────────────────────────────────────
//
// baseline: 1 VU, 15s — sanity check, get clean p50 numbers
// steady:   5 VUs, 30s — normal weekday load
// ramp:     0→15 VUs over 30s, hold 30s — find degradation point
// spike:    25 VUs, 10s — Monday morning, everyone opens dashboards

const allScenarios = {
  baseline: {
    executor: 'constant-vus',
    vus: 1,
    duration: '15s',
    startTime: '0s',
    tags: { scenario: 'baseline' },
  },
  steady: {
    executor: 'constant-vus',
    vus: 5,
    duration: '30s',
    startTime: '20s',
    tags: { scenario: 'steady' },
  },
  ramp: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 15 },
      { duration: '30s', target: 15 },
      { duration: '10s', target: 0 },
    ],
    startTime: '55s',
    tags: { scenario: 'ramp' },
  },
  spike: {
    executor: 'constant-vus',
    vus: 25,
    duration: '10s',
    startTime: '130s',
    tags: { scenario: 'spike' },
  },
}

// Allow running a single scenario via -e SCENARIO=baseline
const scenarios = SCENARIO === 'all'
  ? allScenarios
  : { [SCENARIO]: { ...allScenarios[SCENARIO], startTime: '0s' } }

export const options = {
  scenarios,
  thresholds: {
    'api_cases_list_ms':    ['p(95)<2000', 'p(99)<4000'],
    'api_case_summary_ms':  ['p(95)<2000', 'p(99)<4000'],
    'api_tenancies_ms':     ['p(95)<2000'],
    'error_rate':           ['rate<0.05'],
  },
}

// ── Auth ────────────────────────────────────────────────────────────

const cookieHeader = [
  SESSION_COOKIE ? `renovo-operator-session=${SESSION_COOKIE}` : '',
  TENANT_COOKIE ? `renovo-active-tenant-membership=${TENANT_COOKIE}` : '',
].filter(Boolean).join('; ')

const headers = {
  Cookie: cookieHeader,
  Accept: 'application/json',
}

// ── Helpers ─────────────────────────────────────────────────────────

function hit(method, path, metric, checkName) {
  const url = `${BASE_URL}${path}`
  const res = method === 'GET'
    ? http.get(url, { headers, tags: { endpoint: path } })
    : http.request(method, url, null, { headers, tags: { endpoint: path } })

  if (metric) metric.add(res.timings.duration)
  const ok = res.status >= 200 && res.status < 300
  check(res, { [checkName || `${path} 2xx`]: () => ok })
  errorRate.add(ok ? 0 : 1)
  return res
}

function thinkTime(minSec, maxSec) {
  sleep(minSec + Math.random() * (maxSec - minSec))
}

// ── Main iteration ──────────────────────────────────────────────────
//
// Each VU iteration simulates one operator session:
//   1. Open /checkouts (fires cases + tenancies)
//   2. Scan the list for 1-3s
//   3. Click into a workspace (fires summary)
//   4. Read the workspace for 2-4s
//   5. 50% chance: expand a section (fires evidence/issues/messages/timeline)
//   6. Navigate back to list (fires cases again — tests warm-cache path)

export default function () {
  // ── Step 1: Operator opens /checkouts ──
  group('list page', () => {
    hit('GET', '/api/eot/cases', casesLatency, 'cases 2xx')
    hit('GET', '/api/eot/tenancies', tenanciesLatency, 'tenancies 2xx')
  })

  thinkTime(1, 3) // Scanning the case list

  // ── Step 2: Operator clicks into a workspace ──
  if (CASE_ID) {
    group('workspace page', () => {
      hit('GET', `/api/eot/cases/${CASE_ID}/summary`, summaryLatency, 'summary 2xx')
    })

    thinkTime(2, 4) // Reading workspace header

    // ── Step 3: 50% chance operator expands a section ──
    if (Math.random() < 0.5) {
      group('section expand', () => {
        // Pick a random section (weighted toward evidence and issues)
        const roll = Math.random()
        if (roll < 0.35) {
          hit('GET', `/api/eot/cases/${CASE_ID}/evidence`, evidenceLatency, 'evidence 2xx')
        } else if (roll < 0.65) {
          hit('GET', `/api/eot/cases/${CASE_ID}/issues`, issuesLatency, 'issues 2xx')
        } else if (roll < 0.85) {
          hit('GET', `/api/eot/cases/${CASE_ID}/messages`, messagesLatency, 'messages 2xx')
        } else {
          hit('GET', `/api/eot/cases/${CASE_ID}/timeline`, timelineLatency, 'timeline 2xx')
        }
      })

      thinkTime(1, 2)
    }
  }

  // ── Step 4: Navigate back to list (warm cache path) ──
  group('list return', () => {
    hit('GET', '/api/eot/cases', casesLatency, 'cases 2xx')
  })

  thinkTime(1, 2) // Before next cycle
}
