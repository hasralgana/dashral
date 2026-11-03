"use client"

import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { useMemo } from "react"
import { Card } from "@dashral/ui/components/card"
import { useCountTo } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/**
 * One number on an inset card: its name and icon on the frame, the number (counting up on first show), its change and
 * anything under it (a sparkline, a hint) on the panel.
 */
export function InsetMetric({
  label,
  value,
  locale,
  formatOptions,
  change,
  changeUnit = "%",
  changeLabel,
  invert = false,
  icon,
  children,
  className,
}: {
  label: string
  value: number
  /** BCP 47 locale the number is written in. */
  locale: string
  formatOptions?: Intl.NumberFormatOptions
  /** Change against last period, in percent (or changeUnit). */
  change?: number
  changeUnit?: string
  changeLabel?: string
  /** Down is good news (costs, churn): a fall shows in green. */
  invert?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const shown = useCountTo(value, true)
  const intl = useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const up = (change ?? 0) >= 0
  const good = invert ? !up : up
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    <Card
      variant="inset"
      title={label}
      action={
        icon && (
          <span aria-hidden className="flex text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )
      }
      className={className}
      classNames={{ title: "text-[13px] font-normal text-muted-foreground tracking-normal", header: "py-2.5", body: "flex flex-col gap-3" }}
    >
      <div className="space-y-2">
        {/* The live number is for sight; screen readers get the final value once. */}
        <p className="font-heading text-[26px] leading-none font-medium tracking-[-0.03em] tabular-nums">
          <span aria-hidden>{intl.format(shown)}</span>
          <span className="sr-only">{intl.format(value)}</span>
        </p>
        {change !== undefined && (
          <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                good ? "bg-success/10 text-success-text" : "bg-destructive/10 text-destructive-text"
              )}
            >
              <Arrow className="size-3" aria-hidden />
              {/* Sign, number and unit read left to right in every language: "+8.5%", never "8.5%+" in Arabic. */}
              <span dir="ltr">
                {up ? "+" : "−"}
                {Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 1 })}
                {changeUnit}
              </span>
            </span>
            {changeLabel}
          </p>
        )}
      </div>
      {children}
    </Card>
  )
}
