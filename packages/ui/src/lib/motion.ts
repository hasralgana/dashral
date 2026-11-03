import * as React from "react"
import type { CSSProperties } from "react"

// Entrance motion shared by dashboards: things on a page arriving one after another. Each class is a full Tailwind
// class list; give each item its place with `stagger(i)`. With reduced motion everything is simply there.

/** A row, list item or card rising a little as it fades in. */
export const enterMotion =
  "animate-in fade-in-0 fill-mode-both duration-(--duration-considered) ease-enter slide-in-from-bottom-1 motion-reduce:animate-none"

/** A horizontal bar growing in from the start (the left, or the right in Arabic). Its track needs `overflow-hidden`. */
export const growMotion =
  "animate-in fill-mode-both duration-(--duration-considered) ease-enter slide-in-from-start-full motion-reduce:animate-none"

/** A vertical bar growing up from the bottom. Its track needs `overflow-hidden`. */
export const riseMotion =
  "animate-in fill-mode-both duration-(--duration-considered) ease-enter slide-in-from-bottom-full motion-reduce:animate-none"

/**
 * The delay for the i-th item: `style={stagger(i)}`. Long lists stop adding delay after `max` items, so the last
 * row never waits long.
 */
export function stagger(i: number, step = 45, max = 12): CSSProperties {
  return { animationDelay: `${Math.min(i, max) * step}ms` }
}

/**
 * Whether to keep still: the OS asks for less motion, or the app turned motion down with data-motion="reduce" on
 * <html>. The same two signals the motion-reduce: and motion-safe: classes follow.
 */
export function reducedMotion() {
  if (typeof window === "undefined") return false
  return document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Whether the page has hydrated: after that, every mount is a client navigation. */
let pageHydrated = false

/** A duration token in milliseconds. Browsers may hand it back as "480ms" or, minified, ".48s". */
export function cssDuration(name: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return fallback
  return raw.endsWith("ms") ? n : raw.endsWith("s") ? n * 1000 : n
}

/**
 * Counts to `value` from the number on screen when it changes (and from 0 on mount if asked); never with reduced
 * motion. Starting from what's shown — not a remembered value — survives React running effects twice in development
 * and a value changing again mid-count. Used by MetricCard; use it for any number that should count.
 */
export function useCountTo(value: number, fromZero = false) {
  const [shown, setShown] = React.useState(value)
  const onScreen = React.useRef(value)

  // Counting from 0 on mount: set 0 before the browser paints, so there's no flash of the final number. On the
  // first load the server's number is already on screen; only pull it back to 0 while the page is still arriving.
  React.useLayoutEffect(() => {
    if (!fromZero) return
    const late = !pageHydrated && performance.now() > 900
    pageHydrated = true
    if (late || reducedMotion()) return
    onScreen.current = 0
    setShown(0)
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const start = onScreen.current
    if (start === value || reducedMotion()) {
      onScreen.current = value
      setShown(value)
      return
    }
    // Count in the values' own precision: whole numbers stay whole on the way.
    const decimals = Math.max(...[start, value].map((n) => (String(n).split(".")[1] ?? "").length))
    // As long as the theme's --duration-considered (480ms), with a little more so the eye can follow the count.
    const duration = cssDuration("--duration-considered", 480) * 1.5
    const began = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      // The first frame's time can be a hair before `began`: keep progress within 0…1.
      const t = Math.min(1, Math.max(0, (now - began) / duration))
      const eased = 1 - (1 - t) ** 3
      const next = Number((start + (value - start) * eased).toFixed(decimals))
      onScreen.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [value])
  return shown
}
