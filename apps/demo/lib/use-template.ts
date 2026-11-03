"use client"

import { usePathname } from "next/navigation"

import { templateHref, templateOf } from "./templates"

/** The template of the page you're on. */
export function useTemplate() {
  return templateOf(usePathname())
}

/** Writes Classic links for the template you're in: `href("/settings")` is `/inset/settings` in Inset. */
export function useTemplateHref() {
  const template = useTemplate()
  return (href: string) => templateHref(template, href)
}
