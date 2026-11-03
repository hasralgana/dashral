"use client"

import { useTranslations } from "next-intl"

import { templateNavGroups } from "@/lib/nav"
import { dashral } from "@/lib/site"
import { useTemplate } from "@/lib/use-template"

/**
 * The menu of the template you're in, in the current language: the groups and links of lib/nav.ts, translated. The
 * Pro features' upgrade pages are left out when the app doesn't point to the template (lib/site.ts → dashral.show).
 */
export function useNavGroups() {
  const t = useTranslations("nav")
  return templateNavGroups[useTemplate()].map((group) => ({
    ...group,
    label: t(group.label),
    items: group.items.filter((item) => dashral.show || !item.pro).map((item) => ({
      ...item,
      title: t(item.title),
      children: item.children?.map((child) => ({ ...child, title: t(child.title) })),
    })),
  }))
}

export type TranslatedNavItem = ReturnType<typeof useNavGroups>[number]["items"][number]
