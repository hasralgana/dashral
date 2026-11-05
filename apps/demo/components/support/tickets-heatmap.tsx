"use client"

import { useLocale, useTranslations } from "next-intl"
import { Heatmap } from "@dashral/ui/components/heatmap"

import { localeInfo } from "@/lib/i18n"
import { supportToday, ticketsByDay, volumeWeeks } from "@/lib/support-data"

/** Tickets per day, one square a day. */
export function TicketsHeatmap() {
  const t = useTranslations("support.volume")
  const locale = useLocale()
  return (
    <Heatmap
      data={ticketsByDay}
      endDate={supportToday}
      weeks={volumeWeeks}
      weekStartsOn={1}
      unit={[t("ticket"), t("tickets")]}
      locale={localeInfo[locale].intl}
      aria-label={t("title")}
    />
  )
}
