import * as React from "react"

import { cn } from "../lib/utils"

type TimelineColor = "neutral" | "primary" | "info" | "success" | "warning" | "destructive" | "highlight"

// The marker: a tinted circle around the icon, or a dot without one. Every class is written out in full.
const markers: Record<TimelineColor, { circle: string; dot: string }> = {
  neutral: { circle: "bg-card text-muted-foreground", dot: "bg-muted-foreground" },
  primary: { circle: "border-primary/30 bg-primary/10 text-primary-text", dot: "bg-primary" },
  info: { circle: "border-info/30 bg-info/10 text-info-text", dot: "bg-info" },
  success: { circle: "border-success/30 bg-success/10 text-success-text", dot: "bg-success" },
  warning: { circle: "border-warning/40 bg-warning/12 text-warning-text", dot: "bg-warning" },
  destructive: { circle: "border-destructive/30 bg-destructive/10 text-destructive-text", dot: "bg-destructive" },
  highlight: { circle: "border-highlight/30 bg-highlight/10 text-highlight-text", dot: "bg-highlight" },
}

type TimelineItem = {
  title: React.ReactNode
  description?: React.ReactNode
  /** When it happened, as shown: "2 hours ago", "Oct 12". */
  time?: React.ReactNode
  /** The same moment, machine-readable, for the <time> element: an ISO date. */
  dateTime?: string
  /** The marker's icon; without one it's a dot. */
  icon?: React.ReactNode
  color?: TimelineColor
  /** A stable key; the index is used without one. */
  id?: string | number
}

type TimelineProps = Omit<React.ComponentProps<"ol">, "children"> & {
  items: TimelineItem[]
  classNames?: { item?: string; marker?: string; title?: string; time?: string; description?: string }
}

/** Events in order, in one tag: each with a marker on a line, a title, a time and a description. An ordered list. */
function Timeline({ items, className, classNames, ...props }: TimelineProps) {
  return (
    <ol data-slot="timeline" className={cn("relative", className)} {...props}>
      {items.map((item, i) => {
        const marker = markers[item.color ?? (item.icon ? "neutral" : "primary")]
        return (
          <li key={item.id ?? i} className={cn("relative flex gap-4 pb-6 last:pb-0", classNames?.item)}>
            <span aria-hidden className="absolute top-8 bottom-0 start-4 w-px -translate-x-1/2 rtl:translate-x-1/2 bg-border [li:last-child>&]:hidden" />
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border [&_svg]:size-4",
                item.icon ? marker.circle : "bg-card",
                classNames?.marker
              )}
            >
              {item.icon ?? <span className={cn("size-2 rounded-full", marker.dot)} />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn("text-sm font-medium", classNames?.title)}>{item.title}</p>
                {item.time && (
                  <time dateTime={item.dateTime} className={cn("text-xs text-muted-foreground tabular-nums", classNames?.time)}>
                    {item.time}
                  </time>
                )}
              </div>
              {item.description && <div className={cn("mt-1 text-sm text-muted-foreground", classNames?.description)}>{item.description}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { Timeline, type TimelineProps, type TimelineItem, type TimelineColor }
