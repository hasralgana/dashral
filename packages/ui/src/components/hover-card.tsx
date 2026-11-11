"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

type HoverCardProps = Omit<React.ComponentProps<typeof HoverCardPrimitive.Root>, "children"> & {
  /** The link it previews; it must take a ref and focus. */
  trigger: React.ReactElement
  /** The preview. */
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** The preview panel's classes, e.g. a width. */
  className?: string
}

/**
 * A preview that opens when a pointer rests on a link (or it gets keyboard focus), in one tag. For extra detail only:
 * touch screens never show it, so the trigger must make sense on its own — usually a link to the full page.
 */
function HoverCard({ trigger, children, side, align, openDelay = 300, closeDelay = 150, className, ...props }: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root data-slot="hover-card" openDelay={openDelay} closeDelay={closeDelay} {...props}>
      <HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
      <HoverCardContent side={side} align={align} className={className}>
        {children}
      </HoverCardContent>
    </HoverCardPrimitive.Root>
  )
}

function HoverCardContent({ className, align = "center", sideOffset = 6, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  const portalContainer = usePortalContainer()
  return (
    <HoverCardPrimitive.Portal container={portalContainer}>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, type HoverCardProps }
