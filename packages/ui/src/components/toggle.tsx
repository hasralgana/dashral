"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "../lib/utils"

type ToggleVariant = "ghost" | "outline"
type ToggleSize = "sm" | "default" | "lg"
type ToggleColor = "primary" | "neutral" | "none"

// On: a soft tint of the color. Every class is written out in full so Tailwind finds it.
const onColors: Record<ToggleColor, { fill: string; border: string }> = {
  primary: { fill: "data-[state=on]:bg-primary/12 data-[state=on]:text-primary-text data-[state=on]:hover:bg-primary/18 data-[state=on]:hover:text-primary-text", border: "data-[state=on]:border-primary/40" },
  neutral: { fill: "data-[state=on]:bg-accent data-[state=on]:text-foreground data-[state=on]:hover:bg-accent", border: "data-[state=on]:border-ring/40" },
  // No tint: what's inside shows it's on (a reaction's icon, filled in its own color).
  none: { fill: "data-[state=on]:text-foreground", border: "" },
}

/** The background a toggle takes when on, for an element drawing it apart (the motion edition's). */
const toggleOnFill: Record<ToggleColor, string> = { primary: "bg-primary/12", neutral: "bg-accent", none: "" }

const sizes: Record<ToggleSize, string> = {
  sm: "h-8 min-w-8 px-2 text-xs",
  default: "h-9 min-w-9 px-2.5 text-sm",
  lg: "h-10 min-w-10 px-3 text-sm",
}

/** The classes for a toggle, for ToggleGroup's items and anything that should look like one. */
function toggleVariants({
  variant = "ghost",
  size = "default",
  color = "primary",
  className,
}: { variant?: ToggleVariant; size?: ToggleSize; color?: ToggleColor; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap text-muted-foreground transition-[color,background-color,border-color,box-shadow] outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    onColors[color].fill,
    variant === "outline" && ["border border-input shadow-xs", onColors[color].border],
    sizes[size],
    className
  )
}

type ToggleProps = React.ComponentProps<typeof TogglePrimitive.Root> & {
  /** ghost (the default) is quiet until it's on; outline has a border all the time. */
  variant?: ToggleVariant
  size?: ToggleSize
  /** The tint when it's on: a soft primary (the default), neutral grey for a busy toolbar, or none when what's inside shows it (a reaction's filled icon). */
  color?: ToggleColor
}

/**
 * A button that stays pressed: Bold in a toolbar, Pin, Mute. pressed and onPressedChange control it; an icon alone
 * needs an aria-label.
 */
function Toggle({ variant, size, color, className, ...props }: ToggleProps) {
  return <TogglePrimitive.Root data-slot="toggle" className={toggleVariants({ variant, size, color, className })} {...props} />
}

export { Toggle, toggleVariants, toggleOnFill, type ToggleProps, type ToggleVariant, type ToggleSize, type ToggleColor }
