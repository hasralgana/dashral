"use client"

// The description and error every motion form control shows: an error grows in under the control and folds away.
// The words below glide down as it grows instead of jumping, and a new message crosses over the old one in the same
// space. Each line brings its own space above it, so a message's space grows in with it rather than popping.

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import type { FieldMessages } from "@dashral/ui/components/field"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "./reduced"
import { duration, ease } from "./tokens"

/** What a message says, for telling a new one from a re-render of the same; null when there's none. */
function messageKeyOf(message: React.ReactNode) {
  if (!message) return null
  return typeof message === "string" || typeof message === "number" ? String(message) : "node"
}

/** An error under (or beside) a control: it grows in and folds away, and a new one crosses over the old. */
export function FieldMessage({
  id,
  message,
  space = "pt-2",
  className,
}: {
  id?: string
  message: React.ReactNode
  /** The space above it, grown in with it: pt-2 under a control, pt-1 in a checkbox's or switch's label column. */
  space?: string
  className?: string
}) {
  const reduced = useReducedMotion()
  const fold = { duration: reduced ? 0 : duration.standard, ease: ease.standard }
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="error"
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0, transition: { ...fold, duration: reduced ? 0 : duration.fast } }}
          transition={fold}
        >
          <div className={cn("grid", space)}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={messageKeyOf(message)}
                id={id}
                data-slot="field-error"
                className={cn("col-start-1 row-start-1 text-xs text-destructive-text", className)}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
                transition={{ duration: duration.standard, ease: ease.enter }}
              >
                {message}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * For a kit Field, FieldWrapper or ChoiceField's renderMessages: the description, and the error growing in under it.
 * The field's own gap is taken back above them (each line brings its space), so nothing pops as an error arrives.
 */
export const motionMessages: FieldMessages = ({ description, descriptionId, error, errorId, layout, classNames }) => {
  const space = layout === "field" ? "pt-2" : "pt-1"
  return (
    <div className={cn("grid min-w-0", layout === "field" ? "-mt-2" : "-mt-1")}>
      {description && (
        <p id={descriptionId} data-slot="field-description" className={cn(space, "text-xs text-muted-foreground", classNames?.description)}>
          {description}
        </p>
      )}
      <FieldMessage id={errorId} message={error} space={space} className={classNames?.error} />
    </div>
  )
}
