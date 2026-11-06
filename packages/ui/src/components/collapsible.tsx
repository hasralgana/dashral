"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../lib/utils"

type CollapsibleProps = Omit<React.ComponentProps<typeof CollapsiblePrimitive.Root>, "title"> & {
  /** The trigger's text: a full-width button with a chevron that turns as it opens. */
  title?: React.ReactNode
  /** Your own trigger in place of the title's, e.g. a Button; it must take a ref and focus. */
  trigger?: React.ReactElement
  /** At the end of the title's row, before the chevron, e.g. a count or a badge. */
  meta?: React.ReactNode
  /** What opens and closes. */
  children?: React.ReactNode
  classNames?: { trigger?: string; content?: string }
}

/**
 * One section that opens and closes, in one tag: `<Collapsible title="Advanced settings">…</Collapsible>`. For a list
 * of sections where opening one closes the others, use Accordion.
 */
function Collapsible({ title, trigger, meta, children, className, classNames, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root data-slot="collapsible" className={className} {...props}>
      {trigger ? (
        <CollapsiblePrimitive.Trigger asChild>{trigger}</CollapsiblePrimitive.Trigger>
      ) : (
        title !== undefined && (
          <CollapsiblePrimitive.Trigger
            data-slot="collapsible-trigger"
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md py-2 text-start text-sm font-medium outline-none transition-colors hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]_[data-chevron]]:rotate-180",
              classNames?.trigger
            )}
          >
            <span className="min-w-0">{title}</span>
            <span className="flex shrink-0 items-center gap-2">
              {meta !== undefined && <span className="text-xs font-normal text-muted-foreground">{meta}</span>}
              <ChevronDownIcon
                aria-hidden
                data-chevron=""
                className="size-4 text-muted-foreground transition-transform duration-(--duration-standard) ease-spring motion-reduce:transition-none"
              />
            </span>
          </CollapsiblePrimitive.Trigger>
        )
      )}
      <CollapsiblePrimitive.Content
        data-slot="collapsible-content"
        className="overflow-hidden duration-(--duration-standard) ease-standard data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
      >
        <div className={cn("pt-1 pb-2 text-sm", classNames?.content)}>{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Collapsible, type CollapsibleProps }
