"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { animate, motion, useMotionValue } from "motion/react"
import { ChoiceField, joinIds } from "@dashral/ui/components/field"
import type { SwitchProps } from "@dashral/ui/components/switch"
import { useLocale } from "@dashral/ui/lib/locale"
import { cn } from "@dashral/ui/lib/utils"

import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, spring } from "../lib/tokens"

export type { SwitchProps } from "@dashral/ui/components/switch"

type ControlColor = NonNullable<SwitchProps["color"]>

// The track when on, as the kit's Switch has it. Every class is written out in full so Tailwind finds it.
const trackColors: Record<ControlColor, string> = {
  primary: "data-[state=checked]:bg-primary",
  neutral: "data-[state=checked]:bg-foreground",
  info: "data-[state=checked]:bg-info",
  success: "data-[state=checked]:bg-success",
  warning: "data-[state=checked]:bg-warning",
  destructive: "data-[state=checked]:bg-destructive",
  highlight: "data-[state=checked]:bg-highlight",
}

/** How far the thumb travels from off to on (a 36px track, 2px padding, a 16px thumb). */
const travel = 16

/** Past an end, a drag gives less and less, and never more than `most` pixels (a rubber band). */
const rubber = (distance: number, most = 5) => Math.sign(distance) * most * (1 - 1 / (Math.abs(distance) / most / 2 + 1))

/** A light buzz on phones that have one. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern)
}

/**
 * The kit's Switch with motion: the same label, description, colors and props. The thumb springs across with a touch
 * of overshoot, and stretches toward where it's going while you hold it, like a finger pushing it, the track giving
 * a little under it. Drag the thumb and it follows: past the middle it goes over when you let go, short of it it
 * springs back, and pulled past an end it holds back like a rubber band. Phones buzz as it switches and as a drag
 * crosses the middle. With reduced motion it just moves.
 */
export function Switch({ label, description, error, id, disabled, labelPosition, color = "primary", className, classNames, ...props }: SwitchProps) {
  return (
    <ChoiceField renderMessages={motionMessages} {...{ label, description, error, id, disabled, labelPosition, classNames }} leading="leading-5">
      {(control) => (
        <SwitchControl
          {...props}
          {...control}
          color={color}
          disabled={disabled}
          aria-describedby={joinIds(props["aria-describedby"], control["aria-describedby"])}
          aria-invalid={props["aria-invalid"] ?? control["aria-invalid"]}
          className={cn(trackColors[color], className, classNames?.switch)}
        />
      )}
    </ChoiceField>
  )
}

function SwitchControl({
  className,
  color,
  checked,
  defaultChecked,
  onCheckedChange,
  onPointerDown,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "color"> & { color: ControlColor }) {
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultChecked ?? false)
  const on = checked ?? own
  const [held, setHeld] = React.useState(false)
  const touch = React.useRef(false)
  // Right to left, "on" is the left end.
  const sign = useLocale().dir === "rtl" ? -1 : 1

  // The thumb's one position, in pixels from the off end: every move (a switch, a hold, a drag) goes through it, so
  // nothing else ever places the thumb. Held, a thumb at the on end steps back by what it grows, to stay in the track.
  const rest = (state: boolean, isHeld: boolean) => ((state ? travel : 0) - (state && isHeld && !reduced ? 4 : 0)) * sign
  const x = useMotionValue(rest(on, false))
  const drag = React.useRef<{ pointer: number; x: number; active: boolean; over: boolean } | null>(null)
  const dragged = React.useRef(false)

  // To its place whenever the state or the hold changes, unless a finger is moving it.
  React.useEffect(() => {
    if (drag.current?.active) return
    const target = ((on ? travel : 0) - (on && held && !reduced ? 4 : 0)) * sign
    if (reduced) x.jump(target)
    else {
      const controls = animate(x, target, spring.move)
      return () => controls.stop()
    }
  }, [on, held, reduced, sign, x])

  const toggle = (next: boolean) => {
    if (touch.current) buzz(8)
    if (checked === undefined) setOwn(next)
    onCheckedChange?.(next)
  }

  /** Ends a drag: past the middle it switches (and the thumb springs on from where it is), short of it it springs back. */
  function finish(state: NonNullable<typeof drag.current>) {
    drag.current = null
    setHeld(false)
    if (!state.active) return
    // The click that follows a drag isn't a toggle of its own.
    dragged.current = true
    if (state.over) toggle(!on)
    else animate(x, rest(on, false), spring.move)
  }

  function dragMove(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId || reduced) return
    // The button was let go somewhere we didn't hear: end here rather than follow a pointer that isn't pressing.
    if (event.buttons === 0) return finish(state)
    const dx = (event.clientX - state.x) * sign
    if (!state.active) {
      if (Math.abs(dx) < 3) return
      state.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    // Toward the other side it follows freely up to the end; the other way, or past the end, it holds back.
    const toward = on ? -dx : dx
    const followed = toward < 0 ? rubber(toward) : toward > travel ? travel + rubber(toward - travel) : toward
    const over = toward > travel / 2
    if (over !== state.over) {
      state.over = over
      if (touch.current) buzz(4)
    }
    x.set(rest(on, true) + (on ? -followed : followed) * sign)
  }

  function dragEnd(event: React.PointerEvent<HTMLButtonElement>) {
    const state = drag.current
    if (state && state.pointer === event.pointerId) finish(state)
  }

  // Let go anywhere (the pointer may leave the switch before a drag starts): the hold and any drag end.
  React.useEffect(() => {
    if (!held) return
    const release = () => {
      if (drag.current) finish(drag.current)
      else setHeld(false)
    }
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
    }
  })

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-color={color}
      checked={on}
      data-held={held || undefined}
      onCheckedChange={toggle}
      onPointerDown={(event) => {
        touch.current = event.pointerType === "touch"
        if (!props.disabled && event.button === 0) {
          setHeld(true)
          drag.current = { pointer: event.pointerId, x: event.clientX, active: false, over: false }
        }
        onPointerDown?.(event)
      }}
      onPointerMove={dragMove}
      onPointerUp={dragEnd}
      onPointerCancel={dragEnd}
      onLostPointerCapture={dragEnd}
      onClick={(event) => {
        if (dragged.current) {
          dragged.current = false
          event.preventDefault()
        } else if (event.detail === 0) touch.current = false
        onClick?.(event)
      }}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 touch-none items-center justify-start rounded-full border border-transparent p-0.5 shadow-xs transition-[color,background-color,scale] duration-(--duration-fast) outline-none data-held:scale-95 motion-reduce:data-held:scale-100 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          data-slot="switch-thumb"
          animate={{ width: held && !reduced ? 20 : 16 }}
          transition={spring.move}
          style={{ x, transition: `background-color ${duration.fast}s` }}
          className={cn(
            "pointer-events-none block h-4 shrink-0 rounded-full bg-white shadow-sm",
            // A white thumb would vanish on the light track neutral has in dark mode.
            color === "neutral" && on && "bg-background"
          )}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}
