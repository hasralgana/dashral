import * as React from "react"
import { Slot } from "radix-ui"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../lib/utils"

type ButtonVariant = "solid" | "soft" | "outline" | "ghost" | "link"
type ButtonColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

/** The color a variant takes when none is given: quiet variants are neutral, the rest primary. */
const defaultColors: Record<ButtonVariant, ButtonColor> = {
  solid: "primary",
  soft: "primary",
  outline: "neutral",
  ghost: "neutral",
  link: "primary",
}

// Every class is written out in full so Tailwind finds it.
const tones: Record<ButtonVariant, Record<ButtonColor, string>> = {
  solid: {
    primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    neutral: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    info: "bg-info text-info-foreground shadow-xs hover:bg-info/90",
    success: "bg-success text-success-foreground shadow-xs hover:bg-success/90",
    warning: "bg-warning text-warning-foreground shadow-xs hover:bg-warning/90",
    destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
    highlight: "bg-highlight text-highlight-foreground shadow-xs hover:bg-highlight/90",
  },
  soft: {
    primary: "bg-primary/12 text-primary-text hover:bg-primary/18",
    neutral: "bg-foreground/6 text-foreground hover:bg-foreground/10",
    info: "bg-info/12 text-info-text hover:bg-info/18",
    success: "bg-success/12 text-success-text hover:bg-success/18",
    warning: "bg-warning/18 text-warning-text hover:bg-warning/25",
    destructive: "bg-destructive/10 text-destructive-text hover:bg-destructive/15",
    highlight: "bg-highlight/12 text-highlight-text hover:bg-highlight/18",
  },
  outline: {
    primary: "border border-primary/40 bg-card text-primary-text shadow-xs hover:bg-primary/8",
    neutral: "border bg-card shadow-xs hover:bg-accent hover:text-accent-foreground",
    info: "border border-info/40 bg-card text-info-text shadow-xs hover:bg-info/8",
    success: "border border-success/40 bg-card text-success-text shadow-xs hover:bg-success/8",
    warning: "border border-warning/50 bg-card text-warning-text shadow-xs hover:bg-warning/10",
    destructive: "border border-destructive/40 bg-card text-destructive-text shadow-xs hover:bg-destructive/8",
    highlight: "border border-highlight/40 bg-card text-highlight-text shadow-xs hover:bg-highlight/8",
  },
  ghost: {
    primary: "text-primary-text hover:bg-primary/10",
    neutral: "hover:bg-accent hover:text-accent-foreground",
    info: "text-info-text hover:bg-info/10",
    success: "text-success-text hover:bg-success/10",
    warning: "text-warning-text hover:bg-warning/12",
    destructive: "text-destructive-text hover:bg-destructive/10",
    highlight: "text-highlight-text hover:bg-highlight/10",
  },
  link: {
    primary: "text-primary-text underline-offset-4 hover:underline",
    neutral: "text-foreground underline-offset-4 hover:underline",
    info: "text-info-text underline-offset-4 hover:underline",
    success: "text-success-text underline-offset-4 hover:underline",
    warning: "text-warning-text underline-offset-4 hover:underline",
    destructive: "text-destructive-text underline-offset-4 hover:underline",
    highlight: "text-highlight-text underline-offset-4 hover:underline",
  },
}

/** A soft colored glow under a solid button, for the one action that matters most on a page. */
const glows: Record<ButtonColor, string> = {
  primary: "shadow-lg shadow-primary/30 hover:shadow-primary/40",
  neutral: "shadow-lg shadow-foreground/10",
  info: "shadow-lg shadow-info/30 hover:shadow-info/40",
  success: "shadow-lg shadow-success/30 hover:shadow-success/40",
  warning: "shadow-lg shadow-warning/30 hover:shadow-warning/40",
  destructive: "shadow-lg shadow-destructive/30 hover:shadow-destructive/40",
  highlight: "shadow-lg shadow-highlight/30 hover:shadow-highlight/40",
}

// It presses in a little, except where it anchors a menu, popover, tooltip or listbox (Radix marks those with data-state
// or aria-haspopup): Radix measures the trigger as it opens, and a shrinking one would place the layer a hair off. A
// Motion button (@dashral/motion, data-press="motion") presses on its own spring instead.
const buttonBase = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none motion-safe:enabled:not-aria-busy:not-data-[state]:not-data-[press=motion]:not-[[aria-haspopup]]:not-[[role=combobox]]:active:scale-[0.97] aria-busy:cursor-progress focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/15 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        // Each size has a square one for an icon alone, at the same height: xs and icon-xs, sm and icon-sm, and so on.
        // With an icon beside the label (however deep it sits) the sides tighten; the loading spinner doesn't count, so the
        // width holds while it spins.
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[svg:not([data-spinner])]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[svg:not([data-spinner])]:px-2.5",
        default: "h-9 px-4 py-2 has-[svg:not([data-spinner])]:px-3",
        lg: "h-10 rounded-md px-6 has-[svg:not([data-spinner])]:px-4",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        icon: "size-9",
        "icon-lg": "size-10",
        // Text-sized, for a link-style button inside a sentence or a row of small text.
        inline: "h-auto gap-1 rounded-sm p-0 text-[length:inherit]",
      },
    },
    defaultVariants: { size: "default" },
  }
)

type ButtonStyleProps = {
  /** How much the button stands out: solid, soft, outline, ghost or link. */
  variant?: ButtonVariant | null
  /** Its color. Solid, soft and link default to primary; outline and ghost to neutral. */
  color?: ButtonColor | null
  size?: "xs" | "sm" | "default" | "lg" | "icon-xs" | "icon-sm" | "icon" | "icon-lg" | "inline" | null
  /** A soft colored glow under a solid button. */
  glow?: boolean
  className?: string
}

/** The classes for a button, for an element that should look like one (a Link, a menu trigger). */
function buttonVariants({ variant, color, size, glow, className }: ButtonStyleProps = {}) {
  const kind = variant ?? "solid"
  const tone = color ?? defaultColors[kind]
  return cn(buttonBase({ size }), tones[kind][tone], glow && kind === "solid" && glows[tone], className)
}

const spin = "animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]"
/**
 * A layer of the label's grid cell: laid out like the button itself, its gap and justify included, and as wide as the
 * button, so a className's justify-between, a child's ms-auto or flex-1, and truncate all work as on a plain flex row.
 */
const layer = "col-start-1 row-start-1 inline-flex min-w-0 items-center [justify-content:inherit] gap-[inherit]"

/**
 * A button: variant says how much it stands out, color what it means. Presses in slightly when clicked (not with
 * reduced motion). `loading` shows a spinner (and `loadingText`) in place of the label, the button keeping its width,
 * and ignores clicks, but keeps the button focusable (aria-busy and aria-disabled instead of disabled), so keyboard
 * users don't lose their place.
 */
function Button({
  className,
  variant,
  color,
  size,
  glow,
  asChild = false,
  loading = false,
  loadingText,
  children,
  onClick,
  ...props
}: Omit<React.ComponentProps<"button">, "color"> &
  Omit<ButtonStyleProps, "className"> & {
    asChild?: boolean
    /** Shows a spinner in place of the label and ignores clicks, without moving focus. */
    loading?: boolean
    /** Beside the spinner while loading, e.g. "Saving…"; without it the spinner shows alone. Not with asChild. */
    loadingText?: React.ReactNode
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      {...props}
      className={buttonVariants({ variant, color, size, glow, className })}
      aria-busy={loading || undefined}
      aria-disabled={loading || props["aria-disabled"]}
      // preventDefault also stops a submit button from submitting its form.
      onClick={loading ? (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault() : onClick}
    >
      {/* asChild: Slot looks for Slottable among the direct children (not in a fragment), and can't wrap its child, so the
          spinner sits before it. */}
      {asChild && loading && <Loader2 data-spinner="" className={spin} aria-hidden />}
      {asChild ? (
        <Slot.Slottable>{children}</Slot.Slottable>
      ) : (
        // The label and the loading state share one grid cell, so the button is as wide as the wider of the two and never
        // jumps as it starts or stops loading; the label stays in place, hidden, while the spinner (and loadingText) show.
        // The cell fills the button (one 1fr column) and passes its justify on to the layers.
        <span className="grid w-full min-w-0 grid-cols-1 [justify-content:inherit] gap-[inherit]">
          <span className={cn(layer, loading && "invisible")}>{children}</span>
          {loading && (
            <span className={layer}>
              <Loader2 data-spinner="" className={spin} aria-hidden />
              {loadingText}
            </span>
          )}
        </span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonVariant, type ButtonColor }
