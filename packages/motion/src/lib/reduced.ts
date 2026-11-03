import { useSyncExternalStore } from "react"
import { reducedMotion } from "@dashral/ui/lib/motion"

// Whether to keep still, as the kit decides it: the OS asks for less motion, or the app turned motion down with
// data-motion="reduce" on <html> (the dashboards' setting). motion/react's own hook hears only the first.

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)")
  query.addEventListener("change", onChange)
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] })
  return () => {
    query.removeEventListener("change", onChange)
    observer.disconnect()
  }
}

/** True while motion should stay still; false on the server, so the first paint matches. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, reducedMotion, () => false)
}
