"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

type DialogSize = "sm" | "md" | "lg" | "xl"

const sizes: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
}

type DialogProps = Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "children"> & {
  /** What opens it, e.g. a button. Leave it out to open it yourself with open and onOpenChange. */
  trigger?: React.ReactElement
  /** Required, so screen readers can name the dialog; hide it with classNames.title "sr-only" if the design has none. */
  title: React.ReactNode
  description?: React.ReactNode
  /** The body. */
  children?: React.ReactNode
  /** Buttons at the bottom; wrap a Cancel button in DialogClose to close the dialog. */
  footer?: React.ReactNode
  /** Makes the body and footer one <form>, e.g. { onSubmit } or { action }: Enter submits, a submit button in the footer works. */
  form?: React.ComponentProps<"form">
  size?: DialogSize
  /** The × in the corner. */
  showCloseButton?: boolean
  /** The panel's classes. */
  className?: string
  classNames?: { header?: string; title?: string; description?: string; footer?: string }
}

/**
 * A window over the page that takes the focus until it's closed, in one tag: a trigger, a title and description, the
 * body as children and buttons in the footer. Give it form props and the whole thing is a form.
 */
function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  form,
  size = "md",
  showCloseButton = true,
  className,
  classNames,
  ...props
}: DialogProps) {
  const portalContainer = usePortalContainer()
  const { t } = useLocale()
  const inner = (
    <>
      <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-start", classNames?.header)}>
        <DialogPrimitive.Title
          data-slot="dialog-title"
          className={cn("font-heading text-lg leading-none font-medium tracking-[-0.02em]", classNames?.title)}
        >
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", classNames?.description)}>
            {description}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      {children}
      {footer && (
        <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", classNames?.footer)}>
          {footer}
        </div>
      )}
    </>
  )

  return (
    <DialogPrimitive.Root data-slot="dialog" {...props}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogOverlay />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          // Without a description, say so explicitly: otherwise Radix warns that one is missing.
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:blur-in-[2px] data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit motion-reduce:blur-in-0",
            sizes[size],
            className
          )}
        >
          {form ? (
            <form {...form} className={cn("grid gap-4", form.className)}>
              {inner}
            </form>
          ) : (
            inner
          )}
          {showCloseButton && (
            <DialogPrimitive.Close className="absolute top-4 end-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:size-4">
              <XIcon />
              <span className="sr-only">{t("close")}</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Closes the dialog it's in: wrap a button in the footer, e.g. <DialogClose asChild><Button>Cancel</Button></DialogClose>. */
function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] duration-(--duration-standard) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

export { Dialog, DialogClose, type DialogProps, type DialogSize }
