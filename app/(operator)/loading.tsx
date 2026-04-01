import { PageHeader, SkeletonPanel } from '@/app/operator-ui'

export default function OperatorLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Loading"
        title="Preparing operator workspace"
        description="Verifying access and loading the latest protected workspace data."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <SkeletonPanel />
        <SkeletonPanel />
        <SkeletonPanel />
        <SkeletonPanel />
      </section>

      <div className="px-6 py-6">
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    </div>
  )
}
