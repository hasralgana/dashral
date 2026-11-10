"use client"

import { useState } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { riseMotion, stagger, useCountTo } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/** A bar: its label on the axis ("" for none), its full name when read, this period's value and the one before. */
export type Point = { label: string; long: string; value: number; previous: number }
/** A range on the switch: its label there, what the line compares with, and its bars. */
export type RevenueRange = { value: string; label: string; compare: string; points: Point[] }

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const year = [32, 35, 33, 41, 39, 44, 47, 45, 52, 56, 54, 61].map((value, i) => ({
  label: months[i]!,
  long: `${months[i]} 2026`,
  value: value * 1000,
  previous: [28, 30, 31, 33, 34, 36, 35, 38, 41, 43, 42, 47][i]! * 1000,
}))
const month = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  const wave = Math.sin(i / 2.2) * 260 + Math.cos(i / 5) * 180
  return {
    label: day % 5 === 0 || day === 1 ? String(day) : "",
    long: `Sep ${day}`,
    value: Math.round(1450 + i * 22 + wave),
    previous: Math.round(1380 + i * 12 + Math.sin(i / 3) * 200),
  }
})
const sampleRanges: RevenueRange[] = [
  { value: "year", label: "12 months", compare: "2025", points: year },
  { value: "month", label: "30 days", compare: "August", points: month },
]

/** A round top for the axis, and its four steps: 61,000 → 80,000. */
function niceScale(max: number) {
  const step = 10 ** Math.floor(Math.log10(max / 4))
  const top = Math.ceil(max / 4 / step) * step * 4
  return { top, ticks: [0, 1, 2, 3, 4].map((i) => (top / 4) * i) }
}

function change(now: number, before: number) {
  return ((now - before) / before) * 100
}

function Change({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", up ? "text-success-text" : "text-destructive-text", className)}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

/**
 * Revenue over a year or a month: bars for this period and a dashed line for the one before, on a round axis. Hover
 * a bar, or focus the chart and use the arrow keys, to read a point; the total and its change sit above it. Plain
 * SVG and divs, no chart library; with reduced motion the bars are simply there. Every part comes from props: your
 * ranges and their bars; with `range` and `onRangeChange` you load a range's bars as it's picked.
 */
export function RevenueChart({
  title = "Revenue",
  ranges = sampleRanges,
  range: rangeProp,
  onRangeChange,
  currency = "USD",
  locale = "en-US",
}: {
  title?: React.ReactNode
  ranges?: RevenueRange[]
  /** The range picked (the chart keeps it without it). */
  range?: string
  onRangeChange?: (range: string) => void
  currency?: string
  locale?: string
}) {
  const [ownRange, setOwnRange] = useState(ranges[0]?.value ?? "")
  const range = rangeProp ?? ownRange
  const [active, setActive] = useState<number | null>(null)
  const { points, compare } = ranges.find((r) => r.value === range) ?? ranges[0] ?? { points: [], compare: "" }
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 })
  const symbol = money.formatToParts(0).find((part) => part.type === "currency")?.value ?? ""
  // Axis labels by hand: Intl's compact notation differs between Node and browsers ("$0" vs "$0.0"), which breaks hydration.
  const axis = (value: number) => (value >= 1000 ? `${symbol}${+(value / 1000).toFixed(1)}k` : `${symbol}${value}`)

  const total = points.reduce((sum, p) => sum + p.value, 0)
  // A new period counts the total to its sum.
  const shownTotal = useCountTo(total)
  const previousTotal = points.reduce((sum, p) => sum + p.previous, 0)
  const { top, ticks } = niceScale(Math.max(1, ...points.flatMap((p) => [p.value, p.previous])))
  const shown = active === null ? null : points[active]!

  // The previous period as a line through the middle of each column, in a 0–100 box stretched to the plot.
  const line = points.map((p, i) => `${((i + 0.5) / points.length) * 100},${100 - (p.previous / top) * 100}`).join(" ")

  function onKeyDown(event: React.KeyboardEvent) {
    const last = points.length - 1
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }
    if (!(event.key in keys)) return
    event.preventDefault()
    // The plot runs right to left in Arabic; the arrows follow what you see.
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const step = keys[event.key]! * (rtl && Math.abs(keys[event.key]!) === 1 ? -1 : 1)
    setActive((i) => Math.min(last, Math.max(0, (i ?? (step > 0 ? -1 : last + 1)) + step)))
  }

  return (
    <section aria-labelledby="revenue-chart-title" className="bg-background p-4 sm:p-6">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="revenue-chart-title" className="text-sm font-medium text-muted-foreground">
              {title}
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">{money.format(shownTotal)}</span>
              <span className="text-sm text-muted-foreground">
                <Change value={change(total, previousTotal)} /> vs {compare}
              </span>
            </p>
          </div>
          <SegmentedControl
            aria-label="Range"
            value={range}
            onValueChange={(value) => {
              setOwnRange(value)
              onRangeChange?.(value)
              setActive(null)
            }}
            options={ranges.map(({ value, label }) => ({ value, label }))}
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px] bg-primary" /> This period
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="w-3.5 border-t-2 border-dashed border-muted-foreground/60" /> {compare}
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          {/* The axis: its labels sit on the grid lines. */}
          <div aria-hidden className="relative h-64 w-10 shrink-0 text-end text-[11px] text-muted-foreground tabular-nums">
            {ticks.map((tick) => (
              <span key={tick} className="absolute end-0 translate-y-1/2" style={{ bottom: `${(tick / top) * 100}%` }}>
                {axis(tick)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div
              role="group"
              tabIndex={0}
              aria-label={`Revenue by ${range === "year" ? "month" : "day"}. Use the arrow keys to read each one.`}
              onKeyDown={onKeyDown}
              onBlur={() => setActive(null)}
              onPointerLeave={() => setActive(null)}
              className="relative h-64 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-card"
            >
              {ticks.map((tick) => (
                <div
                  key={tick}
                  aria-hidden
                  className={cn("absolute inset-x-0 border-t", tick === 0 ? "border-border" : "border-dashed border-divider")}
                  style={{ bottom: `${(tick / top) * 100}%` }}
                />
              ))}

              {/* Keyed by the range, so a new set of bars rises in. */}
              <div key={range} className={cn("absolute inset-0 flex", range === "year" ? "gap-2 sm:gap-3" : "gap-0.5 sm:gap-1")}>
                {points.map((p, i) => (
                  <div key={p.long} className="relative flex h-full flex-1 items-end" onPointerEnter={() => setActive(i)}>
                    <div aria-hidden className={cn("absolute inset-x-0 inset-y-0 -mx-1 rounded-md transition-colors", active === i && "bg-muted/70")} />
                    <div className="relative h-full w-full overflow-hidden" style={{ height: `${(p.value / top) * 100}%` }}>
                      <div
                        className={cn(
                          riseMotion,
                          "size-full rounded-t-[4px] transition-colors",
                          active === null || active === i ? "bg-primary" : "bg-primary/40"
                        )}
                        style={stagger(i, range === "year" ? 35 : 12, 30)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible rtl:-scale-x-100">
                <polyline points={line} fill="none" className="stroke-muted-foreground/60" strokeWidth={2} strokeDasharray="4 4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>

              {shown && active !== null && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg rtl:translate-x-1/2"
                  style={{ insetInlineStart: `clamp(5.5rem, ${((active + 0.5) / points.length) * 100}%, calc(100% - 5.5rem))` }}
                >
                  <p className="font-medium">{shown.long}</p>
                  <dl className="mt-2 space-y-1">
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-[2px] bg-primary" /> Revenue
                      </dt>
                      <dd className="font-medium tabular-nums">{money.format(shown.value)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="w-2 border-t-2 border-dashed border-muted-foreground/60" /> {compare}
                      </dt>
                      <dd className="tabular-nums">{money.format(shown.previous)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 border-t pt-2 text-muted-foreground">
                    <Change value={change(shown.value, shown.previous)} /> change
                  </p>
                </div>
              )}
            </div>

            <div aria-hidden className={cn("mt-2 flex text-[11px] text-muted-foreground", range === "year" ? "gap-2 sm:gap-3" : "gap-0.5 sm:gap-1")}>
              {points.map((p, i) => (
                <span key={p.long} className={cn("flex-1 text-center tabular-nums", range === "year" && i % 2 === 1 && "max-sm:invisible")}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* What the tooltip shows, read out as the arrow keys move. */}
        <p aria-live="polite" className="sr-only">
          {shown ? `${shown.long}: ${money.format(shown.value)}, ${compare} ${money.format(shown.previous)}` : ""}
        </p>
      </div>
    </section>
  )
}
