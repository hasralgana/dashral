import { Star } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { cn } from "@dashral/ui/lib/utils"

export type Quote = { text: string; name: string; role: string; src?: string; /** Out of 5; 5 without it. */ stars?: number }

const sampleQuotes: Quote[] = [
  { text: "We replaced three spreadsheets and a weekly meeting. The numbers are just there now.", name: "Olivia Martin", role: "Head of Ops, Acme", src: "https://randomuser.me/api/portraits/women/44.jpg" },
  { text: "Set up in an afternoon. By Friday the whole sales team had it open on a second screen.", name: "Liam Johnson", role: "Sales Lead, Globex", src: "https://randomuser.me/api/portraits/men/32.jpg" },
  {
    text: "The alerts are the best part. I hear about a drop in checkout before a customer emails us about it, which used to be the other way round.",
    name: "Sofia Davis",
    role: "Product Designer, Initech",
    src: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  { text: "Finally a dashboard our finance team trusts. The Excel export alone saved us hours.", name: "Budi Santoso", role: "CFO, PT Nusantara" },
  { text: "Clean, fast, and it works on my phone in a taxi. That's all I wanted.", name: "Ava Chen", role: "Founder, Umbrella Co." },
  {
    text: "We tried four tools. This is the one people kept opening without being reminded to.",
    name: "Noah Kim",
    role: "COO, Hooli",
    src: "https://randomuser.me/api/portraits/men/75.jpg",
  },
]

/**
 * What customers say, as cards in columns that flow like a masonry wall: the quote, five stars, and who said it.
 * Three columns, then two, then one on phones. Every part comes from props.
 */
export function TestimonialsGrid({
  eyebrow = "Customers",
  title = "Teams open it every morning",
  description = "Over 2,000 teams run their week from Acme. Here's what a few of them say.",
  quotes = sampleQuotes,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  quotes?: Quote[]
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
        </div>
        <ul className="mt-12 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {quotes.map((quote) => (
            <li key={quote.name} className="mb-4 break-inside-avoid">
              <figure className="grid gap-4 rounded-2xl border bg-card p-6">
                <div className="flex gap-0.5" aria-label={`${quote.stars ?? 5} out of 5 stars`} role="img">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("size-4 text-warning", i < (quote.stars ?? 5) ? "fill-warning" : "opacity-30")} aria-hidden />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed">“{quote.text}”</blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar src={quote.src} name={quote.name} alt="" />
                  <span className="grid">
                    <span className="text-sm font-medium">{quote.name}</span>
                    <span className="text-xs text-muted-foreground">{quote.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
