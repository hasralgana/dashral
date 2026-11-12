import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@dashral/ui/components/button"

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }

export type CtaBannerProps = {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
}

/**
 * The simplest call to action: one banner, the ask on one side and the actions on the other. A gradient hairline
 * around a soft tint of the same colors, so it stands out from the page without shouting. On phones the two stack,
 * the main action first. Every part comes from props.
 */
export function CtaBanner({
  eyebrow = "Free for small teams",
  title = "Ready to see your numbers in one place?",
  description = "Start free in a minute. No credit card, and your whole team is invited.",
  primary = { label: "Start for free", href: "#" },
  secondary = { label: "Talk to sales", href: "#" },
}: CtaBannerProps) {
  return (
    <section className="bg-background p-4 sm:p-6">
      <div
        className={`relative isolate mx-auto flex flex-col gap-6 overflow-hidden rounded-2xl border border-transparent px-6 py-8 sm:px-10 sm:py-10 md:flex-row md:items-center md:justify-between [background:linear-gradient(120deg,color-mix(in_oklab,var(--gradient-from)_18%,var(--card)),color-mix(in_oklab,var(--gradient-via)_10%,var(--card))_55%,color-mix(in_oklab,var(--gradient-to)_18%,var(--card)))_padding-box,linear-gradient(90deg,var(--gradient-from),var(--gradient-via),var(--gradient-to))_border-box]`}
      >
        {/* A glow in the middle color from one corner and a fine grid fading out, both decoration. */}
        <div aria-hidden className="absolute -top-28 -right-20 -z-10 size-80 rounded-full bg-(--gradient-via)/20 blur-3xl rtl:right-auto rtl:-left-20" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--gradient-via)_1px,transparent_1px),linear-gradient(to_bottom,var(--gradient-via)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.08] [mask-image:linear-gradient(to_left,black,transparent_65%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_65%)]"
        />

        <div className="max-w-xl">
          {eyebrow && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-(--gradient-ink)">
              <Sparkles aria-hidden className="size-4" />
              {eyebrow}
            </p>
          )}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 text-pretty text-muted-foreground">{description}</p>}
        </div>

        {/* Side by side, on a phone too; the second wraps under only when the two can't fit one line. */}
        <div className="flex shrink-0 flex-wrap gap-3">
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
