import { Avatar } from "@dashral/ui/components/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dashral/ui/components/table"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"

import type { Order } from "@/lib/data"
import { useTranslations } from "next-intl"

import { useFormats } from "@/lib/use-formats"

import { OrderStatusBadge } from "./order-status-badge"

export function OrdersTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  const t = useTranslations("overview.table")
  const format = useFormats()
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t("invoice")}</TableHead>
          <TableHead>{t("customer")}</TableHead>
          {!compact && <TableHead>{t("product")}</TableHead>}
          {!compact && <TableHead>{t("date")}</TableHead>}
          <TableHead>{t("status")}</TableHead>
          <TableHead className="text-end">{t("amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order, i) => (
          // Rows arrive one after another, rising a little.
          <TableRow
            key={order.id}
            className={enterMotion}
            style={stagger(i)}
          >
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={order.customer} alt="" />
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                </div>
              </div>
            </TableCell>
            {!compact && <TableCell>{order.product}</TableCell>}
            {!compact && (
              <TableCell className="text-muted-foreground tabular-nums">{format.date(order.date)}</TableCell>
            )}
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="text-end font-medium tabular-nums">
              {format.currency(order.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
