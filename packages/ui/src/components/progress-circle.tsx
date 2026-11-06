"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type ControlColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The ring's color; the track behind it is a pale version. Every class is written out in full so Tailwind finds it.
const ringColors: Record<ControlColor, string> = {
  primary: "text-primary",
  neutral: "text-foreground",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  highlight: "text-highlight",
}

type ProgressCircleProps = Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "color" | "children"> & {
  /** 0–100; null (or left out) for indeterminate: an arc that spins. */
  value?: number | null
  /** The ring's color; the track is a pale version of it. */
  color?: ControlColor
  /** Width and height in pixels. */
  size?: number
  /** The ring's thickness in pixels. */
  thickness?: number
  /** The percentage in the middle, written in the locale ("64%", "٦٤٪"). */
  showValue?: boolean
  /** Anything in the middle instead, e.g. an icon or "3/5". */
  children?: React.ReactNode
  classNames?: { track?: string; indicator?: string; value?: string }
}

/**
 * Progress as a ring, for a small space: a file's upload in a list, a step in a checklist, a quota on a card. The same
 * progressbar as Progress for assistive technology; label it with aria-label.
 */
function ProgressCircle({
  value = null,
  color = "primary",
  size = 40,
  thickness = 4,
  showValue = false,
  children,
  className,
  classNames,
  style,
  ...props
}: ProgressCircleProps) {
  const { locale } = useLocale()
  // Starts empty and fills to its value once on screen, as Gauge does.
  const [drawn, setDrawn] = React.useState(false)
  React.useEffect(() => setDrawn(true), [])
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const indeterminate = value === null || value === undefined
  const clamped = indeterminate ? 0 : Math.min(100, Math.max(0, value))
  // Indeterminate: a quarter of the ring, spinning.
  const offset = indeterminate ? circumference * 0.75 : circumference * (1 - (drawn ? clamped : 0) / 100)
  const center = children ?? (showValue && !indeterminate ? new Intl.NumberFormat(locale, { style: "percent" }).format(clamped / 100) : null)

  return (
    <ProgressPrimitive.Root
      data-slot="progress-circle"
      value={indeterminate ? null : clamped}
      className={cn("relative inline-grid shrink-0 place-items-center", ringColors[color], className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn(
          "col-start-1 row-start-1 -rotate-90",
          indeterminate && "animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]"
        )}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className={cn("opacity-15", classNames?.track)}
        />
        <circle
          data-slot="progress-circle-indicator"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          // A zero-length round cap still draws a dot; hide it at 0.
          opacity={!indeterminate && (!drawn || clamped === 0) ? 0 : 1}
          className={cn("transition-[stroke-dashoffset] duration-(--duration-considered) ease-enter motion-reduce:transition-none", classNames?.indicator)}
        />
      </svg>
      {center !== null && (
        <span
          className={cn(
            "col-start-1 row-start-1 text-foreground tabular-nums",
            size < 48 ? "text-[10px] font-medium" : size < 80 ? "text-xs font-medium" : "text-base font-semibold",
            classNames?.value
          )}
        >
          {center}
        </span>
      )}
    </ProgressPrimitive.Root>
  )
}

export { ProgressCircle, type ProgressCircleProps }
