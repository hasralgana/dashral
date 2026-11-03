import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { isLocale, LOCALE_COOKIE, matchLocale } from "@/lib/i18n"
import { dashral, siteConfig } from "@/lib/site"
import type en from "@/messages/en"

// The messages name the app {brand} and the template it's built on {dashral}: both are filled in here from
// lib/site.ts, once per language, so renaming the app there renames it in every language.
function fillNames(value: unknown): unknown {
  if (typeof value === "string") return value.replaceAll("{brand}", siteConfig.name).replaceAll("{dashral}", dashral.name)
  if (Array.isArray(value)) return value.map(fillNames)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillNames(item)]))
  return value
}

// The language for this request: the cookie the language menu sets, else the browser's preferred language.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(saved) ? saved : matchLocale((await headers()).get("accept-language"))
  // Only this language's messages are loaded: messages/<locale>/index.ts.
  const messages = (await import(`../messages/${locale}/index.ts`)).default as typeof en
  return { locale, messages: fillNames(messages) as typeof en }
})
