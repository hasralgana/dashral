"use client"

import * as React from "react"

import { type CartesianChartProps, ChartAxes, ChartLegend, ChartReading, seriesColor, useCartesianChart } from "../lib/chart"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type BarChartProps = Omit<React.ComponentProps<"div">, "children"> &
  CartesianChartProps & {
    /** Stacks the series in one bar, so its height is their total; otherwise they stand side by side. */
    stacked?: boolean
    /** Corner radius of a bar's end, in pixels. */
    radius?: number
    classNames?: { legend?: string; tooltip?: string }
  }

/**
 * A bar with its end rounded, from the zero line `base` to `end` (above it, or below for a negative value). Its far
 * end is rounded; the end on the zero line stays square.
 */
function barPath(x: number, w: number, base: number, end: number, radius: number) {
  const up = end <= base
  const h = Math.abs(base - end)
  const r = Math.max(0, Math.min(radius, h, w / 2))
  const far = end
  const sign = up ? 1 : -1
  return [
    `M${x},${base}`,
    `V${far + sign * r}`,
    `Q${x},${far} ${x + r},${far}`,
    `H${x + w - r}`,
    `Q${x + w},${far} ${x + w},${far + sign * r}`,
    `V${base}`,
    "Z",
  ].join("")
}

/**
 * Values compared across categories or periods as bars: one series, several side by side, or stacked into a total.
 * Hover, or focus it and use the arrow keys, to read a column: the other bars fade back and a tooltip lists every
 * series there.
 * The axis writes values compactly; the tooltip in full. Plain SVG, fills its container's width; the bars grow up
 * from the axis when it first shows and to their new heights when the data changes.
 */
function BarChart({
  data,
  index,
  labelKey,
  series,
  height,
  locale,
  formatOptions,
  timeFormat,
  showLegend,
  showGrid,
  showYAxis,
  stacked = false,
  radius = 4,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: BarChartProps) {
  const { t } = useLocale()
  const h = useCartesianChart({
    data,
    index,
    labelKey,
    series,
    height,
    locale,
    formatOptions,
    timeFormat,
    showLegend,
    showGrid,
    showYAxis,
    stacked,
    band: true,
    "aria-label": ariaLabel,
    roledescription: t("barChart"),
  })
  const n = data.length
  // Each column takes most of its slot; side by side, its bars share it with a little gap between them.
  const group = Math.min(h.slot * 0.7, stacked ? 48 : 36 * series.length + 4 * (series.length - 1))
  const gap = stacked || series.length === 1 ? 0 : Math.min(4, group * 0.08)
  const bar = stacked ? group : (group - gap * (series.length - 1)) / series.length
  const zero = h.y(Math.max(h.ticks[0]!, Math.min(0, h.ticks.at(-1)!)))

  return (
    <div data-slot="bar-chart" {...h.root} className={cn("grid gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)} {...props}>
      {h.showLegend && <ChartLegend series={series} className={classNames?.legend} />}

      <div ref={h.box} dir="ltr" className="relative w-full touch-none select-none" style={{ height: h.height }} {...h.plot}>
        {h.width !== null && n > 0 && (
          <>
            <ChartAxes chart={h} band />

            {/* The bars, growing up from the axis when the chart first shows and to new heights when the data changes. */}
            <svg aria-hidden width={h.width} height={h.height} className="pointer-events-none absolute inset-0">
              {h.columns.map((cells, i) => {
                const left = h.x(i) - group / 2
                return (
                  // The column being read keeps its color; the others fade back.
                  <g key={i} opacity={h.active === null || h.active === i ? 1 : 0.4} className="transition-opacity duration-(--duration-fast)">
                    {series.map((s, k) => {
                      const cell = cells[k]!
                      const x = stacked ? left : left + k * (bar + gap)
                      // A stacked segment starts a pixel above the one under it, so the parts read apart.
                      const base = stacked ? h.y(cell.base) - (k > 0 ? 1 : 0) : zero
                      const end = h.y(stacked ? cell.top : cell.value)
                      // Only the top segment of a stack is rounded.
                      const isTop = !stacked || cells.slice(k + 1).every((c) => c.value === 0)
                      return (
                        <path
                          key={s.key}
                          d={barPath(Math.round(x), Math.max(1, Math.round(bar)), base, h.drawn ? end : base, isTop ? radius : 0)}
                          fill={seriesColor(s, k)}
                          className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                        />
                      )
                    })}
                  </g>
                )
              })}
            </svg>

            <ChartReading chart={h} series={series} band className={classNames?.tooltip} />
          </>
        )}
        {n === 0 && <p className="grid h-full place-items-center text-sm text-muted-foreground">{t("noData")}</p>}
      </div>
      <p aria-live="polite" className="sr-only">
        {h.announce}
      </p>
    </div>
  )
}

export { BarChart, type BarChartProps }
export type { ChartDatum, ChartSeries } from "../lib/chart"
