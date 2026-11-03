"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type GaugeProps = Omit<React.ComponentProps<"div">, "children"> & {
  value: number
  min?: number
  max?: number
  /** Under the number, e.g. "Uptime". Also the meter's accessible name unless aria-label is set. */
  label?: string
  /** How the number is written, e.g. `{ style: "percent" }` (then pass 0.82 for 82%) or `{ maximumFractionDigits: 0 }`. */
  formatOptions?: Intl.NumberFormatOptions
  locale?: string
  /** Width in pixels; the height is about half of it. */
  size?: number
  thickness?: number
  /**
   * Colors by level, lowest first: the last one the value reaches wins, e.g.
   * `[{ from: 0, className: "text-destructive" }, { from: 60, className: "text-warning" }, { from: 85, className: "text-success" }]`.
   * Without it, the arc takes the text color (text-primary by default).
   */
  levels?: { from: number; className: string }[]
}

/**
 * A single value within a known range, as a half ring — a score, a quota, a target. It's a `meter` for assistive
 * technology, with the formatted value as its text. The arc fills from empty when it first shows.
 */
function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  formatOptions,
  locale: localeProp,
  size = 180,
  thickness = 14,
  levels,
  className,
  "aria-label": ariaLabel,
  ...props
}: GaugeProps) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const [drawn, setDrawn] = React.useState(false)
  React.useEffect(() => setDrawn(true), [])

  const share = Math.min(1, Math.max(0, (value - min) / (max - min || 1)))
  const text = new Intl.NumberFormat(locale, formatOptions).format(value)
  const level = levels?.filter((l) => value >= l.from).at(-1)
  const r = (size - thickness) / 2
  const cy = size / 2
  const arc = `M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${cy}`

  return (
    <div
      data-slot="gauge"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={text}
      aria-label={ariaLabel ?? label}
      className={cn("inline-flex flex-col items-center text-primary", level?.className, className)}
      style={{ width: size }}
      {...props}
    >
      <div className="relative">
        <svg width={size} height={cy + thickness / 2} viewBox={`0 0 ${size} ${cy + thickness / 2}`} aria-hidden>
          <path d={arc} fill="none" stroke="var(--muted)" strokeWidth={thickness} strokeLinecap="round" />
          <path
            d={arc}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${drawn ? share * 100 : 0} 100`}
            className="transition-[stroke-dasharray] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
            // A zero-length round cap still draws a dot; hide it at 0.
            style={{ opacity: share === 0 ? 0 : 1 }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center leading-tight" aria-hidden>
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{text}</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      </div>
      <div className="mt-1 flex w-full justify-between px-1 text-[11px] text-muted-foreground tabular-nums" aria-hidden>
        <span>{new Intl.NumberFormat(locale, formatOptions).format(min)}</span>
        <span>{new Intl.NumberFormat(locale, formatOptions).format(max)}</span>
      </div>
    </div>
  )
}

export { Gauge }
