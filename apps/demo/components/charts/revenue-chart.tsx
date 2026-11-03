"use client"

import { AreaChart } from "@dashral/ui/components/area-chart"
import { useTranslations } from "next-intl"

import { useFormats } from "@/lib/use-formats"

import { ChartDataTable } from "./chart-data-table"

type Point = { month: number; revenue: number }

export function RevenueChart({ data: points }: { data: Point[] }) {
  const t = useTranslations("overview")
  const format = useFormats()
  // Month names in the reader's language.
  const data = points.map((p) => ({ ...p, label: format.month(p.month) }))

  return (
    <div className="w-full">
      <AreaChart
        data={data}
        index="label"
        series={[{ key: "revenue", label: t("revenue"), color: "var(--primary)" }]}
        height={288}
        locale={format.money.locale}
        formatOptions={format.money.options}
        aria-label={t("monthlyRevenue")}
      />
      <ChartDataTable
        caption={t("monthlyRevenue")}
        rows={data}
        columns={[
          { key: "label", label: t("month") },
          { key: "revenue", label: t("revenueUsd") },
        ]}
      />
    </div>
  )
}
