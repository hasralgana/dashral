"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform } from "motion/react"
import type { DialogProps as KitDialogProps, DialogSize } from "@dashral/ui/components/dialog"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"
import { usePortalContainer } from "@dashral/ui/lib/portal"
import { ScrollShadow } from "@dashral/ui/components/scroll-shadow"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { DialogSize } from "@dashral/ui/components/dialog"

export type DialogProps = KitDialogProps & {
  /** On a touch screen, swipe the panel down to close it, as a sheet does. On by default. */
  swipeToClose?: boolean
  /**
   * How it grows out of its trigger. "soft" (the default): from a little smaller, quickly. "trigger": from the
   * trigger's own size and place, travelling to the middle on a smooth, slower curve (no bounce) and shrinking back into it as it closes,
   * its content coming in once it's grown: for a dialog that should read as coming out of the button.
   */
  grow?: "soft" | "trigger"
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
  grow = "soft",
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
  const [origin, setOrigin] = React.useState("50% 50%")
  // Measured as the panel attaches, not in an effect when `open` turns true: Radix's portal mounts the panel a render
  // later, so an effect would find no panel yet and leave it growing from the middle. A ref callback runs before the
  // first frame is drawn, so the panel starts its growth at the trigger.
  // grow="trigger": the panel's scale starts at the trigger's size (the larger of its two ratios) and its content waits.
  const fromTrigger = grow === "trigger" && !reduced
  const growScale = useMotionValue(1)
  const contentOpacity = useMotionValue(1)
  const startScale = React.useRef(0.6)
  const panel = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return
      const box = opener.current?.getBoundingClientRect()
      if (!box || !box.width) {
        setOrigin("50% 50%")
        startScale.current = 0.6
      } else {
        const left = (window.innerWidth - node.offsetWidth) / 2
        const top = (window.innerHeight - node.offsetHeight) / 2
        setOrigin(`${box.left + box.width / 2 - left}px ${box.top + box.height / 2 - top}px`)
        startScale.current = Math.min(0.6, Math.max(0.05, box.width / node.offsetWidth, box.height / node.offsetHeight))
      }
      if (!fromTrigger) return
      growScale.jump(startScale.current)
      contentOpacity.jump(0)
      // A smooth curve, no spring: it leaves the trigger gently, travels, and eases into the middle without a bounce.
      animate(growScale, 1, { duration: 0.45, ease: [0.4, 0, 0.2, 1] })
      animate(contentOpacity, 1, { duration: duration.standard, ease: ease.enter, delay: 0.16 })
    },
    [fromTrigger, growScale, contentOpacity]
  )
  // Closing back into the trigger: the content goes first, so only the shape travels back, as it came.
  React.useEffect(() => {
    if (!isOpen && fromTrigger) animate(contentOpacity, 0, { duration: 0.1, ease: ease.exit })
  }, [isOpen, fromTrigger, contentOpacity])

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
      {/* Only the middle scrolls when the dialog is taller than the screen: the title and the buttons stay in view. */}
      <ScrollShadow
        data-slot="dialog-body"
        size={24}
        className={cn("-mx-6 -my-1 grid min-h-0 flex-1 gap-4 overscroll-contain px-6 py-1", classNames?.body)}
      >
        {children}
      </ScrollShadow>
      {footer && (
        <div data-slot="dialog-footer" className={cn(
            // Side by side, each taking its share, on a phone too; the main one wraps above only when the labels can't share a line.
            "flex flex-wrap-reverse gap-2 sm:flex-wrap sm:justify-end [&>*]:min-w-fit [&>*]:flex-1 sm:[&>*]:flex-none",
            classNames?.footer
          )}>
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
                style={fromTrigger ? { transformOrigin: origin, y: dragY, scale: growScale } : { transformOrigin: origin, y: dragY }}
                drag={canSwipe ? "y" : false}
                dragControls={swipe}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                // Down it follows the finger; up it barely gives.
                dragElastic={{ top: 0.06, bottom: 1 }}
                onPointerDown={(event) => {
                  if (!canSwipe || event.pointerType !== "touch") return
                  if ((event.target as HTMLElement).closest(keepsTouch)) return
                  // A body that scrolls (taller than the screen) keeps the finger for scrolling; the title and the
                  // buttons still swipe the panel away.
                  const body = (event.target as HTMLElement).closest<HTMLElement>("[data-slot=dialog-body]")
                  if (body && body.scrollHeight > body.clientHeight + 1) return
                  swipe.start(event)
                }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 600) {
                    buzz(8)
                    setSwiped(true)
                    change(false)
                  } else animate(dragY, 0, spring.move)
                }}
                initial={reduced ? { opacity: 0 } : fromTrigger ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                animate={fromTrigger ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: duration.fast } }
                    : swiped
                      ? { y: "100vh", transition: { duration: duration.standard, ease: ease.exit } }
                      : fromTrigger
                        ? // Back into the trigger: the shape shrinks to it, fading only at the end.
                          { scale: startScale.current, opacity: 0, transition: { scale: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: duration.fast, delay: 0.14 } } }
                        : { opacity: 0, scale: 0.8, transition: { duration: duration.fast, ease: ease.exit } }
                }
                transition={
                  reduced
                    ? { duration: duration.fast }
                    : fromTrigger
                      ? { opacity: { duration: 0.12, ease: ease.enter } }
                      : { ...spring.appear, opacity: { duration: duration.fast, ease: ease.enter } }
                }
                className={cn(
                  // Centred with translate, which motion leaves alone: it scales with transform.
                  "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border bg-background p-6 shadow-lg",
                  sizes[size],
                  className
                )}
              >
                {canSwipe && (
                  // A handle on touch screens, saying the panel can be swiped down.
                  <span aria-hidden className="absolute top-2 left-1/2 hidden h-1 w-9 -translate-x-1/2 rounded-full bg-muted-foreground/25 pointer-coarse:block" />
                )}
                {/* Clipped only while it glides, so a focus ring at the edge isn't cut off the rest of the time. */}
                <motion.div style={{ height, opacity: contentOpacity }} className={cn("flex min-h-0 flex-col", gliding && "overflow-hidden")}>
                  {/* At most the screen's height less the panel's padding, so a tall body scrolls inside it. */}
                  <div ref={inside} className="flex max-h-[calc(100dvh-5rem)] min-h-0 flex-col gap-4">
                    {form ? (
                      <form {...form} className={cn("flex min-h-0 flex-1 flex-col gap-4", form.className)}>
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
