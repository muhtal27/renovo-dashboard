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
          <p className="app-kicker">Why managers trust the workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
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

      <div className="mt-6 border-t app-divider pt-6">
        <p className="app-kicker">Common questions</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[1.45rem] border border-stone-200 bg-stone-50/70 p-5"
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
