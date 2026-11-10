"use client"

import { AnimatePresence, motion } from "motion/react"
import type { SwapEffect, SwapProps } from "@dashral/ui/components/swap"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { SwapEffect, SwapProps } from "@dashral/ui/components/swap"

const from: Record<SwapEffect, { opacity: number; y?: number; scale?: number }> = {
  fade: { opacity: 0 },
  rise: { opacity: 0, y: 6 },
  pop: { opacity: 0, scale: 0.3 },
}

/**
 * The kit's Swap with motion: the same props. The old content is lifted out of the layout and fades fast while the new
 * one arrives in its place (rising, or popping in on a spring), so whatever is around glides to the new size rather
 * than waiting. With reduced motion they only cross-fade.
 */
export function Swap({ value, children, effect = "fade", wait = false, appear = false, as = "span", className }: SwapProps) {
  const reduced = useReducedMotion()
  const Item = as === "span" ? motion.span : motion.div
  const start = reduced ? { opacity: 0 } : from[effect]

  return (
    <AnimatePresence mode={wait ? "wait" : "popLayout"} initial={appear}>
      <Item
        key={String(value)}
        data-slot="swap"
        className={className ?? (as === "span" ? "inline-flex" : undefined)}
        initial={start}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.exit } }}
        transition={
          reduced
            ? { duration: duration.fast }
            : effect === "pop"
              ? { ...spring.pop, opacity: { duration: duration.fast, ease: ease.enter } }
              : { duration: duration.standard, ease: ease.enter }
        }
      >
        {children}
      </Item>
    </AnimatePresence>
  )
}
