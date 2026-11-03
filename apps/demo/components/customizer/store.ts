"use client"

import { useSyncExternalStore } from "react"

// Whether the customizer is open, kept outside React so it stays open from page to page, and from Classic to Inset
// (each template's layout mounts its own panel). Closed on a fresh load.
let open = false
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setCustomizerOpen(next: boolean) {
  if (next === open) return
  open = next
  for (const listener of listeners) listener()
}

export function useCustomizerOpen() {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false
  )
}

/** The panel's id, for the header button's aria-controls and for moving focus into it. */
export const CUSTOMIZER_ID = "theme-customizer"
