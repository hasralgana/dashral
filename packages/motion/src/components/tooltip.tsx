"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from "motion/react"
import type { TooltipProps as KitTooltipProps } from "@dashral/ui/components/tooltip"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type TooltipProps = KitTooltipProps & {
  /**
   * The tooltip trails the pointer along its trigger, a little behind, as if on a string: across a wide trigger (a
   * chart, a row) it stays by the pointer instead of in the middle. Off by default.
   */
  follow?: boolean
}

// How far it starts back toward its trigger, by side: a tooltip above rises up out of it, one below drops down.
const offsets = { top: { x: 0, y: 4 }, bottom: { x: 0, y: -4 }, left: { x: 4, y: 0 }, right: { x: -4, y: 0 } } as const

/** What the content is, for telling new words from a re-render of the same ones; only text can cross over. */
function contentKey(node: React.ReactNode) {
  return typeof node === "string" || typeof node === "number" ? String(node) : null
}

/**
 * The kit's Tooltip with motion: the same content, side, align, delay and props. It springs out of its trigger, from
 * a little smaller and back toward it, and settles with a touch of overshoot; it leaves quickly. When the words change
 * while it shows ("Copy" to "Copied"), the new ones rise in and the tooltip glides to their width, staying centred on
 * the trigger. With follow, it trails the pointer along the trigger on a soft spring. With reduced motion it only fades
 * and stays put.
 */
export function Tooltip({ content, children, side = "top", align, delay = 0, follow = false, className, open, defaultOpen, onOpenChange, ...triggerProps }: TooltipProps) {
  const portalContainer = usePortalContainer()
  const reduced = useReducedMotion()
  // Kept here, so the tooltip can stay on screen while it leaves.
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const change = (next: boolean) => {
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }

  // The width glides only when the words change; before it's measured it's natural.
  const words = React.useRef<HTMLSpanElement>(null)
  const width = useMotionValue<number | "auto">("auto")
  const key = contentKey(content)
  const lastKey = React.useRef(key)
  const gliding = React.useRef(false)
  React.useLayoutEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    gliding.current = true
  }, [key])
  React.useEffect(() => {
    const node = words.current
    if (!isOpen || !node) return
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.inlineSize ?? node.offsetWidth
      if (!next) return
      if (!gliding.current || reduced || width.get() === "auto") {
        width.jump(next)
        gliding.current = false
        return
      }
      animate(width, next, { ...spring.glide, onComplete: () => (gliding.current = false) })
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      width.jump("auto")
    }
  }, [isOpen, reduced, width])

  // Following: the pointer's distance from the trigger's middle along the tooltip's side, trailed by a spring.
  const across = side === "top" || side === "bottom"
  const lead = useMotionValue(0)
  const trail = useSpring(lead, { stiffness: 260, damping: 24 })
  const followPx = useTransform(trail, (v) => `${v}px`)
  const track = (event: React.PointerEvent<HTMLElement>) => {
    if (!follow || reduced) return
    const box = event.currentTarget.getBoundingClientRect()
    const offset = across ? event.clientX - (box.left + box.width / 2) : event.clientY - (box.top + box.height / 2)
    const half = (across ? box.width : box.height) / 2
    // Where it opens, it's already by the pointer; after that it trails.
    if (!isOpen) trail.jump(offset)
    lead.set(Math.max(-half, Math.min(half, offset)))
  }

  const from = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, ...offsets[side] }

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root data-slot="tooltip" open={isOpen} onOpenChange={change}>
        <TooltipPrimitive.Trigger
          asChild
          onPointerMove={track}
          onPointerEnter={track}
          {...triggerProps}
          onFocus={(event) => {
            triggerProps.onFocus?.(event)
            // As in the kit's: a focus a script moved after a click (a popover opening) doesn't show it, only one you see.
            if (!(event.target as Element).matches?.(":focus-visible")) event.preventDefault()
          }}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <AnimatePresence>
          {isOpen && (
            <TooltipPrimitive.Portal forceMount container={portalContainer}>
              <TooltipPrimitive.Content forceMount asChild side={side} align={align} sideOffset={4}>
                <motion.div
                  data-slot="tooltip-content"
                  // It grows from the side that faces the trigger (Radix works the point out, arrow included).
                  style={{ transformOrigin: "var(--radix-tooltip-content-transform-origin)", ...(follow && !reduced ? { "--follow": followPx } : {}) }}
                  initial={from}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ ...from, transition: { duration: duration.fast, ease: ease.exit } }}
                  transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
                  className={cn(
                    "z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background",
                    // The follow rides on translate, apart from the transform motion springs it in with.
                    follow && !reduced && (across ? "translate-x-(--follow)" : "translate-y-(--follow)"),
                    className
                  )}
                >
                  <motion.span className="flex justify-center" style={{ width }}>
                    <span ref={words} className="grid w-max max-w-[min(20rem,calc(100vw-2rem))]">
                      {key === null ? (
                        content
                      ) : (
                        // popLayout lifts the old words out of the flow at once, so the new ones set the width straight away.
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={key}
                            className="col-start-1 row-start-1"
                            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
                            transition={{ duration: duration.standard, ease: ease.enter }}
                          >
                            {content}
                          </motion.span>
                        </AnimatePresence>
                      )}
                    </span>
                  </motion.span>
                  <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
