"use client"

import { useLayoutEffect } from "react"

import { applyTemplate } from "@/lib/theme-settings"
import { baseTemplate, type Template } from "@/lib/templates"

/**
 * Puts <html> in a template while its pages are open (its data-template and its own customizer settings), and back
 * in the base template's (the one at "/") when you leave. The <head> script does the same on a fresh load, before first paint.
 */
export function TemplateScope({ template }: { template: Template }) {
  useLayoutEffect(() => {
    applyTemplate(template)
    return () => applyTemplate(baseTemplate)
  }, [template])
  return null
}
