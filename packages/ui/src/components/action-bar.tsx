"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type ActionBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Whether it shows: usually while something is selected (`open={selected.length > 0}`). */
  open: boolean
  /** How many are selected: "3 selected", in the locale's plural. */
  count?: number
  /** In place of "3 selected", e.g. "3 invoices selected". */
  label?: React.ReactNode
  /** The buttons: Delete, Export, Move to…, a menu of more. */
  actions: React.ReactNode
  /** An × that clears the selection, and Escape inside the bar does the same. */
  onClear?: () => void
  /** fixed (default): floating at the bottom of the window, centred. inline: in the page's flow, e.g. at a card's foot. */
  position?: "fixed" | "inline"
  /** Names the toolbar for screen readers. "Actions for the selection" by default. */
  "aria-label"?: string
  classNames?: { label?: string; actions?: string }
}

/**
 * The bar that rises from the bottom while rows are selected, in one tag: the count, the actions for them and a way to
 * clear the selection. It slides up and fades in on the spring, and away again, staying in the page while hidden so
 * nothing jumps. The count is announced as it changes.
 */
function ActionBar({
  open,
  count,
  label,
  actions,
  onClear,
  position = "fixed",
  className,
  classNames,
  "aria-label": ariaLabel,
  ...props
}: ActionBarProps) {
  const { t } = useLocale()
  // Keeps the last count while it slides away, so "0 selected" never shows on the way out.
  const [shown, setShown] = React.useState(count)
  if (open && count !== shown) setShown(count)
  const text = label ?? (shown !== undefined ? t("selectedCount", { count: shown }) : null)

  return (
    <div
      role="toolbar"
      data-slot="action-bar"
      data-state={open ? "open" : "closed"}
      aria-label={ariaLabel ?? t("selectionActions")}
      aria-hidden={!open}
      // While hidden it can't be tabbed into or clicked.
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onClear) {
          event.stopPropagation()
          onClear()
        }
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-popover p-1.5 ps-3 text-sm text-popover-foreground shadow-lg",
        position === "fixed" && "fixed inset-x-4 bottom-4 z-40 mx-auto w-auto max-w-fit max-sm:max-w-none",
        // Up and in on the spring; down and out quicker. Hidden, it stays in place (no layout shift) but invisible.
        "transition-[translate,opacity,visibility] motion-reduce:transition-[opacity,visibility]",
        open
          ? "visible translate-y-0 opacity-100 duration-(--duration-considered) ease-spring"
          : "invisible translate-y-4 opacity-0 duration-(--duration-standard) ease-exit motion-reduce:translate-y-0",
        className
      )}
      {...props}
    >
      {text !== null && (
        <span role="status" className={cn("min-w-0 shrink-0 font-medium tabular-nums whitespace-nowrap", classNames?.label)}>
          {text}
        </span>
      )}
      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
      <div className={cn("flex min-w-0 flex-1 items-center gap-1 overflow-x-auto", classNames?.actions)}>{actions}</div>
      {onClear && (
        <button
          type="button"
          aria-label={t("clearSelection")}
          onClick={onClear}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4"
        >
          <XIcon aria-hidden />
        </button>
      )}
    </div>
  )
}

export { ActionBar, type ActionBarProps }
