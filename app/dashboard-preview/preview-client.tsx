'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OperatorNav } from '@/app/operator-nav'
import { DashboardOverviewClient } from '@/app/(operator)/dashboard/dashboard-overview-client'
import { WorkspaceStepProgress } from '@/app/eot/_components/workspace-step-progress'
import type { WorkspaceStep } from '@/lib/eot-types'
import { FIXTURE_TENANCIES, FIXTURE_CASES } from './fixtures'

// Dashboard preview route: renders DashboardOverviewClient against demo-level
// fixture data inside a minimal operator shell so we can visually diff the live
// redesign against private-content/demo.html without SSO or live data.
//
// No auth required. Pure fixtures — no PII, no API calls that hit tenant data.
// React Query fetches fail silently (401 is expected) because initialData is
// already set.

export function DashboardPreviewClient() {
  // Query client with retries disabled — we expect the in-hook refetchInterval
  // to hit 401 in unauthenticated preview, and we want that to be quiet.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            staleTime: Number.POSITIVE_INFINITY,
          },
        },
      })
  )

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <main className="operator-app min-h-screen bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen">
          <OperatorNav
            role="admin"
            collapsed={sidebarCollapsed}
            mobileOpen={mobileOpen}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onCloseMobile={() => setMobileOpen(false)}
            displayName="Jamie Miller"
            initials="JM"
            tenantName="Renovo Preview"
          />

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Mock header — matches operator-layout.tsx visually */}
            <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 xl:hidden"
                  aria-label="Open navigation"
                >
                  <span className="sr-only">Menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>
                </button>
                <div className="text-[13px] font-medium text-zinc-900">Dashboard</div>
              </div>

              <div className="hidden min-w-0 flex-1 xl:flex">
                <input
                  type="text"
                  placeholder="Search..."
                  readOnly
                  className="h-9 w-full max-w-[520px] rounded-[10px] border border-zinc-200 bg-zinc-50 px-4 text-[13px] text-zinc-500 outline-none"
                />
              </div>

              <div className="ml-auto flex items-center gap-1">
                <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">
                  ⌘K
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <div className="ml-1 flex items-center gap-2 rounded-[10px] px-2 py-1">
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                    JM
                  </div>
                  <span className="hidden text-[13px] font-medium text-zinc-700 md:inline">Jamie</span>
                </div>
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-8 px-5 py-7 pb-16 md:px-8">
              <DashboardOverviewClient
                initialTenancies={FIXTURE_TENANCIES}
                initialCases={FIXTURE_CASES}
                operatorName="Jamie"
              />

              {/* Workspace stepper preview — verifies WORKSPACE_STEPS order
                  matches private-content/demo.html:2323 after the review->checkout swap. */}
              <section className="card card-p">
                <h3 className="text-[16px] font-semibold text-zinc-900">Case workspace stepper</h3>
                <p className="mt-1 text-[12px] text-zinc-500">
                  Mirrors demo.html&apos;s 7-step workflow: inventory → checkout → readings → analysis → deductions → negotiation → refund.
                </p>
                <div className="mt-4 overflow-x-auto border-t border-zinc-100 pt-4">
                  <WorkspaceStepProgress
                    currentStep={'checkout' as WorkspaceStep}
                    completedSteps={new Set<WorkspaceStep>(['inventory'])}
                    onStepClick={() => {}}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </QueryClientProvider>
  )
}
