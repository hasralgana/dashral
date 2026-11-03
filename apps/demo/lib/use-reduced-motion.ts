"use client"

import { useSyncExternalStore } from "react"
import { reducedMotion } from "@dashral/ui/lib/motion"

function subscribe(onChange: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
  mql.addEventListener("change", onChange)
  // The customizer's "Reduce motion" sets data-motion on <html>.
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] })
  return () => {
    mql.removeEventListener("change", onChange)
    observer.disconnect()
  }
}

/** True when the OS asks for less motion, or "Reduce motion" is on in the customizer: charts skip their entry animation. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, reducedMotion, () => false)
}
