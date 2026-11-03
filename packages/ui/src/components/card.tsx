import * as React from "react"

import { cn } from "../lib/utils"

type CardVariant = "default" | "soft" | "shadow" | "inset" | "panel" | "bordered"

const variants: Record<CardVariant, string> = {
  // Flat: an edge, no shadow. Depth is the shadow variant's job.
  default: "border",
  // No edge or shadow: a tinted panel. The transparent border keeps the content where the other variants put it.
  soft: "border border-transparent bg-muted",
  // Shadows barely show on dark surfaces, so a faint ring keeps the edge visible.
  shadow: "border border-transparent shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/10",
  // A tinted frame: the header and footer sit on it, the content on a panel set in by 6px (see below).
  inset: "border bg-muted/60 dark:bg-muted/40",
  // The same frame, with the content on a panel flush with the card's edge wherever no header or footer sits (see below).
  panel: "border bg-muted/60 dark:bg-muted/40",
  // The old name, from before soft replaced its heavy 2px edge.
  bordered: "border border-transparent bg-muted",
}

type CardProps = Omit<React.ComponentProps<"div">, "title"> & {
  /**
   * default: an edge; soft: a tinted panel, no edge; shadow: lifted off the page; inset: the header on a tinted frame
   * and the content on a panel set into it; panel: the same, the panel flush with the card's sides (and its top or
   * bottom when nothing sits there), for a chart, a table or a list. ("bordered" is deprecated: it looks like soft.)
   */
  variant?: CardVariant
  title?: React.ReactNode
  description?: React.ReactNode
  /** Above the title, e.g. a badge or a category. */
  eyebrow?: React.ReactNode
  /** At the end of the header, e.g. a menu button. */
  action?: React.ReactNode
  /** An image (or anything) flush with the card's edge: on top, or at the start when horizontal. */
  media?: React.ReactNode
  /** horizontal puts the media beside the content from the sm breakpoint. */
  orientation?: "vertical" | "horizontal"
  /** Under the content, e.g. buttons. */
  footer?: React.ReactNode
  /** A line between the content and the footer. */
  footerDivider?: boolean
  /** none drops the padding around the content, for a layout of your own (an image filling the card). */
  padding?: "default" | "none"
  classNames?: {
    media?: string
    /** The column holding the header, content and footer: its padding and gap, e.g. "gap-3 py-5" for a tighter card. */
    section?: string
    header?: string
    eyebrow?: string
    title?: string
    description?: string
    action?: string
    body?: string
    footer?: string
  }
}

/**
 * A surface for related content, in one tag: a header (eyebrow, title, description, action), the content as children,
 * and a footer. media puts an image flush with the edge, on top or beside.
 */
function Card({
  variant = "default",
  title,
  description,
  eyebrow,
  action,
  media,
  orientation = "vertical",
  footer,
  footerDivider = false,
  padding = "default",
  className,
  classNames,
  children,
  ...props
}: CardProps) {
  const header = title || description || eyebrow || action
  const padded = padding === "default"
  // inset and panel share the frame: the header and footer on the tint, the content on a panel.
  const framed = variant === "inset" || variant === "panel"
  const flush = variant === "panel"

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground",
        orientation === "horizontal" && "sm:flex-row",
        variants[variant],
        className
      )}
      {...props}
    >
      {media && (
        <div
          data-slot="card-media"
          className={cn(
            "shrink-0 [&>img]:w-full [&>img]:object-cover",
            orientation === "horizontal" && "sm:w-56 sm:[&>img]:h-full",
            classNames?.media
          )}
        >
          {media}
        </div>
      )}
      <div
        data-slot="card-section"
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          // A footer under a line sits close to it: 12px above and below its actions, like a toolbar.
          padded && !framed && (footer && footerDivider ? "gap-6 pt-6 pb-3" : "gap-6 py-6"),
          classNames?.section
        )}
      >
        {header && (
          <div
            data-slot="card-header"
            className={cn("grid items-start gap-1.5", padded && (framed ? "px-4 py-3" : "px-6"), framed && action && "items-center", action && "grid-cols-[1fr_auto]", classNames?.header)}
          >
            <div className="grid min-w-0 gap-1.5">
              {eyebrow && <div className={cn("flex", classNames?.eyebrow)}>{eyebrow}</div>}
              {title && (
                <div data-slot="card-title" className={cn("font-heading leading-none font-medium tracking-[-0.01em]", classNames?.title)}>
                  {title}
                </div>
              )}
              {description && (
                <div data-slot="card-description" className={cn("text-sm text-muted-foreground", classNames?.description)}>
                  {description}
                </div>
              )}
            </div>
            {action && <div className={cn("self-start", classNames?.action)}>{action}</div>}
          </div>
        )}
        {children !== undefined && children !== null && children !== false && (
          <div
            data-slot="card-content"
            className={cn(
              "min-w-0 flex-1",
              // inset: a borderless panel 4px in from the frame's sides (and top or bottom when nothing sits there), its
              // corners following the frame's (its radius less 1px border + 3px).
              variant === "inset" && ["mx-[3px] overflow-hidden rounded-[max(0px,calc(var(--radius-xl)-4px))] bg-card text-card-foreground shadow-xs", !header && "mt-[3px]", !footer && "mb-[3px]"],
              // panel: on the frame's own edge (-1px), so the two borders are one line, with the frame's corners.
              flush && ["-mx-px overflow-hidden rounded-xl border bg-card text-card-foreground", !header && "-mt-px", !footer && "-mb-px"],
              framed ? padded && "p-4" : padded && "px-6",
              classNames?.body
            )}
          >
            {children}
          </div>
        )}
        {footer && (
          <div
            data-slot="card-footer"
            className={cn("flex items-center gap-2", padded && (framed ? "px-4 py-3" : "px-6"), footerDivider && !framed && "border-t border-divider pt-3", classNames?.footer)}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export { Card, type CardProps, type CardVariant }
