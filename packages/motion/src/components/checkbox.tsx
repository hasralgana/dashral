"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { motion } from "motion/react"
import { ChoiceField, joinIds } from "@dashral/ui/components/field"
import type { CheckboxProps, ControlColor } from "@dashral/ui/components/checkbox"
import { cn } from "@dashral/ui/lib/utils"

import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { CheckboxProps } from "@dashral/ui/components/checkbox"

type CheckedState = boolean | "indeterminate"

// Ticked: filled with the color, as the kit's Checkbox has it. Every class is written out in full so Tailwind finds it.
const solidColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
  neutral: "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=indeterminate]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background",
  info: "data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=checked]:text-info-foreground data-[state=indeterminate]:border-info data-[state=indeterminate]:bg-info data-[state=indeterminate]:text-info-foreground",
  success: "data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground data-[state=indeterminate]:border-success data-[state=indeterminate]:bg-success data-[state=indeterminate]:text-success-foreground",
  warning: "data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=checked]:text-warning-foreground data-[state=indeterminate]:border-warning data-[state=indeterminate]:bg-warning data-[state=indeterminate]:text-warning-foreground",
  destructive: "data-[state=checked]:border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:border-destructive data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground",
  highlight: "data-[state=checked]:border-highlight data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground data-[state=indeterminate]:border-highlight data-[state=indeterminate]:bg-highlight data-[state=indeterminate]:text-highlight-foreground",
}

// Ticked: a colored border and mark, no fill. Every class is written out in full so Tailwind finds it.
const outlineColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:border-primary data-[state=checked]:text-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary",
  neutral: "data-[state=checked]:border-foreground data-[state=checked]:text-foreground data-[state=indeterminate]:border-foreground data-[state=indeterminate]:text-foreground",
  info: "data-[state=checked]:border-info data-[state=checked]:text-info data-[state=indeterminate]:border-info data-[state=indeterminate]:text-info",
  success: "data-[state=checked]:border-success data-[state=checked]:text-success data-[state=indeterminate]:border-success data-[state=indeterminate]:text-success",
  warning: "data-[state=checked]:border-warning data-[state=checked]:text-warning data-[state=indeterminate]:border-warning data-[state=indeterminate]:text-warning",
  destructive: "data-[state=checked]:border-destructive data-[state=checked]:text-destructive data-[state=indeterminate]:border-destructive data-[state=indeterminate]:text-destructive",
  highlight: "data-[state=checked]:border-highlight data-[state=checked]:text-highlight data-[state=indeterminate]:border-highlight data-[state=indeterminate]:text-highlight",
}

/**
 * The kit's Checkbox with motion: the same label, description, colors, variants and props. The tick draws itself
 * along its stroke as it's checked and draws back out as it's cleared; "indeterminate" draws its dash from the middle
 * out; the box presses in on a spring while held. Press one and sweep the pointer over others, and each takes the
 * state the first is going to, ticks drawing in one after another down the list. With reduced motion the mark only fades.
 */
export function Checkbox({ label, description, error, id, disabled, labelPosition, color = "primary", variant = "solid", className, classNames, ...props }: CheckboxProps) {
  return (
    <ChoiceField renderMessages={motionMessages} {...{ label, description, error, id, disabled, labelPosition, classNames }} leading="leading-4">
      {(control) => (
        <CheckboxControl
          {...props}
          {...control}
          disabled={disabled}
          aria-describedby={joinIds(props["aria-describedby"], control["aria-describedby"])}
          aria-invalid={props["aria-invalid"] ?? control["aria-invalid"]}
          className={cn((variant === "outline" ? outlineColors : solidColors)[color], className, classNames?.checkbox)}
        />
      )}
    </ChoiceField>
  )
}

/**
 * A sweep: press a checkbox and, still holding, run the pointer over others; each one it passes takes the state the
 * first is going to (all ticked, or all cleared), as in a spreadsheet or a mail list. One at a time on a page, so it
 * lives here rather than in any one checkbox.
 */
let sweep: { target: boolean } | null = null

function startSweep(target: boolean) {
  sweep = { target }
  // Running over labels mustn't select their text along the way.
  const select = document.body.style.userSelect
  document.body.style.userSelect = "none"
  const end = () => {
    sweep = null
    document.body.style.userSelect = select
    window.removeEventListener("pointerup", end)
    window.removeEventListener("pointercancel", end)
  }
  window.addEventListener("pointerup", end)
  window.addEventListener("pointercancel", end)
}

function CheckboxControl({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onClick,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState<CheckedState>(defaultChecked ?? false)
  const state = checked ?? own
  const set = (next: CheckedState) => {
    if (checked === undefined) setOwn(next)
    onCheckedChange?.(next)
  }
  // Set by a sweep: the click this checkbox may still get (the press began here) isn't a second toggle.
  const swept = React.useRef(false)
  const pressedHere = React.useRef(false)
  const takeSweep = (event: React.PointerEvent) => {
    if (!sweep || !(event.buttons & 1) || props.disabled || swept.current) return
    swept.current = true
    if (state !== sweep.target) set(sweep.target)
  }

  // Drawing in eases out as it arrives; drawing back out is quicker and gathers speed, like the kit's enter and exit.
  const draw = (on: boolean) =>
    reduced
      ? { opacity: on ? 1 : 0, transition: { duration: duration.fast } }
      : {
          pathLength: on ? 1 : 0,
          // A path drawn to zero still shows its round cap as a dot, so it fades at the very end.
          opacity: on ? 1 : 0,
          transition: on
            ? { pathLength: { duration: duration.standard, ease: ease.enter }, opacity: { duration: 0.01 } }
            : { pathLength: { duration: duration.fast, ease: ease.exit }, opacity: { duration: 0.01, delay: duration.fast } },
        }

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      checked={state}
      onCheckedChange={set}
      asChild
      {...props}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        swept.current = false
        // A mouse or pen sweep (a finger's drag scrolls the page instead).
        if (event.button === 0 && event.pointerType !== "touch" && !props.disabled) {
          pressedHere.current = true
          startSweep(state !== true)
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        // Leaving the first one with the button down starts the sweep: it switches now, not on a click it won't get.
        if (pressedHere.current) {
          pressedHere.current = false
          takeSweep(event)
        }
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (!pressedHere.current) {
          swept.current = false
          takeSweep(event)
        }
      }}
      onClick={(event) => {
        pressedHere.current = false
        if (swept.current) {
          swept.current = false
          event.preventDefault()
        }
        onClick?.(event)
      }}
    >
      <motion.button
        whileTap={reduced || props.disabled ? undefined : { scale: 0.85 }}
        transition={spring.press}
        className={cn(
          // Colors change in CSS; transform is the press's, so CSS mustn't ease it too.
          "peer group size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
          className
        )}
      >
        {/* Always mounted, so clearing can draw the mark back out: Radix would take it away at once. */}
        <CheckboxPrimitive.Indicator forceMount data-slot="checkbox-indicator" className="flex items-center justify-center text-current">
          <svg viewBox="0 0 24 24" aria-hidden className="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <motion.path d="M4 12l5 5L20 6" initial={false} animate={draw(state === true)} />
            {/* The dash starts from its middle: two halves drawn outward. */}
            <motion.path d="M12 12h7" initial={false} animate={draw(state === "indeterminate")} />
            <motion.path d="M12 12H5" initial={false} animate={draw(state === "indeterminate")} />
          </svg>
        </CheckboxPrimitive.Indicator>
      </motion.button>
    </CheckboxPrimitive.Root>
  )
}
