"use client"

import { CircleCheck, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Card } from "@dashral/ui/components/card"
import { Gauge } from "@dashral/ui/components/gauge"

import { serviceStatus } from "@/lib/monitoring-data"
import { localeInfo } from "@/lib/i18n"

/** Uptime over 30 days on a gauge, and each service's state under it. */
export function UptimeCard() {
  const t = useTranslations("monitoring")
  const locale = localeInfo[useLocale()].intl
  const uptime = serviceStatus.reduce((sum, service) => sum + service.uptime, 0) / serviceStatus.length
  return (
    <Card title={t("uptime.title")} description={t("uptime.description")} classNames={{ body: "space-y-5" }}>
      <div className="flex justify-center">
        <Gauge
          value={uptime}
          min={0.99}
          max={1}
          label={t("uptime.label")}
          locale={locale}
          formatOptions={{ style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          levels={[
            { from: 0.99, className: "text-destructive" },
            { from: 0.995, className: "text-warning" },
            { from: 0.999, className: "text-success" },
          ]}
          size={180}
        />
      </div>
      <ul className="divide-y divide-divider">
        {serviceStatus.map((service) => (
          <li key={service.service} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="font-medium">{t(`services.${service.service}`)}</span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">
                {new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 2 }).format(service.uptime)}
              </span>
              {service.health === "operational" ? (
                <Badge variant="soft" color="success">
                  <CircleCheck aria-hidden /> {t("health.operational")}
                </Badge>
              ) : (
                <Badge variant="soft" color="warning">
                  <TriangleAlert aria-hidden /> {t("health.degraded")}
                </Badge>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
