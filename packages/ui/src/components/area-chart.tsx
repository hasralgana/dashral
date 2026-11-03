"use client"

import * as React from "react"

import { areaPath, type CartesianChartProps, ChartAxes, ChartLegend, ChartReading, type Curve, linePath, seriesColor, useCartesianChart } from "../lib/chart"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type AreaChartProps = Omit<React.ComponentProps<"div">, "children"> &
  CartesianChartProps & {
    /** Stacks the series on one another, so the top line is their total. */
    stacked?: boolean
    /** How the line bends between points: smoothly (never past a value it didn't have), straight, or in steps. */
    curve?: Curve
    classNames?: { legend?: string; tooltip?: string }
  }

/**
 * Values over time as filled areas: one series, several side by side, or stacked into a total, with a dashed series
 * for a comparison (last year). Hover, or focus it and use the arrow keys, to read a point: a line marks it and a
 * tooltip lists every series there. The axis writes values compactly; the tooltip in full. Plain SVG, fills its
 * container's width; it draws in from the left when it first shows and moves to new data.
 */
function AreaChart({
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
  curve = "smooth",
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: AreaChartProps) {
  const { t } = useLocale()
  const id = React.useId().replace(/:/g, "")
  const h = useCartesianChart({ data, index, labelKey, series, height, locale, formatOptions, timeFormat, showLegend, showGrid, showYAxis, stacked, "aria-label": ariaLabel, roledescription: t("areaChart") })
  const n = data.length
  const points = (k: number, edge: "top" | "base") => h.columns.map((cell, i) => ({ x: h.x(i), y: h.y(cell[k]![edge]) }))

  return (
    <div data-slot="area-chart" {...h.root} className={cn("grid gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)} {...props}>
      {h.showLegend && <ChartLegend series={series} className={classNames?.legend} />}

      <div ref={h.box} dir="ltr" className="relative w-full touch-none select-none" style={{ height: h.height }} {...h.plot}>
        {h.width !== null && n > 0 && (
          <>
            <ChartAxes chart={h} band={false} />

            {/* The areas, drawn in from the left when the chart first shows; new data moves them to their new shape. */}
            <svg
              aria-hidden
              width={h.width}
              height={h.height}
              className="absolute inset-0 transition-[clip-path] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
              style={{ clipPath: h.drawn ? "inset(0 0 0 0)" : `inset(0 ${h.width}px 0 0)` }}
            >
              <defs>
                {series.map((s, k) => (
                  <linearGradient key={s.key} id={`${id}-${k}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={seriesColor(s, k)} stopOpacity={stacked ? 0.45 : 0.28} />
                    <stop offset="100%" stopColor={seriesColor(s, k)} stopOpacity={stacked ? 0.12 : 0} />
                  </linearGradient>
                ))}
              </defs>
              {series.map((s, k) => (
                <g key={s.key}>
                  {!s.dashed && (
                    <path
                      d={areaPath(points(k, "top"), stacked ? points(k, "base") : h.columns.map((_, i) => ({ x: h.x(i), y: h.y(Math.max(0, h.ticks[0]!)) })), curve)}
                      fill={`url(#${id}-${k})`}
                      className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                    />
                  )}
                  <path
                    d={linePath(points(k, "top"), curve)}
                    fill="none"
                    stroke={seriesColor(s, k)}
                    strokeWidth={s.dashed ? 1.5 : 2}
                    strokeDasharray={s.dashed ? "4 4" : undefined}
                    strokeOpacity={s.dashed ? 0.7 : 1}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="transition-[d] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
                  />
                </g>
              ))}
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

export { AreaChart, type AreaChartProps }
export type { ChartDatum, ChartSeries } from "../lib/chart"
