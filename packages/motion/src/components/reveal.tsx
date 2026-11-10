"use client"

import * as React from "react"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import { glideRevealGap, revealGap, type RevealGap, type RevealProps } from "@dashral/ui/components/reveal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { RevealProps } from "@dashral/ui/components/reveal"

const bezier = (points: readonly number[]) => `cubic-bezier(${points.join(", ")})`

/**
 * The kit's Reveal with motion: the same props. Its height glides open with no overshoot while what's inside rises a
 * little as it fades in, as an Accordion section opens; in a grid or a flex column, the gap it brings glides in with
 * it. Closing, the content fades out fast, then the height folds away gathering speed, so no line is cut through.
 * With reduced motion it only fades.
 */
export function Reveal({ open, children, id, className }: RevealProps) {
  const reduced = useReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {open && (
        <RevealPanel key="reveal" id={id} className={className} reduced={reduced}>
          {children}
        </RevealPanel>
      )}
    </AnimatePresence>
  )
}

/** How the height folds away; the gap follows it on the same timing. */
const closing = { duration: duration.standard, ease: ease.exit, delay: duration.fast / 2 }

function RevealPanel({ id, className, reduced, children }: Omit<RevealProps, "open"> & { reduced: boolean }) {
  const panel = React.useRef<HTMLDivElement>(null)
  const gap = React.useRef<RevealGap | null>(null)
  const present = useIsPresent()

  // The parent's gap glides in with the height as it arrives, and out as it leaves (held until it's gone).
  React.useLayoutEffect(() => {
    if (!panel.current || reduced) return
    if (present) gap.current = revealGap(panel.current)
    const glide = glideRevealGap(
      gap.current,
      present,
      present
        ? { duration: duration.considered * 1000, easing: bezier(ease.standard) }
        : { duration: (closing.duration + closing.delay) * 1000, easing: bezier(ease.exit) }
    )
    return () => glide?.cancel()
  }, [present, reduced])

  return (
    <motion.div
      ref={panel}
      data-slot="reveal"
      id={id}
      className="overflow-hidden"
      initial={reduced ? { opacity: 0 } : { height: 0 }}
      animate={reduced ? { opacity: 1 } : { height: "auto" }}
      exit={reduced ? { opacity: 0, transition: { duration: duration.fast } } : { height: 0, transition: closing }}
      transition={reduced ? { duration: duration.fast } : spring.glide}
    >
      <motion.div
        className={className}
        initial={reduced ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.exit } }}
        transition={{ duration: duration.standard, ease: ease.enter }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
