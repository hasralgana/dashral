"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { collapsibleContentClass } from "./collapsible"

type RevealProps = {
  /** Shown while true. It grows in when it turns true and folds away when it turns false. */
  open: boolean
  /** What appears: a message, a field, a hint. */
  children?: React.ReactNode
  /** Its own id, e.g. for aria-describedby on the field it explains. */
  id?: string
  /** The classes of what's inside (the part that fades), e.g. its text color. */
  className?: string
}

/** The gap a Reveal adds to its parent's layout while it's there, and on which side of it: below when it comes first. */
type RevealGap = { side: "marginTop" | "marginBottom"; size: number }

/**
 * The parent's gap (grid, or a flex column) that this element brings with it. A Reveal grows that gap in with its
 * height, through a margin going from minus the gap to 0, so nothing below jumps when it's added or taken away.
 */
function revealGap(element: HTMLElement): RevealGap {
  let parent = element.parentElement
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement
  if (!parent) return { side: "marginTop", size: 0 }
  const style = getComputedStyle(parent)
  const column = style.display.includes("grid") || (style.display.includes("flex") && style.flexDirection.startsWith("column"))
  const size = column ? parseFloat(style.rowGap) || 0 : 0
  // Laid out in a contents wrapper, the element's own previous sibling may be missing: look at what comes before it
  // in the parent's eyes.
  let node: HTMLElement = element
  while (node.parentElement && node.parentElement !== parent) node = node.parentElement
  return { side: node.previousElementSibling ? "marginTop" : "marginBottom", size }
}

/**
 * Content that appears and disappears in place, in one tag: `<Reveal open={failed}>Couldn't reach the server.</Reveal>`.
 * Its height grows so what's below moves down smoothly instead of jumping, and it fades in as it does; in a grid or a
 * flex column, the gap it brings grows in with it. Closed, it's out of the page and of reach. For a section people open
 * themselves, with a title to click, use Collapsible.
 */
function Reveal({ open, children, id, className }: RevealProps) {
  const content = React.useRef<HTMLDivElement>(null)
  const [gap, setGap] = React.useState<RevealGap>({ side: "marginTop", size: 0 })
  // Opening, it starts with the gap taken back, then lets it go on the next frame so the margin transitions to 0.
  const [settled, setSettled] = React.useState(false)

  React.useLayoutEffect(() => {
    if (!open || !content.current) return
    setGap(revealGap(content.current))
    setSettled(false)
    const frame = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  const margin = open && settled ? 0 : -gap.size
  return (
    <CollapsiblePrimitive.Root open={open} className="contents">
      <CollapsiblePrimitive.Content
        ref={content}
        data-slot="reveal"
        id={id}
        className={collapsibleContentClass}
        style={{
          [gap.side]: margin,
          transition: open
            ? "margin var(--duration-considered) var(--ease-standard)"
            : "margin var(--duration-standard) var(--ease-exit)",
        }}
      >
        <div className={className}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Reveal, revealGap, type RevealProps, type RevealGap }
