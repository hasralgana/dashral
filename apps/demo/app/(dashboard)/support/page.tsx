import type { Metadata } from "next"
import { Clock, Inbox, Smile, TimerOff } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card } from "@dashral/ui/components/card"
import { Kbd } from "@dashral/ui/components/kbd"
import { MetricCard } from "@dashral/ui/components/metric-card"
import { Note } from "@dashral/ui/components/note"

import { PageHeader } from "@/components/page-header"
import { TicketsHeatmap } from "@/components/support/tickets-heatmap"
import { TicketsView } from "@/components/support/tickets-view"
import { getIntlLocale } from "@/lib/i18n-server"
import { tickets, ticketsByDay, volumeWeeks } from "@/lib/support-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("support")
  return { title: t("title"), description: t("description") }
}

export default async function SupportPage() {
  const t = await getTranslations("support")
  const locale = await getIntlLocale()
  const open = tickets.filter((ticket) => ticket.status === "open")
  const lastWeek = ticketsByDay.slice(-7).reduce((sum, day) => sum + day.value, 0)

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("metrics.label")}>
        <MetricCard label={t("metrics.open")} value={open.length} locale={locale} change={-12} changeLabel={t("metrics.vsLastWeek")} invert icon={<Inbox />} countOnMount />
        <MetricCard
          label={t("metrics.firstResponse")}
          value={38}
          locale={locale}
          formatOptions={{ style: "unit", unit: "minute", unitDisplay: "short" }}
          change={-9}
          changeLabel={t("metrics.vsLastWeek")}
          invert
          icon={<Clock />}
          countOnMount
        />
        <MetricCard
          label={t("metrics.satisfaction")}
          value={0.94}
          locale={locale}
          formatOptions={{ style: "percent" }}
          change={1.5}
          changeLabel={t("metrics.vsLastWeek")}
          icon={<Smile />}
          countOnMount
        />
        <MetricCard label={t("metrics.breached")} value={tickets.filter((ticket) => ticket.breached).length} locale={locale} icon={<TimerOff />} countOnMount>
          <p className="text-xs text-muted-foreground">{t("metrics.breachedHint")}</p>
        </MetricCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title={t("volume.title")} description={t("volume.description", { weeks: volumeWeeks, count: lastWeek })} className="xl:col-span-2" classNames={{ body: "overflow-x-auto" }}>
          <TicketsHeatmap />
        </Card>
        <Card title={t("shortcuts.title")} description={t("shortcuts.description")} classNames={{ body: "space-y-4" }}>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              {t("shortcuts.send")} <Kbd keys={["mod", "Enter"]} />
            </li>
            <li className="flex items-center justify-between gap-3">
              {t("shortcuts.close")} <Kbd keys={["Esc"]} />
            </li>
            <li className="flex items-center justify-between gap-3">
              {t("shortcuts.search")} <Kbd keys={["mod", "K"]} />
            </li>
          </ul>
          <Note color="info" title={t("shortcuts.noteTitle")}>
            <p>{t("shortcuts.note")}</p>
          </Note>
        </Card>
      </section>

      <TicketsView />
    </>
  )
}
