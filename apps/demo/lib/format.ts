// Number, money and date formats for a locale (an Intl tag from lib/i18n, e.g. "id-ID"). Client components get them
// with useFormats() (lib/use-formats.ts), server components with getFormats() (lib/i18n-server.ts). Dollars show as
// "$" in every language, not "US$" (`moneyLocale`, from lib/i18n).

export function formats(locale: string, moneyLocale = locale) {
  const currency = new Intl.NumberFormat(moneyLocale, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 })
  // Both fraction-digit bounds: with only the maximum, Node writes "$900.0K" and browsers "$900K", and the page would
  // differ between the server and the browser (a hydration error).
  const compactCurrency = new Intl.NumberFormat(moneyLocale, { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 })
  const number = new Intl.NumberFormat(locale)
  const month = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  return {
    /** For a component that formats money itself (the kit's charts): the locale and the options it uses. */
    money: { locale: moneyLocale, options: { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as Intl.NumberFormatOptions },
    currency: (value: number) => currency.format(value),
    compactCurrency: (value: number) => compactCurrency.format(value),
    number: (value: number) => number.format(value),
    /** 0 → "Jan", "Jan", "يناير". */
    month: (index: number) => month.format(Date.UTC(2026, index, 1)),
    /** 1 → "Mon" (0 is Sunday). */
    weekday: (index: number) => weekday.format(Date.UTC(2026, 1, 1 + index)),
    /** "2026-10-07" → "Oct 7, 2026". */
    date: (day: string) => date.format(new Date(`${day}T00:00:00Z`)),
  }
}

export type Formats = ReturnType<typeof formats>
