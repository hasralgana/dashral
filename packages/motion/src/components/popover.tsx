"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import type { PopoverProps } from "@dashral/ui/components/popover"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { PopoverProps } from "@dashral/ui/components/popover"

// How far it starts back toward its trigger, by side.
const offsets = { top: { x: 0, y: 6 }, bottom: { x: 0, y: -6 }, left: { x: 6, y: 0 }, right: { x: -6, y: 0 } } as const

/**
 * The kit's Popover with motion: the same trigger, side, align and props. It springs out of its trigger from the side
 * it opens on and leaves quickly; when what's inside changes (a filter added, a form's next step, a message after
 * saving), it glides to its new height instead of jumping. With reduced motion it only fades.
 */
export function Popover({ trigger, children, side = "bottom", align = "center", className, open, defaultOpen, onOpenChange, ...props }: PopoverProps) {
  const portalContainer = usePortalContainer()
  const reduced = useReducedMotion()
  // Kept here, so the panel can stay on screen while it leaves.
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const change = (next: boolean) => {
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }

  // The panel's height follows what's inside on a glide; before it's measured (and with reduced motion) it's natural.
  const inside = React.useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | "auto">("auto")
  const [gliding, setGliding] = React.useState(false)
  React.useEffect(() => {
    const node = inside.current
    if (!isOpen || !node) return
    let first = true
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.blockSize ?? node.offsetHeight
      if (first || reduced) height.jump(next)
      else {
        setGliding(true)
        animate(height, next, { ...spring.glide, onComplete: () => setGliding(false) })
      }
      first = false
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      height.jump("auto")
    }
  }, [isOpen, height, reduced])

  const from = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, ...offsets[side] }

  return (
    <PopoverPrimitive.Root data-slot="popover" open={isOpen} onOpenChange={change} {...props}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <AnimatePresence>
        {isOpen && (
          <PopoverPrimitive.Portal forceMount container={portalContainer}>
            {/* Kept clear of the screen's edges, so on a phone it never touches them. */}
            <PopoverPrimitive.Content forceMount asChild side={side} align={align} sideOffset={4} collisionPadding={8}>
              <motion.div
                data-slot="popover-content"
                className={cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden", className)}
                // It grows from the point facing its trigger (Radix works it out).
                style={{ transformOrigin: "var(--radix-popover-content-transform-origin)" }}
                initial={from}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ ...from, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
              >
                {/* Clipped only while it glides, so a focus ring at the edge isn't cut off the rest of the time. */}
                <motion.div style={{ height }} className={cn(gliding && "overflow-hidden")}>
                  <div ref={inside}>{children}</div>
                </motion.div>
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  )
}
