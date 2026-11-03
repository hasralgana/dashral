// The Pro features this edition shows as locked; each one's title, description and highlights are in
// messages/<locale>.json → pro.features.<slug>.

import { dashral } from "@/lib/site"

export const proFeatures = ["analytics", "ecommerce", "crm", "services", "kanban", "calendar", "chat"] as const

export type ProFeature = (typeof proFeatures)[number]

export function getProFeature(slug: string) {
  return proFeatures.find((feature) => feature === slug)
}

/**
 * Where a link to a Pro feature goes: its upgrade page while it's locked here, its own page (`path` within it) once it
 * has shipped — so the same link works in the free and Pro editions. `featureHref("ecommerce", "/orders")`. The
 * upgrade pages only exist while the app points to Dashral (lib/site.ts → dashral.show); otherwise it's home.
 */
export function featureHref(slug: string, path = "") {
  if (!getProFeature(slug)) return `/${slug}${path}`
  return dashral.show ? `/pro/${slug}` : "/"
}
