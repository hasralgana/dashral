"use client"

import { Download } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { BarList } from "@dashral/ui/components/bar-list"
import { Button } from "@dashral/ui/components/button"
import { DonutChart } from "@dashral/ui/components/donut-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"
import { toast } from "@dashral/ui/components/toast"
import { cn } from "@dashral/ui/lib/utils"

import { PanelCard } from "@/components/inset/panel-card"
import { PageHeader } from "@/components/page-header"
import { moneyLocale, type Locale } from "@/lib/i18n"
import { customers, mrrMovement, type Plan } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

const plans: Plan[] = ["starter", "growth", "scale"]
const money = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const

/** Monthly recurring revenue: how it moved, which plans it comes from and who brings the most. */
export function ReportsView() {
  const t = useTranslations("inset.reports")
  const planT = useTranslations("inset.plans")
  const format = useFormats()
  const locale = moneyLocale(useLocale() as Locale)

  const rows = mrrMovement.map((m) => ({ ...m, net: m.new + m.expansion + m.contraction + m.churn }))
  const net = rows.reduce((sum, row) => sum + row.net, 0)
  const added = rows.reduce((sum, row) => sum + row.new, 0)
  // Isolated left to right (U+2066 … U+2069), so the sign stays before the amount in Arabic too.
  const signed = (value: number) => `\u2066${value > 0 ? "+" : value < 0 ? "−" : ""}${format.currency(Math.abs(value))}\u2069`

  const paying = customers.filter((c) => c.mrr > 0)
  const byPlan = plans.map((plan) => ({ label: planT(plan), value: paying.filter((c) => c.plan === plan).reduce((sum, c) => sum + c.mrr, 0) }))
  const top = [...paying].sort((a, b) => b.mrr - a.mrr).slice(0, 6)

  // The movement table as a file, with plain numbers so a spreadsheet can add them up.
  function exportCsv() {
    const head = ["month", "new", "expansion", "contraction", "churn", "net"].map((key) => t(`columns.${key}` as "columns.month"))
    const lines = rows.map((row) => [format.month(row.month), row.new, row.expansion, row.contraction, row.churn, row.net].join(","))
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "reports.csv"
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success(t("exported"))
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button variant="outline" onClick={exportCsv}>
          <Download /> {t("export")}
        </Button>
      </PageHeader>

      <PanelCard
        title={t("movement")}
        info={t("movementInfo")}
        legend={[
          { color: "success", value: signed(net), label: t("net6") },
          { color: "info", value: format.currency(added), label: t("newTotal") },
        ]}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-4">{t("columns.month")}</TableHead>
              {(["new", "expansion", "contraction", "churn"] as const).map((key) => (
                <TableHead key={key} className="text-end">
                  {t(`columns.${key}`)}
                </TableHead>
              ))}
              <TableHead className="pe-4 text-end">{t("columns.net")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="ps-4 font-medium">{format.month(row.month)}</TableCell>
                {([row.new, row.expansion, row.contraction, row.churn] as const).map((value, i) => (
                  <TableCell key={i} className={cn("text-end tabular-nums", value < 0 ? "text-destructive-text" : "text-muted-foreground")}>
                    {signed(value)}
                  </TableCell>
                ))}
                <TableCell className="pe-4 text-end font-medium tabular-nums">{signed(row.net)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={t("byPlan")} info={t("byPlanInfo")} bodyClassName="flex justify-center p-5">
          <DonutChart data={byPlan} locale={locale} formatOptions={money} aria-label={t("byPlan")}>
            <span className="text-xs text-muted-foreground">{t("total")}</span>
            <span className="font-semibold tabular-nums">{format.currency(byPlan.reduce((sum, p) => sum + p.value, 0))}</span>
          </DonutChart>
        </PanelCard>

        <PanelCard title={t("top")} info={t("topInfo")} bodyClassName="p-5">
          <BarList
            showRank
            color="neutral"
            locale={locale}
            formatOptions={money}
            items={top.map((c) => ({ key: c.id, label: c.name, hint: c.company, value: c.mrr, icon: <Avatar name={c.name} alt="" size="xs" /> }))}
          />
        </PanelCard>
      </div>
    </>
  )
}
