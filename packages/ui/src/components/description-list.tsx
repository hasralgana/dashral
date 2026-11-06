import * as React from "react"

import { cn } from "../lib/utils"

type DescriptionItem = {
  /** What the value is: "Email", "Plan", "Due". */
  term: React.ReactNode
  /** The value. Empty (undefined, null or "") shows the list's `empty` mark. */
  description?: React.ReactNode
  /** With layout="stacked" and columns: the item takes the whole row, e.g. an address or notes. */
  span?: "full"
  /** A stable key; the index is used without one. */
  key?: string
}

type DescriptionListLayout = "inline" | "justified" | "stacked"

type DescriptionListProps = Omit<React.ComponentProps<"dl">, "children"> & {
  items: DescriptionItem[]
  /**
   * inline (default): the term in a column of its own, the value beside it, as on a record's details. justified: the
   * term at the start and the value at the far end, as in a summary or totals. stacked: the term above the value,
   * in columns with `columns`.
   */
  layout?: DescriptionListLayout
  /** With layout="stacked": how many side by side from the sm breakpoint up (one on phones). */
  columns?: 1 | 2 | 3 | 4
  /** Lines between the items. */
  divided?: boolean
  /** With layout="inline": the term column's width, any CSS length. */
  termWidth?: string
  /** sm for a dense panel or a popover: smaller text and gaps. */
  size?: "sm" | "default"
  /** In place of an empty value. A muted dash by default. */
  empty?: React.ReactNode
  classNames?: { item?: string; term?: string; description?: string }
}

const columnClasses: Record<NonNullable<DescriptionListProps["columns"]>, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

const isEmpty = (value: React.ReactNode) => value === undefined || value === null || value === ""

/**
 * Terms and their values, in one tag: `<DescriptionList items={[{ term: "Plan", description: "Pro" }]} />`. A real
 * <dl>, so screen readers hear each value with its term. Values wrap rather than being cut off.
 */
function DescriptionList({
  items,
  layout = "inline",
  columns = 1,
  divided = false,
  termWidth = "8rem",
  size = "default",
  empty,
  className,
  classNames,
  style,
  ...props
}: DescriptionListProps) {
  const sm = size === "sm"
  const emptyMark = empty ?? (
    <span aria-hidden className="text-muted-foreground">
      —
    </span>
  )
  const stackedColumns = layout === "stacked" && columns > 1

  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      style={layout === "inline" ? ({ "--term-width": termWidth, ...style } as React.CSSProperties) : style}
      className={cn(
        "grid min-w-0",
        sm ? "text-xs" : "text-sm",
        divided ? (stackedColumns ? (sm ? "gap-x-4" : "gap-x-6") : "divide-y") : sm ? "gap-2" : "gap-3",
        stackedColumns && [columnClasses[columns], !divided && (sm ? "gap-x-4" : "gap-x-6")],
        className
      )}
      {...props}
    >
      {items.map((item, i) => (
        <div
          key={item.key ?? i}
          data-slot="description-item"
          className={cn(
            "min-w-0",
            layout === "inline" && "grid grid-cols-[minmax(0,var(--term-width))_minmax(0,1fr)] gap-x-4 gap-y-1",
            layout === "justified" && "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
            layout === "stacked" && "grid content-start gap-1",
            item.span === "full" && "sm:col-span-full",
            // Divided rows get their breathing room from padding, so the lines sit halfway between them; in columns,
            // each item has a line on top instead, so the line runs under every column.
            divided && (stackedColumns ? ["border-t", sm ? "pt-2 pb-2" : "pt-3 pb-3"] : sm ? "py-2 first:pt-0 last:pb-0" : "py-3 first:pt-0 last:pb-0"),
            classNames?.item
          )}
        >
          <dt className={cn("min-w-0 text-muted-foreground", classNames?.term)}>{item.term}</dt>
          <dd
            className={cn(
              "min-w-0 break-words",
              layout === "justified" && "text-end",
              layout === "stacked" && "font-medium",
              classNames?.description
            )}
          >
            {isEmpty(item.description) ? emptyMark : item.description}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export { DescriptionList, type DescriptionListProps, type DescriptionItem, type DescriptionListLayout }
