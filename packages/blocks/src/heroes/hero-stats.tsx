"use client"

import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { enterMotion, stagger, useCountTo } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/** A button: a link with href, or your handler with onClick. */
export type BlockAction = { label: string; href?: string; onClick?: () => void }
export type HeroStat = { label: string; value: number; format?: Intl.NumberFormatOptions; suffix?: string; change?: string; trend?: number[] }

const sampleStats: HeroStat[] = [
  { label: "Events tracked every day", value: 48_200_000, format: { notation: "compact", maximumFractionDigits: 1 }, change: "+18%", trend: [20, 24, 23, 29, 31, 30, 36, 41, 44, 49] },
  { label: "Teams on Acme", value: 2400, format: { maximumFractionDigits: 0 }, suffix: "+", change: "+320 this quarter", trend: [8, 9, 11, 12, 14, 15, 17, 19, 21, 24] },
  { label: "Median query time", value: 120, format: { maximumFractionDigits: 0 }, suffix: " ms", change: "35% faster this year", trend: [190, 184, 176, 170, 161, 150, 142, 133, 126, 120] },
]

/** A number that counts up from zero when the block first shows. */
function CountingNumber({ value, format = { maximumFractionDigits: 0 }, suffix }: { value: number; format?: Intl.NumberFormatOptions; suffix?: string }) {
  const shown = useCountTo(value, true)
  return (
    <>
      <span aria-hidden>
        {new Intl.NumberFormat("en-US", format).format(shown)}
        {suffix}
      </span>
      <span className="sr-only">
        {new Intl.NumberFormat("en-US", format).format(value)}
        {suffix}
      </span>
    </>
  )
}

/**
 * A hero that leads with proof: the promise and actions on top, then three numbers that count up, each with its trend.
 * Every part comes from props; with reduced motion the numbers are simply there.
 */
export function HeroStats({
  status = "All systems normal",
  title = "Numbers your whole company can trust",
  description = "One source of truth from the first event to the board deck. Built for scale, priced for teams of five.",
  primary = { label: "Get started", href: "#" },
  secondary = { label: "See customer stories", href: "#" },
  stats = sampleStats,
}: {
  /** The badge above the headline; none hides it. */
  status?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  primary?: BlockAction
  /** The second button; null hides it. */
  secondary?: BlockAction | null
  stats?: HeroStat[]
}) {
  return (
    <section className="relative isolate overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {status && (
              <Badge variant="soft" color="success" className={cn(enterMotion, "mb-5 gap-1.5 rounded-full")} style={stagger(0, 80)}>
                <span aria-hidden className="size-1.5 rounded-full bg-success" /> {status}
              </Badge>
            )}
            <h1 className={cn(enterMotion, "text-4xl leading-[1.06] font-semibold tracking-[-0.04em] text-balance sm:text-6xl")} style={stagger(1, 80)}>
              {title}
            </h1>
            {description && (
              <p className={cn(enterMotion, "mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg")} style={stagger(2, 80)}>
                {description}
              </p>
            )}
          </div>
          <div className={cn(enterMotion, "flex flex-wrap gap-3")} style={stagger(3, 80)}>
            <Action action={primary}>
              {primary.label} <ArrowRight aria-hidden />
            </Action>
            {secondary && (
              <Action action={secondary} variant="outline">
                {secondary.label}
              </Action>
            )}
          </div>
        </div>

        <dl className="mt-14 grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-[repeat(var(--count),minmax(0,1fr))]" style={{ "--count": stats.length } as React.CSSProperties}>
          {stats.map((stat, i) => (
            <div key={stat.label} className={cn(enterMotion, "flex flex-col gap-4 p-6 not-first:border-t sm:p-8 sm:not-first:border-t-0 sm:not-first:border-s")} style={stagger(4 + i, 80)}>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="order-first text-4xl font-semibold tracking-[-0.03em] tabular-nums sm:text-5xl">
                <CountingNumber value={stat.value} format={stat.format} suffix={stat.suffix} />
              </dd>
              {(stat.change || stat.trend) && (
                <dd className="flex items-end justify-between gap-4">
                  {stat.change && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success-text">
                      <ArrowUpRight className="size-3.5" aria-hidden /> {stat.change}
                    </span>
                  )}
                  {stat.trend && <Sparkline data={stat.trend} variant="area" className="ms-auto h-10 w-28 text-primary" aria-label={`${stat.label}: trend`} />}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** A large button that follows its action: a link, or a handler. */
function Action({ action, variant, className, children }: { action: BlockAction; variant?: "outline"; className?: string; children: React.ReactNode }) {
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
