"use client"

import { LocaleProvider, type LocaleMessages } from "@dashral/ui/lib/locale"

import { localeInfo, type Locale } from "@/lib/i18n"

/** The UI kit's language: its built-in words (from messages.kit), number and date formats, and the direction. */
export function KitLocaleProvider({ locale, messages, children }: { locale: Locale; messages: Partial<LocaleMessages>; children: React.ReactNode }) {
  const info = localeInfo[locale]
  return (
    <LocaleProvider locale={info.intl} dir={info.dir} messages={messages} dateLocale={info.dateLocale}>
      {children}
    </LocaleProvider>
  )
}
