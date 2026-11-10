"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import type { RevealProps } from "@dashral/ui/components/reveal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { RevealProps } from "@dashral/ui/components/reveal"

/**
 * The kit's Reveal with motion: the same props. Its height glides open with no overshoot while what's inside rises a
 * little as it fades in, as an Accordion section opens. Closing, the content fades out fast, then the height folds away
 * gathering speed, so no line is cut through. With reduced motion it only fades.
 */
export function Reveal({ open, children, id, className }: RevealProps) {
  const reduced = useReducedMotion()

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="reveal"
          data-slot="reveal"
          id={id}
          className="overflow-hidden"
          initial={reduced ? { opacity: 0 } : { height: 0 }}
          animate={reduced ? { opacity: 1 } : { height: "auto" }}
          exit={
            reduced
              ? { opacity: 0, transition: { duration: duration.fast } }
              : { height: 0, transition: { duration: duration.standard, ease: ease.exit, delay: duration.fast / 2 } }
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
      )}
    </AnimatePresence>
  )
}
