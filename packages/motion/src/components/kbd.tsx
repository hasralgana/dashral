"use client"

import * as React from "react"
import { motion } from "motion/react"
import { describeKey, kbdKeyClass, useAppleKeyboard, type KbdProps as KitKbdProps } from "@dashral/ui/components/kbd"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { spring } from "../lib/tokens"

export type KbdProps = KitKbdProps & {
  /** The keys press in as the real ones are held on the keyboard. On by default. */
  listen?: boolean
}

/** What event.key a named key is, for the ones that aren't modifiers. */
const eventKeys: Record<string, string> = { enter: "Enter", esc: "Escape", tab: "Tab", backspace: "Backspace", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }

/** Whether a key of the shortcut is held, from the event's modifier flags and the other keys down. */
function isHeld(key: string, apple: boolean, flags: { meta: boolean; ctrl: boolean; alt: boolean; shift: boolean }, down: Set<string>) {
  switch (key.toLowerCase()) {
    case "mod":
      return apple ? flags.meta : flags.ctrl
    case "cmd":
      return flags.meta
    case "ctrl":
      return flags.ctrl
    case "alt":
      return flags.alt
    case "shift":
      return flags.shift
    default:
      return down.has((eventKeys[key.toLowerCase()] ?? key).toLowerCase())
  }
}

/**
 * The kit's Kbd with motion: the same keys, sizes and props, and the keys answer the keyboard. Hold ⌘ and K and those
 * caps press in, springing back up as you let go, so a shortcut shown on the page shows itself working. listen={false}
 * keeps them still. With reduced motion they only change color.
 */
export function Kbd({ keys, children, size = "default", listen = true, className, ...props }: KbdProps) {
  const apple = useAppleKeyboard()
  const reduced = useReducedMotion()
  const [held, setHeld] = React.useState<boolean[]>([])

  React.useEffect(() => {
    if (!listen || !keys) return
    const down = new Set<string>()
    const update = (event: KeyboardEvent) => {
      const flags = { meta: event.metaKey, ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey }
      const next = keys.map((key) => isHeld(key, apple, flags, down))
      setHeld((was) => (was.length === next.length && was.every((v, i) => v === next[i]) ? was : next))
    }
    const press = (event: KeyboardEvent) => {
      down.add(event.key.toLowerCase())
      update(event)
    }
    const release = (event: KeyboardEvent) => {
      down.delete(event.key.toLowerCase())
      // With ⌘ held, the browser never sends the other key's keyup: letting go of ⌘ lets go of them all.
      if (event.key === "Meta") down.clear()
      update(event)
    }
    const reset = () => {
      down.clear()
      setHeld([])
    }
    window.addEventListener("keydown", press)
    window.addEventListener("keyup", release)
    window.addEventListener("blur", reset)
    return () => {
      window.removeEventListener("keydown", press)
      window.removeEventListener("keyup", release)
      window.removeEventListener("blur", reset)
    }
  }, [listen, keys, apple])

  const cap = (label: React.ReactNode, pressed: boolean, i: number) => (
    <motion.kbd
      key={i}
      aria-hidden={keys ? true : undefined}
      data-pressed={pressed || undefined}
      className={cn(kbdKeyClass(size), "transition-colors data-pressed:border-ring/50 data-pressed:bg-accent data-pressed:text-foreground")}
      // Pressed, it sinks a little: down by its bottom edge, a touch smaller.
      animate={pressed && !reduced ? { y: 1.5, scale: 0.94 } : { y: 0, scale: 1 }}
      transition={spring.press}
    >
      {label}
    </motion.kbd>
  )

  if (!keys)
    return (
      <kbd data-slot="kbd" className={cn("inline-flex", className)} {...props}>
        {cap(children, false, 0)}
      </kbd>
    )
  const described = keys.map((key) => describeKey(key, apple))
  return (
    // Nested kbd for a combination, as HTML has it; read out as words ("Command K"), not symbols.
    <kbd data-slot="kbd" aria-label={described.map((key) => key.name).join(" ")} className={cn("inline-flex items-center gap-1", className)} {...props}>
      {described.map((key, i) => cap(key.label, held[i] ?? false, i))}
    </kbd>
  )
}
