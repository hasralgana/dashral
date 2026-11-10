"use client"

import * as React from "react"

import { cn } from "../lib/utils"

type SwapEffect = "fade" | "rise" | "pop"

type SwapProps = {
  /** What it shows now, as a key: a change swaps the old content out and the new one in. */
  value: string | number | boolean
  /** The content for this value. */
  children?: React.ReactNode
  /**
   * How the new content arrives: fade, rise (up a few pixels as it fades in, for text and forms) or pop (from small,
   * for an icon such as a check).
   */
  effect?: SwapEffect
  /** The old content leaves before the new one comes, rather than both at once. */
  wait?: boolean
  /** The first content arrives with the effect too, as the page loads or as it's added. */
  appear?: boolean
  /** The element: "span" inside a line of text or a button, "div" for blocks. */
  as?: "span" | "div"
  /** Classes of each content's own element, e.g. its layout ("flex items-center gap-2"). */
  className?: string
}

const enter: Record<SwapEffect, string> = {
  fade: "animate-in fade-in-0",
  rise: "animate-in fade-in-0 slide-in-from-bottom-[6px]",
  pop: "animate-in fade-in-0 zoom-in-50",
}
const leave = "animate-out fade-out-0 fill-mode-forwards"

/**
 * Content that changes in place, in one tag: `<Swap value={copied}>{copied ? <Check /> : <Copy />}</Swap>`. When value
 * changes, the old content fades out while the new one arrives with its effect, in the same place: an icon turning into
 * a check, a label after an action, a form giving way to a thank-you.
 */
function Swap({ value, children, effect = "fade", wait = false, appear = false, as: Tag = "span", className }: SwapProps) {
  // The value shown, and the content on its way out (kept until its animation ends). Swapped during render, from the
  // value and the content last on screen, so the old one never blinks away first.
  const [current, setCurrent] = React.useState({ value, entered: appear })
  const [leaving, setLeaving] = React.useState<{ value: SwapProps["value"]; children: React.ReactNode } | null>(null)
  const onScreen = React.useRef(children)
  if (current.value !== value) {
    setLeaving({ value: current.value, children: onScreen.current })
    setCurrent({ value, entered: true })
  }
  React.useLayoutEffect(() => {
    onScreen.current = children
  })
  const animate = current.entered

  const item = cn(Tag === "span" ? "inline-flex" : "block", "[grid-area:1/1] motion-reduce:animate-none", className)
  return (
    <Tag data-slot="swap" className={cn(Tag === "span" ? "inline-grid" : "grid", "items-center")}>
      {leaving && (
        <Tag
          key={`leaving-${String(leaving.value)}`}
          aria-hidden
          className={cn(item, leave, "pointer-events-none duration-(--duration-fast) ease-exit")}
          onAnimationEnd={() => setLeaving(null)}
        >
          {leaving.children}
        </Tag>
      )}
      {!(wait && leaving) && (
        <Tag key={String(value)} className={cn(item, animate && enter[effect], animate && "duration-(--duration-standard) ease-enter")}>
          {children}
        </Tag>
      )}
    </Tag>
  )
}

export { Swap, type SwapProps, type SwapEffect }
