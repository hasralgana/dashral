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

/**
 * Content that appears and disappears in place, in one tag: `<Reveal open={failed}>Couldn't reach the server.</Reveal>`.
 * Its height grows so what's below moves down smoothly instead of jumping, and it fades in as it does; closed, it's out
 * of the page and of reach. For a section people open themselves, with a title to click, use Collapsible.
 */
function Reveal({ open, children, id, className }: RevealProps) {
  return (
    <CollapsiblePrimitive.Root open={open}>
      <CollapsiblePrimitive.Content data-slot="reveal" id={id} className={collapsibleContentClass}>
        <div className={className}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Reveal, type RevealProps }
