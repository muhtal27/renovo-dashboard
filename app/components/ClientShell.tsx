'use client'

import dynamic from 'next/dynamic'

const ConnectionStatus = dynamic(
  () => import('./ConnectionStatus').then((m) => m.ConnectionStatus),
  { ssr: false },
)
const PwaSplash = dynamic(
  () => import('./PwaSplash').then((m) => m.PwaSplash),
  { ssr: false },
)
const ServiceWorkerRegistration = dynamic(
  () => import('./ServiceWorkerRegistration').then((m) => m.ServiceWorkerRegistration),
  { ssr: false },
)

export function ClientShell() {
  return (
    <>
      <PwaSplash />
      <ConnectionStatus />
      <ServiceWorkerRegistration />
    </>
  )
}
