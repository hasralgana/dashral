"use client"

import * as React from "react"
import { motion } from "motion/react"
import { XIcon } from "lucide-react"
import type { ActionBarProps } from "@dashral/ui/components/action-bar"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { ActionBarProps } from "@dashral/ui/components/action-bar"

/**
 * The kit's ActionBar with motion: the same look and props. It rises in on the appear spring, settling with a hint of
 * overshoot, and drops away quicker; its width glides when the label or the actions change. With reduced motion it
 * only fades.
 */
export function ActionBar({
  open,
  count,
  label,
  actions,
  onClear,
  position = "fixed",
  className,
  classNames,
  "aria-label": ariaLabel,
  // Motion takes these itself; the bar's own handlers are kept.
  onAnimationStart: _onAnimationStart,
  onDrag: _onDrag,
  onDragStart: _onDragStart,
  onDragEnd: _onDragEnd,
  ...props
}: ActionBarProps) {
  const { t } = useLocale()
  const reduced = useReducedMotion()
  // Keeps the last count while it drops away, so "0 selected" never shows on the way out.
  const [shown, setShown] = React.useState(count)
  if (open && count !== shown) setShown(count)
  const text = label ?? (shown !== undefined ? t("selectedCount", { count: shown }) : null)

  return (
    <motion.div
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
      layout={reduced ? false : "size"}
      initial={false}
      animate={open ? { y: 0, opacity: 1, visibility: "visible" } : { y: reduced ? 0 : 16, opacity: 0, transitionEnd: { visibility: "hidden" } }}
      transition={
        reduced
          ? { duration: duration.fast }
          : open
            ? { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter }, layout: spring.glide }
            : { duration: duration.standard, ease: ease.exit, layout: spring.glide }
      }
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-popover p-1.5 ps-3 text-sm text-popover-foreground shadow-lg",
        position === "fixed" && "fixed inset-x-4 bottom-4 z-40 mx-auto w-auto max-w-fit max-sm:max-w-none",
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
    </motion.div>
  )
}
