"use client"

import * as React from "react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type IndicatorColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

// The dot or badge, and its ping. Every class is written out in full so Tailwind finds it.
const colors: Record<IndicatorColor, { fill: string; ping: string }> = {
  primary: { fill: "bg-primary text-primary-foreground", ping: "bg-primary" },
  neutral: { fill: "bg-foreground text-background", ping: "bg-foreground" },
  info: { fill: "bg-info text-info-foreground", ping: "bg-info" },
  success: { fill: "bg-success text-success-foreground", ping: "bg-success" },
  warning: { fill: "bg-warning text-warning-foreground", ping: "bg-warning" },
  destructive: { fill: "bg-destructive text-destructive-foreground", ping: "bg-destructive" },
  highlight: { fill: "bg-highlight text-highlight-foreground", ping: "bg-highlight" },
}

type IndicatorPosition = "top-end" | "bottom-end" | "top-start" | "bottom-start"

// Where it sits: its centre on the corner of a square element, or on the edge of a round one (an avatar), where the
// corner would leave it floating in the air.
const positions: Record<"square" | "round", Record<IndicatorPosition, string>> = {
  square: {
    "top-end": "top-0 end-0 -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2",
    "bottom-end": "bottom-0 end-0 translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2",
    "top-start": "top-0 start-0 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2",
    "bottom-start": "bottom-0 start-0 translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2",
  },
  round: {
    "top-end": "top-[14.6%] end-[14.6%] -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2",
    "bottom-end": "bottom-[14.6%] end-[14.6%] translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2",
    "top-start": "top-[14.6%] start-[14.6%] -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2",
    "bottom-start": "bottom-[14.6%] start-[14.6%] translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2",
  },
}

type IndicatorProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** What it sits on: an icon button, an avatar, a tab, a nav link. */
  children: React.ReactNode
  /** A number in a small badge ("3", "99+"); without it, a dot. 0 hides it, unless showZero. */
  count?: number
  /** Above this, "99+". */
  max?: number
  showZero?: boolean
  /** Whether it shows. It scales in and out on the spring, so toggling it never pops. */
  show?: boolean
  color?: IndicatorColor
  position?: IndicatorPosition
  /** round: for a round element (an avatar), so it sits on the edge rather than off the corner. */
  shape?: "square" | "round"
  /** A soft ring pulsing out from it, for something live or urgent. Still with reduced motion. */
  pulse?: boolean
  /**
   * What it means, for screen readers: "3 unread messages", "New". Without it, it's decoration (hidden from them), so
   * say it in the element's own label instead.
   */
  label?: string
  classNames?: { indicator?: string }
}

/**
 * A dot or a count on the corner of something, in one tag: `<Indicator count={3} label="3 unread"><Button …/></Indicator>`.
 * The numbers are written in the locale. A ring in the page's background color keeps it apart from what it sits on;
 * change it with classNames.indicator ("ring-card" on a card).
 */
function Indicator({
  children,
  count,
  max = 99,
  showZero = false,
  show = true,
  color = "destructive",
  position = "top-end",
  shape = "square",
  pulse = false,
  label,
  className,
  classNames,
  ...props
}: IndicatorProps) {
  const { locale } = useLocale()
  const hasCount = count !== undefined
  const visible = show && (!hasCount || count > 0 || showZero)
  const number = new Intl.NumberFormat(locale)
  const text = hasCount ? (count > max ? `${number.format(max)}+` : number.format(count)) : null
  // While it shrinks away, it keeps the last number it showed ("3", not "0").
  const [shownText, setShownText] = React.useState(text)
  if (visible && text !== shownText) setShownText(text)

  return (
    <span data-slot="indicator" className={cn("relative inline-flex w-fit shrink-0", className)} {...props}>
      {children}
      <span
        data-state={visible ? "visible" : "hidden"}
        aria-hidden={!label || !visible}
        className={cn(
          "pointer-events-none absolute z-10 grid place-items-center rounded-full ring-2 ring-background",
          positions[shape][position],
          hasCount ? "h-4.5 min-w-4.5 px-1 text-[10px] leading-none font-semibold tabular-nums" : "size-2.5",
          colors[color].fill,
          // In on the spring, out on --ease-exit (a spring would be gone in a blink), from its own centre. The scale is
          // its own property, so the translate above holds.
          "transition-[scale,opacity] motion-reduce:transition-none",
          visible
            ? "scale-100 opacity-100 duration-(--duration-standard) ease-spring"
            : "scale-0 opacity-0 duration-(--duration-standard) ease-exit",
          classNames?.indicator
        )}
      >
        {pulse && visible && (
          <span aria-hidden className={cn("absolute inset-0 -z-10 animate-ping rounded-full opacity-60 motion-reduce:hidden", colors[color].ping)} />
        )}
        {/* With a label, the label is what's read; the number is for the eyes. */}
        {shownText !== null && <span aria-hidden={label ? true : undefined}>{shownText}</span>}
        {label && <span className="sr-only">{label}</span>}
      </span>
    </span>
  )
}

export { Indicator, type IndicatorProps, type IndicatorColor, type IndicatorPosition }
