"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

/** start and end follow the reading direction (end is the right in English, the left in Arabic); left and right don't. */
type SheetSide = "top" | "right" | "bottom" | "left" | "start" | "end"

const sides: Record<SheetSide, string> = {
  right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
  left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
  start: "inset-y-0 start-0 h-full w-3/4 border-e data-[state=closed]:slide-out-to-start data-[state=open]:slide-in-from-start sm:max-w-sm",
  end: "inset-y-0 end-0 h-full w-3/4 border-s data-[state=closed]:slide-out-to-end data-[state=open]:slide-in-from-end sm:max-w-sm",
  top: "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom: "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
}

type SheetProps = Omit<React.ComponentProps<typeof SheetPrimitive.Root>, "children"> & {
  /** What opens it, e.g. a button. Leave it out to open it yourself with open and onOpenChange. */
  trigger?: React.ReactElement
  /** Required, so screen readers can name the panel; hide it with classNames.title "sr-only" if the design has none. */
  title: React.ReactNode
  description?: React.ReactNode
  /** The body; it scrolls when it's taller than the screen. */
  children?: React.ReactNode
  /** Pinned to the bottom, e.g. a Save button; wrap a Cancel button in SheetClose to close the sheet. */
  footer?: React.ReactNode
  /** Makes the body and footer one <form>, e.g. { onSubmit } or { action }. */
  form?: React.ComponentProps<"form">
  /** Which edge it slides in from. */
  side?: SheetSide
  /** none drops the padding around the body, for a layout of your own (a navigation list). */
  padding?: "default" | "none"
  showCloseButton?: boolean
  /**
   * Whether opening it focuses the first control inside (the default). false focuses the panel instead: for a menu
   * whose first control is a text field, where a phone would otherwise open its keyboard over the menu.
   */
  autoFocus?: boolean
  /** The panel's classes, e.g. a width. */
  className?: string
  classNames?: { header?: string; title?: string; description?: string; body?: string; footer?: string }
}

/**
 * A panel that slides in from an edge, in one tag: a trigger, a title and description, the body as children and a
 * footer pinned to the bottom. Give it form props and the whole thing is a form.
 */
function Sheet({
  trigger,
  title,
  description,
  children,
  footer,
  form,
  side = "end",
  padding = "default",
  showCloseButton = true,
  autoFocus = true,
  className,
  classNames,
  ...props
}: SheetProps) {
  const portalContainer = usePortalContainer()
  const { t } = useLocale()
  const padded = padding === "default"
  const inner = (
    <>
      <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", !padded && "sr-only", classNames?.header)}>
        <SheetPrimitive.Title data-slot="sheet-title" className={cn("font-heading font-medium text-foreground", classNames?.title)}>
          {title}
        </SheetPrimitive.Title>
        {description ? (
          <SheetPrimitive.Description data-slot="sheet-description" className={cn("text-sm text-muted-foreground", classNames?.description)}>
            {description}
          </SheetPrimitive.Description>
        ) : null}
      </div>
      <div data-slot="sheet-body" className={cn("min-h-0 flex-1 overflow-y-auto", padded && "px-4", classNames?.body)}>
        {children}
      </div>
      {footer && (
        <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", classNames?.footer)}>
          {footer}
        </div>
      )}
    </>
  )

  return (
    <SheetPrimitive.Root data-slot="sheet" {...props}>
      {trigger && <SheetPrimitive.Trigger asChild>{trigger}</SheetPrimitive.Trigger>}
      <SheetPrimitive.Portal container={portalContainer}>
        <SheetPrimitive.Overlay
          data-slot="sheet-overlay"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] duration-(--duration-standard) data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <SheetPrimitive.Content
          data-slot="sheet-content"
          {...(description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={
            autoFocus
              ? undefined
              : (event) => {
                  // The panel takes focus (it's focusable, tabIndex -1), so Tab still starts inside it.
                  event.preventDefault()
                  ;(event.currentTarget as HTMLElement).focus()
                }
          }
          className={cn(
            "fixed z-50 flex flex-col bg-background shadow-lg transition data-[state=closed]:animate-out data-[state=closed]:duration-(--duration-standard) data-[state=closed]:ease-exit data-[state=open]:animate-in data-[state=open]:duration-(--duration-considered) data-[state=open]:ease-enter",
            sides[side],
            className
          )}
        >
          {form ? (
            <form {...form} className={cn("flex min-h-0 flex-1 flex-col", form.className)}>
              {inner}
            </form>
          ) : (
            inner
          )}
          {showCloseButton && (
            <SheetPrimitive.Close className="absolute top-4 end-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <XIcon className="size-4" />
              <span className="sr-only">{t("close")}</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  )
}

/** Closes the sheet it's in: wrap a button, e.g. <SheetClose asChild><Button>Done</Button></SheetClose>. */
function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

export { Sheet, SheetClose, type SheetProps, type SheetSide }
