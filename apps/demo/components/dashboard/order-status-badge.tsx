import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"

import type { OrderStatus } from "@/lib/data"

// Status is always icon + label — never color alone.
const statusMap = {
  paid: { icon: CircleCheck, color: "success" },
  pending: { icon: Clock, color: "warning" },
  refunded: { icon: RotateCcw, color: "neutral" },
  failed: { icon: CircleX, color: "destructive" },
} as const

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("overview.status")
  const { icon: Icon, color } = statusMap[status]
  return (
    <Badge variant="soft" color={color}>
      <Icon aria-hidden />
      {t(status)}
    </Badge>
  )
}
