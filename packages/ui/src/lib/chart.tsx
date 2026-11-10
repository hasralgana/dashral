"use client"

// What AreaChart, LineChart and BarChart share: their props, the scales, the round ticks, the curves, stacking, the
// formatters, reading a point with the pointer or the keyboard, and the legend, axes and tooltip around the marks.
// Each chart draws its own marks with this.

import * as React from "react"

import { useLocale } from "./locale"
import { cn } from "./utils"

/** One line, area or set of bars: the data key it reads, its name, and its color. */
export type ChartSeries = {
  /** The key in each data row that holds this series' value. */
  key: string
  /** Its name, in the legend and the tooltip. */
  label: string
  /** Any CSS color; by default the theme's chart colors in order (--chart-1 … --chart-5). */
  color?: string
  /** Drawn dashed and quieter: a comparison, like the same period last year. Lines and areas only. */
  dashed?: boolean
  /** ComboChart: drawn as bars (the default) or as a line. */
  type?: "bar" | "line"
  /**
   * ComboChart and LineChart: read against an axis of its own on the right (on the left in right-to-left), for values
   * of another kind, such as a margin in percent beside revenue. Its ticks fall on the left axis' grid lines.
   */
  axis?: "left" | "right"
}

/** One row of data: the index (a label, a timestamp or an ISO date) and a number for each series. */
export type ChartDatum = Record<string, string | number | null | undefined>

export type CartesianChartProps = {
  /** The rows, in order along the x axis. */
  data: ChartDatum[]
  /** The key in each row for the x axis: a label ("Jan"), or a timestamp or ISO date when `timeFormat` is set. */
  index: string
  /** The key in each row for a fuller title in the tooltip (and read out), e.g. "Oct 2026" under an axis saying "Oct". */
  labelKey?: string
  /** What to draw, in order; the first is the main one. */
  series: ChartSeries[]
  /** The chart's height in pixels, axes included; the width follows its container. */
  height?: number
  /** BCP 47 locale for numbers and dates. */
  locale?: string
  /** How values are written, e.g. `{ style: "currency", currency: "USD" }`. The axis writes them compactly ($48K). */
  formatOptions?: Intl.NumberFormatOptions
  /** Reads the index as dates and writes them like this, e.g. `{ month: "short" }`. */
  timeFormat?: Intl.DateTimeFormatOptions
  /** A legend of the series. On by default when there's more than one. */
  showLegend?: boolean
  /** Dashed lines across the chart at the axis values. */
  showGrid?: boolean
  /** The values along the left. */
  showYAxis?: boolean
  /** What the chart shows, e.g. "Revenue by month". By default it says how the first series went. */
  "aria-label"?: string
}

/** For the charts with a second axis (ComboChart, LineChart): how its values are written. */
export type RightAxisProps = {
  /** How the right axis' values are written (series with `axis: "right"`), e.g. `{ style: "percent" }`. */
  rightFormatOptions?: Intl.NumberFormatOptions
}

export const seriesColor = (series: ChartSeries, i: number) => series.color ?? `var(--chart-${(i % 5) + 1})`

/** Round values for about `count` lines between min and max: steps of 1, 2 or 5 times a power of ten. */
export function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) || 1
  const raw = span / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const n = raw / magnitude
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * magnitude
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)))
  if (ticks.at(-1)! < max) ticks.push(Number((ticks.at(-1)! + step).toFixed(10)))
  return ticks
}

/**
 * `count` round values from at least `lo` to at least `hi`, evenly stepped: a second axis whose ticks fall on the first
 * axis' grid lines (same count, same places), each still a round number.
 */
export function alignedTicks(lo: number, hi: number, count: number) {
  if (count < 2) return niceTicks(lo, hi)
  const steps = count - 1
  const round = (raw: number) => {
    const magnitude = 10 ** Math.floor(Math.log10(raw))
    const n = raw / magnitude
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * magnitude
  }
  let step = round((hi - lo) / steps || Math.abs(hi) || 1)
  let start = Math.floor(lo / step) * step
  // Starting below lo can leave the top short of hi: take the next round step until it fits.
  while (start + step * steps < hi - step * 1e-9) {
    step = round(step * 1.01)
    start = Math.floor(lo / step) * step
  }
  return Array.from({ length: count }, (_, i) => Number((start + step * i).toFixed(10)))
}

/**
 * A bar with its end rounded, from the zero line `base` to `end` (above it, or below for a negative value). Its far
 * end is rounded; the end on the zero line stays square.
 */
export function barPath(x: number, w: number, base: number, end: number, radius: number) {
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

export type Point = { x: number; y: number }
export type Curve = "smooth" | "linear" | "step"

/**
 * A path through the points: straight, in steps, or smooth. Smooth is a monotone curve: it bends through every point
 * without overshooting, so a line never dips below a value it didn't have.
 */
export function linePath(points: Point[], curve: Curve = "smooth", move = true) {
  if (!points.length) return ""
  const start = `${move ? "M" : "L"}${points[0]!.x.toFixed(2)},${points[0]!.y.toFixed(2)}`
  if (points.length === 1) return start
  if (curve === "linear") return start + points.slice(1).map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("")
  if (curve === "step") {
    return (
      start +
      points
        .slice(1)
        .map((p, i) => {
          const mid = (points[i]!.x + p.x) / 2
          return `H${mid.toFixed(2)}V${p.y.toFixed(2)}H${p.x.toFixed(2)}`
        })
        .join("")
    )
  }
  // Monotone cubic (Fritsch–Carlson): tangents from the neighbouring slopes, flattened where the line turns.
  const n = points.length
  const dx = points.slice(1).map((p, i) => p.x - points[i]!.x)
  const slope = points.slice(1).map((p, i) => (p.y - points[i]!.y) / (dx[i] || 1))
  const tangent = points.map((_, i) => {
    if (i === 0) return slope[0]!
    if (i === n - 1) return slope[n - 2]!
    const a = slope[i - 1]!
    const b = slope[i]!
    return a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b)
  })
  let d = start
  for (let i = 0; i < n - 1; i++) {
    const p = points[i]!
    const q = points[i + 1]!
    const h = dx[i]! / 3
    d += `C${(p.x + h).toFixed(2)},${(p.y + tangent[i]! * h).toFixed(2)} ${(q.x - h).toFixed(2)},${(q.y - tangent[i + 1]! * h).toFixed(2)} ${q.x.toFixed(2)},${q.y.toFixed(2)}`
  }
  return d
}

/** An area between a top line and a bottom one (the axis, or the series below when stacked). */
export function areaPath(top: Point[], bottom: Point[], curve: Curve = "smooth") {
  if (!top.length) return ""
  return `${linePath(top, curve)}${linePath([...bottom].reverse(), curve, false)}Z`
}

const toNumber = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

const TOP = 8
const X_AXIS = 24
const Y_GAP = 10

/**
 * Everything a cartesian chart needs from its props: its measured width, the plot's size, the scales, the ticks, each
 * series' values (stacked or not), the formatters, and the point being read (by pointer or keyboard, announced to
 * screen readers). `band` lays the rows out as slots (bars); otherwise as points from edge to edge (lines, areas).
 */
export function useCartesianChart(
  props: CartesianChartProps &
    RightAxisProps & {
      band?: boolean
      stacked?: boolean
      zero?: boolean
      /** Honors series' `axis: "right"` with a second axis; charts that draw on one scale leave it off. */
      axes?: boolean
      roledescription: string
    }
) {
  const { data, index, labelKey, series, height = 260, locale: localeProp, formatOptions, rightFormatOptions, timeFormat, showYAxis = true, band = false, stacked = false, zero = true, axes = false } = props
  const { t, locale: contextLocale, dir } = useLocale()
  // Right to left (Arabic), the chart reads that way too: the first point on the right, the values on the right.
  const rtl = dir === "rtl"
  const locale = localeProp ?? contextLocale
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [drawn, setDrawn] = React.useState(false)
  const [active, setActive] = React.useState<number | null>(null)
  const [announce, setAnnounce] = React.useState("")

  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // The marks only render once the width is known; draw them in a frame later, so the empty start is painted first.
  const measured = width !== null
  React.useEffect(() => {
    if (!measured) return
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [measured])

  const value = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const axisValue = React.useMemo(
    () => new Intl.NumberFormat(locale, { ...formatOptions, notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 0 }),
    [locale, formatOptions]
  )
  // The right axis, for series that ask for it (and only when some series stay on the left).
  const onRight = series.map((s) => axes && s.axis === "right")
  const hasRight = onRight.some(Boolean) && !onRight.every(Boolean)
  const right = (k: number) => hasRight && onRight[k]!
  const rightValue = React.useMemo(() => new Intl.NumberFormat(locale, rightFormatOptions), [locale, rightFormatOptions])
  const rightAxisValue = React.useMemo(
    () => new Intl.NumberFormat(locale, { ...rightFormatOptions, notation: "compact", maximumFractionDigits: 1, minimumFractionDigits: 0 }),
    [locale, rightFormatOptions]
  )
  const formatFor = (k: number) => (right(k) ? rightValue : value)
  const date = React.useMemo(() => (timeFormat ? new Intl.DateTimeFormat(locale, timeFormat) : null), [locale, timeFormat])
  const indexLabel = (row: ChartDatum | undefined) => {
    const raw = row?.[index]
    if (raw === undefined || raw === null) return ""
    if (!date) return String(raw)
    return date.format(new Date(typeof raw === "number" ? raw : Date.parse(raw)))
  }

  // Each series' values, and where each sits when stacked (its base and its top). Right-axis series never stack.
  const columns = data.map((row) => {
    let base = 0
    return series.map((s, k) => {
      const v = toNumber(row[s.key])
      const stacks = stacked && !right(k)
      const cell = stacks ? { value: v, base, top: base + v } : { value: v, base: 0, top: v }
      if (stacks) base += v
      return cell
    })
  })
  const leftCells = columns.flatMap((c) => c.filter((_, k) => !right(k)))
  const tops = leftCells.map((cell) => cell.top)
  const lows = leftCells.map((cell) => (stacked ? cell.base : cell.value))
  const hi = tops.length ? Math.max(...tops) : 1
  const lo = tops.length ? Math.min(...lows) : 0
  const ticks = niceTicks(zero ? Math.min(0, lo) : lo - (hi - lo) * 0.1, hi)
  const min = ticks[0]!
  const max = ticks.at(-1)!
  const rightCells = columns.flatMap((c) => c.filter((_, k) => right(k)).map((cell) => cell.value))
  const rightLo = rightCells.length ? Math.min(...rightCells) : 0
  const rightHi = rightCells.length ? Math.max(...rightCells) : 1
  const rightTicks = hasRight ? alignedTicks(zero ? Math.min(0, rightLo) : rightLo - (rightHi - rightLo) * 0.1, rightHi, ticks.length) : []
  const rightMin = rightTicks[0] ?? 0
  const rightMax = rightTicks.at(-1) ?? 1

  // The axis is as wide as its longest label; the plot takes the rest.
  const tickLabels = ticks.map((v) => axisValue.format(v))
  const axisW = showYAxis ? Math.ceil(Math.max(...tickLabels.map((l) => l.length)) * 6.6) + Y_GAP : 0
  const rightTickLabels = rightTicks.map((v) => rightAxisValue.format(v))
  const rightW = showYAxis && hasRight ? Math.ceil(Math.max(...rightTickLabels.map((l) => l.length)) * 6.6) + Y_GAP : 0
  const plotW = Math.max(0, (width ?? 0) - axisW - rightW)
  const plotH = Math.max(0, height - TOP - X_AXIS)
  const y = (v: number) => TOP + ((max - v) / (max - min || 1)) * plotH
  const yRight = (v: number) => TOP + ((rightMax - v) / (rightMax - rightMin || 1)) * plotH
  /** Where series k's value v sits: on its own axis. */
  const yFor = (k: number, v: number) => (right(k) ? yRight(v) : y(v))
  const n = data.length
  const slot = n ? plotW / n : 0
  // Where the plot starts: after the axis, or at the left edge with the axis on the right.
  const plotLeft = rtl ? rightW : axisW
  const along = (i: number) => (band ? slot * (i + 0.5) : n > 1 ? (i / (n - 1)) * plotW : plotW / 2)
  const x = (i: number) => plotLeft + (rtl ? plotW - along(i) : along(i))

  // Labels along the bottom: as many as fit without touching, always ending on the last.
  const labels = data.map((row) => indexLabel(row))
  const labelW = Math.max(...labels.map((l) => l.length), 1) * 6.4 + 16
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / labelW))))
  const xTicks = data.map((_, i) => i).filter((i) => (n - 1 - i) % every === 0)

  // The tooltip's title: the row's own when it has one, else its label on the axis.
  const titles = data.map((row, i) => (labelKey && row[labelKey] != null ? String(row[labelKey]) : labels[i]!))
  const describe = (i: number) =>
    `${titles[i]}: ${series.map((s, k) => `${s.label} ${formatFor(k).format(columns[i]![k]!.value)}`).join(", ")}`
  const pick = (i: number | null, fromKeyboard = false) => {
    setActive(i)
    if (fromKeyboard && i !== null) setAnnounce(describe(i))
  }

  const first = series[0]
  const label =
    props["aria-label"] ??
    (n && first ? t("trend", { from: value.format(toNumber(data[0]![first.key])), to: value.format(toNumber(data[n - 1]![first.key])) }) : t("noData"))

  return {
    box,
    width,
    drawn,
    height,
    active,
    announce,
    pick,
    columns,
    ticks,
    tickLabels,
    axisW,
    plotLeft,
    rtl,
    plotW,
    plotH,
    top: TOP,
    bottom: height - X_AXIS,
    x,
    y,
    yFor,
    formatFor,
    hasRight,
    rightTicks,
    rightTickLabels,
    rightW,
    slot,
    labels,
    titles,
    xTicks,
    value,
    showLegend: props.showLegend ?? series.length > 1,
    showGrid: props.showGrid ?? true,
    showYAxis,
    root: {
      role: "group" as const,
      "aria-roledescription": props.roledescription,
      "aria-label": label,
      tabIndex: 0,
      onKeyDown(event: React.KeyboardEvent) {
        if (!n) return
        const current = active ?? n - 1
        const next =
          // The arrows move the way they point on screen: right to left, ← is the next point.
          event.key === (rtl ? "ArrowRight" : "ArrowLeft") ? Math.max(0, current - 1)
          : event.key === (rtl ? "ArrowLeft" : "ArrowRight") ? Math.min(n - 1, current + 1)
          : event.key === "Home" ? 0
          : event.key === "End" ? n - 1
          : undefined
        if (event.key === "Escape") return pick(null)
        if (next === undefined) return
        event.preventDefault()
        pick(next, true)
      },
      onBlur: () => pick(null),
    },
    plot: {
      onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!n || !plotW) return
        const offset = event.clientX - event.currentTarget.getBoundingClientRect().left - plotLeft
        const px = rtl ? plotW - offset : offset
        const i = band ? Math.floor(px / slot) : Math.round((px / plotW) * (n - 1))
        pick(Math.min(n - 1, Math.max(0, i)))
      },
      onPointerLeave: () => pick(null),
    },
  }
}

// ── Around the marks ─────────────────────────────────────────────────────────────────────────────────────────────

type Chart = ReturnType<typeof useCartesianChart>

/** The series, each with its color (a dashed swatch for a dashed series). */
export function ChartLegend({ series, className }: { series: ChartSeries[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {series.map((s, k) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            // A bar of a combo chart gets a block; lines (and every other chart's series) a stroke.
            className={s.type === "bar" ? "size-2.5 rounded-sm" : "h-0.5 w-3 rounded-full"}
            style={s.dashed ? { backgroundImage: `linear-gradient(90deg, ${seriesColor(s, k)} 50%, transparent 50%)`, backgroundSize: "4px 2px" } : { background: seriesColor(s, k) }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

/** The grid, the values along the left and the labels along the bottom. */
export function ChartAxes({ chart: h, band }: { chart: Chart; band: boolean }) {
  const last = h.labels.length - 1
  return (
    <svg aria-hidden width={h.width!} height={h.height} className="absolute inset-0 overflow-visible">
      {h.ticks.map((v, i) => (
        <g key={v}>
          {h.showGrid && (
            <line x1={h.plotLeft} x2={h.plotLeft + h.plotW} y1={Math.round(h.y(v)) + 0.5} y2={Math.round(h.y(v)) + 0.5} stroke="var(--chart-grid)" strokeDasharray={i === 0 ? undefined : "2 4"} />
          )}
          {h.showYAxis && h.hasRight && (
            // The right axis' value on the same grid line (its ticks are aligned to the left axis').
            <text
              x={h.rtl ? h.rightW - 10 : h.plotLeft + h.plotW + 10}
              y={h.y(v)}
              dy="0.32em"
              fontSize={11}
              textAnchor={h.rtl ? "end" : "start"}
              fill="var(--chart-axis)"
              className="tabular-nums"
            >
              {h.rightTickLabels[i]}
            </text>
          )}
          {h.showYAxis && (
            <text
              x={h.rtl ? h.plotLeft + h.plotW + 10 : h.axisW - 10}
              y={h.y(v)}
              dy="0.32em"
              fontSize={11}
              textAnchor={h.rtl ? "start" : "end"}
              fill="var(--chart-axis)"
              className="tabular-nums"
            >
              {h.tickLabels[i]}
            </text>
          )}
        </g>
      ))}
      {h.xTicks.map((i) => (
        <text
          key={i}
          x={h.x(i)}
          y={h.height - 6}
          fontSize={11}
          // Points sit on the edges: the first and last labels align inward so they aren't cut off.
          textAnchor={band ? "middle" : i === 0 ? (h.rtl ? "end" : "start") : i === last ? (h.rtl ? "start" : "end") : "middle"}
          fill="var(--chart-axis)"
        >
          {h.labels[i]}
        </text>
      ))}
    </svg>
  )
}

/**
 * The point being read: a line through it and a dot on each series (lines, areas; a bar chart fades the other columns
 * itself), and a tooltip with every value.
 */
export function ChartReading({ chart: h, series, band, className }: { chart: Chart; series: ChartSeries[]; band: boolean; className?: string }) {
  // The tooltip's own size, measured, so it can sit right by the point and stay inside the chart.
  const tip = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ w: 160, h: 64 })
  const reading = h.active !== null
  React.useLayoutEffect(() => {
    const el = tip.current
    if (!el) return
    const measure = () => setSize((was) => (was.w === el.offsetWidth && was.h === el.offsetHeight ? was : { w: el.offsetWidth, h: el.offsetHeight }))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [reading])
  if (h.active === null) return null
  const i = h.active
  const x = h.x(i)
  // The highest value at this point: the tallest bar, or the topmost line.
  const peak = Math.min(...series.map((_, k) => h.yFor(k, h.columns[i]![k]!.top)))
  const gap = 10
  const minLeft = h.plotLeft
  const maxLeft = h.plotLeft + h.plotW - size.w
  const clampLeft = (left: number) => Math.max(minLeft, Math.min(maxLeft, left))
  // Beside the point: on its right, or on its left past the middle of the chart.
  const beside = (offset: number) => (x > h.plotLeft + h.plotW * 0.55 ? x - offset - size.w : x + offset)
  let left: number
  let top: number
  if (band && peak - size.h - gap >= 0) {
    // A column: centred just above its tallest bar.
    left = clampLeft(x - size.w / 2)
    top = peak - size.h - gap
  } else {
    // A point, or a bar too tall to have room above it: beside it, level with its top.
    left = clampLeft(beside(band ? h.slot / 2 + 4 : 14))
    top = Math.max(0, Math.min(h.bottom - size.h, band ? peak : peak - size.h / 2))
  }
  return (
    <>
      {!band && (
        <svg aria-hidden width={h.width!} height={h.height} className="pointer-events-none absolute inset-0 overflow-visible">
          <line x1={Math.round(x) + 0.5} x2={Math.round(x) + 0.5} y1={h.top} y2={h.bottom} stroke="var(--chart-axis)" strokeDasharray="3 3" opacity={0.6} />
          {series.map((s, k) => (
            <circle key={s.key} cx={x} cy={h.yFor(k, h.columns[i]![k]!.top)} r={4} fill="var(--background)" stroke={seriesColor(s, k)} strokeWidth={2} />
          ))}
        </svg>
      )}
      <div
        ref={tip}
        aria-hidden
        // The plot is laid out left to right; the tooltip's words follow the page.
        dir={h.rtl ? "rtl" : "ltr"}
        className={cn("pointer-events-none absolute z-10 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md", className)}
        style={{ left, top }}
      >
        <p className="mb-1.5 font-medium">{h.titles[i]}</p>
        <ul className="grid gap-1">
          {series.map((s, k) => (
            <li key={s.key} className="flex items-center gap-2">
              <span aria-hidden className="size-2 shrink-0 rounded-sm" style={{ background: seriesColor(s, k) }} />
              <span className="flex-1 text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums">{h.formatFor(k).format(h.columns[i]![k]!.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
