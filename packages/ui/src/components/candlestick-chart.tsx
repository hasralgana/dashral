"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

export type Candle = {
  /** When the period starts: a timestamp in ms or an ISO date. */
  time: number | string
  open: number
  high: number
  low: number
  close: number
  /** Traded in the period; shown as bars under the candles when given. */
  volume?: number
}

type CandlestickChartProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The periods, oldest first. */
  data: Candle[]
  /** The chart's height in pixels, axes included; the width follows its container. */
  height?: number
  /** Volume bars under the candles. On by default when the data has volume. */
  showVolume?: boolean
  /** A dashed line at the last close, with its price on the axis. */
  showLastPrice?: boolean
  /** BCP 47 locale for prices and dates. */
  locale?: string
  /** How prices are written, e.g. `{ style: "currency", currency: "USD" }`. Two decimals by default. */
  formatOptions?: Intl.NumberFormatOptions
  /** How the dates under the chart and in the header are written. `{ month: "short", day: "numeric" }` by default. */
  timeFormat?: Intl.DateTimeFormatOptions
  /** What the chart shows, e.g. "BTC/USD, daily". */
  "aria-label"?: string
  /** up and down are text colors for rising and falling candles (text-success and text-destructive by default). */
  classNames?: { up?: string; down?: string; header?: string }
}

const AXIS = 64
const TIME = 22
const TOP = 6
const GAP = 6

/** A round step for about four price lines: 1, 2 or 5 times a power of ten. */
function niceStep(span: number) {
  const raw = span / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const n = raw / magnitude
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * magnitude
}

/**
 * Prices over time as candles, like a trading chart: each period's open, high, low and close, green when it closed
 * higher and red when lower, with volume underneath. Hover or use the arrow keys to read a period in the header and
 * see a crosshair; the last close is marked on the axis. Plain SVG, fills its container's width.
 */
function CandlestickChart({
  data,
  height = 320,
  showVolume,
  showLastPrice = true,
  locale: localeProp,
  formatOptions,
  timeFormat,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: CandlestickChartProps) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [drawn, setDrawn] = React.useState(false)
  const [active, setActive] = React.useState<number | null>(null)
  const [pointerY, setPointerY] = React.useState<number | null>(null)
  const [announce, setAnnounce] = React.useState("")

  // The width is measured, so candles keep crisp, even widths however wide the chart is.
  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // The candles only render once the width is known; reveal them a frame later, so the hidden start is painted first.
  const measured = width !== null
  React.useEffect(() => {
    if (!measured) return
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [measured])

  const price = React.useMemo(
    () => new Intl.NumberFormat(locale, formatOptions ?? { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale, formatOptions]
  )
  const compact = React.useMemo(() => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }), [locale])
  const date = React.useMemo(() => new Intl.DateTimeFormat(locale, timeFormat ?? { month: "short", day: "numeric" }), [locale, timeFormat])
  const percent = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2, signDisplay: "exceptZero" }), [locale])

  const up = classNames?.up ?? "text-success"
  const down = classNames?.down ?? "text-destructive"
  const withVolume = (showVolume ?? data.some((d) => d.volume !== undefined)) && data.some((d) => (d.volume ?? 0) > 0)

  const last = data.at(-1)
  const shown = active !== null ? data[active] : last
  const label = ariaLabel ?? (data.length ? t("trend", { from: price.format(data[0]!.open), to: price.format(last!.close) }) : t("noData"))

  // Geometry, once the width is known.
  const plotW = Math.max(0, (width ?? 0) - AXIS)
  const plotH = height - TIME - TOP
  const priceH = withVolume ? Math.round(plotH * 0.78) : plotH
  const volTop = TOP + priceH + GAP
  const volH = withVolume ? plotH - priceH - GAP : 0
  const lows = data.map((d) => d.low)
  const highs = data.map((d) => d.high)
  const lo = data.length ? Math.min(...lows) : 0
  const hi = data.length ? Math.max(...highs) : 1
  const pad = (hi - lo) * 0.08 || Math.abs(hi) * 0.01 || 1
  const min = lo - pad
  const max = hi + pad
  const y = (v: number) => TOP + ((max - v) / (max - min)) * priceH
  const slot = data.length ? plotW / data.length : 0
  const body = Math.max(1, Math.min(18, Math.floor(slot * 0.64)))
  const cx = (i: number) => Math.round(slot * (i + 0.5)) + 0.5
  const step = niceStep(max - min)
  const ticks: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(Number(v.toFixed(10)))
  const maxVolume = Math.max(1, ...data.map((d) => d.volume ?? 0))
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 90))))
  const timeTicks = data.map((_, i) => i).filter((i) => (data.length - 1 - i) % every === 0)
  const toDate = (time: number | string) => new Date(typeof time === "number" ? time : Date.parse(time))
  const rising = (d: Candle) => d.close >= d.open

  const describe = (d: Candle) =>
    t("candle", { date: date.format(toDate(d.time)), open: price.format(d.open), high: price.format(d.high), low: price.format(d.low), close: price.format(d.close) })
  const short = { open: t("candleOpen"), high: t("candleHigh"), low: t("candleLow"), close: t("candleClose") }

  function pick(i: number | null, fromKeyboard = false) {
    setActive(i)
    if (fromKeyboard && i !== null) setAnnounce(describe(data[i]!))
  }

  return (
    <div
      data-slot="candlestick-chart"
      role="group"
      aria-roledescription={t("candlestickChart")}
      aria-label={label}
      tabIndex={0}
      className={cn("grid gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50", className)}
      onKeyDown={(event) => {
        if (!data.length) return
        const current = active ?? data.length - 1
        const next =
          event.key === "ArrowLeft" ? Math.max(0, current - 1)
          : event.key === "ArrowRight" ? Math.min(data.length - 1, current + 1)
          : event.key === "Home" ? 0
          : event.key === "End" ? data.length - 1
          : undefined
        if (event.key === "Escape") return pick(null)
        if (next === undefined) return
        event.preventDefault()
        setPointerY(null)
        pick(next, true)
      }}
      onBlur={() => pick(null)}
      {...props}
    >
      {/* The period under the pointer (or the latest one): what a trader reads first. */}
      {shown && (
        <div aria-hidden className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs tabular-nums", classNames?.header)}>
          <span className="font-medium text-foreground">{date.format(toDate(shown.time))}</span>
          {(["open", "high", "low", "close"] as const).map((key) => (
            <span key={key} className="text-muted-foreground">
              {short[key]} <span className={rising(shown) ? up : down}>{price.format(shown[key])}</span>
            </span>
          ))}
          <span className={rising(shown) ? up : down}>{percent.format((shown.close - shown.open) / shown.open)}</span>
          {withVolume && shown.volume !== undefined && <span className="text-muted-foreground">
              {t("volume")} {compact.format(shown.volume)}
            </span>}
        </div>
      )}

      <div
        ref={box}
        // Time runs left to right in every language, as on any trading chart.
        dir="ltr"
        className="relative w-full touch-none select-none"
        style={{ height }}
        onPointerMove={(event) => {
          if (!data.length || !slot) return
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          setPointerY(event.clientY - rect.top)
          pick(Math.min(data.length - 1, Math.max(0, Math.floor(x / slot))))
        }}
        onPointerLeave={() => {
          setPointerY(null)
          pick(null)
        }}
      >
        {width !== null && data.length > 0 && (
          <>
            {/* The grid and the axes. */}
            <svg aria-hidden width={width} height={height} className="absolute inset-0 overflow-visible text-muted-foreground">
              {ticks.map((v) => (
                <g key={v}>
                  <line x1={0} x2={plotW} y1={Math.round(y(v)) + 0.5} y2={Math.round(y(v)) + 0.5} stroke="var(--border)" strokeDasharray="2 4" />
                  <text x={plotW + 8} y={y(v)} dy="0.32em" fontSize={11} fill="currentColor" className="tabular-nums">
                    {price.format(v)}
                  </text>
                </g>
              ))}
              <line x1={plotW + 0.5} x2={plotW + 0.5} y1={TOP} y2={height - TIME} stroke="var(--border)" />
              {timeTicks.map((i) => (
                <text key={i} x={cx(i)} y={height - 6} fontSize={11} fill="currentColor" textAnchor="middle">
                  {date.format(toDate(data[i]!.time))}
                </text>
              ))}
            </svg>

            {/* The candles and volume, revealed left to right when the chart first shows. */}
            <svg
              aria-hidden
              width={width}
              height={height}
              className="absolute inset-0 transition-[clip-path] duration-(--duration-considered) ease-enter motion-reduce:transition-none"
              style={{ clipPath: drawn ? "inset(0 0 0 0)" : `inset(0 ${width}px 0 0)` }}
            >
              {data.map((d, i) => {
                const x = cx(i)
                const top = Math.round(y(Math.max(d.open, d.close)))
                const bottom = Math.round(y(Math.min(d.open, d.close)))
                return (
                  <g key={i} className={rising(d) ? up : down} opacity={active === null || active === i ? 1 : 0.55}>
                    <line x1={x} x2={x} y1={Math.round(y(d.high))} y2={Math.round(y(d.low))} stroke="currentColor" />
                    <rect x={Math.round(x - body / 2)} y={top} width={body} height={Math.max(1, bottom - top)} rx={body > 4 ? 1 : 0} fill="currentColor" />
                    {withVolume && d.volume !== undefined && (
                      <rect
                        x={Math.round(x - body / 2)}
                        y={volTop + volH - Math.max(1, (d.volume / maxVolume) * volH)}
                        width={body}
                        height={Math.max(1, (d.volume / maxVolume) * volH)}
                        fill="currentColor"
                        opacity={0.3}
                      />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* On top: the last price, and the crosshair while reading a period. */}
            <svg aria-hidden width={width} height={height} className="pointer-events-none absolute inset-0 overflow-visible">
              {showLastPrice && last && (
                <g className={rising(last) ? up : down}>
                  <line x1={0} x2={plotW} y1={Math.round(y(last.close)) + 0.5} y2={Math.round(y(last.close)) + 0.5} stroke="currentColor" strokeDasharray="3 3" opacity={0.7} />
                  <rect x={plotW + 2} y={y(last.close) - 9} width={AXIS - 4} height={18} rx={4} fill="currentColor" />
                  <text x={plotW + 8} y={y(last.close)} dy="0.32em" fontSize={11} fontWeight={600} fill="var(--background)" className="tabular-nums">
                    {price.format(last.close)}
                  </text>
                </g>
              )}
              {active !== null && (
                <g className="text-muted-foreground">
                  <line x1={cx(active)} x2={cx(active)} y1={TOP} y2={height - TIME} stroke="currentColor" strokeDasharray="3 3" opacity={0.6} />
                  {pointerY !== null && pointerY >= TOP && pointerY <= TOP + priceH && (
                    <>
                      <line x1={0} x2={plotW} y1={Math.round(pointerY) + 0.5} y2={Math.round(pointerY) + 0.5} stroke="currentColor" strokeDasharray="3 3" opacity={0.6} />
                      <rect x={plotW + 2} y={pointerY - 9} width={AXIS - 4} height={18} rx={4} fill="var(--foreground)" />
                      <text x={plotW + 8} y={pointerY} dy="0.32em" fontSize={11} fill="var(--background)" className="tabular-nums">
                        {price.format(max - ((pointerY - TOP) / priceH) * (max - min))}
                      </text>
                    </>
                  )}
                </g>
              )}
            </svg>
          </>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  )
}

export { CandlestickChart, type CandlestickChartProps }
