// Theme customizer settings. Applied as data attributes on <html> and styled in @dashral/ui/themes.css. Each template
// keeps its own, starting from its look in lib/templates.ts: Classic starts in blue, Inset in Dashral's ink with Geist text.

import { themeOptions, type ThemeLook } from "@dashral/ui/lib/themes"

import { baseTemplate, templateHome, templateInfo, templates, type Template } from "./templates"

// The choices of each setting live in the kit, beside the styles they pick (@dashral/ui/themes.css).
export { themeOptions }

/** A look (@dashral/ui/lib/themes), and the reader's own monochrome and reduced motion. */
export type ThemeSettings = ThemeLook & {
  mono: boolean
  /** data-motion="reduce": the kit's reduced motion, whatever the OS says. */
  reduceMotion: boolean
}

export const defaultThemeSettings: ThemeSettings = {
  primary: "black",
  light: "neutral",
  dark: "default",
  card: "default",
  radius: "lg",
  font: "inter",
  mono: false,
  reduceMotion: false,
}

export const THEME_STORAGE_KEY = "dashral-theme"

/** Each template's defaults: these, with its own look over them (lib/templates.ts: Inset is black with Geist text). */
export const templateThemeDefaults = Object.fromEntries(
  templates.map((template) => [template, { ...defaultThemeSettings, ...templateInfo[template].theme }])
) as Record<Template, ThemeSettings>

/** Where a template's settings are saved: the template at "/" keeps the original key. */
export function themeStorageKey(template: Template) {
  return template === baseTemplate ? THEME_STORAGE_KEY : `${THEME_STORAGE_KEY}-${template}`
}

// The default value of each setting maps to "no attribute", so the base tokens apply.
const attributeDefaults = { primary: "black", light: "neutral", dark: "default", card: "default", radius: "lg", font: "inter" } as const

export function applyThemeSettings(settings: ThemeSettings) {
  const root = document.documentElement
  for (const key of Object.keys(attributeDefaults) as (keyof typeof attributeDefaults)[]) {
    const value = settings[key]
    if (value === attributeDefaults[key]) root.removeAttribute(`data-${key}`)
    else root.setAttribute(`data-${key}`, value)
  }
  root.toggleAttribute("data-mono", settings.mono)
  if (settings.reduceMotion) root.setAttribute("data-motion", "reduce")
  else root.removeAttribute("data-motion")
}

/** A template's saved settings, keeping only values that are still options: one that was removed falls back. */
export function readThemeSettings(template: Template): ThemeSettings {
  const defaults = templateThemeDefaults[template]
  try {
    const saved = JSON.parse(localStorage.getItem(themeStorageKey(template)) ?? "{}")
    const settings = { ...defaults, mono: saved.mono === true, reduceMotion: saved.reduceMotion === true }
    for (const key of Object.keys(attributeDefaults) as (keyof typeof attributeDefaults)[]) {
      if (themeOptions[key].some((option) => option.value === saved[key])) Object.assign(settings, { [key]: saved[key] })
    }
    return settings
  } catch {
    return defaults
  }
}

export function saveThemeSettings(template: Template, settings: ThemeSettings) {
  applyThemeSettings(settings)
  try {
    localStorage.setItem(themeStorageKey(template), JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (private mode); the change still applies to this page.
  }
}

/** Puts <html> in a template: its data-template and its saved settings. */
export function applyTemplate(template: Template) {
  document.documentElement.setAttribute("data-template", template)
  applyThemeSettings(readThemeSettings(template))
}

/**
 * Inline script for <head>: puts the page in its template (the same test as lib/templates.ts → templateOf) with that
 * template's saved settings, over its defaults, before first paint, so it never flashes the wrong theme. Kept
 * dependency-free on purpose: it runs before React.
 */
export const themeSettingsScript = `(function(){try{var r=document.documentElement;var h=${JSON.stringify(templateHome)};var b=${JSON.stringify(
  baseTemplate
)};var t=b;for(var x in h){var p=h[x];if(p!=="/"&&(location.pathname===p||location.pathname.indexOf(p+"/")===0))t=x}r.setAttribute("data-template",t);var k=t===b?${JSON.stringify(
  THEME_STORAGE_KEY
)}:${JSON.stringify(THEME_STORAGE_KEY)}+"-"+t;var s=JSON.parse(localStorage.getItem(k)||"{}");var f=${JSON.stringify(
  Object.fromEntries(
    Object.entries(templateThemeDefaults).map(([template, settings]) => [template, Object.fromEntries(Object.keys(attributeDefaults).map((key) => [key, settings[key as keyof typeof attributeDefaults]]))])
  )
)}[t];for(var q in f){if(!s[q])s[q]=f[q]};var d=${JSON.stringify(attributeDefaults)};for(var n in d){if(s[n]&&s[n]!==d[n])r.setAttribute("data-"+n,s[n])}if(s.mono)r.setAttribute("data-mono","");if(s.reduceMotion)r.setAttribute("data-motion","reduce")}catch(e){}})()`
