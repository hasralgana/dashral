import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "../lib/utils"

type ListItem = {
  /** A stable key; the index is used without one. */
  key?: string
  /** The row's main line: a name, a title. */
  title: React.ReactNode
  /** A second line under it. */
  description?: React.ReactNode
  /** At the start: an Avatar, an icon in a tile, a logo. */
  media?: React.ReactNode
  /** At the end, quiet: a date, a status Badge, a count. */
  meta?: React.ReactNode
  /** At the very end: buttons or a menu. They stay clickable on a row that links. */
  actions?: React.ReactNode
  /** Makes the whole row a link (through linkAs); a chevron shows at its end unless it has actions. */
  href?: string
  /** Makes the whole row a button. */
  onClick?: () => void
  /** The row you're on: tinted, and announced as current. */
  active?: boolean
  disabled?: boolean
}

type ListProps = Omit<React.ComponentProps<"ul">, "children"> & {
  items: ListItem[]
  /** default: rows on the page; card: inside a bordered card of their own. */
  variant?: "default" | "card"
  /** Lines between the rows. On by default. */
  divided?: boolean
  /** sm for a popover, a sidebar or a dense panel. */
  size?: "sm" | "default"
  /** Shown in place of the rows when there are none, e.g. an EmptyState. */
  empty?: React.ReactNode
  /** Your router's link, for rows with href. */
  linkAs?: React.ElementType
  classNames?: { item?: string; media?: string; title?: string; description?: string; meta?: string; actions?: string }
}

/**
 * Rows of people, files or things, in one tag: a picture, a title and description, details and actions at the end.
 * Each row can link or act as a whole while its own buttons still work. Where it's narrow (a phone, a sidebar, a small
 * card) the details and actions move under the text instead of squeezing it: it follows its own width, not the
 * screen's.
 */
function List({
  items,
  variant = "default",
  divided = true,
  size = "default",
  empty,
  linkAs: Link = "a",
  className,
  classNames,
  ...props
}: ListProps) {
  const sm = size === "sm"
  if (items.length === 0 && empty !== undefined) return <>{empty}</>

  return (
    <ul
      role="list"
      data-slot="list"
      className={cn(
        "@container grid",
        divided && "divide-y",
        variant === "card" && "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs",
        "text-sm",
        className
      )}
      {...props}
    >
      {items.map((item, i) => {
        const interactive = item.href !== undefined || item.onClick !== undefined
        const trailing = item.meta !== undefined || item.actions !== undefined || (item.href !== undefined && !item.actions)
        // Only a chevron at the end: it stays there at any width; there's nothing to move under the text.
        const chevronOnly = item.meta === undefined && item.actions === undefined && item.href !== undefined
        // The title carries the row's link or button; its ::after stretches over the whole row, so a click anywhere
        // lands on it, while the actions sit above that layer and keep their own clicks.
        const stretch =
          "outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
        const titleText = (
          <span className={cn("block truncate font-medium", classNames?.title)}>{item.title}</span>
        )
        const title =
          item.href !== undefined && !item.disabled ? (
            <Link href={item.href} aria-current={item.active ? "page" : undefined} data-list-link="" className={stretch}>
              {titleText}
            </Link>
          ) : item.onClick && !item.disabled ? (
            <button type="button" onClick={item.onClick} aria-current={item.active || undefined} data-list-link="" className={cn("w-full text-start", stretch)}>
              {titleText}
            </button>
          ) : (
            titleText
          )

        return (
          <li
            key={item.key ?? i}
            data-slot="list-item"
            data-active={item.active || undefined}
            data-disabled={item.disabled || undefined}
            className={cn(
              "relative grid items-center gap-x-3 gap-y-2",
              item.media ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]",
              chevronOnly
                ? item.media
                  ? "grid-cols-[auto_minmax(0,1fr)_auto]"
                  : "grid-cols-[minmax(0,1fr)_auto]"
                : trailing && (item.media ? "@sm:grid-cols-[auto_minmax(0,1fr)_auto]" : "@sm:grid-cols-[minmax(0,1fr)_auto]"),
              sm ? "px-3 py-2" : "px-4 py-3",
              variant === "default" && !divided && "rounded-lg",
              interactive && !item.disabled && "transition-colors duration-(--duration-fast) hover:bg-accent/50",
              item.active && "bg-accent/60",
              item.disabled && "opacity-50",
              classNames?.item
            )}
          >
            {item.media && <div className={cn("flex shrink-0 items-center", classNames?.media)}>{item.media}</div>}
            <div className="grid min-w-0 gap-0.5">
              {title}
              {item.description && (
                <span className={cn("truncate text-muted-foreground", sm ? "text-xs" : "text-[13px]", classNames?.description)}>{item.description}</span>
              )}
            </div>
            {trailing && (
              // Under the text where it's narrow (in line with it, after the media), at the end where there's room.
              <div
                className={cn(
                  "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 @sm:flex-nowrap @sm:justify-end",
                  chevronOnly ? "justify-end" : item.media && "col-start-2 @sm:col-start-3"
                )}
              >
                {item.meta !== undefined && (
                  <div className={cn("flex items-center gap-2 text-xs text-muted-foreground tabular-nums", classNames?.meta)}>{item.meta}</div>
                )}
                {item.actions !== undefined && (
                  <div className={cn("relative z-10 flex items-center gap-1.5 @max-sm:ms-auto", classNames?.actions)}>{item.actions}</div>
                )}
                {item.href !== undefined && !item.actions && (
                  <ChevronRightIcon aria-hidden className="ms-auto size-4 text-muted-foreground rtl:-scale-x-100" />
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export { List, type ListProps, type ListItem }
