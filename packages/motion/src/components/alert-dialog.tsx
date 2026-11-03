"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { AnimatePresence, animate, motion } from "motion/react"
import type { AlertDialogColor, AlertDialogProps as KitAlertDialogProps } from "@dashral/ui/components/alert-dialog"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"
import { Button } from "./button"

export type AlertDialogProps = KitAlertDialogProps & {
  /**
   * For the worst of them (deleting a whole workspace): confirm has to be pressed and held, not clicked. true holds
   * for 1.2s, a number for that many milliseconds. See Button's holdToConfirm.
   */
  holdToConfirm?: boolean | number
}

// The icon's tinted circle, as the kit's AlertDialog has it. Every class is written out in full so Tailwind finds it.
const iconColors: Record<AlertDialogColor, string> = {
  primary: "bg-primary/10 text-primary-text",
  destructive: "bg-destructive/10 text-destructive-text",
}

/**
 * The kit's AlertDialog with motion: the same question, buttons, onConfirm and props. It grows out of the button that
 * opened it on a quick spring and shrinks back into it as it closes; its icon pops in (a destructive one gives a short
 * wiggle). A click outside doesn't close it, so the panel shakes: it needs an answer. Confirm shows it's working while
 * onConfirm's promise runs, and holdToConfirm makes it a press-and-hold for the worst of them. With reduced motion it
 * only fades and nothing shakes.
 */
export function AlertDialog({
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
  holdToConfirm,
  className,
  classNames,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: AlertDialogProps) {
  const portalContainer = usePortalContainer()
  const { t } = useLocale()
  const reduced = useReducedMotion()
  // Kept here, so the panel can stay on screen while it leaves.
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const [pending, setPending] = React.useState(false)
  const close = () => {
    if (open === undefined) setOwn(false)
    onOpenChange?.(false)
  }
  const change = (next: boolean) => {
    // While onConfirm runs, it stays: Escape and Cancel wait too.
    if (pending) return
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }

  async function confirm(event: React.MouseEvent<HTMLButtonElement>) {
    // Radix would close it on this click; it closes here instead, after onConfirm (and its promise) is done.
    event.preventDefault()
    const result = onConfirm?.()
    if (!(result instanceof Promise)) return close()
    setPending(true)
    try {
      await result
      setPending(false)
      close()
    } catch {
      setPending(false)
    }
  }

  // Where it grows from: the trigger's middle, turned into a point inside the panel (centred in the viewport).
  const opener = React.useRef<HTMLButtonElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const [origin, setOrigin] = React.useState("50% 50%")
  React.useLayoutEffect(() => {
    const node = panel.current
    if (!isOpen || !node) return
    const box = opener.current?.getBoundingClientRect()
    if (!box || !box.width) return setOrigin("50% 50%")
    const left = (window.innerWidth - node.offsetWidth) / 2
    const top = (window.innerHeight - node.offsetHeight) / 2
    setOrigin(`${box.left + box.width / 2 - left}px ${box.top + box.height / 2 - top}px`)
  }, [isOpen])

  /** A click outside: it won't close, so it says so with a short shake. */
  function insist() {
    const node = panel.current
    if (reduced || !node) return
    animate(node, { x: [0, -8, 7, -4, 2, 0] }, { duration: 0.4, ease: "easeOut" })
  }

  return (
    <AlertDialogPrimitive.Root data-slot="alert-dialog" open={isOpen} onOpenChange={change} {...props}>
      {trigger && (
        <AlertDialogPrimitive.Trigger asChild ref={opener}>
          {trigger}
        </AlertDialogPrimitive.Trigger>
      )}
      <AnimatePresence>
        {isOpen && (
          <AlertDialogPrimitive.Portal forceMount container={portalContainer}>
            <AlertDialogPrimitive.Overlay forceMount asChild>
              <motion.div
                data-slot="alert-dialog-overlay"
                // The blur stays put and only the opacity moves: animating a full-screen blur costs frames.
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={{ duration: duration.standard, ease: ease.enter }}
                onPointerDown={insist}
              />
            </AlertDialogPrimitive.Overlay>
            <AlertDialogPrimitive.Content forceMount asChild {...(description ? {} : { "aria-describedby": undefined })}>
              {/* The shake runs on this outer box; the inner one grows and shrinks, so the two never fight over a transform. */}
              <div ref={panel} className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 sm:max-w-md">
                <motion.div
                  data-slot="alert-dialog-content"
                  style={{ transformOrigin: origin }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0, transition: { duration: duration.fast } } : { opacity: 0, scale: 0.8, transition: { duration: duration.fast, ease: ease.exit } }}
                  transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
                  className={cn("grid gap-5 rounded-lg border bg-background p-6 shadow-lg", className)}
                >
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-start">
                    {icon && (
                      <motion.span
                        data-slot="alert-dialog-icon"
                        className={cn("grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5", iconColors[color])}
                        initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                        animate={reduced ? { opacity: 1 } : color === "destructive" ? { scale: 1, opacity: 1, rotate: [0, -12, 10, -6, 0] } : { scale: 1, opacity: 1 }}
                        transition={reduced ? { duration: duration.fast } : { ...spring.pop, delay: 0.08, rotate: { duration: 0.5, delay: 0.25, ease: "easeOut" } }}
                      >
                        {icon}
                      </motion.span>
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
                    {/* Cancel takes the focus when it opens, so Enter never confirms by accident. */}
                    <AlertDialogPrimitive.Cancel asChild>
                      <Button variant="outline" disabled={pending}>
                        {cancelLabel ?? t("cancel")}
                      </Button>
                    </AlertDialogPrimitive.Cancel>
                    <AlertDialogPrimitive.Action asChild>
                      <Button color={color} disabled={confirmDisabled} loading={pending} loadingText={loadingText} holdToConfirm={holdToConfirm} onClick={confirm}>
                        {confirmLabel ?? t("continue")}
                      </Button>
                    </AlertDialogPrimitive.Action>
                  </div>
                </motion.div>
              </div>
            </AlertDialogPrimitive.Content>
          </AlertDialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </AlertDialogPrimitive.Root>
  )
}
