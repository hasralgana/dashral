"use client"

import { useLayoutEffect, useRef, useState } from "react"

export type IndicatorRect = { x: number; y: number; width: number; height: number }

// Shared by the apps (the website and the dashboards): sliding highlights, underlines and markers.

/**
 * Where the active element (`selector`, e.g. "[aria-current=page]") sits inside the container, so an indicator can
 * slide to it. Re-measures when the container resizes or anything inside it changes (a new page, a toggled option).
 * Null when nothing matches.
 */
export function useIndicator<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null)
  const [rect, setRect] = useState<IndicatorRect | null>(null)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return
    const measure = () => {
      // The first match that shows: not hidden (display: none) and not in a closed section (inert).
      const active = [...container.querySelectorAll<HTMLElement>(selector)].find((el) => el.offsetParent !== null && !el.closest("[inert]"))
      if (!active) return setRect(null)
      const box = container.getBoundingClientRect()
      const item = active.getBoundingClientRect()
      // Plus the container's scroll, for indicators inside something that scrolls (a long menu), and minus its border:
      // the indicator is placed from inside the border (top-0 left-0), the boxes are measured from outside it.
      const next = {
        x: item.left - box.left + container.scrollLeft - container.clientLeft,
        y: item.top - box.top + container.scrollTop - container.clientTop,
        width: item.width,
        height: item.height,
      }
      setRect((current) =>
        current && current.x === next.x && current.y === next.y && current.width === next.width && current.height === next.height ? current : next
      )
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(container)
    const changes = new MutationObserver(measure)
    changes.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-current", "aria-pressed", "aria-checked", "data-state", "data-nav-current", "hidden", "inert"] })
    return () => {
      resize.disconnect()
      changes.disconnect()
    }
  }, [selector])

  return [ref, rect] as const
}

/**
 * Classes for the sliding indicator itself: it glides to its new place (--duration-considered, --ease-standard: off
 * quickly, then a long, soft stop, no bounce), or just moves with reduced motion. Every sliding highlight uses it.
 */
export const indicatorMotion =
  "pointer-events-none absolute top-0 left-0 transition-[translate,width,height] duration-(--duration-considered) ease-standard motion-reduce:transition-none"
