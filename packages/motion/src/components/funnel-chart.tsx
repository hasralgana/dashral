"use client"

import * as React from "react"
import { motion } from "motion/react"
import type { FunnelChartProps } from "@dashral/ui/components/funnel-chart"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { FunnelChartProps, FunnelChartDatum } from "@dashral/ui/components/funnel-chart"

/** A bar takes this share of its column; the rest is the flow to the next step. As the kit's FunnelChart has it. */
const BAR = 0.56
const RADIUS = 6
/** Seconds between one column's arrival and the next. */
const STEP = 0.06

/**
 * The kit's FunnelChart with motion: the same props and look. When the data changes, every value, share and drop turns
 * on odometer wheels, each digit as far as it travelled, while the bars and the flow between them glide to their new
 * heights. On arrival the bars rise one after another and each value rises into its line with its bar. With reduced
 * motion it's simply there and new data shows at once.
 */
export function FunnelChart({
  data,
  height = 200,
  color = "var(--chart-1)",
  percent: percentOf = "first",
  showLost = true,
  locale: localeProp,
  formatOptions,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: FunnelChartProps) {
  const reduced = useReducedMotion()
  const { t, locale: contextLocale, dir } = useLocale()
  const locale = localeProp ?? contextLocale
  const format = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const percent = React.useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }), [locale])
  const values = data.map((d) => Math.max(0, d.value))
  const full = Math.max(0, ...values)
  const top = (i: number) => (full ? height - (values[i]! / full) * height : height)
  const ratio = (part: number, whole: number) => (whole ? part / whole : 0)
  const squared = (k: number) => showLost && k > 0 && values[k - 1]! > values[k]!
  const corner = (k: number) => (squared(k) ? 0 : Math.min(RADIUS, height - top(k)))

  // Arrival: a column comes up from below after the one before it; with reduced motion, nothing moves.
  const arrive = (i: number, from: Record<string, string | number>) =>
    reduced ? { initial: false as const } : { initial: from, transition: { duration: duration.considered, ease: ease.enter, delay: i * STEP } }
  // Changes after arrival: heights glide, without overshoot.
  const glide = reduced ? { duration: 0 } : spring.glide

  if (data.length === 0) {
    return (
      <div data-slot="funnel-chart" className={cn("grid place-items-center text-sm text-muted-foreground", className)} style={{ height }} {...props}>
        {t("noData")}
      </div>
    )
  }

  return (
    <div data-slot="funnel-chart" role="figure" aria-label={ariaLabel ?? t("funnelChart")} className={cn("w-full", className)} {...props}>
      <ol className="grid grid-rows-[auto_auto] gap-x-0 gap-y-3" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d, i) => {
          const value = values[i]!
          const previous = i > 0 ? values[i - 1]! : undefined
          const lost = previous === undefined ? 0 : Math.max(0, previous - value)
          const base = percentOf === "previous" && previous !== undefined ? previous : values[0]!
          const barTop = top(i)
          const lostTop = previous === undefined ? barTop : top(i - 1)
          const left = ((1 - BAR) / 2) * 100
          const right = 100 - left
          const nextTop = i < data.length - 1 ? top(i + 1) : null
          const end = 100 + left
          const middle = (right + end) / 2
          const hasLost = showLost && previous !== undefined && lost > 0
          return (
            <li key={d.key ?? d.label} className={cn("row-span-2 grid grid-rows-subgrid", classNames?.step)}>
              <div className="grid min-w-0 content-start gap-0.5 px-1 text-center">
                <motion.span className="truncate text-xs text-muted-foreground" animate={{ opacity: 1, y: 0 }} {...arrive(i, { opacity: 0, y: 4 })}>
                  {d.label}
                </motion.span>
                {/* The value rises into its line with its bar, then turns on wheels when the data changes. */}
                <span className="-mb-[0.12em] flex justify-center overflow-hidden pb-[0.12em] text-base font-semibold tabular-nums">
                  <motion.span className="flex" animate={{ y: 0 }} {...arrive(i, { y: "110%" })}>
                    <Odometer value={d.value} format={format} />
                  </motion.span>
                </span>
                <motion.span className="flex justify-center text-xs text-muted-foreground tabular-nums" animate={{ opacity: 1, y: 0 }} {...arrive(i + 1, { opacity: 0, y: 4 })}>
                  <Odometer value={ratio(value, base)} format={percent} />
                </motion.span>
                {previous !== undefined && (
                  <span className="sr-only">{t("funnelFrom", { rate: percent.format(ratio(value, previous)), from: data[i - 1]!.label, lost: format.format(lost) })}</span>
                )}
              </div>

              <div aria-hidden className="relative" style={{ height }}>
                <motion.svg
                  width="100%"
                  height={height}
                  viewBox={`0 0 100 ${height}`}
                  preserveAspectRatio="none"
                  className={cn("absolute inset-0 overflow-visible", dir === "rtl" && "-scale-x-100")}
                  animate={{ opacity: 1 }}
                  {...arrive(i + 1, { opacity: 0 })}
                >
                  {nextTop !== null && (
                    <motion.path
                      initial={false}
                      animate={{ d: `M50,${barTop}L${right},${barTop}C${middle},${barTop} ${middle},${nextTop} ${end},${nextTop}L150,${nextTop}L150,${height}L50,${height}Z` }}
                      transition={glide}
                      fill={color}
                      fillOpacity={0.12}
                    />
                  )}
                </motion.svg>

                {hasLost && (
                  <motion.div
                    className="@container absolute grid place-items-center overflow-hidden border border-b-0 border-dashed border-muted-foreground/35 text-[11px] text-muted-foreground tabular-nums"
                    style={{ left: `${left}%`, right: `${left}%`, borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }}
                    initial={reduced ? false : { top: lostTop, height: barTop - lostTop, opacity: 0 }}
                    animate={{ top: lostTop, height: barTop - lostTop, opacity: 1 }}
                    transition={{ ...glide, opacity: reduced ? { duration: 0 } : { duration: duration.considered, ease: ease.enter, delay: (i + 1) * STEP } }}
                  >
                    {barTop - lostTop >= 18 && (
                      <span className="flex px-0.5 @max-[3.75rem]:px-0 @max-[3.75rem]:text-[10px]">
                        −<Odometer value={lost} format={format} />
                      </span>
                    )}
                  </motion.div>
                )}

                <motion.div
                  className="absolute bottom-0 overflow-hidden"
                  style={{ left: `${left}%`, right: `${left}%`, borderTopLeftRadius: corner(i), borderTopRightRadius: corner(i) }}
                  initial={false}
                  animate={{ top: barTop }}
                  transition={glide}
                >
                  <motion.div className={cn("h-full", classNames?.bar)} style={{ background: color }} animate={{ y: 0 }} {...arrive(i, { y: "100%" })} />
                </motion.div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
