"use client"

// The hover highlight motion menus, selects, tabs and segmented controls share: one pill, gliding without a blink.
// It glides from item to item without going out between them. Its opacity is kept here, outside the pill, so moving to
// the next item (a new pill there, by layoutId) doesn't start it from nothing; and letting go of an item waits a
// moment, so passing from one to the next (or a menu moving focus to itself in between) never blinks it out.

import { useCallback, useEffect, useRef, useState } from "react"
import { animate, useMotionValue } from "motion/react"

import { duration } from "./tokens"

export function useHoverPill<K>(reduced: boolean) {
  const [hot, setHot] = useState<K | null>(null)
  const opacity = useMotionValue(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  /** The pointer or the keys are on this item: the pill goes there (gliding, if it was showing). */
  const enter = useCallback(
    (key: K) => {
      clearTimeout(timer.current)
      setHot(key)
      animate(opacity, 1, { duration: reduced ? 0 : duration.fast })
    },
    [opacity, reduced]
  )

  /** Off an item: unless another takes the pill straight away, it fades where it is, then goes. */
  const leave = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      animate(opacity, 0, { duration: reduced ? 0 : duration.fast, onComplete: () => setHot(null) })
    }, 60)
  }, [opacity, reduced])

  /** At once, as when the list closes. */
  const clear = useCallback(() => {
    clearTimeout(timer.current)
    opacity.jump(0)
    setHot(null)
  }, [opacity])

  return { hot, enter, leave, clear, opacity }
}
