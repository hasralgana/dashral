"use client"

import * as React from "react"

import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"

type MarqueeProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The items, repeated as often as it takes to fill the strip. */
  children: React.ReactNode
  /** Pixels per second. */
  speed?: number
  /** Moves the other way: rightward (leftward in right-to-left text), or downward when vertical. */
  reverse?: boolean
  /** Scrolls up (or down, with reverse) instead of sideways. Give it a height. */
  vertical?: boolean
  /** Stops while the pointer is over it or focus is inside it. */
  pauseOnHover?: boolean
  /** Fades the items out at both ends. */
  fade?: boolean
  /** Space between items, and between one copy of them and the next: any CSS length. */
  gap?: string
  /** Names the strip for screen readers, e.g. "Customers". */
  "aria-label"?: string
  classNames?: { track?: string; group?: string }
}

/**
 * Items that scroll on their own, in one tag: logos, testimonials, news. They loop without a seam — the items are
 * repeated until the strip is full, and the strip moves by exactly one copy — at a steady speed in pixels per second,
 * sideways or up, and stop under the pointer if you ask. Copies after the first are hidden from screen readers and
 * the keyboard. With reduced motion it holds still and scrolls by hand. No CSS to add: it runs on the Web Animations
 * API.
 */
function Marquee({
  children,
  speed = 40,
  reverse = false,
  vertical = false,
  pauseOnHover = false,
  fade = false,
  gap = "1rem",
  className,
  classNames,
  style,
  ...props
}: MarqueeProps) {
  const root = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const first = React.useRef<HTMLDivElement>(null)
  const animation = React.useRef<Animation | null>(null)
  const [copies, setCopies] = React.useState(2)
  const [still, setStill] = React.useState(false)

  React.useEffect(() => {
    const box = root.current
    const strip = track.current
    const group = first.current
    if (!box || !strip || !group) return
    if (reducedMotion()) {
      setStill(true)
      return
    }

    const start = () => {
      animation.current?.cancel()
      // One copy's length plus the gap after it: moving by that much lands on the next copy, exactly where it began.
      const gapPx = parseFloat(getComputedStyle(strip)[vertical ? "rowGap" : "columnGap"]) || 0
      const size = (vertical ? group.offsetHeight : group.offsetWidth) + gapPx
      const room = vertical ? box.clientHeight : box.clientWidth
      if (!size) return
      // Enough copies to fill the strip and the stretch it moves through.
      setCopies(Math.max(2, Math.ceil(room / size) + 1))
      const rtl = !vertical && getComputedStyle(box).direction === "rtl"
      const distance = rtl ? size : -size
      const to = vertical ? `translateY(${distance}px)` : `translateX(${distance}px)`
      animation.current = strip.animate([{ transform: "translate(0, 0)" }, { transform: to }], {
        duration: (size / speed) * 1000,
        iterations: Infinity,
        easing: "linear",
        direction: reverse ? "reverse" : "normal",
      })
    }

    start()
    // Measured again when the strip or its items change size (fonts loading, a resize).
    const observer = new ResizeObserver(start)
    observer.observe(box)
    observer.observe(group)
    return () => {
      observer.disconnect()
      animation.current?.cancel()
    }
    // The items' size is watched above, so new children don't restart the loop from the start.
  }, [speed, reverse, vertical])

  const hold = (paused: boolean) => {
    if (!pauseOnHover || !animation.current) return
    if (paused) animation.current.pause()
    else animation.current.play()
  }

  const mask = fade
    ? vertical
      ? "[mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
      : "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    : ""

  return (
    <div
      ref={root}
      data-slot="marquee"
      role={props["aria-label"] ? "region" : undefined}
      onPointerEnter={() => hold(true)}
      onPointerLeave={() => hold(false)}
      onFocus={() => hold(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hold(false)
      }}
      className={cn(
        "flex",
        vertical ? "flex-col" : "flex-row",
        // Held still, it scrolls by hand instead; its scrollbar stays out of sight.
        still ? (vertical ? "overflow-y-auto" : "overflow-x-auto") : "overflow-hidden",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        mask,
        className
      )}
      style={{ ...style, ["--marquee-gap" as string]: gap }}
      {...props}
    >
      <div
        ref={track}
        data-slot="marquee-track"
        className={cn("flex shrink-0 gap-(--marquee-gap)", vertical ? "flex-col" : "flex-row", classNames?.track)}
      >
        {Array.from({ length: still ? 1 : copies }, (_, i) => (
          <div
            key={i}
            ref={i === 0 ? first : undefined}
            data-slot="marquee-group"
            aria-hidden={i > 0 || undefined}
            inert={i > 0}
            className={cn("flex shrink-0 gap-(--marquee-gap)", vertical ? "flex-col" : "flex-row", classNames?.group)}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Marquee, type MarqueeProps }
