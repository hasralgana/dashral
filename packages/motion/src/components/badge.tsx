"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, PresenceContext, useMotionValue } from "motion/react"
import { badgeVariants, type Badge as KitBadge } from "@dashral/ui/components/badge"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { BadgeVariant, BadgeColor } from "@dashral/ui/components/badge"

// motion/react gives these its own meaning (drag and animation events), so a plain span's versions are left out.
export type BadgeProps = Omit<React.ComponentProps<typeof KitBadge>, "asChild" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> & {
  /** With a number for its label: above this it shows "99+" (for max={99}) instead of the number. */
  max?: number
}

// The status dot, in the color's fill (on a solid badge it takes the text color instead), as the kit's Badge has it.
const dots = {
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  highlight: "bg-highlight",
} as const

/** What the label is, for telling a new label from a re-render of the same one; only text and numbers cross over. */
function labelKey(node: React.ReactNode) {
  return typeof node === "string" || typeof node === "number" ? String(node) : null
}

/** The number in a label ("$96.00", "4 unread", "1,284"), to tell a count going up from one going down; NaN without one. */
function amount(key: string | null) {
  const digits = key?.replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  return digits ? Number(digits[0]) : NaN
}

/**
 * The kit's Badge with motion: the same variants, colors, dot and props. A number turns on odometer wheels, each digit
 * as far as it travelled, and past max it reads "99+"; a new text label crosses over the old one, rolling up for a
 * bigger number in it and down for a smaller, while the badge glides to the new width; a new color makes the dot
 * pulse. Added inside AnimatePresence, it pops in, and taken away it shrinks out. With reduced motion it only fades.
 * No asChild: for a link that looks like a badge, use the kit's Badge.
 */
export function Badge({ className, variant, color, dot = false, max, children: label, ...props }: BadgeProps) {
  const reduced = useReducedMotion()
  const { locale } = useLocale()
  const format = React.useMemo(() => new Intl.NumberFormat(locale), [locale])
  // A count turns on wheels; past max it's text ("99+").
  const count = typeof label === "number" && (max === undefined || label <= max) ? label : null
  const children = typeof label === "number" && count === null ? `${format.format(max!)}+` : label
  // Pops in only where something was added (inside AnimatePresence), never on the page's first paint.
  const presence = React.useContext(PresenceContext)
  const kind = variant ?? "solid"
  const tone = color ?? (kind === "outline" ? "neutral" : "primary")

  const key = labelKey(children)
  // Which way a count rolls: up when it grows, down when it shrinks; words just rise.
  const [shownKey, setShownKey] = React.useState(key)
  const [rise, setRise] = React.useState(1)
  if (shownKey !== key) {
    setShownKey(key)
    setRise(amount(key) < amount(shownKey) ? -1 : 1)
  }
  // How many times the color has changed: each change pulses the dot once, the first paint doesn't.
  const [shownTone, setShownTone] = React.useState(tone)
  const [pulses, setPulses] = React.useState(0)
  if (shownTone !== tone) {
    setShownTone(tone)
    setPulses(pulses + 1)
  }

  // The width glides only when the label changes; before it's measured it's natural.
  const words = React.useRef<HTMLSpanElement>(null)
  const width = useMotionValue<number | "auto">("auto")
  const gliding = React.useRef(false)
  const lastKey = React.useRef(key)
  React.useLayoutEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    gliding.current = true
  }, [key])
  React.useEffect(() => {
    const node = words.current
    if (!node) return
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
    return () => observer.disconnect()
  }, [reduced, width])

  const from = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }

  return (
    <motion.span
      data-slot="badge"
      {...props}
      className={badgeVariants({ variant, color, className })}
      initial={presence ? from : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ ...from, transition: { duration: duration.fast, ease: ease.exit } }}
      transition={reduced ? { duration: duration.fast } : { ...spring.pop, opacity: { duration: duration.fast, ease: ease.enter } }}
    >
      {dot && (
        <motion.span
          // A new color restarts it, so the dot pulses once in its new color.
          key={pulses}
          aria-hidden
          data-slot="badge-dot"
          className={cn("size-1.5 shrink-0 rounded-full", kind === "solid" ? "bg-current" : dots[tone])}
          initial={false}
          animate={reduced || pulses === 0 ? undefined : { scale: [1, 1.8, 1] }}
          transition={{ duration: duration.considered, ease: ease.standard }}
        />
      )}
      {count !== null ? (
        <Odometer value={count} format={format} />
      ) : key === null ? (
        children
      ) : (
        <motion.span className="flex justify-center overflow-hidden" style={{ width }}>
          <span ref={words} className="grid w-max">
            {/* popLayout lifts the old label out of the flow at once, so the new one sets the width straight away. */}
            <AnimatePresence mode="popLayout" initial={false} custom={rise}>
              <motion.span
                key={key}
                className="col-start-1 row-start-1"
                custom={rise}
                variants={{
                  in: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: dir * 8 }),
                  shown: { opacity: 1, y: 0 },
                  out: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: dir * -8 }),
                }}
                initial="in"
                animate="shown"
                exit="out"
                transition={{ duration: duration.standard, ease: ease.enter }}
              >
                {children}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.span>
      )}
    </motion.span>
  )
}
