"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { riseMotion, stagger } from "../lib/motion"
import { cn } from "../lib/utils"
import { Swap } from "./swap"

type TrackerColor = "success" | "warning" | "destructive" | "info" | "primary" | "neutral"

export type TrackerDatum = {
  /** A stable key; the index is used without one. */
  key?: string
  /** What the square stands for, said when it's read: a day ("Oct 18"), a run ("#1284"), an hour. */
  label: string
  /** Its color, for what it means: success (fine), warning, destructive (down, failed), info, primary; neutral for no data. By default the tracker's color. */
  color?: TrackerColor
  /** What happened, after the label when it's read: "Slow responses for 14 minutes". */
  note?: string
}

type TrackerProps = Omit<React.ComponentProps<"div">, "children" | "color"> & {
  /** The squares, oldest first. */
  data: TrackerDatum[]
  /** The color of squares without their own. */
  color?: TrackerColor
  /** The squares' height in pixels. */
  height?: number
  /**
   * Under the squares while none is read: at the start, in the middle (e.g. "99.98% uptime") and at the end ("Today").
   * The start and end default to the first and last square showing (where it's narrow, the oldest make room, so the
   * start follows); null leaves one out.
   */
  startLabel?: React.ReactNode
  summary?: React.ReactNode
  endLabel?: React.ReactNode
  /** What the tracker shows, e.g. "API uptime, last 90 days". */
  "aria-label"?: string
  classNames?: { square?: string; caption?: string }
}

const colors: Record<TrackerColor, string> = {
  success: "bg-success/80",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-muted",
}

/** The narrowest a square gets before the oldest ones are left out, and the gap between squares, in pixels. */
const MIN_SQUARE = 4
const GAP = 2

/**
 * A row of status squares, in one tag: uptime per day, the last runs of a job, a habit kept. Hover a square, or focus
 * the row and use the arrow keys, to read it under the row (its label and note) while the others fade back. Where it's
 * narrow, the oldest squares make room, so the latest always show. The squares rise in one after another.
 */
function Tracker({
  data,
  color = "success",
  height = 28,
  startLabel,
  summary,
  endLabel,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: TrackerProps) {
  const { t, dir } = useLocale()
  const box = React.useRef<HTMLDivElement>(null)
  const [fits, setFits] = React.useState(data.length)
  const [active, setActive] = React.useState<number | null>(null)
  const [announce, setAnnounce] = React.useState("")

  // As many of the latest squares as fit at their narrowest; followed as the row resizes.
  React.useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setFits(Math.max(1, Math.floor((el.clientWidth + GAP) / (MIN_SQUARE + GAP))))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const first = Math.max(0, data.length - fits)
  const shown = data.slice(first)
  const n = shown.length
  const read = active === null ? null : shown[active]
  const describe = (d: TrackerDatum) => (d.note ? `${d.label} · ${d.note}` : d.label)

  function pick(i: number | null, fromKeyboard = false) {
    setActive(i)
    if (fromKeyboard && i !== null) setAnnounce(describe(shown[i]!))
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!n) return
    const current = active ?? n - 1
    // The arrows move the way they point on screen: right to left, ← is the next square.
    const next =
      event.key === (dir === "rtl" ? "ArrowRight" : "ArrowLeft") ? Math.max(0, current - 1)
      : event.key === (dir === "rtl" ? "ArrowLeft" : "ArrowRight") ? Math.min(n - 1, current + 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? n - 1
      : undefined
    if (event.key === "Escape") return pick(null)
    if (next === undefined) return
    event.preventDefault()
    pick(next, true)
  }

  return (
    <div
      data-slot="tracker"
      role="group"
      aria-roledescription={t("tracker")}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => pick(null)}
      className={cn("grid gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-background", className)}
      {...props}
    >
      {/* Hover holds across the gaps: the row, not each square, lets go when the pointer leaves. */}
      <div ref={box} aria-hidden className="flex" style={{ height, gap: GAP }} onPointerLeave={() => pick(null)}>
        {shown.map((d, i) => (
          <span key={d.key ?? first + i} className="relative min-w-0 flex-1 overflow-hidden rounded-[2px]" onPointerEnter={() => pick(i)}>
            <span
              className={cn(
                riseMotion,
                "absolute inset-0 transition-opacity duration-(--duration-fast)",
                colors[d.color ?? color],
                active !== null && active !== i && "opacity-50",
                classNames?.square
              )}
              style={stagger(i, 8, 90)}
            />
          </span>
        ))}
      </div>

      {n > 0 && (
        <Swap value={active === null ? "rest" : `day-${active}`} as="div" className={cn("flex min-h-4 justify-between gap-3 text-[11px] text-muted-foreground", classNames?.caption)}>
          {read ? (
            <span className="truncate">
              <span className="text-foreground">{read.label}</span>
              {read.note && <> · {read.note}</>}
            </span>
          ) : (
            <>
              <span>{startLabel === undefined ? shown[0]!.label : startLabel}</span>
              <span className="tabular-nums">{summary}</span>
              <span>{endLabel === undefined ? shown[n - 1]!.label : endLabel}</span>
            </>
          )}
        </Swap>
      )}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  )
}

export { Tracker, type TrackerProps, type TrackerColor }
