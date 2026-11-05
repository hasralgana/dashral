"use client"

import { useTranslations } from "next-intl"
import { LineChart } from "@dashral/ui/components/line-chart"

import { cashFlow } from "@/lib/finance-data"
import { useFormats } from "@/lib/use-formats"

/** Money in, money out and the spending plan, month by month: the plan dashed, as a comparison. */
export function CashFlowChart() {
  const t = useTranslations("finance.cashFlow")
  const format = useFormats()
  const data = cashFlow.map((point) => ({ ...point, label: format.month(point.month) }))
  return (
    <LineChart
      data={data}
      index="label"
      series={[
        { key: "inflow", label: t("inflow"), color: "var(--primary)" },
        { key: "outflow", label: t("outflow"), color: "var(--chart-3)" },
        { key: "plan", label: t("plan"), color: "var(--muted-foreground)", dashed: true },
      ]}
      height={288}
      locale={format.money.locale}
      formatOptions={format.money.options}
      showGrid
      aria-label={t("title")}
    />
  )
}
