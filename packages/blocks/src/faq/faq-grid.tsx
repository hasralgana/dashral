import { ArrowRight } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

const sampleFaqs: { q: string; a: React.ReactNode }[] = [
  { q: "Is there a free plan?", a: "Yes, Starter is free forever for one person, with one dashboard and three sources." },
  { q: "Do I need an engineer to set it up?", a: "No. Connecting a source takes a couple of clicks; SQL is there if you want it." },
  { q: "Can I embed dashboards in my app?", a: "On Business, yes — with your branding and each customer seeing only their own data." },
  { q: "How does billing work?", a: "Per workspace, monthly or yearly. Seats you add mid-month are charged for the days left." },
  { q: "Is my data safe?", a: "Encrypted at rest and in transit, with SSO, roles and an audit log on Business." },
  { q: "What if I need help?", a: "Docs and a community for everyone; email support on Team; a named manager on Business." },
]

/**
 * Short answers you can scan without clicking: questions in two columns, each with its answer under it, then a
 * line pointing to the full help center. One column on phones. Every part comes from props.
 */
export function FaqGrid({
  eyebrow = "FAQ",
  title = "Good to know",
  faqs = sampleFaqs,
  more = { title: "Didn't find your answer?", description: "The help center has guides for every feature.", label: "Visit the help center", href: "#" },
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  faqs?: { q: string; a: React.ReactNode }[]
  /** The line under the answers pointing to more help; null hides it. */
  more?: { title: string; description?: string; label: string; href: string } | null
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
        </div>
        <dl className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
        {more && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-6">
            <p className="text-sm">
              <span className="font-semibold">{more.title}</span> {more.description && <span className="text-muted-foreground">{more.description}</span>}
            </p>
            <Button variant="outline" size="sm" className="group" asChild>
              <a href={more.href}>
                {more.label} <ArrowRight className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
