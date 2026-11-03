"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { animate, motion, useMotionValue } from "motion/react"
import type { Progress as KitProgress } from "@dashral/ui/components/progress"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type ProgressProps = React.ComponentProps<typeof KitProgress> & {
  /** The percentage at the end of the bar, on odometer wheels. */
  showValue?: boolean
}

type ControlColor = NonNullable<ProgressProps["color"]>

// The track and the bar, as the kit's Progress has them. Every class is written out in full so Tailwind finds it.
const trackColors: Record<ControlColor, string> = {
  primary: "bg-primary/15",
  neutral: "bg-foreground/15",
  info: "bg-info/15",
  success: "bg-success/15",
  warning: "bg-warning/15",
  destructive: "bg-destructive/15",
  highlight: "bg-highlight/15",
}
const barColors: Record<ControlColor, string> = {
  primary: "bg-primary",
  neutral: "bg-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  highlight: "bg-highlight",
}

/**
 * The kit's Progress with motion: the same value, max, colors and props. The bar glides to each new value on a spring
 * (filling from the start when it first shows), a value of null runs a highlight back and forth for work of unknown
 * length, and reaching the end sends a shine across the bar once. `showValue` puts the percentage at its end, on
 * odometer wheels. With reduced motion the bar moves at once and nothing shines or runs.
 */
export function Progress({ className, classNames, color = "primary", value, max = 100, showValue = false, ...props }: ProgressProps) {
  const reduced = useReducedMotion()
  const { dir, locale } = useLocale()
  const known = value !== null && value !== undefined
  const share = known ? Math.min(1, Math.max(0, value / max)) : 0

  // How full it shows: from empty when it first appears, then gliding to each new value.
  const fill = useMotionValue(0)
  const done = known && share >= 1
  const [shines, setShines] = React.useState(0)
  React.useEffect(() => {
    if (reduced) return fill.jump(share)
    const controls = animate(fill, share, { ...spring.glide, visualDuration: duration.considered * 1.2 })
    return () => controls.stop()
  }, [fill, share, reduced])
  // One shine each time it reaches the end, not on every render there.
  const [wasDone, setWasDone] = React.useState(done)
  if (wasDone !== done) {
    setWasDone(done)
    if (done) setShines(shines + 1)
  }

  const percent = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale])
  const start = dir === "rtl" ? "right" : "left"

  const bar = (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full", trackColors[color], className)}
      value={value}
      max={max}
      {...props}
    >
      {/* Keyed apart: the running highlight's position mustn't carry over to the bar when the length becomes known. */}
      {known ? (
        <ProgressPrimitive.Indicator key="known" asChild>
          <motion.div
            data-slot="progress-indicator"
            className={cn("absolute inset-0 rounded-full", barColors[color], classNames?.indicator)}
            style={{ scaleX: fill, transformOrigin: start }}
          >
            {shines > 0 && !reduced && (
              // The shine: a soft band of light crossing the full bar once.
              <motion.span
                key={shines}
                aria-hidden
                className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/60 to-transparent"
                initial={{ [start]: "-35%" }}
                animate={{ [start]: "110%" }}
                transition={{ duration: duration.considered * 1.4, ease: ease.standard, delay: duration.considered }}
              />
            )}
          </motion.div>
        </ProgressPrimitive.Indicator>
      ) : (
        <ProgressPrimitive.Indicator key="running" asChild>
          {/* Unknown length: a highlight running back and forth along the track. */}
          <motion.div
            data-slot="progress-indicator"
            className={cn("absolute inset-y-0 w-2/5 rounded-full", barColors[color], classNames?.indicator)}
            initial={{ [start]: "-40%" }}
            animate={reduced ? { [start]: "30%" } : { [start]: ["-40%", "100%"] }}
            transition={reduced ? { duration: 0 } : { duration: 1.4, ease: ease.standard, repeat: Infinity, repeatType: "loop" }}
          />
        </ProgressPrimitive.Indicator>
      )}
    </ProgressPrimitive.Root>
  )

  if (!showValue) return bar
  return (
    <div className="flex w-full items-center gap-3">
      {bar}
      <span aria-hidden className="min-w-10 text-end text-xs font-medium text-muted-foreground tabular-nums">
        {known ? <Odometer value={share} format={percent} className="justify-end" /> : "…"}
      </span>
    </div>
  )
}
