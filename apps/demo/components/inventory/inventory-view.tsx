"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleCheck, CircleX, LayoutGrid, List, PackagePlus, TriangleAlert } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Alert } from "@dashral/ui/components/alert"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { createDataTableColumnHelper, DataTable, DataTableColumnHeader } from "@dashral/ui/components/data-table"
import { NumberInput } from "@dashral/ui/components/number-input"
import { Progress } from "@dashral/ui/components/progress"
import { Select } from "@dashral/ui/components/select"
import { Skeleton } from "@dashral/ui/components/skeleton"
import { Slider } from "@dashral/ui/components/slider"
import { toast } from "@dashral/ui/components/toast"
import { ToggleGroup } from "@dashral/ui/components/toggle-group"

import { items as sample, stockStatus, warehouses, type Item, type ItemCategory, type StockStatus } from "@/lib/inventory-data"
import { formats } from "@/lib/format"
import { localeInfo, moneyLocale } from "@/lib/i18n"
import { useFormats } from "@/lib/use-formats"

const helper = createDataTableColumnHelper<Item>()
const categories: ItemCategory[] = ["kitchen", "living", "bedroom", "outdoor"]
// Always icon + label, never color alone.
const statusStyle = {
  inStock: { icon: CircleCheck, color: "success" },
  low: { icon: TriangleAlert, color: "warning" },
  out: { icon: CircleX, color: "destructive" },
} as const

export function InventoryView() {
  const t = useTranslations("inventory")
  const format = useFormats()
  const [rows, setRows] = useState(sample)
  const [warehouse, setWarehouse] = useState("all")
  const [margin, setMargin] = useState(0)
  const [view, setView] = useState("table")
  // A warehouse's stock "loads" for a moment, as it would from a stock system.
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setLoading(false), 550)
    return () => clearTimeout(timer)
  }, [loading])

  const shown = warehouse === "all" ? rows : rows.filter((row) => row.warehouse === warehouse)
  const status = (item: Item): StockStatus => stockStatus(item, margin / 100)
  const reorder = shown.filter((item) => status(item) !== "inStock" && item.incoming === 0)

  // The columns stay the same while counts change. DataTable renders each cell as a component, so new column functions
  // on every render would remount the NumberInput under the pointer: its focus ring would blink on each click.
  const locale = useLocale()
  const columns = useMemo(() => {
    const format = formats(localeInfo[locale].intl, moneyLocale(locale))
    const status = (item: Item): StockStatus => stockStatus(item, margin / 100)
    const setOnHand = (sku: string, onHand: number) => setRows((current) => current.map((row) => (row.sku === sku ? { ...row, onHand } : row)))
    return helper.columns([
      helper.accessor((row) => `${row.name} ${row.sku}`, {
        id: "item",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.item")} />,
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{row.original.sku}</p>
          </div>
        ),
        enableHiding: false,
      }),
      helper.accessor("category", {
        header: t("table.category"),
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{t(`categories.${getValue()}`)}</span>,
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor("warehouse", {
        header: t("table.warehouse"),
        cell: ({ getValue }) => <span className="text-sm whitespace-nowrap">{t(`warehouses.${getValue()}`)}</span>,
        enableGlobalFilter: false,
      }),
      helper.accessor("onHand", {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.onHand")} />,
        cell: ({ row }) => (
          <NumberInput
            aria-label={t("table.onHandOf", { name: row.original.name })}
            value={row.original.onHand}
            onValueChange={(value) => setOnHand(row.original.sku, value ?? 0)}
            min={0}
            max={9999}
            className="w-32"
          />
        ),
        enableGlobalFilter: false,
      }),
      helper.accessor("reorderPoint", {
        header: t("table.reorderAt"),
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{format.number(getValue())}</span>,
        enableGlobalFilter: false,
      }),
      helper.accessor((row) => status(row), {
        id: "status",
        header: t("table.status"),
        cell: ({ row }) => <StatusBadge status={status(row.original)} incoming={row.original.incoming} />,
        filterFn: "oneOf",
        enableGlobalFilter: false,
      }),
      helper.accessor((row) => row.onHand * row.unitCost, {
        id: "value",
        header: ({ column }) => (
          <div className="text-end">
            <DataTableColumnHeader column={column} title={t("table.value")} className="-me-3" />
          </div>
        ),
        cell: ({ getValue }) => <div className="text-end font-medium tabular-nums">{format.currency(getValue())}</div>,
        enableGlobalFilter: false,
      }),
    ])
  }, [t, locale, margin])

  return (
    <>
      {reorder.length > 0 && (
        <Alert
          color="warning"
          title={t("alert.title", { count: reorder.length })}
          description={reorder.map((item) => item.name).join(", ")}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRows((current) => current.map((row) => (reorder.some((item) => item.sku === row.sku) ? { ...row, incoming: row.reorderPoint * 2 } : row)))
                toast.success(t("alert.ordered", { count: reorder.length }))
              }}
            >
              <PackagePlus /> {t("alert.order")}
            </Button>
          }
        />
      )}

      <Card
        title={t("table.title")}
        description={t("table.description")}
        action={
          <ToggleGroup
            type="single"
            attached
            aria-label={t("view.label")}
            value={view}
            onValueChange={(value: string) => value && setView(value)}
            items={[
              { value: "table", icon: <List />, "aria-label": t("view.table") },
              { value: "grid", icon: <LayoutGrid />, "aria-label": t("view.grid") },
            ]}
          />
        }
        classNames={{ body: "space-y-5 pt-0" }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label={t("filters.warehouse")}
            value={warehouse}
            onValueChange={(value) => {
              setWarehouse(value)
              setLoading(true)
            }}
            options={[{ value: "all", label: t("filters.allWarehouses") }, ...warehouses.map((value) => ({ value, label: t(`warehouses.${value}`) }))]}
          />
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium" id="safety-margin">
                {t("filters.margin")}
              </span>
              <span className="text-muted-foreground tabular-nums">+{format.number(margin)}%</span>
            </div>
            <Slider
              aria-labelledby="safety-margin"
              value={[margin]}
              onValueChange={([value]) => setMargin(value ?? 0)}
              min={0}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">{t("filters.marginHint")}</p>
          </div>
        </div>

        {loading ? (
          <div aria-busy="true" aria-label={t("loading")} className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : view === "table" ? (
          <DataTable
            columns={columns}
            data={shown}
            getRowId={(row) => row.sku}
            searchPlaceholder={t("table.search")}
            filters={[
              { column: "category", title: t("table.category"), options: categories.map((value) => ({ value, label: t(`categories.${value}`) })) },
              { column: "status", title: t("table.status"), options: (["inStock", "low", "out"] as const).map((value) => ({ value, label: t(`statuses.${value}`) })) },
            ]}
            exportable={{ filename: "inventory", columns: { item: { label: t("table.item"), value: (row) => row.name } } }}
            emptyMessage={t("table.empty")}
            autoResetPage={false}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((item) => (
              <li key={item.sku}>
                <Card variant="inset" classNames={{ body: "space-y-3" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="tabular-nums">{item.sku}</span> · {t(`warehouses.${item.warehouse}`)}
                      </p>
                    </div>
                    <StatusBadge status={status(item)} incoming={item.incoming} />
                  </div>
                  <Progress
                    value={Math.min(100, (item.onHand / (item.reorderPoint * 3)) * 100)}
                    color={status(item) === "inStock" ? "primary" : status(item) === "low" ? "warning" : "destructive"}
                    aria-label={t("table.onHandOf", { name: item.name })}
                  />
                  <p className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("grid.units", { count: item.onHand })}</span>
                    <span className="font-medium tabular-nums">{format.currency(item.onHand * item.unitCost)}</span>
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function StatusBadge({ status, incoming }: { status: StockStatus; incoming: number }) {
  const t = useTranslations("inventory")
  const format = useFormats()
  const { icon: Icon, color } = statusStyle[status]
  return (
    <span className="flex flex-col items-start gap-0.5">
      <Badge variant="soft" color={color}>
        <Icon aria-hidden />
        {t(`statuses.${status}`)}
      </Badge>
      {incoming > 0 && status !== "inStock" && <span className="text-xs text-muted-foreground">{t("table.incoming", { count: format.number(incoming) })}</span>}
    </span>
  )
}
