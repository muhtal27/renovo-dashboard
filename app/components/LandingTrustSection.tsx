type TrustPoint = {
  title: string
  body: string
}

type FaqItem = {
  question: string
  answer: string
}

type LandingTrustSectionProps = {
  points: TrustPoint[]
  faqs: FaqItem[]
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
            Guidance hub
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Clear reasoning beats black-box automation
          </h2>
          <p className="mt-4 text-base leading-8 text-stone-700">
            Renovo is designed to make end-of-tenancy decisions easier to review, easier to
            explain, and easier to defend later. Trust comes from seeing the evidence, the issue,
            and the reasoning together in one place.
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
              Built for deposit-scheme-ready workflows
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Designed around real dispute documentation, with evidence, reasoning, and claim
              output kept reviewable before scheme submission.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['MyDeposits', 'TDS', 'DPS', 'More schemes'].map((item) => (
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
          Scheme references are shown for workflow context only.
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
