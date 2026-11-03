"use client"

import { useMemo, useRef, useState } from "react"
import { CircleCheck, CircleX, Clock, MoreHorizontal, PackageCheck, Plus, RotateCcw, Truck } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import {
  createDataTableColumnHelper,
  DataTable,
  DataTableColumnHeader,
  dataTableSelectColumn,
  type DataTableFilter,
} from "@dashral/ui/components/data-table"
import { DropdownMenu } from "@dashral/ui/components/dropdown-menu"

export type Payment = "paid" | "pending" | "refunded" | "failed"
export type Fulfillment = "unfulfilled" | "shipped" | "delivered"
export type Order = {
  id: string
  date: string
  customer: string
  email: string
  avatar?: string
  items: number
  total: number
  payment: Payment
  fulfillment: Fulfillment
}

const initialOrders: Order[] = [
  { id: "#1048", date: "2026-10-17", customer: "Olivia Martin", email: "olivia@example.com", avatar: "https://randomuser.me/api/portraits/women/44.jpg", items: 3, total: 249, payment: "paid", fulfillment: "unfulfilled" },
  { id: "#1047", date: "2026-10-17", customer: "Jackson Lee", email: "jackson@example.com", avatar: "https://randomuser.me/api/portraits/men/22.jpg", items: 1, total: 129, payment: "pending", fulfillment: "unfulfilled" },
  { id: "#1046", date: "2026-10-16", customer: "Isabella Nguyen", email: "isabella@example.com", avatar: "https://randomuser.me/api/portraits/women/65.jpg", items: 2, total: 98, payment: "paid", fulfillment: "shipped" },
  { id: "#1045", date: "2026-10-16", customer: "William Kim", email: "will@example.com", items: 1, total: 129, payment: "refunded", fulfillment: "delivered" },
  { id: "#1044", date: "2026-10-15", customer: "Sofia Davis", email: "sofia@example.com", avatar: "https://randomuser.me/api/portraits/women/68.jpg", items: 4, total: 412, payment: "paid", fulfillment: "delivered" },
  { id: "#1043", date: "2026-10-15", customer: "Budi Santoso", email: "budi@example.com", items: 1, total: 249, payment: "failed", fulfillment: "unfulfilled" },
  { id: "#1042", date: "2026-10-14", customer: "Ayu Lestari", email: "ayu@example.com", avatar: "https://randomuser.me/api/portraits/women/12.jpg", items: 2, total: 74, payment: "paid", fulfillment: "shipped" },
  { id: "#1041", date: "2026-10-14", customer: "Liam Johnson", email: "liam@example.com", avatar: "https://randomuser.me/api/portraits/men/32.jpg", items: 5, total: 538, payment: "paid", fulfillment: "delivered" },
  { id: "#1040", date: "2026-10-13", customer: "Emma Wilson", email: "emma@example.com", items: 1, total: 249, payment: "pending", fulfillment: "unfulfilled" },
  { id: "#1039", date: "2026-10-13", customer: "Rizky Pratama", email: "rizky@example.com", avatar: "https://randomuser.me/api/portraits/men/75.jpg", items: 2, total: 98, payment: "paid", fulfillment: "delivered" },
  { id: "#1038", date: "2026-10-12", customer: "Noah Brown", email: "noah@example.com", items: 3, total: 187, payment: "paid", fulfillment: "delivered" },
  { id: "#1037", date: "2026-10-11", customer: "Mia Garcia", email: "mia@example.com", avatar: "https://randomuser.me/api/portraits/women/90.jpg", items: 1, total: 49, payment: "refunded", fulfillment: "unfulfilled" },
]

const day = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

// Status is always an icon and a word, never color alone.
const payments = {
  paid: { label: "Paid", icon: CircleCheck, color: "success" },
  pending: { label: "Pending", icon: Clock, color: "warning" },
  refunded: { label: "Refunded", icon: RotateCcw, color: "neutral" },
  failed: { label: "Failed", icon: CircleX, color: "destructive" },
} as const
const fulfillments = {
  unfulfilled: { label: "Unfulfilled", icon: Clock, color: "warning" },
  shipped: { label: "Shipped", icon: Truck, color: "info" },
  delivered: { label: "Delivered", icon: PackageCheck, color: "success" },
} as const

function StatusBadge({ status }: { status: { label: string; icon: React.ComponentType; color: "success" | "warning" | "neutral" | "destructive" | "info" } }) {
  const Icon = status.icon
  return (
    <Badge variant="soft" color={status.color}>
      <Icon aria-hidden />
      {status.label}
    </Badge>
  )
}

const filters: DataTableFilter[] = [
  { column: "payment", title: "Payment", options: Object.entries(payments).map(([value, s]) => ({ value, label: s.label, icon: s.icon })) },
  { column: "fulfillment", title: "Fulfillment", options: Object.entries(fulfillments).map(([value, s]) => ({ value, label: s.label, icon: s.icon })) },
]

const helper = createDataTableColumnHelper<Order>()

/**
 * A store's orders: search, payment and fulfillment filters, sorting, columns, export, and pages. Select rows to
 * ship or deliver them together; each row's menu does the same for one order, and the table updates in place. Your
 * orders come in as `orders` (a new list replaces what's shown), and every change goes to `onUpdate` first in the
 * table, undone with its message if it throws.
 */
export function OrdersTable({
  title = "Orders",
  orders: given = initialOrders,
  currency = "USD",
  locale = "en-US",
  onUpdate,
  onCreate,
}: {
  title?: React.ReactNode
  orders?: Order[]
  currency?: string
  locale?: string
  /** Ships, delivers or refunds orders, by id. */
  onUpdate?: (ids: string[], change: Partial<Pick<Order, "fulfillment" | "payment">>) => Promise<void> | void
  onCreate?: () => void
}) {
  const [orders, setOrders] = useState(given)
  // A new list from you replaces what's shown.
  const [lastGiven, setLastGiven] = useState(given)
  if (given !== lastGiven) {
    setLastGiven(given)
    setOrders(given)
  }
  const [problem, setProblem] = useState<string | null>(null)
  // The latest handler, for the row menus the columns made once.
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency])

  function update(ids: string[], change: Partial<Pick<Order, "fulfillment" | "payment">>) {
    let before: Order[] = []
    setOrders((all) => {
      before = all
      return all.map((order) => (ids.includes(order.id) ? { ...order, ...change } : order))
    })
    setProblem(null)
    void Promise.resolve()
      .then(() => onUpdateRef.current?.(ids, change))
      .catch((e) => {
        setOrders(before)
        setProblem(e instanceof Error ? e.message : "That didn't go through. Try again.")
      })
  }

  const columns = useMemo(
    () =>
      helper.columns([
        dataTableSelectColumn<Order>(),
        helper.accessor("id", {
          header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
          cell: ({ row }) => (
            <div>
              <p className="font-medium tabular-nums">{row.original.id}</p>
              <p className="text-xs text-muted-foreground">{day.format(new Date(row.original.date))}</p>
            </div>
          ),
          enableHiding: false,
        }),
        helper.accessor("customer", {
          header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              <Avatar src={row.original.avatar} name={row.original.customer} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.customer}</p>
                <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
              </div>
            </div>
          ),
        }),
        helper.accessor("payment", {
          header: "Payment",
          cell: ({ getValue }) => <StatusBadge status={payments[getValue()]} />,
          filterFn: "oneOf",
        }),
        helper.accessor("fulfillment", {
          header: "Fulfillment",
          cell: ({ getValue }) => <StatusBadge status={fulfillments[getValue()]} />,
          filterFn: "oneOf",
        }),
        helper.accessor("items", {
          header: "Items",
          cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{getValue()}</span>,
        }),
        helper.accessor("total", {
          header: ({ column }) => (
            <div className="text-end">
              <DataTableColumnHeader column={column} title="Total" className="-me-3" />
            </div>
          ),
          cell: ({ getValue }) => <div className="text-end font-medium tabular-nums">{money.format(getValue())}</div>,
        }),
        helper.display({
          id: "actions",
          cell: ({ row }) => {
            const order = row.original
            return (
              <div className="text-end">
                <DropdownMenu
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for order ${order.id}`}>
                      <MoreHorizontal />
                    </Button>
                  }
                  align="end"
                  items={[
                    { type: "label", label: `Order ${order.id}` },
                    { label: "Mark as shipped", icon: <Truck />, disabled: order.fulfillment !== "unfulfilled", onSelect: () => update([order.id], { fulfillment: "shipped" }) },
                    { label: "Mark as delivered", icon: <PackageCheck />, disabled: order.fulfillment === "delivered", onSelect: () => update([order.id], { fulfillment: "delivered" }) },
                    { type: "separator" },
                    { label: "Refund", icon: <RotateCcw />, color: "destructive", disabled: order.payment !== "paid", onSelect: () => update([order.id], { payment: "refunded" }) },
                  ]}
                />
              </div>
            )
          },
        }),
      ]),
    [money]
  )

  const open = orders.filter((order) => order.fulfillment === "unfulfilled" && order.payment === "paid").length

  return (
    <section aria-labelledby="orders-table-title" className="bg-background p-4 sm:p-6">
      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:px-6">
          <div>
            <h2 id="orders-table-title" className="font-semibold">
              {title}
            </h2>
            <p className={problem ? "mt-0.5 text-sm text-destructive-text" : "mt-0.5 text-sm text-muted-foreground"} role={problem ? "alert" : undefined}>
              {problem ?? (open === 0 ? "Every paid order is on its way." : `${open} paid ${open === 1 ? "order is" : "orders are"} waiting to ship.`)}
            </p>
          </div>
          <Button size="sm" onClick={onCreate}>
            <Plus aria-hidden /> Create order
          </Button>
        </div>
        <DataTable
          className="p-4 sm:px-6"
          columns={columns}
          data={orders}
          getRowId={(row) => row.id}
          searchPlaceholder="Search orders…"
          filters={filters}
          pageSizes={[8, 20, 50]}
          exportable={{ filename: "orders", columns: { total: { label: `Total (${currency})` } } }}
          emptyMessage="No orders match. Try another search or clear the filters."
          toolbar={(table) => {
            const ids = Object.keys(table.state.rowSelection)
            if (ids.length === 0) return null
            // Shipping skips what's already on its way; nothing moves backwards.
            const unshipped = orders.filter((order) => ids.includes(order.id) && order.fulfillment === "unfulfilled").map((order) => order.id)
            const done = (targets: string[], change: Partial<Order>) => {
              update(targets, change)
              table.resetRowSelection()
            }
            return (
              <>
                <Button size="sm" variant="outline" className="h-8" disabled={unshipped.length === 0} onClick={() => done(unshipped, { fulfillment: "shipped" })}>
                  <Truck aria-hidden /> Ship {unshipped.length || ""}
                </Button>
                <Button size="sm" variant="outline" className="h-8" onClick={() => done(ids, { fulfillment: "delivered" })}>
                  <PackageCheck aria-hidden /> Mark delivered
                </Button>
              </>
            )
          }}
        />
      </div>
    </section>
  )
}
