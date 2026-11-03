"use client"

import { useState } from "react"
import { Clock, DollarSign, Percent, ShoppingBag } from "lucide-react"
import { MetricCard } from "@dashral/ui/components/metric-card"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

export type Stat = { value: number; change: number; trend: number[] }
/** A card: what it measures and how its number reads; its figures come from each period, under `key`. */
export type StatMetric = {
  key: string
  label: string
  icon?: React.ReactNode
  formatOptions?: Intl.NumberFormatOptions
  formatValue?: (value: number) => string
  /** After the change, e.g. " pts". */
  changeUnit?: string
  /** A fall is good news (response times): it shows in green. */
  invert?: boolean
  chart: "area" | "bar" | "line"
}
/** A period on the switch: its label there, what the change is against, and each card's figures by key. */
export type StatPeriod = { value: string; label: string; compare: string; stats: Record<string, Stat> }

const sampleMetrics: StatMetric[] = [
  { key: "revenue", label: "Revenue", icon: <DollarSign />, formatOptions: { style: "currency", currency: "USD", maximumFractionDigits: 0 }, chart: "area" },
  { key: "orders", label: "Orders", icon: <ShoppingBag />, chart: "bar" },
  { key: "conversion", label: "Conversion rate", icon: <Percent />, formatOptions: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }, changeUnit: " pts", chart: "line" },
  { key: "response", label: "First response", icon: <Clock />, formatValue: (v: number) => `${Math.round(v)} min`, invert: true, chart: "line" },
]

const sampleData: Record<string, { label: string; revenue: Stat; orders: Stat; conversion: Stat; response: Stat }> = {
  "7d": {
    label: "vs previous 7 days",
    revenue: { value: 12840, change: 8.2, trend: [1.4, 1.6, 1.5, 1.9, 1.8, 2.1, 2.3] },
    orders: { value: 342, change: 4.6, trend: [41, 45, 44, 52, 49, 54, 57] },
    conversion: { value: 0.031, change: 0.4, trend: [2.7, 2.8, 2.9, 3.0, 2.9, 3.1, 3.2] },
    response: { value: 74, change: -12.1, trend: [92, 88, 85, 81, 79, 76, 74] },
  },
  "30d": {
    label: "vs previous 30 days",
    revenue: { value: 48290, change: 12.5, trend: [31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52] },
    orders: { value: 1408, change: 9.1, trend: [98, 104, 101, 112, 108, 117, 115, 121, 119, 126, 124, 133] },
    conversion: { value: 0.029, change: 0.2, trend: [2.6, 2.7, 2.7, 2.8, 2.7, 2.9, 2.8, 2.9, 3.0, 2.9, 3.0, 3.1] },
    response: { value: 81, change: -6.3, trend: [96, 94, 93, 90, 91, 88, 87, 85, 86, 83, 82, 81] },
  },
  "90d": {
    label: "vs previous 90 days",
    revenue: { value: 139400, change: -2.4, trend: [52, 49, 47, 50, 46, 44, 45, 43, 46, 44, 47, 45] },
    orders: { value: 4120, change: 1.8, trend: [310, 322, 318, 331, 327, 335, 330, 341, 338, 344, 340, 349] },
    conversion: { value: 0.027, change: -0.3, trend: [3.0, 2.9, 2.9, 2.8, 2.8, 2.7, 2.8, 2.7, 2.6, 2.7, 2.6, 2.7] },
    response: { value: 88, change: 3.5, trend: [82, 83, 85, 84, 86, 85, 87, 86, 88, 87, 89, 88] },
  },
}

/** Reads a trend aloud by its two ends, so a screen reader hears which way it went. */
function trendLabel(name: string, trend: number[]) {
  const rising = trend.at(-1)! >= trend[0]!
  return `${name} trend: ${rising ? "rising" : "falling"}`
}

const samplePeriods: StatPeriod[] = (["7d", "30d", "90d"] as const).map((value) => {
  const { label: compare, ...stats } = sampleData[value]!
  return { value, label: `${value.slice(0, -1)} days`, compare, stats }
})

/**
 * The top of a dashboard: four numbers with their change and trend, and a period switch that moves all of them.
 * Response time goes down when it gets better, so its fall shows in green. Four columns, then two, then one. Every
 * part comes from props: your metrics and each period's figures; with `period` and `onPeriodChange` you load a
 * period's figures as it's picked.
 */
export function StatsCards({
  title = "Overview",
  description = "Updated a minute ago · all stores",
  metrics = sampleMetrics,
  periods = samplePeriods,
  period: periodProp,
  onPeriodChange,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  metrics?: StatMetric[]
  periods?: StatPeriod[]
  /** The period picked (the cards keep it without it). */
  period?: string
  onPeriodChange?: (period: string) => void
}) {
  const [ownPeriod, setOwnPeriod] = useState(periods[1]?.value ?? periods[0]?.value ?? "")
  const period = periodProp ?? ownPeriod
  const setPeriod = (next: string) => {
    setOwnPeriod(next)
    onPeriodChange?.(next)
  }
  const data = periods.find((p) => p.value === period) ?? periods[0]
  const cards = metrics.flatMap((metric) => {
    const stat = data?.stats[metric.key]
    return stat ? [{ ...metric, stat }] : []
  })

  return (
    <section aria-labelledby="stats-cards-title" className="bg-background p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="stats-cards-title" className="text-lg font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {periods.length > 1 && (
          <SegmentedControl aria-label="Period" value={period} onValueChange={setPeriod} options={periods.map(({ value, label }) => ({ value, label }))} />
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(var(--count),minmax(0,1fr))]" style={{ "--count": Math.min(4, cards.length) } as React.CSSProperties}>
        {cards.map((card, i) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.stat.value}
            formatOptions={card.formatOptions}
            formatValue={card.formatValue}
            change={card.stat.change}
            changeUnit={card.changeUnit}
            changeLabel={data?.compare}
            invert={card.invert}
            icon={card.icon}
            countOnMount
            className={cn(enterMotion)}
            style={stagger(i, 60)}
          >
            {/* Keyed by the period, so the new trend draws in instead of morphing from the old one. */}
            <Sparkline
              key={period}
              data={card.stat.trend}
              variant={card.chart}
              min={card.chart === "bar" ? 0 : undefined}
              className="h-10 text-primary"
              aria-label={trendLabel(card.label, card.stat.trend)}
            />
          </MetricCard>
        ))}
      </div>
    </section>
  )
}
