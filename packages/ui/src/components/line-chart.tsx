"use client"

import * as React from "react"

import { type CartesianChartProps, ChartAxes, ChartLegend, ChartReading, type Curve, linePath, seriesColor, useCartesianChart } from "../lib/chart"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type LineChartProps = Omit<React.ComponentProps<"div">, "children"> &
  CartesianChartProps & {
    /** How the line bends between points: smoothly (never past a value it didn't have), straight, or in steps. */
    curve?: Curve
    /** A dot on every point, not only the one being read. */
    showDots?: boolean
    /** Starts the axis at zero. Off by default: a line shows change, so the axis fits the values. */
    startAtZero?: boolean
    classNames?: { legend?: string; tooltip?: string }
  }

/**
 * Values over time as lines: one or several, with dashed ones for comparisons (a target, last year). The axis fits
 * the values unless it's asked to start at zero, so small changes show. Hover, or focus it and use the arrow keys, to
 * read a point: a line marks it and a tooltip lists every series there. Plain SVG, fills its container's width; it
 * draws in from the left when it first shows and moves to new data.
 */
function LineChart({
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
  curve = "smooth",
  showDots = false,
  startAtZero = false,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: LineChartProps) {
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
    zero: startAtZero,
    "aria-label": ariaLabel,
    roledescription: t("lineChart"),
  })
  const n = data.length

  return (
    <div data-slot="line-chart" {...h.root} className={cn("grid gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)} {...props}>
      {h.showLegend && <ChartLegend series={series} className={classNames?.legend} />}

      <div ref={h.box} dir="ltr" className="relative w-full touch-none select-none" style={{ height: h.height }} {...h.plot}>
        {h.width !== null && n > 0 && (
          <>
            <ChartAxes chart={h} band={false} />

            {/* The lines, drawn in from the left when the chart first shows; new data moves them to their new shape. */}
            <svg
              aria-hidden
              width={h.width}
              height={h.height}
              className="absolute inset-0 overflow-visible transition-[clip-path] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
              style={{ clipPath: h.drawn ? "inset(-8px -8px -8px -8px)" : `inset(0 ${h.width}px 0 0)` }}
            >
              {series.map((s, k) => {
                const points = h.columns.map((cell, i) => ({ x: h.x(i), y: h.y(cell[k]!.value) }))
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
                    {showDots &&
                      !s.dashed &&
                      points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--background)" stroke={seriesColor(s, k)} strokeWidth={1.5} />)}
                  </g>
                )
              })}
            </svg>

            <ChartReading chart={h} series={series} band={false} className={classNames?.tooltip} />
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

export { LineChart, type LineChartProps }
export type { ChartDatum, ChartSeries } from "../lib/chart"
