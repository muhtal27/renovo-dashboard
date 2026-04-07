import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mx-auto max-w-[400px]">
        <p className="text-6xl font-bold tracking-tight text-zinc-200">404</p>

        <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-7 text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or head back to the dashboard.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
