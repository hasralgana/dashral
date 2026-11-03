"use client"

import { useState } from "react"
import { CircleCheck, Clock, Copy, Download, MoreHorizontal, Plus, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { createDataTableColumnHelper, DataTable, DataTableColumnHeader } from "@dashral/ui/components/data-table"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"
import { toast } from "@dashral/ui/components/toast"

import { InvoiceStatusBadge } from "@/components/inset/badges"
import { InsetMetric } from "@/components/inset/inset-metric"
import { PanelCard } from "@/components/inset/panel-card"
import { moneyLocale, type Locale } from "@/lib/i18n"
import { customers, insetToday, invoices as initialInvoices, type Invoice, type InvoiceStatus } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

const helper = createDataTableColumnHelper<Invoice>()
const statuses: InvoiceStatus[] = ["paid", "open", "overdue", "draft"]
const statusColors = { paid: "success", open: "info", overdue: "destructive", draft: "neutral" } as const

export function InvoicesView() {
  const t = useTranslations("inset.invoices")
  const statusT = useTranslations("inset.invoiceStatus")
  const format = useFormats()
  const locale = useLocale()
  const [invoices, setInvoices] = useState(initialInvoices)

  function markPaid(id: string) {
    setInvoices((list) => list.map((invoice) => (invoice.id === id ? { ...invoice, status: "paid" } : invoice)))
    toast.success(t("actions.markedPaid", { id }))
  }

  function createDraft() {
    // The next number, for the first customer without a draft: a demo of a new row arriving at the top.
    const next = Math.max(...invoices.map((invoice) => Number(invoice.id.slice(4)))) + 1
    const customer = customers.find((c) => c.mrr > 0 && !invoices.some((i) => i.customerId === c.id && i.status === "draft")) ?? customers[0]!
    const draft: Invoice = {
      id: `INV-${next}`,
      customerId: customer.id,
      customer: customer.name,
      email: customer.email,
      issued: insetToday,
      due: insetToday,
      amount: customer.mrr,
      status: "draft",
    }
    setInvoices((list) => [draft, ...list])
    toast.success(t("created"), { description: `${draft.id} · ${customer.name}` })
  }

  const columns = helper.columns([
    helper.accessor("id", {
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.invoice")} />,
      cell: ({ getValue }) => <span className="font-medium whitespace-nowrap tabular-nums">{getValue()}</span>,
      enableHiding: false,
    }),
    helper.accessor((row) => `${row.customer} ${row.email}`, {
      id: "customer",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.customer")} />,
      cell: ({ row }) => (
        <div className="flex min-w-44 items-center gap-2.5">
          <Avatar name={row.original.customer} alt="" size="sm" />
          <span className="truncate">{row.original.customer}</span>
        </div>
      ),
    }),
    helper.accessor("issued", {
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.issued")} />,
      cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(getValue())}</span>,
      enableGlobalFilter: false,
    }),
    helper.accessor("due", {
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.due")} />,
      cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(getValue())}</span>,
      enableGlobalFilter: false,
    }),
    helper.accessor("status", {
      header: t("columns.status"),
      cell: ({ getValue }) => <InvoiceStatusBadge status={getValue()} />,
      filterFn: "oneOf",
      enableGlobalFilter: false,
    }),
    helper.accessor("amount", {
      header: ({ column }) => (
        <div className="text-end">
          <DataTableColumnHeader column={column} title={t("columns.amount")} className="-me-3" />
        </div>
      ),
      cell: ({ getValue }) => <div className="text-end font-medium tabular-nums">{format.currency(getValue())}</div>,
      enableGlobalFilter: false,
    }),
    helper.display({
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu
              align="end"
              className="w-48"
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={t("actions.label", { id: invoice.id })}>
                  <MoreHorizontal />
                </Button>
              }
              items={[
                ...(invoice.status === "open" || invoice.status === "overdue"
                  ? [{ label: t("actions.markPaid"), icon: <CircleCheck />, onSelect: () => markPaid(invoice.id) }, { type: "separator" as const }]
                  : []),
                {
                  label: t("actions.copyId"),
                  icon: <Copy />,
                  onSelect: () => {
                    void navigator.clipboard?.writeText(invoice.id)
                    toast.success(t("actions.copied", { id: invoice.id }))
                  },
                },
                { label: t("actions.download"), icon: <Download />, onSelect: () => toast(t("actions.downloading", { id: invoice.id })) },
              ]}
            />
          </div>
        )
      },
    }),
  ])

  // The summary follows the table: marking an invoice paid moves its amount across.
  const total = (status: InvoiceStatus) => invoices.filter((invoice) => invoice.status === status)
  const money = moneyLocale(locale as Locale)
  const summary = [
    { status: "paid", icon: CircleCheck },
    { status: "open", icon: Clock },
    { status: "overdue", icon: TriangleAlert },
  ] as const

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map(({ status, icon: Icon }) => {
          const list = total(status)
          return (
            <InsetMetric
              key={status}
              label={t(`summary.${status}`)}
              value={list.reduce((sum, invoice) => sum + invoice.amount, 0)}
              locale={money}
              formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
              icon={<Icon />}
            >
              <p className="text-xs text-muted-foreground">{t("summary.count", { count: list.length })}</p>
            </InsetMetric>
          )
        })}
      </section>

      <PanelCard
        title={t("all")}
        info={t("allDescription")}
        legend={statuses.map((status) => ({ color: statusColors[status], value: total(status).length, label: statusT(status) }))}
        actions={
          <Button size="sm" onClick={createDraft}>
            <Plus /> {t("newInvoice")}
          </Button>
        }
        bodyClassName="p-4"
      >
        <DataTable
          columns={columns}
          data={invoices}
          getRowId={(row) => row.id}
          searchPlaceholder={t("search")}
          filters={[{ column: "status", title: t("columns.status"), options: statuses.map((status) => ({ value: status, label: statusT(status) })) }]}
          exportable={{ filename: "invoices", columns: { actions: false, customer: { label: t("columns.customer"), value: (row) => row.customer } } }}
          emptyMessage={t("empty")}
        />
      </PanelCard>
    </>
  )
}

