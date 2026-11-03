"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform } from "motion/react"
import type { DialogProps as KitDialogProps, DialogSize } from "@dashral/ui/components/dialog"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { DialogSize } from "@dashral/ui/components/dialog"

export type DialogProps = KitDialogProps & {
  /** On a touch screen, swipe the panel down to close it, as a sheet does. On by default. */
  swipeToClose?: boolean
}

/** A light buzz on phones that have one. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

/** Where a swipe shouldn't start: a field you type in, or something you drag or scroll on your own. */
const keepsTouch = "input, textarea, select, [contenteditable], [data-slot=slider], [role=slider]"
export { DialogClose } from "@dashral/ui/components/dialog"

const sizes: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
}

/**
 * The kit's Dialog with motion: the same trigger, title, body, footer, form and props. It grows out of the button that
 * opened it on a quick spring and shrinks back into it as it closes; the page behind dims and blurs as it comes. When what's
 * inside changes (a form's next step, an error appearing), the panel glides to its new height instead of jumping.
 * Opened without a trigger, it grows from the middle. On a touch screen, swipe it down and it follows your finger,
 * the backdrop clearing as it goes: far or fast enough and it slides away closed (phones buzz), short of it it
 * springs back; upward it barely gives. With reduced motion it only fades and doesn't swipe.
 */
export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  form,
  size = "md",
  showCloseButton = true,
  swipeToClose = true,
  className,
  classNames,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: DialogProps) {
  const portalContainer = usePortalContainer()
  const { t } = useLocale()
  const reduced = useReducedMotion()
  // Kept here, so the panel can stay on screen while it closes.
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? own
  const change = (next: boolean) => {
    if (next) setSwiped(false)
    if (open === undefined) setOwn(next)
    onOpenChange?.(next)
  }

  // A swipe down on a touch screen: how far the panel has come, the backdrop clearing with it, and whether a swipe
  // closed it (so it leaves downward instead of shrinking back into its button).
  const dragY = useMotionValue(0)
  const backdrop = useTransform(dragY, [0, 320], [1, 0.15])
  const swipe = useDragControls()
  const [swiped, setSwiped] = React.useState(false)
  React.useEffect(() => {
    if (isOpen) dragY.jump(0)
  }, [isOpen, dragY])
  const canSwipe = swipeToClose && !reduced

  // Where it grows from: the trigger's middle, turned into a point inside the panel. The panel sits in the middle of
  // the viewport (left and top 50%, pulled back by half its size), so its untransformed size places it.
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

  // The body's height follows what's inside on a glide; before it's measured (and with reduced motion) it's natural.
  const inside = React.useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | "auto">("auto")
  const [gliding, setGliding] = React.useState(false)
  React.useEffect(() => {
    const node = inside.current
    if (!isOpen || !node) return
    let first = true
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.blockSize ?? node.offsetHeight
      if (first || reduced) height.jump(next)
      else {
        setGliding(true)
        animate(height, next, { ...spring.glide, onComplete: () => setGliding(false) })
      }
      first = false
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      height.jump("auto")
    }
  }, [isOpen, height, reduced])

  const inner = (
    <>
      <div data-slot="dialog-header" className={cn("flex flex-col gap-2 text-center sm:text-start", classNames?.header)}>
        <DialogPrimitive.Title data-slot="dialog-title" className={cn("font-heading text-lg leading-none font-medium tracking-[-0.02em]", classNames?.title)}>
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
    <DialogPrimitive.Root data-slot="dialog" open={isOpen} onOpenChange={change} {...props}>
      {trigger && (
        <DialogPrimitive.Trigger asChild ref={opener}>
          {trigger}
        </DialogPrimitive.Trigger>
      )}
      <AnimatePresence>
        {isOpen && (
          <DialogPrimitive.Portal forceMount container={portalContainer}>
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                data-slot="dialog-overlay"
                className="fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: duration.fast, ease: ease.exit } }}
                transition={{ duration: duration.standard, ease: ease.enter }}
              >
                {/* The blur stays put and only the opacity moves (animating a full-screen blur costs frames); a swipe clears it. */}
                <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" style={{ opacity: backdrop }} />
              </motion.div>
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              forceMount
              asChild
              // Without a description, say so explicitly: otherwise Radix warns that one is missing.
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <motion.div
                ref={panel}
                data-slot="dialog-content"
                style={{ transformOrigin: origin, y: dragY }}
                drag={canSwipe ? "y" : false}
                dragControls={swipe}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                // Down it follows the finger; up it barely gives.
                dragElastic={{ top: 0.06, bottom: 1 }}
                onPointerDown={(event) => {
                  if (!canSwipe || event.pointerType !== "touch") return
                  if ((event.target as HTMLElement).closest(keepsTouch)) return
                  swipe.start(event)
                }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 600) {
                    buzz(8)
                    setSwiped(true)
                    change(false)
                  } else animate(dragY, 0, spring.move)
                }}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: duration.fast } }
                    : swiped
                      ? { y: "100vh", transition: { duration: duration.standard, ease: ease.exit } }
                      : { opacity: 0, scale: 0.8, transition: { duration: duration.fast, ease: ease.exit } }
                }
                transition={reduced ? { duration: duration.fast } : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }}
                className={cn(
                  // Centred with translate, which motion leaves alone: it scales with transform.
                  "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg",
                  sizes[size],
                  className
                )}
              >
                {canSwipe && (
                  // A handle on touch screens, saying the panel can be swiped down.
                  <span aria-hidden className="absolute top-2 left-1/2 hidden h-1 w-9 -translate-x-1/2 rounded-full bg-muted-foreground/25 pointer-coarse:block" />
                )}
                {/* Clipped only while it glides, so a focus ring at the edge isn't cut off the rest of the time. */}
                <motion.div style={{ height }} className={cn(gliding && "overflow-hidden")}>
                  <div ref={inside} className="grid gap-4">
                    {form ? (
                      <form {...form} className={cn("grid gap-4", form.className)}>
                        {inner}
                      </form>
                    ) : (
                      inner
                    )}
                  </div>
                </motion.div>
                {showCloseButton && (
                  <DialogPrimitive.Close className="absolute top-4 end-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:size-4">
                    <XIcon />
                    <span className="sr-only">{t("close")}</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
