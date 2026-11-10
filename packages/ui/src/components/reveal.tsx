"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { collapsibleContentClass } from "./collapsible"

type RevealProps = {
  /** Shown while true: it grows in when it turns true and folds away when it turns false. Inside a RevealList, a row is shown while it's in the list. */
  open?: boolean
  /** The element it is: "li" for a row of a RevealList, "span" inside a line of text. */
  as?: "div" | "li" | "span"
  /** What appears: a message, a field, a hint, a row. */
  children?: React.ReactNode
  /** Its own id, e.g. for aria-describedby on the field it explains. */
  id?: string
  /** The classes of what's inside (the part that fades), e.g. its text color. */
  className?: string
}

type RevealListProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** The list's element. */
  as?: "ul" | "ol" | "div"
  /** Its rows: a Reveal each, as="li", with a key. */
  children?: React.ReactNode
}

/** Inside a RevealList: its rows are shown while they're in it, and arrive and leave on their own. */
const RevealListContext = React.createContext(false)

/**
 * A list whose rows are Reveals: `<RevealList>{items.map((item) => <Reveal key={item.id} as="li">…</Reveal>)}</RevealList>`.
 * Added rows grow in and removed ones fold away in the Motion edition; here they appear and go at once.
 */
function RevealList({ as: Tag = "ul", children, ...props }: RevealListProps) {
  return (
    <RevealListContext.Provider value={true}>
      <Tag data-slot="reveal-list" {...props}>
        {children}
      </Tag>
    </RevealListContext.Provider>
  )
}

/**
 * The gap a Reveal brings to its parent's grid or flex column, and the neighbor whose margin takes it back while the
 * Reveal grows: the one before it (its bottom margin), or after it when it comes first (its top margin). A grid keeps
 * the gap around any item, even 0px tall, and won't let that item's own negative margin shrink its row, so the
 * neighbor's margin does it.
 */
type RevealGap = { neighbor: HTMLElement; side: "marginBottom" | "marginTop"; size: number }

function revealGap(element: HTMLElement): RevealGap | null {
  let parent = element.parentElement
  while (parent && getComputedStyle(parent).display === "contents") parent = parent.parentElement
  if (!parent) return null
  const style = getComputedStyle(parent)
  const column = style.display.includes("grid") || (style.display.includes("flex") && style.flexDirection.startsWith("column"))
  const size = column ? parseFloat(style.rowGap) || 0 : 0
  if (!size) return null
  // What the parent lays out: the element itself, or the contents wrapper it sits in.
  let node: HTMLElement = element
  while (node.parentElement && node.parentElement !== parent) node = node.parentElement
  const before = node.previousElementSibling
  if (before instanceof HTMLElement) return { neighbor: before, side: "marginBottom", size }
  const after = node.nextElementSibling
  return after instanceof HTMLElement ? { neighbor: after, side: "marginTop", size } : null
}

/**
 * Glides the neighbor's margin with the Reveal's height: from minus the gap to its own as it opens; from its own to
 * minus the gap as it closes, held there until the Reveal is gone (cancel it then, and the gap goes with it).
 */
function glideRevealGap(gap: RevealGap | null, opening: boolean, timing: { duration: number; easing: string }) {
  if (!gap) return undefined
  const own = parseFloat(getComputedStyle(gap.neighbor)[gap.side]) || 0
  const shut = { [gap.side]: `${own - gap.size}px` }
  const full = { [gap.side]: `${own}px` }
  return gap.neighbor.animate(opening ? [shut, full] : [full, shut], { ...timing, fill: opening ? "none" : "forwards" })
}

/** The reader asked for less motion: the system setting, or the app's own (data-motion="reduce" on <html>). */
function reducedMotion() {
  return document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Content that appears and disappears in place, in one tag: `<Reveal open={failed}>Couldn't reach the server.</Reveal>`.
 * Its height grows so what's below moves down smoothly instead of jumping, and it fades in as it does; in a grid or a
 * flex column, the gap it brings grows in with it. Closed, it's out of the page and of reach. For a section people open
 * themselves, with a title to click, use Collapsible.
 */
function Reveal({ open: openProp, as: Tag = "div", children, id, className }: RevealProps) {
  const inList = React.useContext(RevealListContext)
  const open = openProp ?? true
  const Inner = Tag === "span" ? "span" : "div"
  // The content element, followed through a state ref: Radix sets it up a step after open first turns true.
  const [content, setContent] = React.useState<HTMLElement | null>(null)
  const gap = React.useRef<RevealGap | null>(null)
  // Open from the start (or a row already in its list), it's simply there: no gap to glide in.
  const shownAtStart = React.useRef(open)

  // The gap glides with the height, on the same tokens as the height's animation.
  React.useLayoutEffect(() => {
    if (!content) return
    if (open) gap.current = revealGap(content)
    if (open && shownAtStart.current) {
      shownAtStart.current = false
      return
    }
    shownAtStart.current = false
    if (reducedMotion() || inList) return
    const token = (name: string) => getComputedStyle(content).getPropertyValue(name).trim()
    const ms = (value: string) => (value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000)
    const glide = glideRevealGap(gap.current, open, {
      duration: ms(token(open ? "--duration-considered" : "--duration-standard")),
      easing: token(open ? "--ease-standard" : "--ease-exit"),
    })
    if (open || !glide) return () => glide?.cancel()
    // Closed, Radix hides the content (its gap goes with it) rather than removing it: the neighbor's margin is let go
    // in the same moment, before the next paint, so nothing jumps.
    const hidden = new MutationObserver(() => {
      if (content.hidden) glide.cancel()
    })
    hidden.observe(content, { attributes: true, attributeFilter: ["hidden"] })
    return () => {
      hidden.disconnect()
      glide.cancel()
    }
  }, [open, content, inList])

  // Root and Content are one element (asChild), so a row stays a direct child of its list.
  return (
    <CollapsiblePrimitive.Root open={open} asChild>
      <CollapsiblePrimitive.Content ref={setContent} data-slot="reveal" id={id} className={collapsibleContentClass} asChild>
        <Tag>
          <Inner className={className}>{children}</Inner>
        </Tag>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Reveal, RevealList, RevealListContext, revealGap, glideRevealGap, type RevealProps, type RevealListProps, type RevealGap }
