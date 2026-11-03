import { useLocale } from "next-intl"

import { formats } from "@/lib/format"
import { localeInfo, moneyLocale } from "@/lib/i18n"

/** Number, money and date formats in the current language. Works in server and client components. */
export function useFormats() {
  const locale = useLocale()
  return formats(localeInfo[locale].intl, moneyLocale(locale))
}
