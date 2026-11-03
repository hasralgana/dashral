import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }
/** A link in the footer. */
export type FooterLink = { label: string; href: string }

const linksOf = (...labels: string[]): FooterLink[] => labels.map((label) => ({ label, href: "#" }))
const sampleColumns = [
  { title: "Product", links: linksOf("Features", "Pricing", "Changelog") },
  { title: "Company", links: linksOf("About", "Careers", "Contact") },
  { title: "Resources", links: linksOf("Docs", "Blog", "Status") },
]

/**
 * The end of a landing page: a last call to action on a soft glow — the promise, the main action and the reassurance
 * under it — then the brand, three columns of links and the copyright. Every part comes from props.
 */
export function CtaFooter({
  title = "Your next dashboard is an afternoon away",
  description = "Connect your data, pick a template, invite the team. Everyone sees real numbers by the end of the day.",
  primary = { label: "Start for free", href: "#" },
  secondary = { label: "Book a demo", href: "#" },
  note = "Free forever for small teams · No credit card",
  brand = { name: "Acme", href: "#", tagline: "Dashboards your team actually opens." },
  columns = sampleColumns,
  copyright,
  legal = linksOf("Privacy", "Terms"),
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
  /** A line under the buttons; none hides it. */
  note?: React.ReactNode
  brand?: { name: string; href: string; tagline?: string; logo?: React.ReactNode }
  columns?: { title: string; links: FooterLink[] }[]
  /** The copyright line (© this year and the brand without it). */
  copyright?: string
  legal?: FooterLink[]
}) {
  const link = "rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"

  return (
    <footer className="bg-background">
      {/* One column for everything, the same as the page's, so the card's edges line up with the content above. */}
      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-2xl border bg-card px-6 py-14 text-center sm:px-12 sm:py-16">
          {/* A soft glow from the top and a faint grid, both decoration. */}
          <div aria-hidden className="absolute inset-x-0 -top-32 -z-10 mx-auto h-64 max-w-2xl rounded-full bg-primary/20 blur-3xl" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:32px_32px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          />
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
          {description && <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">{description}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Action action={primary} className="group">
              {primary.label}{" "}
              <ArrowRight className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
            </Action>
            {secondary && (
              <Action action={secondary} variant="outline">
                {secondary.label}
              </Action>
            )}
          </div>
          {note && <p className="mt-4 text-xs text-muted-foreground">{note}</p>}
        </div>

        <div className="grid gap-10 py-14 sm:grid-cols-[1.5fr_repeat(var(--count),1fr)]" style={{ "--count": columns.length } as React.CSSProperties}>
          <div>
            <a
              href={brand.href}
              className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {brand.logo ?? (
                <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
              )}
              {brand.name}
            </a>
            {brand.tagline && <p className="mt-3 max-w-xs text-sm text-muted-foreground">{brand.tagline}</p>}
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 grid gap-2.5">
                {column.links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className={`${link} text-sm`}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 border-t py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>{copyright ?? `© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`}</p>
          <div className="flex gap-4">
            {legal.map(({ label, href }) => (
              <a key={label} href={href} className={link}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/** A large button that follows its action: a link, or a handler. */
function Action({ action, variant, className, children }: { action: BlockAction; variant?: "outline"; className?: string; children: React.ReactNode }) {
  return action.href ? (
    <Button size="lg" variant={variant} className={className} asChild>
      <a href={action.href}>{children}</a>
    </Button>
  ) : (
    <Button size="lg" variant={variant} className={className} onClick={action.onClick}>
      {children}
    </Button>
  )
}
