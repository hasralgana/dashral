import { ArrowRight, Check } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"

const samplePeople = [{ name: "Sophia Chen" }, { name: "Liam Johnson" }, { name: "Emma Davis" }, { name: "Noah Williams" }, { name: "Ava Brown" }]
// Each face its own soft tint, from the theme's status colors, on the card's color so the stack doesn't show through.
const tints = ["bg-primary/15 text-primary-text", "bg-info/15 text-info-text", "bg-success/15 text-success-text", "bg-highlight/15 text-highlight-text", "bg-warning/20 text-warning-text"]

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }

export type CtaCenteredProps = {
  /** The pill above the heading; none hides it. */
  badge?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
  /** Short promises under the buttons; none hides the row. */
  promises?: string[]
  /** The people already using it, and their rating; no people hides the row. */
  people?: { name: string; src?: string }[]
  rating?: React.ReactNode
}

/**
 * A call to action between sections of a landing page: the promise and two actions on a soft glow, with the people
 * already using it under them. Every part comes from props.
 */
export function CtaCentered({
  badge = "2,400 teams joined this month",
  title = "Stop guessing. See every number in one place.",
  description = "Connect your data, pick a dashboard and invite the team. Everyone sees the same numbers by lunch.",
  primary = { label: "Start for free", href: "#" },
  secondary = { label: "Talk to sales", href: "#" },
  promises = ["Free for small teams", "No credit card", "Set up in minutes"],
  people = samplePeople,
  rating = (
    <>
      <span className="font-medium text-foreground">4.9 out of 5</span> from 1,200+ reviews
    </>
  ),
}: CtaCenteredProps) {
  return (
    <section className="bg-background p-4 sm:p-6">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center shadow-xs sm:px-12 sm:py-20">
        {/* The glow and the grid, both decoration: brightest at the top, gone at the edges. */}
        <div aria-hidden className="absolute -top-40 left-1/2 -z-10 h-80 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:40px_40px] opacity-50 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black,transparent)]"
        />

        {badge && (
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            {badge}
          </p>
        )}
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.08]">{title}</h2>
        {description && <p className="mx-auto mt-5 max-w-lg text-pretty text-muted-foreground sm:text-lg">{description}</p>}

        {/* Side by side, on a phone too: each takes its share of the row, and the second wraps under only when the
            two labels can't fit one line. */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Action action={primary} className="group flex-auto sm:flex-none">
            {primary.label}
            <ArrowRight
              aria-hidden
              className="transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
          </Action>
          {secondary && (
            <Action action={secondary} variant="outline" className="flex-auto sm:flex-none">
              {secondary.label}
            </Action>
          )}
        </div>

        {promises.length > 0 && (
          <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {promises.map((promise) => (
              <li key={promise} className="flex items-center gap-1.5">
                <Check aria-hidden className="size-4 text-success-text" />
                {promise}
              </li>
            ))}
          </ul>
        )}

        {people.length > 0 && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {people.map(({ name, src }, i) => (
                <Avatar
                  key={name}
                  name={name}
                  src={src}
                  alt=""
                  size="lg"
                  className="rounded-full bg-card ring-[3px] ring-card"
                  classNames={{ fallback: `text-xs font-semibold ${tints[i % tints.length]}` }}
                />
              ))}
            </div>
            {rating && <p className="text-sm text-muted-foreground">{rating}</p>}
          </div>
        )}
      </div>
    </section>
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
