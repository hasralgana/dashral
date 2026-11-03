// Formatting as you type, with no library: card numbers in groups, phone numbers, dates, expiry dates, times,
// numbers with thousands separators, or any pattern. Used by Input's `format` prop; usable on its own too.

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay" | "unknown"

/**
 * - "card": 4-4-4-4 (Amex 4-6-5, Diners 4-6-4), up to 19 digits, and the brand.
 * - "phone": 4-4-4 digits, "0812 3456 7890"; pass a pattern for another country's style.
 * - "date": day, month and year in the locale's order and separator ("31/12/2026", "12/31/2026").
 * - "expiry": MM/YY. "time": HH:MM, 24-hour.
 * - "number": thousands separators in the locale's style; { type: "number", decimals: 2 } allows decimals.
 * - { pattern }: # is a digit, A a letter, * either; anything else is written as is, e.g. "##.###.###.#-###.###".
 */
export type InputFormat =
  | "card"
  | "phone"
  | "date"
  | "expiry"
  | "time"
  | "number"
  | { type: "number"; decimals?: number }
  | { pattern: string }

export type FormatResult = {
  /** What the field shows. */
  text: string
  /** What it means: the digits (and letters) alone; for numbers, a plain "1234.5". */
  raw: string
  /** For "card": the brand, from the first digits. */
  brand?: CardBrand
}

export type InputFormatter = {
  format: (text: string) => FormatResult
  /** The characters that carry meaning; everything else is a separator the formatter adds. */
  significant: RegExp
  /** Where the caret goes in `formatted`, given the text that was before it as typed. */
  caret: (before: string, formatted: string) => number
}

const DIGIT = /\d/

/** Writes `chars` into a pattern. Separators only appear once a character follows them, so deleting never sticks. */
function applyPattern(input: string, pattern: string) {
  const chars = [...input].filter((c) => /[\dA-Za-z]/.test(c))
  let out = ""
  let pending = ""
  let raw = ""
  let i = 0
  for (const slot of pattern) {
    if (i >= chars.length) break
    const fits = slot === "#" ? DIGIT : slot === "A" ? /[A-Za-z]/ : slot === "*" ? /[\dA-Za-z]/ : null
    if (!fits) {
      pending += slot
      continue
    }
    // Skip what can't go in this slot (a letter where a digit belongs).
    while (i < chars.length && !fits.test(chars[i]!)) i++
    if (i >= chars.length) break
    out += pending + chars[i]
    raw += chars[i]
    pending = ""
    i++
  }
  return { text: out, raw }
}

/** Two-digit parts with a ceiling (a month, an hour): "5" becomes "05", and "13" can't be typed as a month. */
function applySegments(input: string, segments: { length: number; max?: number }[], separator: string) {
  const digits = input.replace(/\D/g, "")
  const parts: string[] = []
  let i = 0
  for (const segment of segments) {
    if (i >= digits.length) break
    let part = ""
    if (segment.max !== undefined && segment.length === 2 && Number(digits[i]) > Math.floor(segment.max / 10)) {
      part = `0${digits[i]}`
      i += 1
    } else {
      part = digits.slice(i, i + segment.length)
      i += part.length
      if (segment.max !== undefined && part.length === segment.length && Number(part) > segment.max) part = String(segment.max)
    }
    parts.push(part)
  }
  return { text: parts.join(separator), raw: parts.join("") }
}

/** The card's brand from its first digits. */
export function cardBrand(digits: string): CardBrand {
  if (/^3[47]/.test(digits)) return "amex"
  if (/^3(0[0-5]|[689])/.test(digits)) return "diners"
  if (/^35/.test(digits)) return "jcb"
  if (/^4/.test(digits)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard"
  if (/^6(011|5|4[4-9])/.test(digits)) return "discover"
  if (/^62/.test(digits)) return "unionpay"
  return "unknown"
}

const cardPatterns: Partial<Record<CardBrand, string>> = { amex: "#### ###### #####", diners: "#### ###### ####" }

/** The locale's day, month and year order and separator, e.g. ["day", "month", "year"] and "/". */
function dateParts(locale: string) {
  const parts = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(new Date(2026, 11, 31))
  const order = parts.filter((p) => p.type === "day" || p.type === "month" || p.type === "year").map((p) => p.type)
  // Without the direction marks some locales (Arabic) put around it.
  const separator = parts.find((p) => p.type === "literal")?.value.replace(/[\u200e\u200f\u061c\s]/g, "") || "/"
  return { order, separator }
}

/** The formatter for a format and locale: call `format` on whatever the field holds. */
export function inputFormatter(format: InputFormat, locale = "en-US"): InputFormatter {
  const base = baseFormatter(format, locale)
  const grouped = format === "number" || (typeof format === "object" && "type" in format)
  return {
    ...base,
    // Patterns put separators in fixed places, so the caret goes where the text before it ends up ("5" → "05|").
    // Number groups move with the length, so there it goes after the same count of digits.
    caret: grouped
      ? (before, formatted) => caretAfter(formatted, countSignificant(before, base.significant), base.significant)
      : (before, formatted) => Math.min(base.format(before).text.length, formatted.length),
  }
}

function baseFormatter(format: InputFormat, locale: string): Omit<InputFormatter, "caret"> {
  if (format === "number" || (typeof format === "object" && "type" in format)) {
    const decimals = typeof format === "object" ? (format.decimals ?? 0) : 0
    const sample = new Intl.NumberFormat(locale).formatToParts(12345.6)
    const group = sample.find((p) => p.type === "group")?.value ?? ","
    const mark = sample.find((p) => p.type === "decimal")?.value ?? "."
    const escaped = mark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return {
      significant: new RegExp(decimals > 0 ? `[\\d${escaped}]` : "\\d"),
      format(text) {
        const kept = [...text].filter((c) => DIGIT.test(c) || (decimals > 0 && c === mark)).join("")
        const [whole = "", ...rest] = kept.split(mark)
        const hasMark = decimals > 0 && kept.includes(mark)
        const fraction = rest.join("").slice(0, decimals)
        const integer = whole.replace(/^0+(?=\d)/, "")
        const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group)
        const shownInteger = grouped || (hasMark ? "0" : "")
        return {
          text: hasMark ? `${shownInteger}${mark}${fraction}` : shownInteger,
          raw: hasMark ? `${integer || "0"}.${fraction}` : integer,
        }
      },
    }
  }

  if (typeof format === "object") return { significant: /[\dA-Za-z]/, format: (text) => applyPattern(text, format.pattern) }

  switch (format) {
    case "card":
      return {
        significant: DIGIT,
        format(text) {
          const digits = text.replace(/\D/g, "")
          const brand = cardBrand(digits)
          return { ...applyPattern(digits, cardPatterns[brand] ?? "#### #### #### #### ###"), brand }
        },
      }
    case "phone":
      return { significant: DIGIT, format: (text) => applyPattern(text, "#### #### #####") }
    case "expiry":
      return { significant: DIGIT, format: (text) => applySegments(text, [{ length: 2, max: 12 }, { length: 2 }], "/") }
    case "time":
      return { significant: DIGIT, format: (text) => applySegments(text, [{ length: 2, max: 23 }, { length: 2, max: 59 }], ":") }
    case "date": {
      const { order, separator } = dateParts(locale)
      const segments = order.map((part) => (part === "year" ? { length: 4 } : { length: 2, max: part === "month" ? 12 : 31 }))
      return { significant: DIGIT, format: (text) => applySegments(text, segments, separator) }
    }
  }
}

/** How many meaningful characters `text` has. */
export function countSignificant(text: string, significant: RegExp) {
  let n = 0
  for (const c of text) if (significant.test(c)) n++
  return n
}

/** Where the caret goes in `text`: right after its `count`-th meaningful character. */
export function caretAfter(text: string, count: number, significant: RegExp) {
  if (count <= 0) return 0
  let n = 0
  for (let i = 0; i < text.length; i++) {
    if (significant.test(text[i]!) && ++n === count) return i + 1
  }
  return text.length
}
