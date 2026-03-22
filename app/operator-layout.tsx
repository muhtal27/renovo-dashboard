'use client'

import type { ReactNode } from 'react'
import { OperatorNav } from '@/app/operator-nav'
import { getOperatorLabel } from '@/lib/operator'
import { useOperatorGate } from '@/lib/use-operator-gate'

export function OperatorLayout({
  children,
  pageTitle,
  pageDescription,
}: {
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
}) {
  const { operator } = useOperatorGate()

  const operatorLabel = getOperatorLabel(operator)

  return (
    <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
      <OperatorNav viewerName={operatorLabel} />
      <div className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-6">
          {(pageTitle || pageDescription) && (
            <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
              {pageTitle ? <p className="app-kicker">Renovo operator</p> : null}
              {pageTitle ? (
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                  {pageTitle}
                </h1>
              ) : null}
              {pageDescription ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                  {pageDescription}
                </p>
              ) : null}
            </section>
          )}
          {children}
        </div>
      </div>
    </main>
  )
}
