"use client"

import { motion } from "motion/react"
import type { GlideProps } from "@dashral/ui/components/glide"

import { useReducedMotion } from "../lib/reduced"
import { spring } from "../lib/tokens"

export type { GlideProps } from "@dashral/ui/components/glide"

const elements = { div: motion.div, span: motion.span, li: motion.li }

/**
 * The kit's Glide with motion: the same props. When the layout changes it glides to its new place and size on a spring
 * with no overshoot; a highlight shared by name (layoutId) springs to its new place with a touch of overshoot to settle.
 * With reduced motion it moves at once.
 */
export function Glide({ as = "div", layout = true, layoutId, ...props }: GlideProps) {
  const reduced = useReducedMotion()
  const Element = elements[as]
  return (
    <Element
      data-slot="glide"
      layout={reduced ? false : layout}
      layoutId={layoutId}
      transition={reduced ? { duration: 0 } : layoutId ? spring.move : spring.glide}
      {...props}
    />
  )
}
