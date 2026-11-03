"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { createDataTableColumnHelper, DataTable, DataTableColumnHeader } from "@dashral/ui/components/data-table"
import { Sheet } from "@dashral/ui/components/sheet"

import { CustomerStatusBadge, InvoiceStatusBadge, PlanBadge } from "@/components/inset/badges"
import { PanelCard } from "@/components/inset/panel-card"
import { customers, invoices, type Customer, type CustomerStatus, type Plan } from "@/lib/inset-data"
import { useFormats } from "@/lib/use-formats"

const helper = createDataTableColumnHelper<Customer>()
const plans: Plan[] = ["starter", "growth", "scale"]
const statuses: CustomerStatus[] = ["active", "trial", "atRisk", "churned"]
const statusColors = { active: "success", trial: "info", atRisk: "warning", churned: "neutral" } as const

export function CustomersView() {
  const t = useTranslations("inset.customers")
  const planT = useTranslations("inset.plans")
  const statusT = useTranslations("inset.customerStatus")
  const format = useFormats()
  const [open, setOpen] = useState<Customer | null>(null)

  const columns = helper.columns([
    // Name, email and company together, so the search finds any of them.
    helper.accessor((row) => `${row.name} ${row.email} ${row.company}`, {
      id: "customer",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.customer")} />,
      cell: ({ row }) => (
        <div className="flex min-w-52 items-center gap-3">
          <Avatar name={row.original.name} alt="" size="md" />
          <div className="min-w-0">
            {/* The name opens the customer in a sheet. */}
            <button
              type="button"
              onClick={() => setOpen(row.original)}
              className="rounded-sm text-start font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={t("details.open", { name: row.original.name })}
            >
              {row.original.name}
            </button>
            <p className="truncate text-xs text-muted-foreground">{row.original.company}</p>
          </div>
        </div>
      ),
      enableHiding: false,
    }),
    helper.accessor("plan", {
      header: t("columns.plan"),
      cell: ({ getValue }) => <PlanBadge plan={getValue()} />,
      filterFn: "oneOf",
      enableGlobalFilter: false,
    }),
    helper.accessor("status", {
      header: t("columns.status"),
      cell: ({ getValue }) => <CustomerStatusBadge status={getValue()} />,
      filterFn: "oneOf",
      enableGlobalFilter: false,
    }),
    helper.accessor("mrr", {
      header: ({ column }) => (
        <div className="text-end">
          <DataTableColumnHeader column={column} title={t("columns.mrr")} className="-me-3" />
        </div>
      ),
      cell: ({ getValue }) => <div className="text-end font-medium tabular-nums">{getValue() ? format.currency(getValue()) : <span className="text-muted-foreground">—</span>}</div>,
      enableGlobalFilter: false,
    }),
    helper.accessor("since", {
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("columns.since")} />,
      cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(getValue())}</span>,
      enableGlobalFilter: false,
    }),
    helper.accessor("country", {
      header: t("columns.country"),
      cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue()}</span>,
    }),
  ])

  return (
    <>
      <PanelCard
        title={t("all")}
        info={t("allDescription", { count: customers.length, plans: plans.length })}
        legend={statuses.map((status) => ({
          color: statusColors[status],
          value: customers.filter((customer) => customer.status === status).length,
          label: statusT(status),
        }))}
        bodyClassName="p-4"
      >
        <DataTable
          columns={columns}
          data={customers}
          getRowId={(row) => row.id}
          searchPlaceholder={t("search")}
          filters={[
            { column: "plan", title: t("columns.plan"), options: plans.map((plan) => ({ value: plan, label: planT(plan) })) },
            { column: "status", title: t("columns.status"), options: statuses.map((status) => ({ value: status, label: statusT(status) })) },
          ]}
          exportable={{
            filename: "customers",
            columns: { customer: { label: t("columns.customer"), value: (row) => row.name } },
            extraColumns: [{ label: "Email", value: (row) => row.email }],
          }}
          emptyMessage={t("empty")}
        />
      </PanelCard>

      <Sheet
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
        title={open?.name ?? ""}
        description={open?.company}
        className="w-full sm:max-w-md"
        classNames={{ body: "space-y-4 p-4", footer: "border-t" }}
        footer={
          open && (
            <Button asChild className="w-full">
              <a href={`mailto:${open.email}`}>
                <Mail /> {t("details.email")}
              </a>
            </Button>
          )
        }
      >
        {open && <CustomerDetails customer={open} />}
      </Sheet>
    </>
  )
}

function CustomerDetails({ customer }: { customer: Customer }) {
  const t = useTranslations("inset.customers.details")
  const format = useFormats()
  const theirs = invoices.filter((invoice) => invoice.customerId === customer.id)
  const rows = [
    { label: t("contact"), value: <span className="break-all">{customer.email}</span> },
    { label: t("mrr"), value: customer.mrr ? t("perMonth", { amount: format.currency(customer.mrr) }) : "—" },
    { label: t("since"), value: format.date(customer.since) },
    { label: t("country"), value: customer.country },
  ]
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={customer.name} alt="" size="lg" />
        {/* The name and company are the sheet's title; here the status and plan, at a glance. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <CustomerStatusBadge status={customer.status} />
          <PlanBadge plan={customer.plan} />
        </div>
      </div>

      <Card variant="inset" classNames={{ body: "p-0" }}>
        <dl className="divide-y divide-divider text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-end font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card variant="inset" title={t("invoices")} classNames={{ body: "p-0", title: "text-sm" }}>
        {theirs.length ? (
          <ul className="divide-y divide-divider text-sm">
            {theirs.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium tabular-nums">{invoice.id}</p>
                  <p className="text-xs text-muted-foreground">{format.date(invoice.issued)}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
                <span className="w-16 text-end font-medium tabular-nums">{format.currency(invoice.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>
        )}
      </Card>
    </>
  )
}
