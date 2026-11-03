import { MessageCircle } from "lucide-react"
import { Accordion } from "@dashral/ui/components/accordion"
import { Button } from "@dashral/ui/components/button"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { payments: "Fernpay", store: "Cartwell", crm: "Dealbird", analytics: "Peekly" }

const sampleFaqs: { value: string; title: string; content: React.ReactNode }[] = [
  { value: "trial", title: "Is there a free trial?", content: "Yes. Every paid plan starts with 14 days free, no card needed. You keep everything you build if you upgrade." },
  { value: "sources", title: "Which data sources can I connect?", content: `${brands.payments}, ${brands.store}, Postgres, MySQL, ${brands.crm}, ${brands.analytics} and about forty more. A REST API covers the rest.` },
  { value: "team", title: "Can I invite my whole team?", content: "Starter is for one person. Team covers up to 25 people with roles; Business has no limit and adds SSO." },
  { value: "security", title: "Where is my data stored?", content: "In the EU or the US, your choice, encrypted at rest and in transit. We never sell or share it." },
  { value: "cancel", title: "Can I cancel any time?", content: "Yes, from Billing in two clicks. Yearly plans are refunded for the months you haven't used." },
]

/**
 * Questions on one side, a way to ask more on the other: the heading and a contact card stay put while the
 * answers open in place. Stacks on phones. Every part comes from props.
 */
export function FaqSplit({
  eyebrow = "FAQ",
  title = "Questions, answered",
  description = "Everything people ask before they start. Something missing? We reply within a day.",
  faqs = sampleFaqs,
  defaultOpen = ["trial"],
  contact = { title: "Still have a question?", description: "Talk to a person, not a bot.", label: "Contact us", href: "#" },
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  faqs?: { value: string; title: string; content: React.ReactNode }[]
  /** The questions open at first, by value. */
  defaultOpen?: string[]
  /** The card to ask more; null hides it. */
  contact?: { title: string; description?: string; label: string; href?: string; onClick?: () => void } | null
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="grid content-start gap-6 lg:sticky lg:top-8">
          <div>
            {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
            {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
          </div>
          {contact && (
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary-text">
                <MessageCircle className="size-5" />
              </span>
              <span className="grid flex-1">
                <span className="text-sm font-semibold">{contact.title}</span>
                {contact.description && <span className="text-xs text-muted-foreground">{contact.description}</span>}
              </span>
              {contact.href ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={contact.href}>{contact.label}</a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={contact.onClick}>
                  {contact.label}
                </Button>
              )}
            </div>
          )}
        </div>
        <Accordion defaultValue={defaultOpen} items={faqs} classNames={{ content: "text-muted-foreground leading-relaxed" }} />
      </div>
    </section>
  )
}
