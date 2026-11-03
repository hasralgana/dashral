"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The track behind the bar. Every class is written out in full so Tailwind finds it.
const trackColors: Record<ControlColor, string> = {
  primary: "bg-primary/15",
  neutral: "bg-foreground/15",
  info: "bg-info/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  destructive: "bg-destructive/15",
  highlight: "bg-highlight/15",
}

// The bar. Every class is written out in full so Tailwind finds it.
const barColors: Record<ControlColor, string> = {
  primary: "bg-primary",
  neutral: "bg-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  highlight: "bg-highlight",
}

function Progress({
  className,
  classNames,
  color = "primary",
  value,
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "color"> & {
  /** The bar's color; the track is a pale version of it. */
  color?: ControlColor
  classNames?: { indicator?: string }
}) {
  const { dir } = useLocale()
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full", trackColors[color], className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        // Fills from the start (the left, or the right in Arabic) when it first shows, then follows its value.
        className={cn(
          "h-full w-full flex-1 animate-in rounded-full transition-all duration-(--duration-considered) ease-enter slide-in-from-start-full motion-reduce:animate-none",
          barColors[color],
          classNames?.indicator
        )}
        style={{ transform: `translateX(${dir === "rtl" ? "" : "-"}${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
