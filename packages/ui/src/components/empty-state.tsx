import * as React from "react"

import { cn } from "../lib/utils"

type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** A dashed outline for an empty area of a page; plain inside a card or table. */
  variant?: "default" | "plain"
  /** Shown in a soft circle above the title. */
  icon?: React.ReactNode
  title?: React.ReactNode
  /** The title's heading level, to fit the page's outline. */
  titleAs?: "h2" | "h3" | "h4" | "p"
  description?: React.ReactNode
  /** The next step, e.g. a "New project" button. */
  actions?: React.ReactNode
  classNames?: { icon?: string; title?: string; description?: string; actions?: string }
}

/**
 * What a list, table or page shows when there's nothing in it yet, in one tag: say what would be here and offer the
 * next step. The title is an h3 unless titleAs says otherwise; anything in children goes under the actions.
 */
function EmptyState({ variant = "default", icon, title, titleAs: Title = "h3", description, actions, className, classNames, children, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl px-6 py-12 text-center",
        variant === "default" && "border border-dashed",
        className
      )}
      {...props}
    >
      {icon && (
        <div
          aria-hidden
          className={cn(
            "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
            classNames?.icon
          )}
        >
          {icon}
        </div>
      )}
      {(title || description) && (
        <div className="grid justify-items-center gap-2">
          {title && <Title className={cn("text-base font-medium tracking-tight", classNames?.title)}>{title}</Title>}
          {description && <p className={cn("max-w-sm text-sm text-balance text-muted-foreground", classNames?.description)}>{description}</p>}
        </div>
      )}
      {actions && <div className={cn("flex flex-wrap items-center justify-center gap-2", classNames?.actions)}>{actions}</div>}
      {children}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
