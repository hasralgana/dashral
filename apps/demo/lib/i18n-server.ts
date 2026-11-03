// Server components only (next-intl/server).
import { getLocale } from "next-intl/server"

import { formats } from "@/lib/format"
import { localeInfo, moneyLocale } from "@/lib/i18n"

/** The Intl tag for this request's language, e.g. "ar-u-nu-latn". */
export async function getIntlLocale() {
  return localeInfo[await getLocale()].intl
}

/** The Intl tag this request's language writes dollar amounts in. */
export async function getMoneyLocale() {
  return moneyLocale(await getLocale())
}

/** Number, money and date formats in this request's language. */
export async function getFormats() {
  const locale = await getLocale()
  return formats(localeInfo[locale].intl, moneyLocale(locale))
}
