import * as React from "react"

import { CountTo } from "../lib/count-to"
import { enterMotion, growMotion, stagger } from "../lib/motion"
import { cn } from "../lib/utils"

type BarListItem = {
  /** A stable key; the index is used without one. */
  key?: string
  label: React.ReactNode
  value: number
  /** Before the label, e.g. an avatar, a product photo or an icon. */
  icon?: React.ReactNode
  /** Muted text after the label, e.g. the referring domains. */
  hint?: React.ReactNode
  /** Muted text before the value, e.g. "53 sold". */
  meta?: React.ReactNode
  /** Shown in place of the formatted value, e.g. "2m 05s". */
  display?: React.ReactNode
  /** Makes the label a link. */
  href?: string
  /** Any CSS color for this bar, e.g. "var(--chart-2)"; otherwise the list's color. */
  color?: string
}

type BarListColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive" | "highlight"

type BarListProps = Omit<React.HTMLAttributes<HTMLElement>, "children" | "color"> & {
  items: BarListItem[]
  /** The bars' color. */
  color?: BarListColor
  /** Numbers the rows (an ordered list), for a ranking. */
  showRank?: boolean
  /** Each value's share of `total` as a percentage, after the value. */
  showShare?: boolean
  /** What shares are of; by default the values added up. Pass it when the list is a top N of more. */
  total?: number
  /** The value a full bar stands for; by default the largest. */
  max?: number
  /** BCP 47 locale for values and shares. */
  locale?: string
  /** How values are written, e.g. `{ style: "currency", currency: "USD" }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** Your router's link for rows with href, e.g. Next.js Link. */
  linkAs?: React.ElementType
  classNames?: { item?: string; icon?: string; label?: string; value?: string; track?: string; bar?: string }
}

const shareOptions: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 }

const barColors: Record<BarListColor, string> = {
  primary: "bg-primary",
  neutral: "bg-foreground/70",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  highlight: "bg-highlight",
}

/**
 * Values side by side as labelled bars, in one tag: top products, traffic sources, storage by type. Every value is
 * written out, so the bars only add a quick sense of size; they grow in one after another, and new values count to
 * theirs.
 */
function BarList({
  items,
  color = "primary",
  showRank = false,
  showShare = false,
  total,
  max,
  locale = "en-US",
  formatOptions,
  linkAs: LinkAs = "a",
  className,
  classNames,
  ...props
}: BarListProps) {
  const full = max ?? Math.max(0, ...items.map((item) => item.value))
  const sum = total ?? items.reduce((acc, item) => acc + Math.max(0, item.value), 0)
  const List = showRank ? "ol" : "ul"

  return (
    <List data-slot="bar-list" className={cn("grid grid-cols-1 gap-3.5 text-sm", className)} {...props}>
      {items.map((item, i) => (
        <li key={item.key ?? i} className={cn(enterMotion, "flex items-start gap-2.5", classNames?.item)} style={stagger(i, 60)}>
          {showRank && (
            <span aria-hidden className="mt-0.5 w-4 shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">
              {i + 1}
            </span>
          )}
          {item.icon && <span className={cn("flex shrink-0 items-center text-muted-foreground [&_svg]:size-4", classNames?.icon)}>{item.icon}</span>}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5">
            <div className="flex min-h-5 items-center gap-2.5">
              <span className={cn("flex min-w-0 flex-1 items-baseline gap-2", classNames?.label)}>
                {item.href ? (
                  <LinkAs href={item.href} className="max-w-full shrink-0 truncate font-medium underline-offset-4 hover:underline">
                    {item.label}
                  </LinkAs>
                ) : (
                  <span className="truncate font-medium">{item.label}</span>
                )}
                {item.hint != null && <span className="min-w-0 truncate text-xs text-muted-foreground">{item.hint}</span>}
              </span>
              {item.meta != null && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.meta}</span>}
              <span className={cn("shrink-0 text-end font-semibold tabular-nums", classNames?.value)}>{item.display ?? <CountTo value={item.value} locale={locale} formatOptions={formatOptions} />}</span>
              {showShare && (
                <span className="w-9 shrink-0 text-end text-xs text-muted-foreground tabular-nums">
                  <CountTo value={sum ? Math.max(0, item.value) / sum : 0} locale={locale} formatOptions={shareOptions} />
                </span>
              )}
            </div>
            <div aria-hidden className={cn("h-1.5 overflow-hidden rounded-full bg-muted", classNames?.track)}>
              <div
                className={cn(growMotion, "h-full rounded-full", !item.color && barColors[color], classNames?.bar)}
                style={{ width: `${full ? (Math.max(0, item.value) / full) * 100 : 0}%`, background: item.color, ...stagger(i, 60) }}
              />
            </div>
          </div>
        </li>
      ))}
    </List>
  )
}

export { BarList, type BarListProps, type BarListItem, type BarListColor }
