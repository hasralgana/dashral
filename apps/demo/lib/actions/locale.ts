"use server"

import { cookies } from "next/headers"

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n"

/** Saves the language for a year; the page then reloads in it. */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return
  ;(await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
}
