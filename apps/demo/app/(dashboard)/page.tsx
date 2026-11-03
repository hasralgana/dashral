import Link from "next/link"
import { DollarSign, Download, RotateCcw, ShoppingBag, UserPlus } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { MetricCard } from "@dashral/ui/components/metric-card"
import { Progress } from "@dashral/ui/components/progress"
import { Sparkline } from "@dashral/ui/components/sparkline"

import { RevenueChart } from "@/components/charts/revenue-chart"
import { SalesChart } from "@/components/charts/sales-chart"
import { OrdersTable } from "@/components/dashboard/orders-table"
import { TrafficSources } from "@/components/dashboard/traffic-sources"
import { PageHeader } from "@/components/page-header"
import { monthlyRevenue, orders, stats, topProducts, trafficSources, weeklySales } from "@/lib/data"
import { getTranslations } from "next-intl/server"

import { getFormats, getIntlLocale, getMoneyLocale } from "@/lib/i18n-server"
import { featureHref } from "@/lib/pro-features"

const statIcons = [DollarSign, ShoppingBag, UserPlus, RotateCcw]

export default async function OverviewPage() {
  const t = await getTranslations("overview")
  const format = await getFormats()
  const locale = await getIntlLocale()
  const money = await getMoneyLocale()
  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0)
  const topSales = Math.max(...topProducts.map((p) => p.sales))

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button variant="outline">
          <Download /> {t("export")}
        </Button>
      </PageHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("keyMetrics")}>
        {stats.map((stat, i) => {
          const Icon = statIcons[i] ?? DollarSign
          // A fall is shown in green where down is good news (refunds).
          const good = (stat.delta >= 0) === stat.upIsGood
          return (
            <MetricCard
              key={stat.label}
              label={t(`stats.${stat.label}`)}
              value={stat.value}
              locale={stat.format.style === "currency" ? money : locale}
              formatOptions={stat.format}
              change={stat.delta}
              changeLabel={t("vsLastMonth")}
              invert={!stat.upIsGood}
              icon={<Icon />}
              countOnMount
            >
              <Sparkline
                data={stat.trend}
                variant="area"
                className={good ? "h-9 text-primary" : "h-9 text-destructive"}
                aria-label={t("trendLabel", { label: t(`stats.${stat.label}`), direction: good ? t("improving") : t("worsening") })}
              />
            </MetricCard>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title={t("revenue")}
          description={t("revenueDescription", { from: format.month(0), to: format.month(11), year: "2026" })}
          action={
            <>
              <p className="text-xl font-semibold">{format.currency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">{t("yearToDate")}</p>
            </>
          }
          className="xl:col-span-2"
          classNames={{ action: "text-end", body: "ps-2" }}
        >
          <RevenueChart data={monthlyRevenue} />
        </Card>

        <Card title={t("ordersWeek")} description={t("ordersWeekDescription")}>
          <SalesChart data={weeklySales} />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title={t("recentOrders")}
          description={t("recentOrdersDescription")}
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href={featureHref("ecommerce", "/orders")}>{t("viewAll")}</Link>
            </Button>
          }
          className="xl:col-span-2"
        >
          <OrdersTable orders={orders.slice(0, 5)} compact />
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card title={t("trafficSources")} description={t("trafficDescription")}>
            <TrafficSources data={trafficSources} />
          </Card>

          <Card title={t("topProducts")} description={t("topProductsDescription")} classNames={{ body: "space-y-4" }}>
            {topProducts.map((p) => (
              <div key={p.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("sold", { count: format.number(p.sales) })}
                  </span>
                </div>
                <Progress value={(p.sales / topSales) * 100} aria-label={t("productSales", { name: p.name })} />
              </div>
            ))}
          </Card>
        </div>
      </section>
    </>
  )
}
