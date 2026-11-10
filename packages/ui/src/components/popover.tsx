"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

type PopoverProps = Omit<React.ComponentProps<typeof PopoverPrimitive.Root>, "children"> & {
  /** What opens it, e.g. a button; it must take a ref and focus. */
  trigger: React.ReactElement
  /** The panel's content. */
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  /** The panel's classes, e.g. a width or no padding. */
  className?: string
}

/** A panel that opens from a trigger, in one tag: `<Popover trigger={<Button>Filters</Button>}>…</Popover>`. */
function Popover({ trigger, children, side, align, className, ...props }: PopoverProps) {
  return (
    <PopoverPrimitive.Root data-slot="popover" {...props}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverContent side={side} align={align} className={className}>
        {children}
      </PopoverContent>
    </PopoverPrimitive.Root>
  )
}

/** Building block: the root, for a control of your own (Combobox and DatePicker are built from these). */
function PopoverRoot(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

const focusable = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  // Keep clear of the screen's edges, so on a phone it never touches them.
  collisionPadding = 8,
  onOpenAutoFocus,
  ref,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const portalContainer = usePortalContainer()
  const content = React.useRef<HTMLDivElement | null>(null)
  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Content
        ref={(node) => {
          content.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          // Radix focuses the first thing it can. When that's a radio, it's the group's first, not the picked one Tab
          // would land on (a color picker opening on Black while Blue is picked): focus the picked one instead.
          const first = content.current?.querySelector<HTMLElement>(focusable)
          if (!(first instanceof HTMLInputElement) || first.type !== "radio" || !first.name) return
          const picked = content.current?.querySelector<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(first.name)}"]:checked`)
          if (!picked || picked === first) return
          event.preventDefault()
          picked.focus()
        }}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-standard data-[side=bottom]:slide-in-from-top-[6px] data-[side=top]:slide-in-from-bottom-[6px] data-[side=left]:slide-in-from-right-[6px] data-[side=right]:slide-in-from-left-[6px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor(props: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverRoot, PopoverTrigger, PopoverContent, PopoverAnchor, type PopoverProps }
