"use client"

// Where menus, dialogs, popovers and tooltips put themselves: document.body unless something says otherwise. A themed
// part of a page (a preview in another look, a section with its own theme) gives its own element, carrying the same
// theme attributes, so what opens from inside it wears its look while still opening over the whole page.

import * as React from "react"

const PortalContainerContext = React.createContext<HTMLElement | null>(null)

/** Everything inside opens its overlays in `container` instead of document.body. */
export function PortalContainer({ container, children }: { container: HTMLElement | null; children: React.ReactNode }) {
  return <PortalContainerContext value={container}>{children}</PortalContainerContext>
}

/** The element overlays open in here, or undefined for document.body (as a Radix Portal's container takes it). */
export function usePortalContainer() {
  return React.useContext(PortalContainerContext) ?? undefined
}
