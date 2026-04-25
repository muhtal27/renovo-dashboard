import type { Metadata } from 'next'
import { ScenariosView } from './scenarios-view'

export const metadata: Metadata = {
  title: 'Scenarios · Renovo Finance',
}

export default function ScenariosPage() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Scenarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Named sets of forward-looking assumptions. The active scenario drives the projection on the dashboard — switch between Base, Upside, and Downside to stress-test your plan.
        </p>
      </div>
      <ScenariosView />
    </div>
  )
}
