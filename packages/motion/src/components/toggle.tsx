"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"
import { AnimatePresence, motion } from "motion/react"
import { toggleOnFill, toggleVariants, type ToggleProps } from "@dashral/ui/components/toggle"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { ToggleProps } from "@dashral/ui/components/toggle"

/**
 * The kit's Toggle with motion: the same variants, sizes and props. It presses in on a spring; turned on, its
 * background pops in from the middle and what's inside gives a small bounce; turned off, the background shrinks away.
 * With reduced motion the background only fades.
 */
export function Toggle({ variant, size, color = "primary", className, pressed: pressedProp, defaultPressed, onPressedChange, children, ...props }: ToggleProps) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultPressed ?? false)
  const pressed = pressedProp ?? own
  const [flips, setFlips] = React.useState(0)

  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      pressed={pressed}
      onPressedChange={(next) => {
        if (pressedProp === undefined) setOwn(next)
        setFlips((n) => n + 1)
        onPressedChange?.(next)
      }}
      asChild
      {...props}
    >
      <motion.button
        whileTap={reduced || props.disabled ? undefined : { scale: 0.9 }}
        transition={spring.press}
        // The background is the motion layer's; CSS keeps the colors.
        className={toggleVariants({ variant, size, color, className: cn("relative isolate data-[state=on]:bg-transparent data-[state=on]:hover:bg-transparent", className) })}
      >
        <AnimatePresence initial={false}>
          {pressed && color !== "none" && (
            <motion.span
              key="on"
              aria-hidden
              className={cn("absolute inset-0 -z-10 rounded-[inherit]", toggleOnFill[color])}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: duration.fast, ease: ease.exit } }}
              transition={reduced ? { duration: duration.fast } : { ...spring.pop, opacity: { duration: duration.fast } }}
            />
          )}
        </AnimatePresence>
        <motion.span
          key={flips}
          className="inline-flex items-center gap-[inherit]"
          initial={false}
          animate={flips && !reduced ? { scale: [1, pressed ? 1.18 : 0.88, 1] } : undefined}
          transition={{ duration: duration.standard, ease: ease.standard }}
        >
          {children}
        </motion.span>
      </motion.button>
    </TogglePrimitive.Root>
  )
}
