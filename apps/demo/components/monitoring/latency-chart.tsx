"use client"

import { useLocale, useTranslations } from "next-intl"
import { LineChart } from "@dashral/ui/components/line-chart"

import { latency } from "@/lib/monitoring-data"
import { localeInfo } from "@/lib/i18n"

/** p50 and p95 response times over the last 24 hours. */
export function LatencyChart() {
  const t = useTranslations("monitoring.latency")
  const locale = localeInfo[useLocale()].intl
  return (
    <LineChart
      data={latency}
      index="hour"
      series={[
        { key: "p95", label: t("p95"), color: "var(--chart-3)" },
        { key: "p50", label: t("p50"), color: "var(--primary)" },
      ]}
      height={260}
      locale={locale}
      formatOptions={{ style: "unit", unit: "millisecond", unitDisplay: "short" }}
      startAtZero
      showGrid
      aria-label={t("title")}
    />
  )
}
