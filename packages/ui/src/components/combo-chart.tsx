"use client"

import * as React from "react"

import {
  barPath,
  type CartesianChartProps,
  ChartAxes,
  ChartLegend,
  ChartReading,
  type Curve,
  linePath,
  type RightAxisProps,
  seriesColor,
  useCartesianChart,
} from "../lib/chart"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type ComboChartProps = Omit<React.ComponentProps<"div">, "children"> &
  CartesianChartProps &
  RightAxisProps & {
    /** How a line bends between points: smoothly (never past a value it didn't have), straight, or in steps. */
    curve?: Curve
    /** Corner radius of a bar's end, in pixels. */
    radius?: number
    classNames?: { legend?: string; tooltip?: string }
  }

/**
 * Bars and lines on one chart, in one tag: revenue as bars and margin as a line, orders as bars and a target as a
 * dashed line. Each series says what it is (`type: "bar"`, the default, or `"line"`), and a line of another kind of
 * value reads against an axis of its own on the right (`axis: "right"`), whose ticks fall on the same grid lines.
 * Hover, or focus it and use the arrow keys, to read a column: the other bars fade back, the lines show a dot, and a
 * tooltip lists every series. Plain SVG, fills its container's width; bars grow up from the axis and lines draw in
 * from the left when it first shows, and both move to new data.
 */
function ComboChart({
  data,
  index,
  labelKey,
  series,
  height,
  locale,
  formatOptions,
  rightFormatOptions,
  alignZero,
  timeFormat,
  showLegend,
  showGrid,
  showYAxis,
  curve = "smooth",
  radius = 4,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: ComboChartProps) {
  const { t } = useLocale()
  // Bars by default: a series is a line only when it says so.
  const typed = React.useMemo(() => series.map((s) => ({ ...s, type: s.type ?? ("bar" as const) })), [series])
  const h = useCartesianChart({
    data,
    index,
    labelKey,
    series: typed,
    height,
    locale,
    formatOptions,
    rightFormatOptions,
    alignZero,
    timeFormat,
    showLegend,
    showGrid,
    showYAxis,
    band: true,
    axes: true,
    "aria-label": ariaLabel,
    roledescription: t("comboChart"),
  })
  const n = data.length
  const bars = typed.map((s, k) => ({ s, k })).filter(({ s }) => s.type === "bar")
  const lines = typed.map((s, k) => ({ s, k })).filter(({ s }) => s.type === "line")
  // Each column takes most of its slot; its bars stand side by side in it with a little gap, as in BarChart.
  const group = Math.min(h.slot * 0.7, 36 * bars.length + 4 * Math.max(0, bars.length - 1))
  const gap = bars.length > 1 ? Math.min(4, group * 0.08) : 0
  const bar = bars.length ? (group - gap * (bars.length - 1)) / bars.length : 0
  const zero = h.y(Math.max(h.ticks[0]!, Math.min(0, h.ticks.at(-1)!)))

  return (
    <div data-slot="combo-chart" {...h.root} className={cn("grid gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)} {...props}>
      {h.showLegend && <ChartLegend series={typed} className={classNames?.legend} />}

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
                    {bars.map(({ s, k }, j) => {
                      const end = h.yFor(k, cells[k]!.value)
                      return (
                        <path
                          key={s.key}
                          d={barPath(Math.round(left + j * (bar + gap)), Math.max(1, Math.round(bar)), zero, h.drawn ? end : zero, radius)}
                          fill={seriesColor(s, k)}
                          className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                        />
                      )
                    })}
                  </g>
                )
              })}
            </svg>

            {/* The lines over the bars, drawn in from the left when the chart first shows; new data moves them. */}
            <svg
              aria-hidden
              width={h.width}
              height={h.height}
              className="pointer-events-none absolute inset-0 overflow-visible transition-[clip-path] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
              style={{ clipPath: h.drawn ? "inset(-8px -8px -8px -8px)" : `inset(0 ${h.width}px 0 0)` }}
            >
              {lines.map(({ s, k }) => {
                const points = h.columns.map((cells, i) => ({ x: h.x(i), y: h.yFor(k, cells[k]!.value) }))
                return (
                  <g key={s.key}>
                    <path
                      d={linePath(points, curve)}
                      fill="none"
                      stroke={seriesColor(s, k)}
                      strokeWidth={s.dashed ? 1.5 : 2}
                      strokeDasharray={s.dashed ? "4 4" : undefined}
                      strokeOpacity={s.dashed ? 0.7 : 1}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                    />
                    {/* The point being read, on each line. */}
                    {h.active !== null && (
                      <circle cx={points[h.active]!.x} cy={points[h.active]!.y} r={4} fill="var(--background)" stroke={seriesColor(s, k)} strokeWidth={2} />
                    )}
                  </g>
                )
              })}
            </svg>

            <ChartReading chart={h} series={typed} band className={classNames?.tooltip} />
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

export { ComboChart, type ComboChartProps }
export type { ChartDatum, ChartSeries } from "../lib/chart"
