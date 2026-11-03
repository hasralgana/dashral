"use client"

import { useId, useState } from "react"
import { ChevronUp, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { cn } from "@dashral/ui/lib/utils"

type LegendColor = "primary" | "neutral" | "info" | "success" | "warning" | "destructive"

// Each legend dot: a soft fill of its color inside a ring of it.
const dots: Record<LegendColor, string> = {
  primary: "border-primary/60 bg-primary/15",
  neutral: "border-muted-foreground/50 bg-muted-foreground/15",
  info: "border-info/60 bg-info/20",
  success: "border-success/60 bg-success/20",
  warning: "border-warning/70 bg-warning/25",
  destructive: "border-destructive/60 bg-destructive/20",
}

export type PanelCardLegendItem = {
  label: string
  /** Shown before the label, e.g. a count: "3 Overdue". */
  value?: React.ReactNode
  color: LegendColor
}

/**
 * The kit's panel card (`variant="panel"`) for a chart or a table, with more in its bar: the title and what it means
 * behind an info button, a legend of counts, actions, and a button that folds the panel away.
 */
export function PanelCard({
  title,
  info,
  legend,
  actions,
  collapsible = true,
  defaultOpen = true,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode
  /** What the card shows, in the info button's tooltip. */
  info?: string
  legend?: PanelCardLegendItem[]
  /** At the end of the bar, before the fold button: a link or a button. */
  actions?: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
  /** Padding and layout inside the panel. */
  bodyClassName?: string
  children: React.ReactNode
}) {
  const t = useTranslations("inset.panel")
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  return (
    <Card
      variant="panel"
      title={
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{title}</span>
          {info && (
            <Tooltip content={info} className="max-w-64">
              <button
                type="button"
                aria-label={t("about")}
                className="flex shrink-0 rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Info className="size-4" aria-hidden />
              </button>
            </Tooltip>
          )}
        </span>
      }
      action={
        (legend || actions || collapsible) && (
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {legend && (
              <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted-foreground max-sm:hidden">
                <LegendItems items={legend} />
              </ul>
            )}
            {actions}
            {collapsible && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls={bodyId}
                aria-label={open ? t("collapse") : t("expand")}
                className="bg-card"
              >
                <ChevronUp
                  className={cn("transition-transform duration-(--duration-standard) ease-standard motion-reduce:transition-none", !open && "rotate-180")}
                  aria-hidden
                />
              </Button>
            )}
          </div>
        )
      }
      // On phones the legend moves under the title, where it has the width.
      description={
        legend && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 sm:hidden">
            <LegendItems items={legend} />
          </ul>
        )
      }
      // Folded, it keeps to its bar's height instead of stretching to the row beside it.
      className={cn(!open && "self-start", className)}
      classNames={{
        header: "py-2.5",
        title: "text-[15px]",
        body: cn("p-0 transition-colors", !open && "border-transparent bg-transparent"),
      }}
    >
      {/* Folds by height (0fr ↔ 1fr); a folded panel can't be reached (inert). */}
      <div
        id={bodyId}
        className="grid transition-[grid-template-rows] duration-(--duration-standard) ease-standard motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </Card>
  )
}

function LegendItems({ items }: { items: PanelCardLegendItem[] }) {
  return items.map((item) => (
    <li key={item.label} className="flex items-center gap-2">
      <span aria-hidden className={cn("size-3.5 shrink-0 rounded-full border", dots[item.color])} />
      <span className="whitespace-nowrap">
        {item.value !== undefined && <span className="font-medium text-foreground tabular-nums">{item.value} </span>}
        {item.label}
      </span>
    </li>
  ))
}
