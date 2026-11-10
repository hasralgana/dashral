"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import { revealGap, type RevealGap, type RevealProps } from "@dashral/ui/components/reveal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { RevealProps } from "@dashral/ui/components/reveal"

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

function RevealPanel({ id, className, reduced, children }: Omit<RevealProps, "open"> & { reduced: boolean }) {
  const panel = React.useRef<HTMLDivElement>(null)
  // The parent's gap this brings, taken back at first and glided to 0 with the height, so nothing below jumps.
  const margin = useMotionValue(0)
  const [gap, setGap] = React.useState<RevealGap>({ side: "marginTop", size: 0 })

  React.useLayoutEffect(() => {
    if (!panel.current) return
    const measured = revealGap(panel.current)
    setGap(measured)
    if (reduced || !measured.size) return
    margin.jump(-measured.size)
    const glide = animate(margin, 0, spring.glide)
    return () => glide.stop()
    // Measured once, as it arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      ref={panel}
      data-slot="reveal"
      id={id}
      className="overflow-hidden"
      style={gap.side === "marginTop" ? { marginTop: margin } : { marginBottom: margin }}
      initial={reduced ? { opacity: 0 } : { height: 0 }}
      animate={reduced ? { opacity: 1 } : { height: "auto" }}
      exit={
        reduced
          ? { opacity: 0, transition: { duration: duration.fast } }
          : {
              height: 0,
              ...(gap.side === "marginTop" ? { marginTop: -gap.size } : { marginBottom: -gap.size }),
              transition: { duration: duration.standard, ease: ease.exit, delay: duration.fast / 2 },
            }
      }
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
