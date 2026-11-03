"use client"

import { BarChart } from "@dashral/ui/components/bar-chart"
import { useTranslations } from "next-intl"

import { useFormats } from "@/lib/use-formats"

import { ChartDataTable } from "./chart-data-table"

type Point = { day: number; online: number; store: number }

export function SalesChart({ data: points }: { data: Point[] }) {
  const t = useTranslations("overview")
  const format = useFormats()
  // Day names in the reader's language.
  const data = points.map((p) => ({ ...p, label: format.weekday(p.day) }))
  const series = [
    { key: "online", label: t("online") },
    { key: "store", label: t("inStore") },
  ]

  return (
    <div className="w-full">
      <BarChart data={data} index="label" series={series} height={268} aria-label={t("ordersPerDay")} />
      <ChartDataTable
        caption={t("ordersPerDay")}
        rows={data}
        columns={[
          { key: "label", label: t("day") },
          { key: "online", label: series[0]!.label },
          { key: "store", label: series[1]!.label },
        ]}
      />
    </div>
  )
}
