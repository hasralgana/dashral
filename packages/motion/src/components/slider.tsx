"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldOwnProps } from "@dashral/ui/components/field"
import type { SliderProps as KitSliderProps } from "@dashral/ui/components/slider"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { Odometer } from "../lib/odometer"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type SliderProps = KitSliderProps & {
  /** A bubble over the thumb with its value on odometer wheels: while it's dragged or focused ("active"), always, or never. */
  valueLabel?: "active" | "always" | false
  /** How the bubble writes the value, e.g. `{ style: "currency", currency: "USD" }`. */
  formatOptions?: Intl.NumberFormatOptions
}

type ControlColor = NonNullable<KitSliderProps["color"]>

// Track, filled range, and the thumb's border and halo, as the kit's Slider has them. Every class is written out in full
// so Tailwind finds it.
const colors: Record<ControlColor, { track: string; range: string; thumb: string }> = {
  primary: { track: "bg-primary/15", range: "bg-primary", thumb: "border-primary hover:ring-primary/20 focus-visible:ring-primary/30" },
  neutral: { track: "bg-foreground/10", range: "bg-foreground", thumb: "border-foreground hover:ring-foreground/15 focus-visible:ring-foreground/25" },
  info: { track: "bg-info/15", range: "bg-info", thumb: "border-info hover:ring-info/20 focus-visible:ring-info/30" },
  success: { track: "bg-success/15", range: "bg-success", thumb: "border-success hover:ring-success/20 focus-visible:ring-success/30" },
  warning: { track: "bg-warning/20", range: "bg-warning", thumb: "border-warning hover:ring-warning/25 focus-visible:ring-warning/35" },
  destructive: { track: "bg-destructive/15", range: "bg-destructive", thumb: "border-destructive hover:ring-destructive/20 focus-visible:ring-destructive/30" },
  highlight: { track: "bg-highlight/15", range: "bg-highlight", thumb: "border-highlight hover:ring-highlight/20 focus-visible:ring-highlight/30" },
}

/** Past an end, a drag gives less and less, and never more than `most` pixels (a rubber band). */
const rubber = (distance: number, most = 14) => Math.sign(distance) * most * (1 - 1 / (Math.abs(distance) / most / 2 + 1))

/** A light buzz on phones that have one. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

/**
 * The kit's Slider with motion: the same props, range and colors, and more. Held, the thumb grows; dragged past an
 * end, the track stretches after your finger like a rubber band and snaps back on release; pushed past an end with
 * the keyboard, the thumb strains and springs home. A bubble over the thumb shows the value on odometer wheels and
 * leans the way you drag, more the faster you go. Phones buzz at the ends (and on each step of a coarse slider).
 * With reduced motion nothing stretches, leans or strains.
 */
export function Slider(props: SliderProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group renderMessages={motionMessages}>
      <SliderControl {...control} />
    </FieldWrapper>
  )
}

function SliderControl({
  className,
  classNames,
  color = "primary",
  thumbLabels,
  defaultValue,
  value: valueProp,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  orientation = "horizontal",
  valueLabel = "active",
  formatOptions,
  ...rest
}: Omit<SliderProps, keyof FieldOwnProps>) {
  const { "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy, "aria-invalid": _invalid, ...props } =
    useFieldControl(rest)
  const reduced = useReducedMotion()
  const { locale } = useLocale()
  const format = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const [own, setOwn] = React.useState(defaultValue ?? [min])
  const values = valueProp ?? own
  const tone = colors[color]
  const vertical = orientation === "vertical"
  const coarse = (max - min) / step <= 24

  const root = React.useRef<HTMLSpanElement>(null)
  const [active, setActive] = React.useState<number | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [focused, setFocused] = React.useState<number | null>(null)
  const touch = React.useRef(false)
  // How far the dragged end is pulled past the track, and which end.
  const stretch = useMotionValue(0)
  const [pulled, setPulled] = React.useState<-1 | 1>(1)
  const trackScale = useTransform(stretch, (px) => {
    const node = root.current
    const size = node ? (vertical ? node.offsetHeight : node.offsetWidth) : 0
    return size ? 1 + Math.abs(px) / size : 1
  })
  // A push past an end with the keyboard.
  const strainOffset = useMotionValue(0)
  // The active thumb follows both: the stretch while dragged past an end, the strain after a key.
  const shift = useTransform(() => stretch.get() + strainOffset.get())
  // The bubble leans the way the value moves: a target that each change sets and that settles back to upright.
  const lean = useMotionValue(0)
  const tilt = useSpring(lean, { stiffness: 300, damping: 18 })
  const leanTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastChange = React.useRef({ at: 0, value: values[0] ?? min })
  React.useEffect(() => () => clearTimeout(leanTimer.current), [])

  const rtl = () => (root.current ? getComputedStyle(root.current).direction === "rtl" : false)

  function change(next: number[]) {
    const index = next.findIndex((v, i) => v !== values[i])
    if (index >= 0) {
      const v = next[index]!
      // Lean by speed: value units per millisecond, scaled to the track and capped.
      const now = performance.now()
      const last = lastChange.current
      const speed = (v - last.value) / Math.max(16, now - last.at) / (max - min)
      lastChange.current = { at: now, value: v }
      if (!reduced) {
        lean.set(Math.max(-14, Math.min(14, -speed * 4000 * (rtl() ? -1 : 1))))
        clearTimeout(leanTimer.current)
        leanTimer.current = setTimeout(() => lean.set(0), 90)
      }
      if (touch.current && (v === min || v === max)) buzz(12)
      else if (touch.current && coarse) buzz(3)
    }
    if (valueProp === undefined) setOwn(next)
    onValueChange?.(next)
  }

  /** Pushed past an end with a key: the thumb strains that way and springs back. */
  function strain(direction: -1 | 1) {
    if (reduced) return
    animate(strainOffset, 0, { type: "spring", stiffness: 700, damping: 16, velocity: direction * 160 })
  }

  function pointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    if (!dragging || reduced || active === null) return
    const node = root.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const value = values[active]
    let over = 0
    if (vertical) {
      // Up is more on a vertical slider.
      if (value === max && event.clientY < rect.top) over = event.clientY - rect.top
      else if (value === min && event.clientY > rect.bottom) over = event.clientY - rect.bottom
    } else {
      const start = rtl() ? rect.right : rect.left
      const end = rtl() ? rect.left : rect.right
      const forward = (rtl() ? -1 : 1) * (event.clientX - end)
      const backward = (rtl() ? -1 : 1) * (event.clientX - start)
      if (value === max && forward > 0) over = event.clientX - end
      else if (value === min && backward < 0) over = event.clientX - start
    }
    if (over) setPulled(over > 0 ? 1 : -1)
    stretch.set(rubber(over))
  }

  function release() {
    if (!dragging) return
    setDragging(false)
    setActive(null)
    animate(stretch, 0, reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 14 })
  }

  // The track grows from the end that stays put, so it reaches after the pulled end.
  const origin = vertical ? (pulled > 0 ? "bottom" : "top") : pulled > 0 ? "left" : "right"

  return (
    <SliderPrimitive.Root
      ref={root}
      data-slot="slider"
      value={values}
      onValueChange={change}
      min={min}
      max={max}
      step={step}
      orientation={orientation}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      onPointerDown={(event) => {
        touch.current = event.pointerType === "touch"
        setDragging(true)
        // The thumb this press moves is the nearest one, as Radix picks it. Set here, not on focus: a thumb still focused
        // from the last drag doesn't get focus again, and its bubble wouldn't show.
        const box = event.currentTarget.getBoundingClientRect()
        const share = vertical ? (box.bottom - event.clientY) / box.height : rtl() ? (box.right - event.clientX) / box.width : (event.clientX - box.left) / box.width
        const at = min + Math.min(1, Math.max(0, share)) * (max - min)
        let nearest = 0
        values.forEach((v, i) => {
          if (Math.abs(v - at) < Math.abs((values[nearest] ?? v) - at)) nearest = i
        })
        setActive(nearest)
      }}
      onPointerMove={pointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" asChild>
        <motion.span
          className={cn(
            "relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
            tone.track,
            classNames?.track
          )}
          style={{ [vertical ? "scaleY" : "scaleX"]: trackScale, transformOrigin: origin }}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn("absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full", tone.range, classNames?.range)}
          />
        </motion.span>
      </SliderPrimitive.Track>
      {values.map((v, index) => {
        const showLabel = valueLabel === "always" || (valueLabel === "active" && ((dragging && active === index) || focused === index))
        return (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            asChild
            // The thumbs are what's focused, so they carry the name: thumbLabels for a range, else the label or aria-label.
            aria-label={thumbLabels?.[index] ?? (labelledBy ? undefined : ariaLabel)}
            aria-labelledby={thumbLabels?.[index] ? undefined : labelledBy}
            aria-describedby={describedBy}
            onFocus={(event) => {
              setActive(index)
              // From the keyboard, the bubble stays while it's focused; from a drag, only while dragging.
              if (event.currentTarget.matches(":focus-visible")) setFocused(index)
            }}
            onBlur={() => {
              setFocused(null)
              setActive(null)
            }}
            onKeyDown={(event) => {
              const up = vertical ? ["ArrowUp", "PageUp", "End"] : rtl() ? ["ArrowLeft", "PageUp", "End"] : ["ArrowRight", "PageUp", "End", "ArrowUp"]
              const down = vertical ? ["ArrowDown", "PageDown", "Home"] : rtl() ? ["ArrowRight", "PageDown", "Home"] : ["ArrowLeft", "PageDown", "Home", "ArrowDown"]
              touch.current = false
              if (v === max && up.includes(event.key)) strain(vertical ? -1 : rtl() ? -1 : 1)
              else if (v === min && down.includes(event.key)) strain(vertical ? 1 : rtl() ? 1 : -1)
            }}
          >
            <motion.span
              className={cn(
                "relative block size-4 shrink-0 rounded-full border bg-background shadow-sm transition-[color,box-shadow] duration-(--duration-fast) hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
                tone.thumb,
                classNames?.thumb
              )}
              style={{ [vertical ? "y" : "x"]: active === index ? shift : 0 }}
              animate={{ scale: dragging && active === index && !reduced ? 1.25 : 1 }}
              transition={spring.press}
            >
              <AnimatePresence>
                {showLabel && (
                  <motion.span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute z-10 flex origin-bottom items-center rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-background tabular-nums shadow-md",
                      vertical ? "start-full ms-2.5 top-1/2 -translate-y-1/2 origin-left" : "bottom-full left-1/2 mb-2.5 -translate-x-1/2"
                    )}
                    style={{ rotate: vertical ? 0 : tilt }}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: reduced ? 1 : 0.8, transition: { duration: duration.fast, ease: ease.exit } }}
                    transition={reduced ? { duration: duration.fast } : spring.appear}
                  >
                    <Odometer value={v} format={format} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.span>
          </SliderPrimitive.Thumb>
        )
      })}
    </SliderPrimitive.Root>
  )
}
