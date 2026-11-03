"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

type TooltipProps = Pick<React.ComponentProps<typeof TooltipPrimitive.Root>, "open" | "defaultOpen" | "onOpenChange"> &
  Omit<React.ComponentProps<typeof TooltipPrimitive.Trigger>, "children" | "content"> & {
  /** What the tooltip says. */
  content: React.ReactNode
  /** The element it describes; it must take a ref and focus (a button, a link). */
  children: React.ReactElement
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** Milliseconds the pointer rests before it opens. */
  delay?: number
  className?: string
}

/**
 * A short label for a control, shown on hover and keyboard focus, in one tag: `<Tooltip content="Copy"><Button …/></Tooltip>`.
 * Don't put anything in it people must read or press: touch screens never show it. Other props (a ref, handlers) go
 * on to the control, so a Tooltip can itself be another component's trigger.
 */
function Tooltip({ content, children, side, align, delay = 0, className, open, defaultOpen, onOpenChange, ...triggerProps }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root data-slot="tooltip" open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger
          asChild
          {...triggerProps}
          onFocus={(event) => {
            triggerProps.onFocus?.(event)
            // Only a focus you can see (the keyboard's) shows it, not one a script moved after a click: opening a
            // popover or dialog focuses what's inside, and its first control's tooltip would pop up on its own. The
            // focused element may be inside the trigger (a radio in its label), so ask it, not the trigger.
            if (!(event.target as Element).matches?.(":focus-visible")) event.preventDefault()
          }}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipContent side={side} align={align} className={className}>
          {content}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const portalContainer = usePortalContainer()
  return (
    <TooltipPrimitive.Portal container={portalContainer}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background data-[state=closed]:zoom-out-95 animate-in fade-in-0 zoom-in-95 blur-in-[2px] duration-(--duration-standard) ease-spring data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit motion-reduce:blur-in-0",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, type TooltipProps }
