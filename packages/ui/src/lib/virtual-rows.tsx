"use client"

// The scrolling part of a virtual List: the rows arrive made (List draws them, and stays a component a server can
// render), and only the ones in view, plus a few around them, are put on the page. Each row's height is measured, so
// rows of any height work, a narrow screen's stacked ones too.

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Loader2Icon } from "lucide-react"

import { useLoadMore } from "./load-more"
import { useLocale } from "./locale"
import { cn } from "./utils"

type VirtualRowsProps = Omit<React.ComponentProps<"ul">, "children"> & {
  /** The rows, each an <li> with a key. */
  rows: React.ReactElement[]
  /** The box's height in pixels. */
  height: number
  /** A row's height before it's measured. */
  estimateSize?: number
  onLoadMore?: () => Promise<void> | void
  hasMore?: boolean
  /** The scrolling box's classes; className goes on the list inside it. */
  boxClassName?: string
}

export function VirtualRows({ rows, height, estimateSize = 57, onLoadMore, hasMore = true, boxClassName, className, style, ...props }: VirtualRowsProps) {
  const { t } = useLocale()
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loader = onLoadMore !== undefined && hasMore

  // TanStack Virtual hands back new values on every scroll, so the compiler leaves this component as it is.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length + (loader ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan: 8,
  })
  const items = virtualizer.getVirtualItems()
  const top = items[0]?.start ?? 0
  const bottom = virtualizer.getTotalSize() - (items.at(-1)?.end ?? 0)
  const lastIndex = items.at(-1)?.index ?? 0
  const { status, retry } = useLoadMore({ near: loader && lastIndex >= rows.length - 6, count: rows.length, hasMore, onLoadMore })

  return (
    // The box can take focus, so the arrow keys and Page Down scroll it.
    <div
      ref={scrollRef}
      tabIndex={0}
      style={{ height }}
      className={cn("overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset", boxClassName)}
    >
      {/* The space above and below the drawn rows keeps the scrollbar true to the whole list. */}
      <ul {...props} className={className} style={{ ...style, paddingTop: top, paddingBottom: bottom }}>
        {items.map((item) =>
          item.index < rows.length ? (
            React.cloneElement(rows[item.index] as React.ReactElement<Record<string, unknown>>, {
              ref: virtualizer.measureElement,
              "data-index": item.index,
            })
          ) : (
            <li key="more" ref={virtualizer.measureElement} data-index={item.index} className="flex h-12 items-center justify-center gap-2 text-sm text-muted-foreground">
              {status === "error" ? (
                <span role="alert" className="inline-flex items-center gap-2">
                  {t("loadMoreFailed")}
                  <button
                    type="button"
                    onClick={retry}
                    className="inline-flex h-7 items-center rounded-md border bg-background px-2.5 text-xs font-medium text-foreground shadow-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {t("tryAgain")}
                  </button>
                </span>
              ) : (
                <>
                  <Loader2Icon aria-hidden className="size-4 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                  {t("loadingMore")}
                </>
              )}
            </li>
          )
        )}
      </ul>
    </div>
  )
}
