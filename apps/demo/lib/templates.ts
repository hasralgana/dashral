// The dashboard templates in this repository. Each has its own pages under its own address, its own menu
// (lib/nav.ts) and its own customizer settings (lib/theme-settings.ts). Classic is the default; Inset lives under /inset.
// `templateInfo` below is the one list of them: everything else follows it, and what has to name each template (its
// menu, its picture and description in the switcher) is a Record<Template, …>, so typecheck says what's missing.
//
// A new template, beyond what typecheck asks for:
// - app/<id>/layout.tsx: a copy of app/(dashboard)/layout.tsx with <TemplateScope template="<id>" /> inside, plus its
//   pages; settings/ and pricing/ re-export Classic's (see app/inset).
// - app/layout-<id>.css for its look (html[data-template="<id>"] …), imported in app/globals.css between
//   `@dashral-if <id>` markers, like its entry below.
// - scripts/dashral.mjs: init and update only know classic, inset and both; teach them the new one.
// - Wherever you list the templates (a site, docs): its entry and screenshots there.

import type { ThemeSettings } from "./theme-settings"

type TemplateInfo = {
  /** Its name, the same in every language. */
  name: string
  /** Where it starts: "/" for the base template (one of them), its own address for the others. */
  home: string
  /** Its starting look, over defaultThemeSettings; the reader's customizer changes are saved per template. */
  theme?: Partial<ThemeSettings>
}

const templateList = {
  // @dashral-if classic
  classic: { name: "Classic", home: "/", theme: { primary: "blue" } },
  // @dashral-end
  // @dashral-if inset
  inset: { name: "Inset", home: "/inset", theme: { primary: "black", font: "geist" } },
  // @dashral-end
} satisfies Record<string, TemplateInfo>

export type Template = keyof typeof templateList

export const templateInfo: Record<Template, TemplateInfo> = templateList

export const templates = Object.keys(templateInfo) as Template[]

/** Where each template starts. */
export const templateHome = Object.fromEntries(templates.map((template) => [template, templateInfo[template].home])) as Record<Template, string>

/** The template at "/": the shared pages (sign-in, error pages) are in it. */
export const baseTemplate = templates.find((template) => templateHome[template] === "/") ?? (templates[0] as Template)

/** The templates that live under an address of their own, e.g. Inset under /inset. */
const prefixed = templates.filter((template) => templateHome[template] !== "/")

/** The template a page belongs to, from its path. */
export function templateOf(pathname: string): Template {
  return prefixed.find((template) => pathname === templateHome[template] || pathname.startsWith(`${templateHome[template]}/`)) ?? baseTemplate
}

// Pages a prefixed template has its own copy of; everything else (sign-in, error pages, files) is shared.
const templateCopies = ["/settings", "/pricing"]

/** A link to a base template page, as it's written inside a template: `/settings` is `/inset/settings` in Inset. */
export function templateHref(template: Template, href: string) {
  const home = templateHome[template]
  if (home === "/") return href
  if (href === "/") return home
  return templateCopies.some((path) => href === path || href.startsWith(`${path}/`) || href.startsWith(`${path}?`)) ? `${home}${href}` : href
}
