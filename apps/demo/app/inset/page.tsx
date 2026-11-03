import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, CircleDollarSign, Download, Plus, Receipt, UserMinus, Users } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Sparkline } from "@dashral/ui/components/sparkline"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"

import { RevenueChart } from "@/components/charts/revenue-chart"
import { ActivityTimeline } from "@/components/inset/activity"
import { InvoiceStatusBadge } from "@/components/inset/badges"
import { DeliveryList } from "@/components/inset/delivery-list"
import { InsetMetric } from "@/components/inset/inset-metric"
import { PanelCard } from "@/components/inset/panel-card"
import { PageHeader } from "@/components/page-header"
import { getFormats, getIntlLocale, getMoneyLocale } from "@/lib/i18n-server"
import { activity, insetMetrics, invoices, mrrByMonth } from "@/lib/inset-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inset.overview")
  return { title: `${t("title")} · Inset`, description: t("description") }
}

const invoiceColors = { paid: "success", open: "info", overdue: "destructive" } as const

const metricIcons = { mrr: CircleDollarSign, activeCustomers: Users, outstanding: Receipt, churn: UserMinus }

/** A link at the foot of an inset card, on its frame. */
function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
    </Link>
  )
}

export default async function InsetOverviewPage() {
  const t = await getTranslations("inset.overview")
  const deliveriesT = await getTranslations("inset.deliveries")
  const statusT = await getTranslations("inset.invoiceStatus")
  const format = await getFormats()
  const locale = await getIntlLocale()
  const money = await getMoneyLocale()

  return (
    <>
      <PageHeader title={t("title")} description={t("description")}>
        <Button variant="outline">
          <Download /> {t("export")}
        </Button>
        <Button asChild>
          <Link href="/inset/invoices">
            <Plus /> {t("newInvoice")}
          </Link>
        </Button>
      </PageHeader>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("keyMetrics")}>
        {insetMetrics.map((metric) => {
          const Icon = metricIcons[metric.key]
          const label = t(`metrics.${metric.key}`)
          const good = (metric.delta >= 0) === metric.upIsGood
          return (
            <InsetMetric
              key={metric.key}
              label={label}
              value={metric.value}
              locale={metric.format.style === "currency" ? money : locale}
              formatOptions={metric.format}
              change={metric.delta}
              changeUnit={metric.key === "churn" ? " pts" : "%"}
              changeLabel={t("vsLastMonth")}
              invert={!metric.upIsGood}
              icon={<Icon />}
            >
              <Sparkline
                data={metric.trend}
                variant="area"
                className={good ? "h-10 text-foreground" : "h-10 text-destructive"}
                aria-label={t("trendLabel", { label, direction: good ? t("improving") : t("worsening") })}
              />
            </InsetMetric>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PanelCard
          title={t("revenueTitle")}
          info={t("revenueDescription", { from: format.month(0), to: format.month(11), year: "2026" })}
          legend={[
            { color: "primary", value: format.currency(mrrByMonth.at(-1)!.revenue), label: t("thisMonth") },
            { color: "success", value: `+${format.number(insetMetrics[0]!.delta)}%`, label: t("vsLastMonth") },
          ]}
          className="xl:col-span-2"
          bodyClassName="pe-4 ps-1 pt-5 pb-3"
        >
          <RevenueChart data={mrrByMonth} />
        </PanelCard>

        <Card
          variant="panel"
          title={t("deliveredTo")}
          description={deliveriesT("sent", { count: 128 })}
          footer={<CardLink href="/inset/integrations">{t("manageIntegrations")}</CardLink>}
          classNames={{ body: "bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-muted/30 [background-size:16px_16px] p-3" }}
        >
          <DeliveryList />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PanelCard
          title={t("recentInvoices")}
          info={t("recentInvoicesDescription")}
          legend={(["paid", "open", "overdue"] as const).map((status) => ({
            color: invoiceColors[status],
            value: invoices.filter((invoice) => invoice.status === status).length,
            label: statusT(status),
          }))}
          actions={<CardLink href="/inset/invoices">{t("viewAll")}</CardLink>}
          className="xl:col-span-2"
        >
          <InvoicesPreview />
        </PanelCard>

        <Card
          variant="panel"
          title={t("latestActivity")}
          description={t("latestActivityDescription")}
          footer={<CardLink href="/inset/activity">{t("viewActivity")}</CardLink>}
          classNames={{ body: "p-5" }}
        >
          <ActivityTimeline events={activity.slice(0, 5)} />
        </Card>
      </section>
    </>
  )
}

async function InvoicesPreview() {
  const t = await getTranslations("inset.invoices.columns")
  const format = await getFormats()
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="ps-4">{t("invoice")}</TableHead>
          <TableHead>{t("customer")}</TableHead>
          <TableHead className="max-sm:hidden">{t("due")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead className="pe-4 text-end">{t("amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 8).map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="ps-4 font-medium tabular-nums">{invoice.id}</TableCell>
            <TableCell className="whitespace-nowrap">{invoice.customer}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums max-sm:hidden">{format.date(invoice.due)}</TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="pe-4 text-end font-medium tabular-nums">{format.currency(invoice.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
