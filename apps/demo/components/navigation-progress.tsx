"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cssDuration, reducedMotion } from "@dashral/ui/lib/motion"

import { leavesThisPage, navigationStartEvent } from "@/lib/navigation-progress"

/** A page that arrives sooner than this never shows the line: no flash on a page that was already fetched. */
const showAfter = 100
/** A page change that never lands (a redirect back to the same page, a dropped request) lets go of the line. */
const giveUpAfter = 20_000

/**
 * The line along the top of the window while the next page is on its way: it sets off the moment a link is clicked,
 * runs fast then slows as it waits, and fills and fades once the page is there (or its loading.tsx is). The router
 * starts it for every page change (instrumentation-client.ts). It wears the primary color's gradient and runs from
 * the right in a right-to-left language; with reduced motion the whole line fades in and out, still. It's
 * decoration: Next.js already announces the new page to screen readers.
 */
export function NavigationProgress() {
  const line = useRef<HTMLDivElement>(null)
  const run = useRef<{ wait?: number; giveUp?: number; grow?: Animation; busy: boolean }>({ busy: false })
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    const state = run.current

    const start = () => {
      if (state.busy) return
      state.busy = true
      state.giveUp = window.setTimeout(finish, giveUpAfter)
      state.wait = window.setTimeout(() => {
        const el = line.current
        if (!el) return
        el.getAnimations().forEach((animation) => animation.cancel())
        const still = reducedMotion()
        // Most of the way in the first second, then a crawl: it never reaches the end before the page does.
        state.grow = el.animate(
          still
            ? [{ transform: "scaleX(1)", opacity: 0 }, { transform: "scaleX(1)", opacity: 1 }]
            : [{ transform: "scaleX(0)", opacity: 1 }, { transform: "scaleX(0.94)", opacity: 1 }],
          still ? { duration: 160, fill: "forwards" } : { duration: 14_000, easing: "cubic-bezier(0.05, 0.75, 0.1, 1)", fill: "forwards" },
        )
      }, showAfter)
    }

    const finish = () => {
      if (!state.busy) return
      state.busy = false
      window.clearTimeout(state.wait)
      window.clearTimeout(state.giveUp)
      const el = line.current
      const grow = state.grow
      state.grow = undefined
      if (!el || !grow) return
      // From wherever it has got to: fill the rest, then fade.
      const style = getComputedStyle(el)
      const reached = new DOMMatrixReadOnly(style.transform).a
      const duration = cssDuration("--duration-standard", 240)
      const fill = el.animate([{ transform: `scaleX(${reached})`, opacity: 1 }, { transform: "scaleX(1)", opacity: 1 }], {
        duration,
        easing: style.getPropertyValue("--ease-standard").trim() || "ease-out",
        fill: "forwards",
      })
      grow.cancel()
      fill.onfinish = () => {
        const fade = el.animate([{ transform: "scaleX(1)", opacity: 1 }, { transform: "scaleX(1)", opacity: 0 }], { duration, easing: "ease-out", fill: "forwards" })
        fill.cancel()
        fade.onfinish = () => fade.cancel()
      }
    }

    const onStart = (event: Event) => {
      if (leavesThisPage((event as CustomEvent<string>).detail)) start()
    }

    window.addEventListener(navigationStartEvent, onStart)
    // This effect runs again when the address changes: the page is there.
    finish()
    return () => window.removeEventListener(navigationStartEvent, onStart)
  }, [pathname, search])

  return (
    <div
      ref={line}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-linear-to-r from-(--gradient-from) via-(--gradient-via) to-(--gradient-to) opacity-0 rtl:origin-right rtl:bg-linear-to-l"
    />
  )
}
