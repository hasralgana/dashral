// Demo notifications. In a real app these come from your API or a realtime channel.

import { featureHref } from "@/lib/pro-features"

export type NotificationTone = "success" | "destructive" | "info" | "primary" | "highlight" | "warning"

export type Notification = {
  id: string
  type: "order" | "payment" | "customer" | "report" | "mention" | "system"
  /** Its title and description in messages/<locale>.json → notifications.items, filled with `values`. */
  message: "newOrder" | "paymentFailed" | "mention" | "newCustomers" | "report" | "maintenance"
  values?: Record<string, string | number>
  /** How long ago it arrived, written in the reader's language ("2 minutes ago", "2 menit yang lalu"). */
  minutesAgo: number
  href: string
  read: boolean
}

export const initialNotifications: Notification[] = [
  // @dashral-if demo
  {
    id: "n1",
    type: "order",
    message: "newOrder",
    values: { invoice: "INV-1048", name: "Olivia Martin", product: "Pro License", amount: "$249" },
    minutesAgo: 2,
    href: featureHref("ecommerce", "/orders"),
    read: false,
  },
  {
    id: "n2",
    type: "payment",
    message: "paymentFailed",
    values: { name: "Budi Santoso", invoice: "INV-1043" },
    minutesAgo: 60,
    href: featureHref("ecommerce", "/orders"),
    read: false,
  },
  { id: "n3", type: "mention", message: "mention", values: { name: "Sofia" }, minutesAgo: 180, href: "/", read: false },
  { id: "n4", type: "customer", message: "newCustomers", values: { count: 12 }, minutesAgo: 60 * 24, href: "/", read: true },
  { id: "n5", type: "report", message: "report", minutesAgo: 60 * 48, href: "/", read: true },
  { id: "n6", type: "system", message: "maintenance", minutesAgo: 60 * 72, href: "/errors/maintenance", read: true },
  // @dashral-end
]
