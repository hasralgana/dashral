// The theme presets of @dashral/ui/themes.css as data: each setting's choices (with a swatch to show them by), a
// whole look's defaults, named presets, a shuffle that still goes together, and the data attributes a look sets. The
// dashboard's customizer and the website's preview customizer both read them from here.

export const themeOptions = {
  primary: [
    { value: "black", label: "Black", swatch: "oklch(0.205 0 0)" },
    { value: "blue", label: "Blue", swatch: "oklch(0.546 0.245 262.881)" },
    { value: "indigo", label: "Indigo", swatch: "oklch(0.511 0.262 276.966)" },
    { value: "purple", label: "Purple", swatch: "oklch(0.558 0.288 302.321)" },
    { value: "green", label: "Green", swatch: "oklch(0.527 0.154 150.069)" },
    { value: "amber", label: "Amber", swatch: "oklch(0.769 0.188 70.08)" },
    { value: "rose", label: "Rose", swatch: "oklch(0.514 0.222 16.935)" },
  ],
  light: [
    { value: "neutral", label: "Neutral", swatch: "oklch(0.922 0 0)" },
    { value: "gray", label: "Gray", swatch: "oklch(0.96 0.005 250)" },
    { value: "slate", label: "Slate", swatch: "oklch(0.929 0.013 255.508)" },
  ],
  dark: [
    { value: "default", label: "Default", swatch: "oklch(0.2 0.005 260)" },
    { value: "navy", label: "Navy", swatch: "oklch(0.208 0.042 265.755)" },
    { value: "zinc", label: "Zinc", swatch: "oklch(0.21 0.006 285.885)" },
    { value: "black", label: "Black", swatch: "oklch(0.1 0 0)" },
    { value: "mint", label: "Mint", swatch: "oklch(0.21 0.03 190)" },
  ],
  card: [
    { value: "default", label: "Default" },
    { value: "soft", label: "Soft" },
    { value: "shadow", label: "Shadow" },
  ],
  font: [
    { value: "inter", label: "Inter" },
    { value: "geist", label: "Geist" },
    { value: "system", label: "System" },
  ],
  radius: [
    { value: "0", label: "0" },
    { value: "sm", label: "0.375" },
    { value: "md", label: "0.625" },
    { value: "lg", label: "0.875" },
    { value: "xl", label: "1.25" },
  ],
} as const

type Values<K extends keyof typeof themeOptions> = (typeof themeOptions)[K][number]["value"]

/** A look: the settings themes.css styles. Mode, monochrome and reduced motion are the reader's own, not part of it. */
export type ThemeLook = {
  primary: Values<"primary">
  light: Values<"light">
  dark: Values<"dark">
  card: Values<"card">
  radius: Values<"radius">
  /** The text font (headings stay Geist): Inter, Geist, or the device's own. */
  font: Values<"font">
}

export const lookKeys = ["primary", "light", "dark", "card", "radius", "font"] as const

/** The look of globals.css alone: each of these is "no attribute". */
export const defaultLook: ThemeLook = { primary: "black", light: "neutral", dark: "default", card: "default", radius: "lg", font: "inter" }

/** The data attributes that give an element (or <html>) a look: only the settings that differ from the default. */
export function lookAttributes(look: ThemeLook): Record<string, string> {
  return Object.fromEntries(lookKeys.filter((key) => look[key] !== defaultLook[key]).map((key) => [`data-${key}`, look[key]]))
}

export const sameLook = (a: ThemeLook, b: ThemeLook) => lookKeys.every((key) => a[key] === b[key])

/** Looks put together to work as a whole, each with an id (a name to translate) and an English name. */
export const presets: { id: "ocean" | "mono" | "forest" | "ember" | "studio" | "grape"; name: string; look: ThemeLook }[] = [
  { id: "ocean", name: "Ocean", look: { primary: "blue", light: "slate", dark: "navy", card: "soft", radius: "lg", font: "inter" } },
  { id: "mono", name: "Mono", look: { primary: "black", light: "neutral", dark: "zinc", card: "default", radius: "md", font: "geist" } },
  { id: "forest", name: "Forest", look: { primary: "green", light: "gray", dark: "mint", card: "shadow", radius: "xl", font: "inter" } },
  { id: "ember", name: "Ember", look: { primary: "rose", light: "neutral", dark: "default", card: "soft", radius: "lg", font: "geist" } },
  { id: "studio", name: "Studio", look: { primary: "indigo", light: "slate", dark: "navy", card: "shadow", radius: "sm", font: "system" } },
  { id: "grape", name: "Grape", look: { primary: "purple", light: "gray", dark: "zinc", card: "soft", radius: "xl", font: "geist" } },
]

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!

// The dark backgrounds that sit well with each color: a tinted one beside its own hue, neutral ones beside the rest.
const darkFor: Record<ThemeLook["primary"], ThemeLook["dark"][]> = {
  blue: ["navy", "default", "zinc"],
  indigo: ["navy", "zinc", "default"],
  purple: ["zinc", "default", "black"],
  green: ["mint", "default", "black"],
  amber: ["default", "zinc", "black"],
  rose: ["default", "zinc", "black"],
  black: ["zinc", "black", "default"],
}
// Cool grays beside cool colors, plain ones beside warm colors and black.
const lightFor: Record<ThemeLook["primary"], ThemeLook["light"][]> = {
  blue: ["slate", "gray"],
  indigo: ["slate", "gray"],
  purple: ["gray", "neutral"],
  green: ["gray", "neutral"],
  amber: ["neutral", "gray"],
  rose: ["neutral", "gray"],
  black: ["neutral", "gray"],
}

/** A look at random that still goes together (its backgrounds follow its color), never the one you have. */
export function shuffleLook(current: ThemeLook): ThemeLook {
  for (;;) {
    const primary = pick(themeOptions.primary).value
    const look: ThemeLook = {
      primary,
      light: pick(lightFor[primary]),
      dark: pick(darkFor[primary]),
      card: pick(themeOptions.card).value,
      // Square corners are a deliberate choice, not a lucky draw.
      radius: pick(themeOptions.radius.filter((option) => option.value !== "0")).value,
      font: pick(themeOptions.font).value,
    }
    if (!sameLook(look, current)) return look
  }
}
