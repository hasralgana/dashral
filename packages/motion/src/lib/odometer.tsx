"use client"

// A number on odometer wheels, as the motion NumberInput and Slider show their values: each digit turns as far as it
// really travelled, softly blurred while it turns, and the number's width glides as digits come and go.

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"

import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "./reduced"
import { duration, ease, spring } from "./tokens"

type Column = { key: string; count: number } | { key: string; text: string }

/**
 * The number as columns keyed by place (ones, tens, tenths…), so the ones stay the ones as it grows. A digit's count
 * is the whole number of its place units (1,284 has 128 tens), so a column knows how far it really turned.
 */
function columnsOf(value: number, format: Intl.NumberFormat): Column[] {
  const parts = format.formatToParts(value)
  const fractionDigits = parts.filter((p) => p.type === "fraction").reduce((n, p) => n + p.value.length, 0)
  // From the digits as shown, so a percent (0.45 shown as 45%) or a rounded value counts what you see.
  const scaled = Number(parts.filter((p) => p.type === "integer" || p.type === "fraction").map((p) => p.value).join("")) || 0
  let place = parts.filter((p) => p.type === "integer").reduce((n, p) => n + p.value.length, 0)
  let fraction = 0
  return parts.flatMap((part, index): Column[] => {
    if (part.type === "integer")
      return [...part.value].map(() => {
        place--
        return { key: `i${place}`, count: Math.floor(scaled / 10 ** (place + fractionDigits)) }
      })
    if (part.type === "fraction")
      return [...part.value].map(() => {
        const at = fractionDigits - 1 - fraction++
        return { key: `f${fraction}`, count: Math.floor(scaled / 10 ** at) }
      })
    return [{ key: part.type === "group" ? `g${place}` : part.type === "decimal" ? "d" : `${part.type}${index}`, text: part.value }]
  })
}

/**
 * The columns, with the number's width gliding to fit as columns come and go (9 to 10 opens a tens column): a new
 * column rolls in the way the number moved, and one that's no longer needed rolls out.
 */
export function Odometer({ value, format, className }: { value: number; format: Intl.NumberFormat; className?: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = React.useState(value)
  const [rise, setRise] = React.useState(1)
  if (shown !== value) {
    setShown(value)
    setRise(value < shown ? -1 : 1)
  }

  // The visible width follows the columns' on a glide; the first measure is at once.
  const inner = React.useRef<HTMLSpanElement>(null)
  const width = useMotionValue<number | "auto">("auto")
  React.useEffect(() => {
    const node = inner.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.inlineSize ?? node.offsetWidth
      if (!next) return
      if (reduced || width.get() === "auto") width.jump(next)
      else animate(width, next, spring.glide)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced, width])

  const slot = {
    enter: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: `${dir * 100}%`, filter: "blur(2px)" }),
    shown: { opacity: 1, y: 0, filter: "blur(0px)" },
    leave: (dir: number) => (reduced ? { opacity: 0 } : { opacity: 0, y: `${dir * -100}%`, filter: "blur(2px)" }),
  }
  return (
    <motion.span className={cn("flex justify-center overflow-hidden", className)} style={{ width }}>
      <span ref={inner} className="relative flex w-max shrink-0">
        {/* popLayout lifts a leaving column out of the row at once, so the new width is measured straight away. */}
        <AnimatePresence mode="popLayout" initial={false} custom={rise}>
          {columnsOf(value, format).map((column) => (
            <motion.span
              key={column.key}
              className="inline-flex"
              custom={rise}
              variants={slot}
              initial="enter"
              animate="shown"
              exit="leave"
              transition={reduced ? { duration: 0 } : { duration: duration.standard, ease: ease.enter }}
            >
              {"count" in column ? <Wheel count={column.count} reduced={reduced} /> : column.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </motion.span>
  )
}

/**
 * One column: the ten digits on a wheel. It turns as many places as its count moved (capped near two turns, so a
 * huge jump still lands quickly), takes longer the farther it goes, and blurs with its speed, sharp again at rest.
 */
function Wheel({ count, reduced }: { count: number; reduced: boolean }) {
  const position = useMotionValue(count)
  // Blur from the wheel's speed as it turns, and none once it rests.
  const filter = useMotionValue("none")
  const turned = React.useRef({ count, target: count })
  React.useLayoutEffect(() => {
    const wheel = turned.current
    const delta = count - wheel.count
    if (!delta) return
    wheel.count = count
    // Past two turns it keeps only the last few places (same digit to land on), so it never spins for long.
    const travel = Math.abs(delta) > 20 ? Math.sign(delta) * (20 + (Math.abs(delta) % 10)) : delta
    wheel.target += travel
    if (reduced) {
      position.jump(wheel.target)
      return
    }
    const controls = animate(position, wheel.target, {
      type: "spring",
      visualDuration: Math.min(0.32 + Math.abs(travel) * 0.025, 0.85),
      bounce: 0.12,
      onUpdate: () => {
        // A soft blur on any turn (a single step too), growing with speed for a long spin.
        const speed = Math.abs(position.getVelocity())
        filter.set(speed < 0.4 ? "none" : `blur(${Math.min(0.6 + speed * 0.04, 2).toFixed(2)}px)`)
      },
      onComplete: () => filter.set("none"),
    })
    return () => {
      controls.stop()
      filter.set("none")
    }
  }, [count, filter, position, reduced])
  return (
    <motion.span className="relative inline-grid overflow-hidden" style={{ filter }}>
      <span className="invisible">0</span>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
        <Glyph key={digit} digit={digit} position={position} />
      ))}
    </motion.span>
  )
}

/** Where a digit sits on its wheel: on the line when the wheel is at it, a line below for the next one up. */
function Glyph({ digit, position }: { digit: number; position: MotionValue<number> }) {
  const away = (at: number) => {
    let d = (digit - at) % 10
    if (d > 5) d -= 10
    if (d < -5) d += 10
    return d
  }
  const y = useTransform(position, (at) => `${away(at) * 100}%`)
  const opacity = useTransform(position, (at) => Math.max(0, 1 - Math.abs(away(at)) ** 1.4))
  // "inherit", not "visible", for the digit on show: a parent hidden (NumberInput's wheels while you type) hides it too.
  const visibility = useTransform(position, (at) => (Math.abs(away(at)) >= 1 ? "hidden" : "inherit"))
  return (
    <motion.span className="absolute inset-0 text-center" style={{ y, opacity, visibility }}>
      {digit}
    </motion.span>
  )
}
