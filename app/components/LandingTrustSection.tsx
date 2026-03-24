type TrustPoint = {
  title: string
  body: string
}

type FaqItem = {
  question: string
  answer: string
}

type LandingTrustSectionProps = {
  points: ReadonlyArray<TrustPoint>
  faqs: ReadonlyArray<FaqItem>
}

export function LandingTrustSection({
  points,
  faqs,
}: LandingTrustSectionProps) {
  return (
    <section className="app-surface rounded-[2rem] p-6 md:p-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            Control and trust
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Control stays with your team
          </h2>
          <p className="mt-4 text-base leading-8 text-stone-700">
            Renovo prepares the work, but your team reviews every issue, amount, and explanation
            before anything is sent. The reasoning stays visible, the evidence stays linked, and
            the record is there if a claim is challenged later.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {points.map((point) => (
            <article
              key={point.title}
              className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
            >
              <h3 className="text-base font-semibold text-stone-900">{point.title}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{point.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.45rem] border border-stone-200 bg-stone-50/70 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Built for review and challenge
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Property data is encrypted in transit and at rest. Core customer data is stored in
              the EU, and we use trusted sub-processors only where needed to run the service.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Human sign-off', 'Evidence linked', 'Override anything', 'Data stays yours'].map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Claim review and submission stay under your team&apos;s control from draft through sign-off.
        </p>
      </div>

      <div className="mt-6 border-t border-stone-200 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          Common questions
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[1.45rem] border border-stone-200 bg-white/92 p-5"
            >
              <h3 className="text-base font-semibold text-stone-900">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
