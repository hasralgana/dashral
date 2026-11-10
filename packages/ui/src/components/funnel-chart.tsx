"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { enterMotion, riseMotion, stagger, useCountTo } from "../lib/motion"
import { cn } from "../lib/utils"
import { TextReveal } from "./text-reveal"

export type FunnelChartDatum = {
  /** A stable key; the label is used without one. */
  key?: string
  label: string
  value: number
}

type FunnelChartProps = Omit<React.ComponentProps<"div">, "children" | "color"> & {
  /** The steps in order, the first the widest: visits, carts, checkouts, payments. */
  data: FunnelChartDatum[]
  /** The bars' height at the first step, in pixels. */
  height?: number
  /** Any CSS color for the bars; by default the theme's first chart color. */
  color?: string
  /** What the percentage under each value is of: the first step (the default), or the step before. */
  percent?: "first" | "previous"
  /** What dropped since the step before, written in the space above each bar. */
  showLost?: boolean
  /** BCP 47 locale for values and percentages. */
  locale?: string
  /** How values are written, e.g. `{ notation: "compact" }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** What the chart shows, e.g. "Checkout funnel". */
  "aria-label"?: string
  classNames?: { step?: string; bar?: string }
}

/** A bar takes this share of its column; the rest is the flow to the next step. */
const BAR = 0.56
/** The rounding of a bar's top (or of the "lost" space above it), in pixels. */
const RADIUS = 6

/** A number that counts to its new value when the data changes (as MetricCard's does), written with `format`. */
function Count({ value, format }: { value: number; format: Intl.NumberFormat }) {
  return format.format(useCountTo(value))
}

/** The step's value: it rises into its line with its bar on arrival, then counts to each new value. */
function RevealedCount({ value, format, delay }: { value: number; format: Intl.NumberFormat; delay: number }) {
  const shown = useCountTo(value)
  return (
    <TextReveal as="span" variant="rise" trigger="mount" delay={delay} className="block truncate text-base font-semibold tabular-nums">
      {format.format(shown)}
    </TextReveal>
  )
}

/**
 * Conversion step by step, in one tag: `<FunnelChart data={steps} />`. Each step is a column with its value and its
 * share written out; between the bars the flow narrows to the next step, and the space above a bar says how many
 * dropped there. Plain HTML and SVG, fills its container's width; the bars rise in one after another, and new data
 * eases them to their heights while the numbers count to theirs.
 */
function FunnelChart({
  data,
  height = 200,
  color = "var(--chart-1)",
  percent: percentOf = "first",
  showLost = true,
  locale: localeProp,
  formatOptions,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: FunnelChartProps) {
  const { t, locale: contextLocale, dir } = useLocale()
  const locale = localeProp ?? contextLocale
  const format = new Intl.NumberFormat(locale, formatOptions)
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 })
  const values = data.map((d) => Math.max(0, d.value))
  const full = Math.max(0, ...values)
  // The top of a step's bar, in pixels from the top of the plot.
  const top = (i: number) => (full ? height - (values[i]! / full) * height : height)
  const share = (part: number, whole: number) => percent.format(whole ? part / whole : 0)

  if (data.length === 0) {
    return (
      <div data-slot="funnel-chart" className={cn("grid place-items-center text-sm text-muted-foreground", className)} style={{ height }} {...props}>
        {t("noData")}
      </div>
    )
  }

  return (
    <div data-slot="funnel-chart" role="figure" aria-label={ariaLabel ?? t("funnelChart")} className={cn("w-full", className)} {...props}>
      {/* Columns share their rows (subgrid), so the bars stand on one line whatever the labels wrap to. */}
      <ol className="grid grid-rows-[auto_auto] gap-x-0 gap-y-3" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d, i) => {
          const value = values[i]!
          const previous = i > 0 ? values[i - 1]! : undefined
          const lost = previous === undefined ? 0 : Math.max(0, previous - value)
          const base = percentOf === "previous" && previous !== undefined ? previous : values[0]!
          const barTop = top(i)
          const lostTop = previous === undefined ? barTop : top(i - 1)
          const left = ((1 - BAR) / 2) * 100
          const right = 100 - left
          // A bar's top is rounded unless a "lost" space sits on it. The flow starts and ends at the bars' tops, tucked behind them
          // from their middles, so a rounded corner sits in it like a square one does.
          const squared = (k: number) => showLost && k > 0 && values[k - 1]! > values[k]!
          const corner = (k: number) => (squared(k) ? 0 : Math.min(RADIUS, height - top(k)))
          const nextTop = i < data.length - 1 ? top(i + 1) : null
          const end = 100 + left
          const middle = (right + end) / 2
          return (
            <li key={d.key ?? d.label} className={cn("row-span-2 grid grid-rows-subgrid", classNames?.step)}>
              <div className="grid min-w-0 content-start gap-0.5 px-1 text-center">
                <span className={cn(enterMotion, "truncate text-xs text-muted-foreground")} style={stagger(i, 60)}>
                  {d.label}
                </span>
                <RevealedCount value={d.value} format={format} delay={i * 60} />
                <span className={cn(enterMotion, "truncate text-xs text-muted-foreground tabular-nums")} style={stagger(i + 1, 60)}>
                  <Count value={base ? value / base : 0} format={percent} />
                </span>
                {/* Read out: what's lost here, and how many of the step before carried on. */}
                {previous !== undefined && (
                  <span className="sr-only">{t("funnelFrom", { rate: share(value, previous), from: data[i - 1]!.label, lost: format.format(lost) })}</span>
                )}
              </div>

              <div aria-hidden className="relative" style={{ height }}>
                {/* The flow from this bar's top down to the next one's, drawn in one piece across the column edge (columns are
                    equal, so 100 + left lands on the next bar); mirrored in right-to-left, where the steps run leftwards. */}
                <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className={cn(enterMotion, "absolute inset-0 overflow-visible", dir === "rtl" && "-scale-x-100")} style={stagger(i + 1, 60)}>
                  {nextTop !== null && (
                    <path
                      // An S-curve, level where it leaves one bar and where it meets the next.
                      d={`M50,${barTop}L${right},${barTop}C${middle},${barTop} ${middle},${nextTop} ${end},${nextTop}L150,${nextTop}L150,${height}L50,${height}Z`}
                      fill={color}
                      fillOpacity={0.12}
                      className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                    />
                  )}
                </svg>

                {/* What dropped since the step before: the space between that step's height and this bar. */}
                {showLost && previous !== undefined && lost > 0 && (
                  <div
                    className="@container absolute grid place-items-center overflow-hidden border border-b-0 border-dashed border-muted-foreground/35 text-[11px] text-muted-foreground tabular-nums transition-[top,height] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                    style={{ left: `${left}%`, right: `${left}%`, top: lostTop, height: barTop - lostTop, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }}
                  >
                    {barTop - lostTop >= 18 && <span className="truncate px-0.5 @max-[3.75rem]:px-0 @max-[3.75rem]:text-[10px]">
                        −<Count value={lost} format={format} />
                      </span>}
                  </div>
                )}

                {/* The bar; it eases to its new height when the data changes. Under a "lost" space its top stays square. */}
                <div
                  className={cn("absolute bottom-0 overflow-hidden transition-[top] duration-(--duration-considered) ease-standard motion-reduce:transition-none")}
                  style={{ left: `${left}%`, right: `${left}%`, top: barTop, borderTopLeftRadius: corner(i), borderTopRightRadius: corner(i) }}
                >
                  <div
                    className={cn(riseMotion, "h-full", classNames?.bar)}
                    style={{ background: color, ...stagger(i, 60) }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export { FunnelChart, type FunnelChartProps }
