import type { Metadata } from "next"
import { Activity, Gauge as GaugeIcon, OctagonAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card } from "@dashral/ui/components/card"
import { MetricCard } from "@dashral/ui/components/metric-card"

import { LatencyChart } from "@/components/monitoring/latency-chart"
import { LogsView } from "@/components/monitoring/logs-view"
import { UptimeCard } from "@/components/monitoring/uptime-card"
import { PageHeader } from "@/components/page-header"
import { getIntlLocale } from "@/lib/i18n-server"
import { latency } from "@/lib/monitoring-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("monitoring")
  return { title: t("title"), description: t("description") }
}

export default async function MonitoringPage() {
  const t = await getTranslations("monitoring")
  const locale = await getIntlLocale()
  const p95 = latency.at(-1)!.p95

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label={t("metrics.label")}>
        <MetricCard label={t("metrics.requests")} value={1842} locale={locale} change={6.4} changeLabel={t("metrics.vsYesterday")} icon={<Activity />} countOnMount>
          <p className="text-xs text-muted-foreground">{t("metrics.perMinute")}</p>
        </MetricCard>
        <MetricCard
          label={t("metrics.p95")}
          value={p95}
          locale={locale}
          formatOptions={{ style: "unit", unit: "millisecond", unitDisplay: "short" }}
          change={-11}
          changeLabel={t("metrics.vsYesterday")}
          invert
          icon={<GaugeIcon />}
          countOnMount
        />
        <MetricCard
          label={t("metrics.errors")}
          value={0.0042}
          locale={locale}
          formatOptions={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          change={0.1}
          changeUnit=" pp"
          changeLabel={t("metrics.vsYesterday")}
          invert
          icon={<OctagonAlert />}
          countOnMount
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title={t("latency.title")} description={t("latency.description")} className="xl:col-span-2" classNames={{ body: "ps-2" }}>
          <LatencyChart />
        </Card>
        <UptimeCard />
      </section>

      <LogsView />
    </>
  )
}
