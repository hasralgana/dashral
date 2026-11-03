// The dashboard's languages. The choice is a cookie (no /en or /ar in the URL: a dashboard isn't indexed), set from
// the language menu; without one, the browser's preferred language if it's one of these, else English.
//
// Everything a language needs is its entry here and its folder in messages/ (messages/<code>/). To add one, see
// "Adding a language" in the docs.

import { ar, enUS, id } from "@daypicker/react/locale"
import GB from "country-flag-icons/react/3x2/GB"
// @dashral-if i18n
import ID from "country-flag-icons/react/3x2/ID"
import SA from "country-flag-icons/react/3x2/SA"
// @dashral-end
import type { FlagComponent } from "country-flag-icons/react/3x2"

export const localeInfo = {
  en: { label: "English", flag: GB, dir: "ltr", intl: "en-US", dateLocale: enUS },
  // @dashral-if i18n
  id: { label: "Indonesia", flag: ID, dir: "ltr", intl: "id-ID", dateLocale: id },
  // Arabic with Western digits (1,234), as most Arabic software shows numbers in tables and charts.
  // Dollar amounts as "$8,900": Arabic locale data only has "US$" for the dollar.
  ar: { label: "العربية", flag: SA, dir: "rtl", intl: "ar-u-nu-latn", money: "en-US", dateLocale: ar },
  // @dashral-end
} satisfies Record<string, LocaleInfo>

type LocaleInfo = {
  /** The language's name in itself, for the language menu. */
  label: string
  /** Its flag in the language menu, from country-flag-icons (country-flag-icons/react/3x2/<country code>). */
  flag: FlagComponent
  dir: "ltr" | "rtl"
  /** The Intl tag numbers and dates are written in. */
  intl: string
  /** The Intl tag dollar amounts are written in, when it isn't `intl`. */
  money?: string
  /** Month and day names, and the first day of the week, for the calendars (a react-day-picker locale). */
  dateLocale: unknown
}

export type Locale = keyof typeof localeInfo
export const locales = Object.keys(localeInfo) as Locale[]
export const defaultLocale: Locale = "en"
export const LOCALE_COOKIE = "locale"

/** The Intl tag a language writes dollar amounts in. */
export const moneyLocale = (locale: Locale): string => {
  const info: LocaleInfo = localeInfo[locale]
  return info.money ?? info.intl
}

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (locales as readonly string[]).includes(value)

/** The best of our languages for an Accept-Language header, e.g. "id-ID,id;q=0.9,en;q=0.8" → "id". */
export function matchLocale(acceptLanguage: string | null): Locale {
  const wanted = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", q] = part.trim().split(";q=")
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  return wanted.find((w) => isLocale(w.lang))?.lang as Locale | undefined ?? defaultLocale
}
