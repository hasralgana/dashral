"use client"

import Link from "next/link"
import { ArrowUpRight, CircleCheck, CreditCard, Download } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Progress } from "@dashral/ui/components/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"
import { toast } from "@dashral/ui/components/toast"

import { PanelCard } from "@/components/inset/panel-card"
import { PageHeader } from "@/components/page-header"
import { billingHistory, workspacePlan } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

/** The workspace's own plan: what it costs, what's been used this period, the card on file and past invoices. */
export function BillingView() {
  const t = useTranslations("inset.billing")
  const format = useFormats()
  const write = (key: string, value: number) => (key === "storage" ? t("gb", { value: format.number(value) }) : format.number(value))

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card
          variant="panel"
          title={t("plan")}
          description={t("renews", { date: format.date(workspacePlan.renews) })}
          action={
            <Button variant="outline" size="sm" className="bg-card" asChild>
              <Link href="/inset/pricing">
                {t("changePlan")} <ArrowUpRight className="rtl:-scale-x-100" />
              </Link>
            </Button>
          }
          className="lg:col-span-2"
          classNames={{ body: "space-y-5" }}
        >
          <p className="flex items-baseline gap-3">
            <span className="font-heading text-2xl font-medium tracking-[-0.02em]">{workspacePlan.name}</span>
            <span className="text-muted-foreground">{t("perMonth", { amount: format.currency(workspacePlan.price) })}</span>
          </p>
          <ul className="grid gap-4 sm:grid-cols-3" aria-label={t("usage")}>
            {workspacePlan.usage.map((meter) => {
              const share = (meter.used / meter.limit) * 100
              return (
                <li key={meter.key} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{t(`meters.${meter.key}`)}</span>
                    <span className="text-muted-foreground tabular-nums">{Math.round(share)}%</span>
                  </div>
                  {/* Nearly full shows in amber, before it's a surprise. */}
                  <Progress value={share} color={share >= 80 ? "warning" : "primary"} aria-label={t(`meters.${meter.key}`)} />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("of", { used: write(meter.key, meter.used), limit: write(meter.key, meter.limit) })}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card
          variant="panel"
          title={t("payment")}
          footer={
            <Button variant="ghost" size="sm" className="-ms-2" onClick={() => toast(t("updateToast"))}>
              <CreditCard /> {t("update")}
            </Button>
          }
        >
          {/* The card on file, drawn small: brand, last four and expiry. */}
          <div className="flex items-center gap-4">
            <span aria-hidden className="flex h-10 w-14 shrink-0 items-end rounded-md bg-linear-to-br from-foreground/90 to-foreground/60 p-1.5">
              <span className="text-[9px] font-semibold tracking-wide text-background">{workspacePlan.card.brand.toUpperCase()}</span>
            </span>
            <div className="min-w-0">
              <p className="font-medium tabular-nums">
                {workspacePlan.card.brand} •••• {workspacePlan.card.last4}
              </p>
              <p className="text-sm text-muted-foreground">{t("expires", { date: workspacePlan.card.expires })}</p>
            </div>
          </div>
        </Card>
      </section>

      <PanelCard title={t("history")} info={t("historyInfo")}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-4">{t("columns.invoice")}</TableHead>
              <TableHead>{t("columns.date")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead className="text-end">{t("columns.amount")}</TableHead>
              <TableHead className="w-12 pe-4">
                <span className="sr-only">PDF</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="ps-4 font-medium tabular-nums">{invoice.id}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(invoice.date)}</TableCell>
                <TableCell>
                  <Badge variant="soft" color="success">
                    <CircleCheck aria-hidden />
                    {t("paid")}
                  </Badge>
                </TableCell>
                <TableCell className="text-end font-medium tabular-nums">{format.currency(invoice.amount)}</TableCell>
                <TableCell className="pe-4 text-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("download", { id: invoice.id })}
                    onClick={() => toast(t("downloading", { id: invoice.id }))}
                  >
                    <Download />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>
    </>
  )
}
