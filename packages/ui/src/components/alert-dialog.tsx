"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"
import { Button } from "./button"

type AlertDialogColor = "primary" | "destructive"

// The icon's tinted circle. Every class is written out in full so Tailwind finds it.
const iconColors: Record<AlertDialogColor, string> = {
  primary: "bg-primary/10 text-primary-text",
  destructive: "bg-destructive/10 text-destructive-text",
}

type AlertDialogProps = Omit<React.ComponentProps<typeof AlertDialogPrimitive.Root>, "children"> & {
  /** What opens it, e.g. a Delete button. Leave it out to open it yourself with open and onOpenChange. */
  trigger?: React.ReactElement
  /** The question, e.g. "Delete this project?". Required: it names the dialog. */
  title: React.ReactNode
  /** What happens if they go ahead, e.g. "Its 12 dashboards go with it. This can't be undone." */
  description?: React.ReactNode
  /** More between the text and the buttons, e.g. a field to type the project's name. */
  children?: React.ReactNode
  /** In a tinted circle beside the text, e.g. a warning triangle. */
  icon?: React.ReactNode
  /** "destructive" makes the confirm button (and the icon) red, for deleting. */
  color?: AlertDialogColor
  /** The confirm button's label. "Continue" by default. */
  confirmLabel?: React.ReactNode
  /** The cancel button's label. "Cancel" by default. */
  cancelLabel?: React.ReactNode
  /** Beside the spinner while onConfirm's promise runs, e.g. "Deleting…". */
  loadingText?: React.ReactNode
  /**
   * Runs on confirm. Return a promise and the confirm button shows it's working while the dialog waits; it closes when
   * the promise resolves and stays open if it rejects (say why in the body).
   */
  onConfirm?: () => void | Promise<unknown>
  /** Keeps confirm off until something's done, e.g. the project's name typed. */
  confirmDisabled?: boolean
  /** The panel's classes. */
  className?: string
  classNames?: { title?: string; description?: string; footer?: string }
}

/**
 * A question that has to be answered before anything else, in one tag: "Delete this project?" with Cancel and a
 * confirm button. Unlike Dialog it can't be dismissed by clicking outside, and Cancel has the focus, so Enter never
 * deletes by accident. onConfirm can return a promise: the button shows it's working and the dialog waits for it.
 */
function AlertDialog({
  trigger,
  title,
  description,
  children,
  icon,
  color = "primary",
  confirmLabel,
  cancelLabel,
  loadingText,
  onConfirm,
  confirmDisabled,
  className,
  classNames,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: AlertDialogProps) {
  const portalContainer = usePortalContainer()
  const { t } = useLocale()
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const [pending, setPending] = React.useState(false)
  const change = (next: boolean) => {
    // While onConfirm runs, it stays: Escape and Cancel wait too.
    if (pending) return
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }

  async function confirm(event: React.MouseEvent<HTMLButtonElement>) {
    const result = onConfirm?.()
    if (!(result instanceof Promise)) return
    // A promise: keep it open (Radix would close it on this click) until it settles.
    event.preventDefault()
    setPending(true)
    try {
      await result
      setPending(false)
      if (open === undefined) setOwn(false)
      onOpenChange?.(false)
    } catch {
      setPending(false)
    }
  }

  return (
    <AlertDialogPrimitive.Root data-slot="alert-dialog" open={isOpen} onOpenChange={change} {...props}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal container={portalContainer}>
        <AlertDialogPrimitive.Overlay
          data-slot="alert-dialog-overlay"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] duration-(--duration-standard) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <AlertDialogPrimitive.Content
          data-slot="alert-dialog-content"
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 rounded-lg border bg-background p-6 shadow-lg sm:max-w-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:blur-in-[2px] data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-(--duration-fast) data-[state=closed]:ease-exit motion-reduce:blur-in-0",
            className
          )}
        >
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-start">
            {icon && (
              <span data-slot="alert-dialog-icon" className={cn("grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5", iconColors[color])}>
                {icon}
              </span>
            )}
            <div className="grid gap-2">
              <AlertDialogPrimitive.Title
                data-slot="alert-dialog-title"
                className={cn("font-heading text-lg leading-tight font-medium tracking-[-0.02em]", classNames?.title)}
              >
                {title}
              </AlertDialogPrimitive.Title>
              {description && (
                <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn("text-sm text-muted-foreground", classNames?.description)}>
                  {description}
                </AlertDialogPrimitive.Description>
              )}
            </div>
          </div>
          {children}
          <div data-slot="alert-dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", classNames?.footer)}>
            {/* Cancel takes the focus when it opens (Radix does that for the Cancel part), so Enter never confirms by accident. */}
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="outline" disabled={pending}>
                {cancelLabel ?? t("cancel")}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button color={color} disabled={confirmDisabled} loading={pending} loadingText={loadingText} onClick={confirm}>
                {confirmLabel ?? t("continue")}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { AlertDialog, type AlertDialogProps, type AlertDialogColor }
