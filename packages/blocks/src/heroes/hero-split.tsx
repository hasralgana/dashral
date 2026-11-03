"use client"

import { useState } from "react"
import { ArrowRight, Check, DollarSign, Users } from "lucide-react"
import { BarList } from "@dashral/ui/components/bar-list"
import { Button } from "@dashral/ui/components/button"
import { MetricCard } from "@dashral/ui/components/metric-card"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }
/** One period the preview can switch to: its figures, their trends and the top pages. */
export type HeroPeriod = {
  value: string
  label: string
  revenue: number
  revenueChange: number
  users: number
  usersChange: number
  trend: number[]
  usersTrend: number[]
  pages: { label: string; value: number }[]
}

const samplePeriods: HeroPeriod[] = [
  {
    value: "week",
    label: "7 days",
    revenue: 12840,
    revenueChange: 8.2,
    users: 1204,
    usersChange: 3.1,
    trend: [12, 14, 13, 17, 16, 19, 22],
    usersTrend: [150, 162, 158, 171, 168, 180, 189],
    pages: [
      { label: "/pricing", value: 3120 },
      { label: "/", value: 2650 },
      { label: "/docs/start", value: 1480 },
    ],
  },
  {
    value: "month",
    label: "30 days",
    revenue: 48290,
    revenueChange: 12.5,
    users: 4810,
    usersChange: 6.4,
    trend: [31, 34, 33, 38, 36, 41, 40, 44, 43, 47, 46, 52],
    usersTrend: [320, 338, 352, 349, 371, 380, 395, 402, 398, 415, 428, 441],
    pages: [
      { label: "/", value: 11800 },
      { label: "/pricing", value: 9420 },
      { label: "/blog/launch", value: 5210 },
    ],
  },
]

/**
 * A split hero: the promise, three reasons and the actions on one side; on the other, the product itself — a small
 * live dashboard in a browser frame, where switching the period moves every number. Stacks on phones. Every part
 * comes from props, the preview's numbers too.
 */
export function HeroSplit({
  eyebrow = "Analytics for product teams",
  title = "Know what’s working, the day it starts working",
  description = "Connect your store and your app once. Acme keeps every chart current, so Monday’s meeting starts with answers.",
  points = ["Live numbers, no spreadsheets", "Sign-in, roles and an audit log", "Self-host it or let us run it"],
  primary = { label: "Start free trial", href: "#" },
  secondary = { label: "Talk to sales", href: "#" },
  address = "app.acme.com/overview",
  periods = samplePeriods,
  defaultPeriod = "month",
  currency = "USD",
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  points?: string[]
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
  /** The preview's address bar. */
  address?: string
  periods?: HeroPeriod[]
  defaultPeriod?: string
  currency?: string
}) {
  const [period, setPeriod] = useState(defaultPeriod)
  const data = periods.find((p) => p.value === period) ?? periods[0]!

  return (
    <section className="relative isolate overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden className="absolute top-0 right-0 -z-10 size-[40rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          {eyebrow && (
            <p className={cn(enterMotion, "text-sm font-medium text-primary-text")} style={stagger(0, 80)}>
              {eyebrow}
            </p>
          )}
          <h1 className={cn(enterMotion, "mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl")} style={stagger(1, 80)}>
            {title}
          </h1>
          {description && (
            <p className={cn(enterMotion, "mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg")} style={stagger(2, 80)}>
              {description}
            </p>
          )}
          <ul className={cn(enterMotion, "mt-7 space-y-3 empty:hidden")} style={stagger(3, 80)}>
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success-text">
                  <Check className="size-3" aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className={cn(enterMotion, "mt-9 flex flex-wrap gap-3")} style={stagger(4, 80)}>
            <Action action={primary}>
              {primary.label} <ArrowRight aria-hidden />
            </Action>
            {secondary && (
              <Action action={secondary} variant="ghost">
                {secondary.label}
              </Action>
            )}
          </div>
        </div>

        {/* The product, live: a browser frame with real components inside. */}
        <div className={cn(enterMotion, "min-w-0")} style={stagger(2, 80)}>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_80px_-24px_rgb(0_0_0/0.25)] dark:shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)]">
            <div aria-hidden className="flex h-10 items-center gap-1.5 border-b px-4">
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="mx-auto rounded-md bg-muted px-3 py-0.5 text-xs text-muted-foreground">{address}</span>
            </div>
            <div className="space-y-4 bg-muted/30 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Overview</p>
                {periods.length > 1 && (
                  <SegmentedControl aria-label="Period" value={data.value} onValueChange={setPeriod} options={periods.map(({ value, label }) => ({ value, label }))} />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Revenue"
                  value={data.revenue}
                  formatOptions={{ style: "currency", currency, maximumFractionDigits: 0 }}
                  change={data.revenueChange}
                  changeLabel="vs last period"
                  icon={<DollarSign />}
                >
                  <Sparkline key={period} data={data.trend} variant="area" className="h-9 text-primary" aria-label="Revenue trend: rising" />
                </MetricCard>
                <MetricCard label="Active users" value={data.users} change={data.usersChange} changeLabel="vs last period" icon={<Users />}>
                  <Sparkline key={period} data={data.usersTrend} variant="bar" min={0} className="h-9 text-primary" aria-label="Active users trend: rising" />
                </MetricCard>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="mb-3 text-sm font-medium">Top pages</p>
                <BarList items={data.pages} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** A large button that follows its action: a link, or a handler. */
function Action({ action, variant, className, children }: { action: BlockAction; variant?: "outline" | "ghost"; className?: string; children: React.ReactNode }) {
  return action.href ? (
    <Button size="lg" variant={variant} className={className} asChild>
      <a href={action.href}>{children}</a>
    </Button>
  ) : (
    <Button size="lg" variant={variant} className={className} onClick={action.onClick}>
      {children}
    </Button>
  )
}
