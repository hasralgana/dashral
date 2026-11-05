import type { Metadata } from "next"
import { CalendarClock, Flame, Landmark, TrendingUp } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card } from "@dashral/ui/components/card"
import { MetricCard } from "@dashral/ui/components/metric-card"

import { BudgetCard } from "@/components/finance/budget-card"
import { CashFlowChart } from "@/components/finance/cash-flow-chart"
import { FinanceActions } from "@/components/finance/finance-actions"
import { TransactionsTable } from "@/components/finance/transactions-table"
import { PageHeader } from "@/components/page-header"
import { getFormats, getIntlLocale, getMoneyLocale } from "@/lib/i18n-server"
import { balances, cashFlow, transactions } from "@/lib/finance-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finance")
  return { title: t("title"), description: t("description") }
}

export default async function FinancePage() {
  const t = await getTranslations("finance")
  const format = await getFormats()
  const locale = await getIntlLocale()
  const money = await getMoneyLocale()
  const cash = balances.operating + balances.reserve
  const october = transactions.filter((tx) => tx.date.startsWith("2026-10") && tx.category === "revenue" && tx.amount > 0)
  const revenue = october.reduce((sum, tx) => sum + tx.amount, 0)
  const runway = Math.floor(cash / balances.burn)
  const dollars = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const
  // "18 months", "18 bulan", "١٨ شهرًا": the unit is written in the reader's language.
  const months = { style: "unit", unit: "month", unitDisplay: "long" } as const

  const metrics = [
    { label: t("metrics.cash"), value: cash, icon: Landmark, options: dollars, change: 4.2 },
    { label: t("metrics.burn"), value: balances.burn, icon: Flame, options: dollars, change: -6.8, invert: true },
    { label: t("metrics.runway"), value: runway, icon: CalendarClock, options: months, unit: true, change: 2 },
    { label: t("metrics.revenue"), value: revenue, icon: TrendingUp, options: dollars, change: 11.4 },
  ]
  const last = cashFlow.at(-1)!

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <FinanceActions />
      </PageHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("metrics.label")}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            locale={metric.options === dollars ? money : locale}
            formatOptions={metric.options}
            change={metric.change}
            changeUnit={metric.unit ? t("metrics.monthsShort") : "%"}
            changeLabel={metric.unit ? t("metrics.monthsLonger") : t("metrics.vsLastMonth")}
            invert={metric.invert}
            icon={<metric.icon />}
            countOnMount
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title={t("cashFlow.title")}
          description={t("cashFlow.description", { from: format.month(0), to: format.month(last.month) })}
          action={
            <>
              <p className="text-xl font-semibold tabular-nums">{format.currency(last.inflow - last.outflow)}</p>
              <p className="text-xs text-muted-foreground">{t("cashFlow.netThisMonth")}</p>
            </>
          }
          className="xl:col-span-2"
          classNames={{ action: "text-end", body: "ps-2" }}
        >
          <CashFlowChart />
        </Card>
        <BudgetCard />
      </section>

      <TransactionsTable />
    </>
  )
}
