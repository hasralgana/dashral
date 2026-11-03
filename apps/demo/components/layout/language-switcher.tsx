"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { Tooltip } from "@dashral/ui/components/tooltip"

import { setLocaleAction } from "@/lib/actions/locale"
import { localeInfo, locales } from "@/lib/i18n"

/** The language menu: each language's flag and its name written in itself, the current one ticked. */
export function LanguageSwitcher() {
  const t = useTranslations("layout")
  const current = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const choose = (locale: string) =>
    startTransition(async () => {
      await setLocaleAction(locale)
      router.refresh()
    })

  return (
    <DropdownMenu
      align="end"
      className="w-48"
      trigger={
        <Tooltip content={t("language")}>
          <Button variant="ghost" size="icon" aria-label={t("changeLanguage")} aria-busy={pending || undefined}>
            <Languages />
          </Button>
        </Tooltip>
      }
      items={locales.map((locale) => {
        const { label, flag: Flag } = localeInfo[locale]
        const selected = locale === current
        return {
          icon: <Flag aria-hidden className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-[0_0_0_1px_var(--border)]" />,
          label: (
            <span lang={locale} className="flex flex-1 items-center gap-2">
              {label}
              {selected && <Check className="ms-auto size-4 text-primary-text" aria-label={t("currentLanguage")} />}
            </span>
          ),
          active: selected,
          onSelect: () => !selected && choose(locale),
        }
      })}
    />
  )
}
