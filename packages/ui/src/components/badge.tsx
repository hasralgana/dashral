import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../lib/utils"

type BadgeVariant = "solid" | "soft" | "outline"
type BadgeColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

const defaultColors: Record<BadgeVariant, BadgeColor> = { solid: "primary", soft: "primary", outline: "neutral" }

// Every class is written out in full so Tailwind finds it.
const tones: Record<BadgeVariant, Record<BadgeColor, string>> = {
  solid: {
    primary: "border-transparent bg-primary text-primary-foreground",
    neutral: "border-transparent bg-secondary text-secondary-foreground",
    info: "border-transparent bg-info text-info-foreground",
    success: "border-transparent bg-success text-success-foreground",
    warning: "border-transparent bg-warning text-warning-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    highlight: "border-transparent bg-highlight text-highlight-foreground",
  },
  soft: {
    primary: "border-transparent bg-primary/12 text-primary-text",
    neutral: "border-transparent bg-foreground/6 text-foreground",
    info: "border-transparent bg-info/12 text-info-text",
    success: "border-transparent bg-success/12 text-success-text",
    warning: "border-transparent bg-warning/18 text-warning-text",
    destructive: "border-transparent bg-destructive/12 text-destructive-text",
    highlight: "border-transparent bg-highlight/12 text-highlight-text",
  },
  outline: {
    primary: "border-primary/40 text-primary-text",
    neutral: "text-foreground",
    info: "border-info/40 text-info-text",
    success: "border-success/40 text-success-text",
    warning: "border-warning/50 text-warning-text",
    destructive: "border-destructive/40 text-destructive-text",
    highlight: "border-highlight/40 text-highlight-text",
  },
}

/** The status dot, in the color's fill (on a solid badge it takes the text color instead). */
const dots: Record<BadgeColor, string> = {
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  highlight: "bg-highlight",
}

type BadgeStyleProps = {
  /** How much it stands out: solid, soft or outline. */
  variant?: BadgeVariant | null
  /** Its color. Solid and soft default to primary, outline to neutral. */
  color?: BadgeColor | null
  className?: string
}

/** The variant and color a badge ends up with. */
function resolve(variant: BadgeStyleProps["variant"], color: BadgeStyleProps["color"]): [BadgeVariant, BadgeColor] {
  const kind = variant ?? "solid"
  return [kind, color ?? defaultColors[kind]]
}

/** The classes for a badge, for an element that should look like one. */
function badgeVariants({ variant, color, className }: BadgeStyleProps = {}) {
  const [kind, tone] = resolve(variant, color)
  return cn(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
    tones[kind][tone],
    className
  )
}

/** A short label: variant says how much it stands out, color what it means. `dot` adds a status dot in front. */
function Badge({
  className,
  variant,
  color,
  dot = false,
  asChild = false,
  children,
  ...props
}: Omit<React.ComponentProps<"span">, "color"> &
  Omit<BadgeStyleProps, "className"> & {
    /** A small dot before the label, as in "● Active". */
    dot?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "span"
  const [kind, tone] = resolve(variant, color)

  return (
    <Comp data-slot="badge" className={badgeVariants({ variant, color, className })} {...props}>
      {dot && (
        <span
          aria-hidden
          data-slot="badge-dot"
          className={cn("size-1.5 shrink-0 rounded-full", kind === "solid" ? "bg-current" : dots[tone])}
        />
      )}
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )
}

export { Badge, badgeVariants, type BadgeVariant, type BadgeColor }
