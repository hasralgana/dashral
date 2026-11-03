"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { useLocale } from "../lib/locale"
import { useCountTo } from "../lib/motion"
import { cn } from "../lib/utils"
import { Card } from "./card"

type MetricCardProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** null when there's nothing to show yet: the card reads "—". */
  value: number | null
  /** How the value is written, e.g. `{ style: "currency", currency: "USD" }` or `{ style: "percent" }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** Writes the value yourself, for what Intl can't (durations like "2m 05s"). Overrides formatOptions; client only. */
  formatValue?: (value: number) => string
  /** BCP 47 locale, e.g. "id-ID". */
  locale?: string
  /** Change in percent against the comparison period, e.g. 12.5 or -3. */
  change?: number | null
  /** After the change's number: "%" by default, " pts" for a change in a rate. */
  changeUnit?: string
  /** What the change compares with, e.g. "vs last month". */
  changeLabel?: React.ReactNode
  /** For metrics where down is good (churn, costs, response time): a fall shows in green. */
  invert?: boolean
  icon?: React.ReactNode
  /** Under the numbers, e.g. a Sparkline. */
  children?: React.ReactNode
  /**
   * Count up from zero when the card first shows (a dashboard's opening). By default only later changes count.
   * The server renders the final value, so it's there without JavaScript.
   */
  countOnMount?: boolean
}

/** One number that matters, with its change against a past period. Put a Sparkline in it for the trend. */
function MetricCard({
  label,
  value,
  formatOptions,
  formatValue,
  locale: localeProp,
  change,
  changeUnit = "%",
  changeLabel,
  invert = false,
  icon,
  children,
  countOnMount = false,
  className,
  ...props
}: MetricCardProps) {
  const { locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const shown = useCountTo(value ?? 0, countOnMount && value !== null)
  const intl = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const format = formatValue ?? intl.format
  const up = (change ?? 0) >= 0
  const good = invert ? !up : up
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    // A Card underneath, so it looks and follows themes (and the dashboard's card style setting) like every other card.
    <Card data-metric-card="" padding="none" className={cn("p-5", className)} classNames={{ body: "flex flex-col gap-3" }} {...props}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && (
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary-text [&_svg:not([class*='size-'])]:size-4">
            {icon}
          </span>
        )}
      </div>
      <div>
        {/* The live number is for sight; screen readers get the final value once. */}
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value === null ? (
            "—"
          ) : (
            <>
              <span aria-hidden>{format(shown)}</span>
              <span className="sr-only">{format(value)}</span>
            </>
          )}
        </p>
        {(change !== undefined && change !== null) || changeLabel ? (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {change !== undefined && change !== null && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-success-text" : "text-destructive-text")}>
                <Arrow className="size-3.5" aria-hidden />
                <span className="sr-only">{up ? "Up" : "Down"} </span>
                {/* Sign, number and unit read left to right in every language: "+8.5%", never "8.5%+" in Arabic. */}
                <span dir="ltr">
                  {up ? "+" : "−"}
                  {Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 1 })}
                  {changeUnit}
                </span>
              </span>
            )}
            {changeLabel}
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  )
}

export { MetricCard }
