"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type SparklineProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The values, oldest first. */
  data: number[]
  /** A line, a line with a soft fill under it, or bars. */
  variant?: "line" | "area" | "bar"
  /** Mark the latest value with a dot (line and area). */
  showLast?: boolean
  /** Lowest and highest values of the scale; by default the data's own. Set min={0} to start the scale at zero. */
  min?: number
  max?: number
  /** What the trend shows, read by screen readers, e.g. "Revenue, last 30 days: rising from $1.2K to $2.4K". */
  "aria-label"?: string
}

const W = 100
const H = 100

/**
 * A tiny chart without axes, for a trend next to a number (in a MetricCard, a table cell). It fills its box: size it
 * with className ("h-8 w-24"), color it with a text color ("text-success"). Draws itself in when it first shows.
 */
function Sparkline({ data, variant = "line", showLast = false, min, max, className, "aria-label": ariaLabel, ...props }: SparklineProps) {
  const { t } = useLocale()
  const [drawn, setDrawn] = React.useState(false)
  React.useEffect(() => setDrawn(true), [])

  const low = min ?? Math.min(...data)
  const high = max ?? Math.max(...data)
  const span = high - low || 1
  const x = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * W : W / 2)
  const y = (v: number) => H - ((v - low) / span) * H
  const label = ariaLabel ?? (data.length ? t("trend", { from: data[0], to: data.at(-1) }) : t("noData"))

  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ")
  const last = data.length ? { left: (x(data.length - 1) / W) * 100, top: (y(data.at(-1)!) / H) * 100 } : null

  return (
    <div data-slot="sparkline" role="img" aria-label={label} className={cn("relative h-8 w-full text-primary", className)} {...props}>
      {/* Lines and areas are revealed left to right (a clip that opens), which works however the chart is stretched. */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn(
          "size-full overflow-visible",
          variant !== "bar" && "transition-[clip-path] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
        )}
        style={variant !== "bar" ? { clipPath: drawn ? "inset(-4px -4px -4px -4px)" : "inset(-4px 100% -4px -4px)" } : undefined}
        aria-hidden
      >
        {variant === "bar"
          ? data.map((v, i) => {
              const width = W / data.length
              const base = y(Math.max(low, Math.min(0, high)))
              const top = y(v)
              return (
                <rect
                  key={i}
                  x={i * width + width * 0.15}
                  width={width * 0.7}
                  y={Math.min(top, base)}
                  height={Math.max(Math.abs(base - top), 1)}
                  rx={1}
                  fill="currentColor"
                  className="origin-bottom transition-transform duration-(--duration-considered) ease-spring motion-reduce:transition-none"
                  style={{ transform: drawn ? undefined : "scaleY(0)", transformBox: "fill-box", transitionDelay: `${i * 15}ms` }}
                />
              )
            })
          : data.length > 1 && (
              <>
                {variant === "area" && (
                  <path d={`${line} L${W},${H} L0,${H} Z`} fill="currentColor" opacity={0.14} />
                )}
                <path
                  d={line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
      </svg>
      {/* The dot is HTML, so it stays round however the chart is stretched. */}
      {showLast && last && variant !== "bar" && (
        <span
          aria-hidden
          className="absolute size-2 -translate-1/2 rounded-full bg-current ring-2 ring-card transition-[opacity,scale] delay-(--duration-considered) duration-(--duration-standard) ease-spring motion-reduce:delay-0 motion-reduce:transition-none"
          // It pops in once the line has reached it.
          style={{ left: `${last.left}%`, top: `${last.top}%`, opacity: drawn ? 1 : 0, scale: drawn ? "1" : "0.4" }}
        />
      )}
    </div>
  )
}

export { Sparkline }
