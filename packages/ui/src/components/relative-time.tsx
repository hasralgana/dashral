"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type RelativeTimeProps = Omit<React.ComponentProps<"time">, "children" | "dateTime"> & {
  /** The moment: a Date, an ISO string ("2026-11-06T09:30:00Z") or milliseconds since 1970. Past or future. */
  date: Date | string | number
  /** long: "3 minutes ago"; short: "3 min. ago"; narrow: "3m ago" (as the locale writes them). */
  style?: Intl.RelativeTimeFormatStyle
  /** Past this many days, the date itself ("Oct 12") instead of "5 weeks ago". Never by default. */
  absoluteAfterDays?: number
  /** How the date is written past absoluteAfterDays. */
  formatOptions?: Intl.DateTimeFormatOptions
  /** The full date and time shown on hover (the title). */
  titleFormatOptions?: Intl.DateTimeFormatOptions
  /** Keeps it current as time passes: each 15 seconds under a minute, each 30 under an hour, then less often. On by default. */
  live?: boolean
  /** BCP 47 locale; the LocaleProvider's by default. */
  locale?: string
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** The largest unit that reads naturally: "now", "5 minutes", "3 hours", "yesterday", "2 weeks", "4 months", "2 years". */
function pick(diff: number): [number, Intl.RelativeTimeFormatUnit] {
  const abs = Math.abs(diff)
  const sign = diff < 0 ? -1 : 1
  if (abs < 45 * SECOND) return [0, "second"]
  if (abs < 45 * MINUTE) return [sign * Math.max(1, Math.round(abs / MINUTE)), "minute"]
  if (abs < 22 * HOUR) return [sign * Math.round(abs / HOUR), "hour"]
  if (abs < 7 * DAY) return [sign * Math.max(1, Math.round(abs / DAY)), "day"]
  if (abs < 30 * DAY) return [sign * Math.round(abs / (7 * DAY)), "week"]
  if (abs < 345 * DAY) return [sign * Math.max(1, Math.round(abs / (30.44 * DAY))), "month"]
  return [sign * Math.max(1, Math.round(abs / (365.25 * DAY))), "year"]
}

/** How long until the text could change, so a timer wakes no more than it must. */
function nextTick(diff: number) {
  const abs = Math.abs(diff)
  if (abs < MINUTE) return 15 * SECOND
  if (abs < HOUR) return 30 * SECOND
  if (abs < DAY) return 5 * MINUTE
  return HOUR
}

/**
 * A moment as people say it, in one tag: `<RelativeTime date={comment.createdAt} />` reads "3 minutes ago", "yesterday"
 * or "in 2 days", in the reader's language, and keeps itself current. A real <time> with the exact moment in
 * dateTime, and the full date and time on hover. The server writes it from its clock and the browser corrects it as it
 * loads, without a hydration warning.
 */
function RelativeTime({
  date,
  style = "long",
  absoluteAfterDays,
  formatOptions = { dateStyle: "medium" },
  titleFormatOptions = { dateStyle: "full", timeStyle: "short" },
  live = true,
  locale: localeProp,
  className,
  ...props
}: RelativeTimeProps) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const time = new Date(date).getTime()
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    setNow(Date.now())
    if (!live) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        setNow(Date.now())
        schedule()
      }, nextTick(time - Date.now()))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [time, live])

  if (Number.isNaN(time)) return null
  const diff = time - now
  const absolute = absoluteAfterDays !== undefined && Math.abs(diff) > absoluteAfterDays * DAY
  const [value, unit] = pick(diff)
  const text = absolute
    ? new Intl.DateTimeFormat(locale, formatOptions).format(time)
    : new Intl.RelativeTimeFormat(locale, { numeric: "auto", style }).format(value, unit)

  return (
    <time
      data-slot="relative-time"
      dateTime={new Date(time).toISOString()}
      title={new Intl.DateTimeFormat(locale, titleFormatOptions).format(time)}
      // The server's clock (and time zone) aren't the reader's: the text is corrected right after it loads.
      suppressHydrationWarning
      className={cn("tabular-nums", className)}
      {...props}
    >
      {text}
    </time>
  )
}

export { RelativeTime, type RelativeTimeProps }
