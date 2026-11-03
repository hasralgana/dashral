"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

export type DonutChartDatum = {
  label: string
  value: number
  /** Any CSS color; by default the theme's chart colors in order (--chart-1 … --chart-5). */
  color?: string
}

type DonutChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  data: DonutChartDatum[]
  /** Diameter in pixels. */
  size?: number
  /** Ring width in pixels. */
  thickness?: number
  /** In the middle, e.g. the total. Hovering a slice or its legend row shows that slice there instead. */
  children?: React.ReactNode
  /** A list of slices with their values and shares beside the ring. */
  showLegend?: boolean
  /** BCP 47 locale for values and percentages. */
  locale?: string
  /** How values are written, e.g. `{ style: "currency", currency: "USD" }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** What the chart shows, e.g. "Sales by channel". */
  "aria-label"?: string
}

const colorAt = (i: number) => `var(--chart-${(i % 5) + 1})`

/**
 * Parts of a whole as a ring — best with two to five slices (more read better as a bar chart). The legend lists every
 * value, so nothing depends on telling colors apart. Slices sweep in when it first shows.
 */
function DonutChart({
  data,
  size = 160,
  thickness = 20,
  children,
  showLegend = true,
  locale: localeProp,
  formatOptions,
  className,
  "aria-label": ariaLabelProp,
  ...props
}: DonutChartProps) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const ariaLabel = ariaLabelProp ?? t("donutChart")
  const [drawn, setDrawn] = React.useState(false)
  const [active, setActive] = React.useState<number | null>(null)
  React.useEffect(() => setDrawn(true), [])

  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0)
  const format = new Intl.NumberFormat(locale, formatOptions)
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 })
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  // A small gap between slices, unless there's only one.
  const gap = data.filter((d) => d.value > 0).length > 1 ? Math.min(3, circumference / 100) : 0

  let offset = 0
  const slices = data.map((d, i) => {
    const length = total ? (Math.max(0, d.value) / total) * circumference : 0
    const slice = { ...d, i, color: d.color ?? colorAt(i), start: offset, length }
    offset += length
    return slice
  })
  const highlighted = active === null ? null : slices[active]

  return (
    <div data-slot="donut-chart" className={cn("flex flex-wrap items-center gap-6", className)} {...props}>
      {/* Centered when the legend wraps under it; beside the legend, the legend takes the room. */}
      <div className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={ariaLabel}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {slices.map((s) =>
            s.length > 0 ? (
              <circle
                key={s.i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${drawn ? Math.max(0, s.length - gap) : 0} ${circumference}`}
                strokeDashoffset={-s.start}
                // Length and start both ease, so slices slide to new sizes together when the data changes.
                className="transition-[stroke-dasharray,stroke-dashoffset,opacity] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
                style={{ opacity: active === null || active === s.i ? 1 : 0.35 }}
                onPointerEnter={() => setActive(s.i)}
                onPointerLeave={() => setActive(null)}
              >
                <title>{`${s.label}: ${format.format(s.value)} (${percent.format(total ? s.value / total : 0)})`}</title>
              </circle>
            ) : null
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
          {highlighted ? (
            <>
              <span className="text-lg font-semibold tabular-nums">{format.format(highlighted.value)}</span>
              <span className="max-w-[70%] truncate text-xs text-muted-foreground">{highlighted.label}</span>
            </>
          ) : (
            children
          )}
        </div>
      </div>
      {/* Beside the ring when there's room for it, under it on a narrow screen. */}
      <ul className={cn("grid min-w-0 grow basis-56 grid-cols-1 gap-2 text-sm", !showLegend && "sr-only")}>
        {slices.map((s) => (
          <li
            key={s.i}
            className="flex items-center gap-2 rounded-md px-1 transition-colors hover:bg-accent/60"
            onPointerEnter={() => setActive(s.i)}
            onPointerLeave={() => setActive(null)}
          >
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="font-medium tabular-nums">{format.format(s.value)}</span>
            <span className="w-12 text-end text-xs text-muted-foreground tabular-nums">{percent.format(total ? s.value / total : 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { DonutChart }
