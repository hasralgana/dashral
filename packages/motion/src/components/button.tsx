"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform, type Variants } from "motion/react"
import { buttonVariants } from "@dashral/ui/components/button"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { TextMorph } from "../lib/text-morph"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

type StyleProps = Omit<NonNullable<Parameters<typeof buttonVariants>[0]>, "className">

// motion/react gives these its own meaning (drag and animation events), so a plain button's versions are left out.
type NativeProps = Omit<React.ComponentProps<"button">, "color" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">

export type ButtonProps = NativeProps &
  StyleProps & {
    /** Shows a spinner in place of the label and ignores clicks, without moving focus. */
    loading?: boolean
    /** Beside the spinner while loading, e.g. "Saving…"; without it the spinner shows alone. */
    loadingText?: React.ReactNode
    /**
     * For an action that can't be undone: a click isn't enough, it has to be pressed and held. A fill sweeps across
     * while it's held and runs onClick (and submits its form) once full; let go early and it drains back. true holds
     * for 1.2s, a number for that many milliseconds. Space and Enter hold it from the keyboard.
     */
    holdToConfirm?: boolean | number
    /**
     * How the hold shows its progress: "fill" sweeps across the button; "radial" grows a circle from where it's
     * pressed; "ring" traces the button's edge; "bar" fills a thin line along its foot; "countdown" turns the label
     * into the seconds left, on odometer wheels, over a bar.
     */
    holdStyle?: "fill" | "radial" | "ring" | "bar" | "countdown"
    /**
     * A label that's only text morphs into the next one letter by letter (Follow to Following keeps "Follow" and grows
     * "ing") instead of crossing over. Off by default.
     */
    morph?: boolean
  }

/** A light buzz on phones that have one. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

/**
 * What the label is, for telling a new label from a re-render of the same one: its text and the names of the elements
 * in it. A new label (or icon) crosses over; the same one with new props stays put.
 */
function labelKey(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node)
  if (Array.isArray(node)) return node.map(labelKey).join("")
  if (!React.isValidElement(node)) return ""
  const type = node.type as string | { displayName?: string; name?: string }
  const name = typeof type === "string" ? type : (type.displayName ?? type.name ?? "")
  return `<${name}>${labelKey((node.props as { children?: React.ReactNode }).children)}`
}

/** How far it presses in: an icon button a little deeper, a wide one a little less, so each feels like the same push. */
const press: Variants = {
  pressed: (button: React.RefObject<HTMLButtonElement | null>) => {
    const width = button.current?.offsetWidth ?? 0
    return { scale: width > 200 ? 0.985 : width > 0 && width <= 44 ? 0.95 : 0.97, transition: spring.press }
  },
}

/** A layer of the label's grid cell, laid out like the button itself (its gap included). */
const layer = "col-start-1 row-start-1 inline-flex items-center justify-center gap-[inherit]"

/**
 * The kit's Button with motion: the same variants, colors, sizes and props, and it adds what CSS can't do on its own.
 * It presses in on a spring, as deep as its size calls for; a new label crosses over (rising as it fades in), or with
 * morph a text label changes letter by letter (Follow to Following keeps Follow and grows "ing"), while the button
 * glides to its new width instead of snapping; and loading pops the spinner (and loadingText) in over the label,
 * keeping the width. Disabled, loading, reduced motion, or opening a menu or popover (Radix places the layer from the
 * trigger as it opens), it doesn't press in. With holdToConfirm, it asks to be held: a fill sweeps across, and when
 * it's full the button pops and the action runs (phones buzz); let go early and the fill drains back. No asChild: for
 * a link that looks like a button, use the kit's Button.
 */
export function Button({
  className,
  variant,
  color,
  size,
  glow,
  loading = false,
  loadingText,
  holdToConfirm,
  holdStyle = "fill",
  morph = false,
  children,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  ref,
  ...props
}: ButtonProps) {
  const reduced = useReducedMotion()
  const { t, locale } = useLocale()
  const button = React.useRef<HTMLButtonElement | null>(null)
  // Its own ref (the press measures the button) and the one it's given (a Radix trigger's, a form library's), both.
  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      button.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  const content = React.useRef<HTMLSpanElement | null>(null)
  const width = useMotionValue<number | "auto">("auto")
  const key = labelKey(children)
  const iconOnly = !/[^\s]/.test(key.replace(/<[^>]*>/g, ""))

  // The width glides only when the label itself changes; anything else that resizes it (a web font arriving, a parent's
  // layout) is followed at once, so nothing wobbles on first paint.
  const gliding = React.useRef(false)
  const lastKey = React.useRef(key)
  React.useLayoutEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    gliding.current = true
  }, [key])
  React.useEffect(() => {
    const node = content.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.borderBoxSize[0]?.inlineSize ?? node.offsetWidth
      if (!next) return
      if (!gliding.current || reduced || width.get() === "auto") {
        width.jump(next)
        gliding.current = false
        return
      }
      animate(width, next, { ...spring.glide, onComplete: () => (gliding.current = false) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced, width])

  const popup = props["aria-haspopup"]
  const anchorsLayer = (popup !== undefined && popup !== false && popup !== "false") || props.role === "combobox" || "data-state" in props
  const still = reduced || props.disabled || loading || anchorsLayer

  // Hold to confirm: how full the fill is, and whether the click now coming is the one the hold earned.
  const holdMs = holdToConfirm === true ? 1200 : typeof holdToConfirm === "number" ? holdToConfirm : 0
  const fill = useMotionValue(0)
  const filling = React.useRef<ReturnType<typeof animate> | null>(null)
  const earned = React.useRef(false)
  const holding = React.useRef(false)
  // A hold that ran ends with the pointer being let go, and the browser sends a click for that too: by then the button
  // may already be something else (Restore, Undo), so that one click is swallowed. The next press clears it.
  const spent = React.useRef(false)
  // The countdown's seconds left, in tenths, while a hold runs.
  const [counting, setCounting] = React.useState(false)
  const [left, setLeft] = React.useState(holdMs / 1000)
  useMotionValueEvent(fill, "change", (v) => {
    if (holdStyle !== "countdown") return
    const next = Math.max(0, Math.ceil((1 - v) * holdMs / 100) / 10)
    setLeft((was) => (was === next ? was : next))
  })
  const seconds = React.useMemo(
    () => new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "narrow", minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [locale]
  )
  const radial = React.useRef<HTMLSpanElement>(null)
  // An empty ring hides: a path drawn to nothing still shows its round cap as a dot.
  const ringShown = useTransform(fill, (v) => (v > 0.005 ? 1 : 0))
  const ring = React.useRef<SVGRectElement>(null)
  const ringTrack = React.useRef<SVGRectElement>(null)
  /** Sizes what the style draws to the button as it is now: the circle around the press, the edge's path. */
  const prepare = (point: { x: number; y: number } | null) => {
    const node = button.current
    if (!node) return
    // Inside the border: the layers sit in the padding box, which is also where the button clips them.
    const w = node.clientWidth
    const h = node.clientHeight
    if (radial.current) {
      const x = point?.x ?? w / 2
      const y = point?.y ?? h / 2
      // Big enough to cover the farthest corner from where it's pressed.
      const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
      Object.assign(radial.current.style, { left: `${x - r}px`, top: `${y - r}px`, width: `${r * 2}px`, height: `${r * 2}px` })
    }
    if (ring.current) {
      const css = getComputedStyle(node)
      // The corner inside the border, then half the stroke in from there, so the line runs evenly all the way round.
      const inner = Math.max(0, (parseFloat(css.borderTopLeftRadius) || 0) - (parseFloat(css.borderTopWidth) || 0))
      const rx = String(Math.max(0, Math.min(inner - 1.5, h / 2 - 1.5)))
      for (const rect of [ring.current, ringTrack.current]) {
        if (!rect) continue
        rect.setAttribute("width", String(Math.max(0, w - 3)))
        rect.setAttribute("height", String(Math.max(0, h - 3)))
        rect.setAttribute("rx", rx)
      }
    }
  }
  const startHold = (touch: boolean, point: { x: number; y: number } | null = null) => {
    if (!holdMs || props.disabled || loading || holding.current) return
    holding.current = true
    prepare(point)
    if (holdStyle === "countdown") {
      setLeft(holdMs / 1000)
      setCounting(true)
    }
    if (touch) buzz(4)
    filling.current?.stop()
    // A fill left full (the button became something else before it drained) starts empty again.
    if (fill.get() >= 1) fill.jump(0)
    filling.current = animate(fill, 1, {
      duration: (holdMs / 1000) * (1 - fill.get()),
      ease: "linear",
      onComplete: () => {
        holding.current = false
        setCounting(false)
        if (touch) buzz(14)
        // Full, it pops: a quick swell and back.
        if (!reduced && button.current) animate(button.current, { scale: [0.97, 1.06, 1] }, { duration: 0.32, ease: ease.standard })
        earned.current = true
        button.current?.click()
        spent.current = true
        filling.current = animate(fill, 0, { duration: duration.considered, ease: ease.standard, delay: 0.15 })
      },
    })
  }
  const stopHold = () => {
    if (!holding.current) return
    holding.current = false
    setCounting(false)
    filling.current?.stop()
    filling.current = animate(fill, 0, spring.glide)
  }
  const enter = reduced ? { opacity: 0 } : iconOnly ? { opacity: 0, scale: 0.8 } : { opacity: 0, y: 4 }

  return (
    <motion.button
      ref={setRef}
      data-slot="button"
      // Tells the kit's styles to leave the press to this component.
      data-press="motion"
      {...props}
      className={buttonVariants({
        variant,
        color,
        size,
        glow,
        // Colors still change in CSS; transform is this component's, so CSS mustn't ease it too.
        className: cn("transition-[color,background-color,border-color,box-shadow,opacity]", holdMs > 0 && "relative overflow-hidden", className),
      })}
      aria-busy={loading || undefined}
      aria-disabled={loading || props["aria-disabled"]}
      // preventDefault also stops a submit button from submitting its form. Held to confirm, only the click the hold
      // earned goes through.
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (spent.current) {
          spent.current = false
          return event.preventDefault()
        }
        if (loading || (holdMs && !earned.current)) return event.preventDefault()
        earned.current = false
        onClick?.(event)
      }}
      onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => {
        spent.current = false
        onPointerDown?.(event)
        if (event.button === 0) {
          const box = event.currentTarget.getBoundingClientRect()
          startHold(event.pointerType === "touch", { x: event.clientX - box.left, y: event.clientY - box.top })
        }
      }}
      onPointerUp={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerUp?.(event)
        stopHold()
      }}
      onPointerLeave={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(event)
        stopHold()
      }}
      onPointerCancel={(event: React.PointerEvent<HTMLButtonElement>) => {
        onPointerCancel?.(event)
        stopHold()
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!event.repeat) spent.current = false
        onKeyDown?.(event)
        if (holdMs && (event.key === " " || event.key === "Enter")) {
          // The browser's own click on Enter would come before the hold is done.
          event.preventDefault()
          if (!event.repeat) startHold(false)
        }
      }}
      onKeyUp={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyUp?.(event)
        if (holdMs && (event.key === " " || event.key === "Enter")) {
          event.preventDefault()
          stopHold()
        }
      }}
      custom={button}
      variants={press}
      whileTap={still ? undefined : "pressed"}
      transition={spring.press}
    >
      {/*
        The fill, behind the label, sweeping from the start to the end. Always there, so its drain keeps playing when the
        button turns into something else after a hold (a Restore in its place): taken away, it would stop full.
      */}
      <motion.span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 origin-left bg-current opacity-15 rtl:origin-right", (!holdMs || holdStyle !== "fill") && "hidden")}
        style={{ scaleX: fill }}
      />
      {/* radial: a circle from where it was pressed, growing to cover the button. */}
      <motion.span
        ref={radial}
        aria-hidden
        className={cn("pointer-events-none absolute rounded-full bg-current opacity-15", (!holdMs || holdStyle !== "radial") && "hidden")}
        style={{ scale: fill }}
      />
      {/* ring: the button's edge, traced from its top-left corner round. */}
      <svg aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", (!holdMs || holdStyle !== "ring") && "hidden")}>
        {/* The path it will take, faint, while it's held; then the line drawn along it. */}
        <motion.rect ref={ringTrack} x={1.5} y={1.5} fill="none" stroke="currentColor" strokeWidth={2} strokeOpacity={0.15} style={{ opacity: ringShown }} />
        <motion.rect ref={ring} x={1.5} y={1.5} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ pathLength: fill, opacity: ringShown }} />
      </svg>
      {/* A rounded line floating inside the foot, clear of the corners, over a faint track that shows while it's held. */}
      <motion.span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full",
          (!holdMs || (holdStyle !== "bar" && holdStyle !== "countdown")) && "hidden"
        )}
        style={{ opacity: ringShown }}
      >
        <span className="absolute inset-0 bg-current opacity-20" />
        <motion.span className="absolute inset-0 origin-left rounded-full bg-current rtl:origin-right" style={{ scaleX: fill }} />
      </motion.span>
      {holdMs > 0 && <span className="sr-only">{t("pressAndHold")}</span>}
      {/* The visible width, gliding; what's inside is measured at its own width and kept centred while it catches up. */}
      <motion.span className="flex justify-center gap-[inherit]" style={{ width }}>
        <span ref={content} className="relative grid w-max shrink-0 gap-[inherit]">
          <motion.span
            className={layer}
            animate={{ opacity: loading || counting ? 0 : 1 }}
            transition={{ duration: duration.fast, ease: ease.standard }}
            aria-hidden={loading || undefined}
          >
            {morph && (typeof children === "string" || typeof children === "number") ? (
              // With morph, a label that's only text changes letter by letter: the letters both labels have glide to their places.
              <span className={layer}>
                <TextMorph>{String(children)}</TextMorph>
              </span>
            ) : (
              // popLayout lifts the outgoing label out of the flow at once, so the new one sets the width straight away.
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={key}
                  className={layer}
                  initial={enter}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
                  transition={
                    reduced
                      ? { duration: duration.fast }
                      : iconOnly
                        ? { ...spring.pop, opacity: { duration: duration.fast, ease: ease.enter } }
                        : { duration: duration.standard, ease: ease.enter }
                  }
                >
                  {children}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.span>
          {/* countdown: the seconds left take the label's place while it's held, keeping the button's width. */}
          <AnimatePresence initial={false}>
            {counting && (
              <motion.span
                key="countdown"
                aria-hidden
                className={cn(layer, "tabular-nums")}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
                transition={{ duration: duration.fast, ease: ease.enter }}
              >
                <Odometer value={left} format={seconds} />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {loading && (
              <motion.span
                key="loading"
                className={layer}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1, ease: ease.exit } }}
                transition={reduced ? { duration: duration.fast } : { ...spring.pop, opacity: { duration: duration.fast, ease: ease.enter } }}
              >
                <Loader2 data-spinner="" className="animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-hidden />
                {loadingText}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.span>
    </motion.button>
  )
}
