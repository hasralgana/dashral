"use client"

import { useMemo, useState } from "react"
import { CircleCheck, Clock, Eye } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import {
  createDataTableColumnHelper,
  DataTable,
  DataTableColumnHeader,
  dataTableSelectColumn,
} from "@dashral/ui/components/data-table"
import { toast } from "@dashral/ui/components/toast"
import { cn } from "@dashral/ui/lib/utils"

import { transactions as sample, type Account, type Transaction, type TransactionCategory, type TransactionStatus } from "@/lib/finance-data"
import { formats } from "@/lib/format"
import { localeInfo, moneyLocale } from "@/lib/i18n"

const helper = createDataTableColumnHelper<Transaction>()
const categories: TransactionCategory[] = ["revenue", "payroll", "software", "marketing", "office", "travel", "tax"]
const statuses: TransactionStatus[] = ["cleared", "pending", "review"]
const accounts: Account[] = ["operating", "reserve", "card"]
// Status is always icon + label, never color alone.
const statusStyle = {
  cleared: { icon: CircleCheck, color: "success" },
  pending: { icon: Clock, color: "info" },
  review: { icon: Eye, color: "warning" },
} as const

export function TransactionsTable() {
  const t = useTranslations("finance")
  const locale = useLocale()
  const [rows, setRows] = useState(sample)

  // Built once per language: DataTable renders each cell as a component, so new column functions on every render
  // would remount every cell (open menus, hover cards and focus would be lost) whenever the page's state changes.
  const columns = useMemo(() => {
    const format = formats(localeInfo[locale].intl, moneyLocale(locale))
    return helper.columns([
      dataTableSelectColumn<Transaction>(),
      helper.accessor("date", {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground tabular-nums">{format.date(getValue())}</span>,
        enableGlobalFilter: false,
      }),
      // The party and the memo together, so the search finds either.
      helper.accessor((row) => `${row.party} ${t(`memos.${row.memo}`)} ${row.id}`, {
        id: "party",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.party")} />,
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium">{row.original.party}</p>
            <p className="text-xs text-muted-foreground">
              {t(`memos.${row.original.memo}`)} · <span className="tabular-nums">{row.original.id}</span>
            </p>
          </div>
        ),
        enableHiding: false,
      }),
      helper.accessor("category", {
        header: t("table.category"),
        cell: ({ getValue }) => <Badge variant="outline">{t(`categories.${getValue()}`)}</Badge>,
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("account", {
        header: t("table.account"),
        cell: ({ getValue }) => <span className="whitespace-nowrap text-muted-foreground">{t(`accounts.${getValue()}`)}</span>,
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("status", {
        header: t("table.status"),
        cell: ({ getValue }) => {
          const { icon: Icon, color } = statusStyle[getValue()]
          return (
            <Badge variant="soft" color={color}>
              <Icon aria-hidden />
              {t(`statuses.${getValue()}`)}
            </Badge>
          )
        },
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("amount", {
        header: ({ column }) => (
          <div className="text-end">
            <DataTableColumnHeader column={column} title={t("table.amount")} className="-me-3" />
          </div>
        ),
        cell: ({ getValue }) => (
          <div className={cn("text-end font-medium whitespace-nowrap tabular-nums", getValue() > 0 && "text-success-text")}>
            {getValue() > 0 ? "+" : ""}
            {format.currency(getValue())}
          </div>
        ),
        enableGlobalFilter: false,
      }),
    ])
  }, [t, locale])

  const toReview = rows.filter((row) => row.status === "review").length

  return (
    <Card
      title={t("table.title")}
      description={t("table.description", { count: rows.length, review: toReview })}
      classNames={{ body: "pt-0" }}
    >
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        searchPlaceholder={t("table.search")}
        filters={[
          { column: "category", title: t("table.category"), options: categories.map((value) => ({ value, label: t(`categories.${value}`) })) },
          { column: "account", title: t("table.account"), options: accounts.map((value) => ({ value, label: t(`accounts.${value}`) })) },
          { column: "status", title: t("table.status"), options: statuses.map((value) => ({ value, label: t(`statuses.${value}`) })) },
        ]}
        toolbar={(table) => {
          const ids = Object.keys(table.state.rowSelection)
          if (!ids.length) return null
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRows((current) => current.map((row) => (ids.includes(row.id) ? { ...row, status: "cleared" } : row)))
                table.resetRowSelection()
                toast.success(t("table.markedCleared", { count: ids.length }))
              }}
            >
              <CircleCheck /> {t("table.markCleared")}
            </Button>
          )
        }}
        exportable={{
          filename: "transactions",
          columns: { party: { label: t("table.party"), value: (row) => row.party } },
          extraColumns: [{ label: t("table.memo"), value: (row) => t(`memos.${row.memo}`) }],
        }}
        emptyMessage={t("table.empty")}
        autoResetPage={false}
      />
    </Card>
  )
}
