"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

export type HeatmapDatum = {
  /** "YYYY-MM-DD". */
  date: string
  value: number
}

type HeatmapProps = Omit<React.ComponentProps<"div">, "children"> & {
  data: HeatmapDatum[]
  /** The last day shown, "YYYY-MM-DD"; by default the latest day in the data. */
  endDate?: string
  /** How many weeks back from endDate. */
  weeks?: number
  /** Monday or Sunday at the top of each column. */
  weekStartsOn?: 0 | 1
  /** What a value counts, for tooltips and the summary: "orders", or ["order", "orders"] to get "1 order" right. */
  unit?: string | [one: string, other: string]
  /** BCP 47 locale for month and day names. */
  locale?: string
  /** Show the "Less … More" scale. */
  showLegend?: boolean
}

const DAY = 86_400_000
const CELL = 12
const GAP = 3
/** Opacity of each level; level 0 is the empty track. */
const LEVELS = [0, 0.25, 0.45, 0.7, 1]

const toTime = (day: string) => Date.parse(`${day}T00:00:00Z`)
const toDay = (time: number) => new Date(time).toISOString().slice(0, 10)

/**
 * Activity per day as a grid of weeks, like a contribution calendar: darker means more. Each square says its day and
 * value on hover, and the chart is summarized for screen readers. Color it with a text color (text-primary by default).
 */
function Heatmap({
  data,
  endDate,
  weeks = 26,
  weekStartsOn = 1,
  unit = "events",
  locale: localeProp,
  showLegend = true,
  className,
  "aria-label": ariaLabel,
  ...props
}: HeatmapProps) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const [drawn, setDrawn] = React.useState(false)
  React.useEffect(() => setDrawn(true), [])

  const values = new Map(data.map((d) => [d.date, d.value]))
  const last = endDate ?? data.map((d) => d.date).sort().at(-1) ?? toDay(Date.now())
  const lastTime = toTime(last)
  // Start on the week's first day, so every column is a whole week.
  const lastWeekday = (new Date(lastTime).getUTCDay() - weekStartsOn + 7) % 7
  const start = lastTime - (lastWeekday + (weeks - 1) * 7) * DAY
  const days = Array.from({ length: weeks * 7 }, (_, i) => start + i * DAY).filter((t) => t <= lastTime)
  const max = Math.max(0, ...days.map((t) => values.get(toDay(t)) ?? 0))
  const level = (v: number) => (v <= 0 || max === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)))

  const dateLabel = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
  const number = new Intl.NumberFormat(locale)
  const plural = new Intl.PluralRules(locale)
  const count = (n: number) => `${number.format(n)} ${typeof unit === "string" ? unit : plural.select(n) === "one" ? unit[0] : unit[1]}`

  // A month's name above the first column that starts in it.
  const months: { column: number; label: string }[] = []
  for (let column = 0; column < weeks; column++) {
    const time = start + column * 7 * DAY
    const date = new Date(time)
    const previous = months.at(-1)
    if (date.getUTCDate() <= 7 && (!previous || column - previous.column > 2)) months.push({ column, label: monthLabel.format(date) })
  }

  const total = days.reduce((sum, t) => sum + (values.get(toDay(t)) ?? 0), 0)
  const busiest = days.reduce((best, t) => ((values.get(toDay(t)) ?? 0) > (values.get(toDay(best)) ?? 0) ? t : best), days[0] ?? lastTime)
  const summary =
    ariaLabel ??
    t("heatmapSummary", { count: count(total), weeks, date: dateLabel.format(new Date(lastTime)) }) +
      (max > 0 ? t("heatmapBusiest", { date: dateLabel.format(new Date(busiest)), value: number.format(max) }) : ".")

  const left = 28
  const top = 16
  const width = left + weeks * (CELL + GAP)
  const height = top + 7 * (CELL + GAP)

  return (
    <div data-slot="heatmap" className={cn("grid gap-2 text-primary", className)} {...props}>
      <div className="overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} className="block">
          {months.map((m) => (
            <text key={m.column} x={left + m.column * (CELL + GAP)} y={10} className="fill-muted-foreground text-[10px]">
              {m.label}
            </text>
          ))}
          {[0, 2, 4].map((row) => (
            <text key={row} x={0} y={top + row * (CELL + GAP) + CELL - 2} className="fill-muted-foreground text-[10px]">
              {weekdayLabel.format(new Date(start + row * DAY))}
            </text>
          ))}
          {days.map((time, i) => {
            const value = values.get(toDay(time)) ?? 0
            const l = level(value)
            return (
              <rect
                key={time}
                x={left + Math.floor(i / 7) * (CELL + GAP)}
                y={top + (i % 7) * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={l === 0 ? "var(--muted)" : "currentColor"}
                className="transition-opacity duration-(--duration-considered) ease-enter motion-reduce:transition-none"
                style={{ opacity: l === 0 ? 1 : drawn ? LEVELS[l] : 0, transitionDelay: `${Math.floor(i / 7) * 12}ms` }}
              >
                <title>{`${count(value)} on ${dateLabel.format(new Date(time))}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>
      {showLegend && (
        // Only the words take the muted color: the squares keep the chart's own (currentColor).
        <div className="flex items-center justify-end gap-1 text-[11px]" aria-hidden>
          <span className="me-0.5 text-muted-foreground">{t("less")}</span>
          {LEVELS.map((opacity, l) => (
            <span
              key={l}
              className="size-3 rounded-[2px]"
              style={l === 0 ? { background: "var(--muted)" } : { background: "currentColor", opacity }}
            />
          ))}
          <span className="ms-0.5 text-muted-foreground">{t("more")}</span>
        </div>
      )}
    </div>
  )
}

export { Heatmap }
