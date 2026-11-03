"use client"

import { useLocale } from "next-intl"

import { localeInfo } from "@/lib/i18n"

/** "rtl" for Arabic, else "ltr": for the few things that choose a physical side, like a tooltip beside the sidebar. */
export function useDir(): "ltr" | "rtl" {
  return localeInfo[useLocale()].dir
}
