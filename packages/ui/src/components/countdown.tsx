"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type CountdownUnit = "days" | "hours" | "minutes" | "seconds"

type CountdownProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** When it ends: a Date, an ISO string ("2026-12-01T09:00:00Z") or milliseconds since 1970. */
  to: Date | string | number
  /** Which units to show, largest first. Without days, the hours carry on past 24. */
  units?: CountdownUnit[]
  /** boxes (default): each number in a box with its unit under it. inline: one line of text, "2d 04:15:09". */
  variant?: "boxes" | "inline"
  size?: "sm" | "default" | "lg"
  /** Called once, when it reaches zero (right away if `to` has already passed). */
  onComplete?: () => void
  /** Shown in place of the numbers once it's over. Without it, zeros stay. */
  completed?: React.ReactNode
  classNames?: { unit?: string; value?: string; label?: string }
}

const unitMs: Record<CountdownUnit, number> = { days: 86_400_000, hours: 3_600_000, minutes: 60_000, seconds: 1000 }
const intlUnit: Record<CountdownUnit, "day" | "hour" | "minute" | "second"> = { days: "day", hours: "hour", minutes: "minute", seconds: "second" }
const allUnits: CountdownUnit[] = ["days", "hours", "minutes", "seconds"]

/** What's left, split into the units shown: the largest takes what's above it (no days → 50 hours). */
function split(ms: number, units: CountdownUnit[]) {
  let rest = Math.max(0, ms)
  const parts = {} as Record<CountdownUnit, number>
  for (const unit of allUnits.filter((u) => units.includes(u))) {
    parts[unit] = Math.floor(rest / unitMs[unit])
    rest -= parts[unit] * unitMs[unit]
  }
  return parts
}

/** The unit's name in the locale and in the right plural for the number ("days", "hari", "أيام"), without the number. */
function unitName(locale: string, unit: CountdownUnit, value: number, display: "long" | "narrow") {
  const parts = new Intl.NumberFormat(locale, { style: "unit", unit: intlUnit[unit], unitDisplay: display }).formatToParts(value)
  return parts.filter((part) => part.type === "unit").map((part) => part.value).join("") || unit
}

/**
 * One character that rolls when it changes: the old one slides down and fades out while the new one slides in from
 * above, in the same cell, so a tick never blinks. Plain CSS animations (tw-animate), no library; with reduced motion
 * it just changes.
 */
function RollingChar({ char }: { char: string }) {
  // The character shown and the one leaving, with a count so each change gets fresh elements (and fresh animations).
  const [state, setState] = React.useState({ current: char, previous: null as string | null, turn: 0 })
  if (state.current !== char) setState({ current: char, previous: state.current, turn: state.turn + 1 })
  const roll = "duration-(--duration-considered) ease-standard fill-mode-forwards motion-reduce:animate-none"
  return (
    <span className="inline-grid overflow-hidden [mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]">
      {state.previous !== null && (
        <span
          key={`out-${state.turn}`}
          className={cn("col-start-1 row-start-1 animate-out fade-out-0 blur-out-[2px] slide-out-to-bottom-[70%] motion-reduce:hidden", roll)}
        >
          {state.previous}
        </span>
      )}
      <span
        key={`in-${state.turn}`}
        className={cn("col-start-1 row-start-1", state.turn > 0 && ["animate-in fade-in-0 blur-in-[2px] slide-in-from-top-[70%]", roll])}
      >
        {state.current}
      </span>
    </span>
  )
}

/** A number (or any text) whose characters roll one by one: in "40" → "39" both turn, in "39" → "38" only the last. */
function RollingText({ text }: { text: string }) {
  // Keyed from the end, so a number that loses a digit (100 → 99) keeps its units in place.
  const chars = [...text]
  return (
    <span className="inline-flex">
      {chars.map((char, i) => (
        <RollingChar key={chars.length - i} char={char} />
      ))}
    </span>
  )
}

/**
 * Time left until a moment, ticking each second: a launch, a sale's end, a webinar. Unit names come from the locale,
 * so they're in the reader's language without translations. The numbers fill in once the page is in the browser
 * (the server can't know the reader's clock), so the page never shows a wrong time first.
 */
function Countdown({
  to,
  units = allUnits,
  variant = "boxes",
  size = "default",
  onComplete,
  completed,
  className,
  classNames,
  ...props
}: CountdownProps) {
  const { locale } = useLocale()
  const target = new Date(to).getTime()
  const [now, setNow] = React.useState<number | null>(null)
  const onCompleteRef = React.useRef(onComplete)
  React.useEffect(() => {
    onCompleteRef.current = onComplete
  })

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let done = false
    const tick = () => {
      const current = Date.now()
      setNow(current)
      if (current >= target) {
        if (!done) onCompleteRef.current?.()
        done = true
        return
      }
      // Wakes on the next whole second of what's left, so every unit turns over together and never skips.
      timer = setTimeout(tick, ((target - current) % 1000) + 5)
    }
    tick()
    return () => clearTimeout(timer)
  }, [target])

  const left = now === null ? null : target - now
  const over = left !== null && left <= 0
  if (over && completed !== undefined) {
    return (
      <div data-slot="countdown" data-complete="" className={className} {...props}>
        {completed}
      </div>
    )
  }

  const parts = left === null ? null : split(left, units)
  const shown = allUnits.filter((unit) => units.includes(unit))
  const number = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  const plain = new Intl.NumberFormat(locale)
  // Every second for the eyes; the whole sentence for screen readers, which read it when they reach it (a timer
  // isn't announced on every tick).
  const spoken = parts ? shown.map((unit) => `${plain.format(parts[unit])} ${unitName(locale, unit, parts[unit], "long")}`).join(", ") : undefined

  if (variant === "inline") {
    // "2d 04:15:09": days with their short unit, then the rest joined by colons.
    const clock = shown.filter((unit) => unit !== "days").map((unit) => (parts ? number.format(parts[unit]) : "––"))
    const days = shown.includes("days") ? (parts ? `${plain.format(parts.days)}${unitName(locale, "days", parts.days, "narrow")}` : "–") : null
    const text = [days, clock.join(":")].filter(Boolean).join(" ")
    // A span, so it can sit inside a sentence (a <p>).
    return (
      <span
        role="timer"
        data-slot="countdown"
        data-complete={over || undefined}
        aria-label={spoken}
        className={cn(
          "inline-flex font-medium tabular-nums",
          size === "sm" ? "text-sm" : size === "lg" ? "text-2xl tracking-tight" : "text-base",
          className
        )}
        {...props}
      >
        <span aria-hidden className={cn("inline-flex", !parts && "text-muted-foreground", classNames?.value)}>
          {parts ? <RollingText text={text} /> : text}
        </span>
      </span>
    )
  }

  return (
    <div
      role="timer"
      data-slot="countdown"
      data-complete={over || undefined}
      aria-label={spoken}
      className={cn("inline-flex items-start", size === "sm" ? "gap-1.5" : size === "lg" ? "gap-3" : "gap-2", className)}
      {...props}
    >
      {shown.map((unit) => (
        <div
          key={unit}
          aria-hidden
          className={cn(
            "grid justify-items-center rounded-lg border bg-card text-card-foreground shadow-xs",
            size === "sm" ? "min-w-11 px-1.5 py-1" : size === "lg" ? "min-w-20 px-3 py-3" : "min-w-15 px-2 py-2",
            classNames?.unit
          )}
        >
          <span
            className={cn(
              "font-semibold tabular-nums",
              size === "sm" ? "text-base" : size === "lg" ? "text-4xl tracking-tight" : "text-2xl tracking-tight",
              !parts && "text-muted-foreground",
              classNames?.value
            )}
          >
            {parts ? <RollingText text={number.format(parts[unit])} /> : "––"}
          </span>
          <span className={cn("text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs", classNames?.label)}>
            {unitName(locale, unit, parts ? parts[unit] : 2, "long")}
          </span>
        </div>
      ))}
    </div>
  )
}

export { Countdown, type CountdownProps, type CountdownUnit }
