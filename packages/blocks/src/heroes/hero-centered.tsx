import { ArrowRight, Hexagon, Layers, Orbit, Play, Triangle, Waves } from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }

// Sample customers, as wordmarks: swap in your customers' logos.
const sampleLogos: { name: string; icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; logo?: React.ReactNode }[] = [
  { name: "Northwind", icon: Waves },
  { name: "Lumen", icon: Hexagon },
  { name: "Orbital", icon: Orbit },
  { name: "Stackline", icon: Layers },
  { name: "Apex", icon: Triangle },
]

/**
 * A centered hero: an announcement, the promise, two actions and the customers who already use it, on a soft glow
 * of the primary color with a faint grid. Each line arrives a moment after the one before. Every part comes from props.
 */
export function HeroCentered({
  announcement = { label: "New", text: "Scheduled reports are here", href: "#" },
  title = (
    <>
      The dashboard your team <span className="text-primary-text">actually opens</span>
    </>
  ),
  description = "Revenue, customers and every metric that matters, in one place that updates itself. Set it up in an afternoon, not a quarter.",
  primary = { label: "Get started free", href: "#" },
  secondary = { label: "Watch the demo", href: "#" },
  note = "Free for 14 days · No credit card needed",
  logosTitle = "Trusted by teams at",
  logos = sampleLogos,
}: {
  /** The pill above the headline; null hides it. */
  announcement?: { label: string; text: string; href: string } | null
  title?: React.ReactNode
  description?: React.ReactNode
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
  /** A line under the buttons; none hides it. */
  note?: React.ReactNode
  logosTitle?: string
  /** Your customers: a name with an icon, or a logo of their own; none hides the row. */
  logos?: typeof sampleLogos
}) {
  return (
    <section className="relative isolate overflow-hidden bg-background px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
      {/* The glow and the grid, fading out towards the edges. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(55%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_30%,#000_30%,transparent_80%)] bg-size-[44px_44px]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        {announcement && (
          <a
            href={announcement.href}
            className={cn(enterMotion, "mb-7 inline-flex items-center gap-2 rounded-full border bg-card/70 py-1 ps-1 pe-3 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground")}
            style={stagger(0, 80)}
          >
            <Badge className="rounded-full">{announcement.label}</Badge>
            {announcement.text}
            <ArrowRight className="size-3" aria-hidden />
          </a>
        )}
        <h1
          className={cn(enterMotion, "text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl")}
          style={stagger(1, 80)}
        >
          {title}
        </h1>
        {description && (
          <p className={cn(enterMotion, "mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg")} style={stagger(2, 80)}>
            {description}
          </p>
        )}
        <div className={cn(enterMotion, "mt-9 flex flex-wrap justify-center gap-3")} style={stagger(3, 80)}>
          <Action action={primary}>
            {primary.label} <ArrowRight aria-hidden />
          </Action>
          {secondary && (
            <Action action={secondary} variant="outline" className="bg-card/60">
              <Play aria-hidden /> {secondary.label}
            </Action>
          )}
        </div>
        {note && (
          <p className={cn(enterMotion, "mt-4 text-xs text-muted-foreground")} style={stagger(4, 80)}>
            {note}
          </p>
        )}
      </div>

      {logos.length > 0 && (
        <div className={cn(enterMotion, "mx-auto mt-16 max-w-4xl")} style={stagger(5, 80)}>
          <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">{logosTitle}</p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-muted-foreground">
            {logos.map(({ name, icon: Icon, logo }) => (
              <li key={name} className="flex items-center gap-2 text-lg font-semibold tracking-tight opacity-80 grayscale transition-opacity hover:opacity-100">
                {logo ?? (
                  <>
                    {Icon && <Icon className="size-5" aria-hidden />}
                    {name}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
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
