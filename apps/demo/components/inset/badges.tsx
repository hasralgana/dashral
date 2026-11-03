import { CircleCheck, CircleDashed, CircleX, Clock, Sparkles, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@dashral/ui/components/badge"

import type { CustomerStatus, InvoiceStatus, Plan } from "@/lib/inset-data"

// Status is always icon + label — never color alone.
const customerStatus = {
  active: { icon: CircleCheck, color: "success" },
  trial: { icon: Sparkles, color: "info" },
  atRisk: { icon: TriangleAlert, color: "warning" },
  churned: { icon: CircleX, color: "neutral" },
} as const

const invoiceStatus = {
  paid: { icon: CircleCheck, color: "success" },
  open: { icon: Clock, color: "info" },
  overdue: { icon: TriangleAlert, color: "destructive" },
  draft: { icon: CircleDashed, color: "neutral" },
} as const

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const t = useTranslations("inset.customerStatus")
  const { icon: Icon, color } = customerStatus[status]
  return (
    <Badge variant="soft" color={color}>
      <Icon aria-hidden />
      {t(status)}
    </Badge>
  )
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useTranslations("inset.invoiceStatus")
  const { icon: Icon, color } = invoiceStatus[status]
  return (
    <Badge variant="soft" color={color}>
      <Icon aria-hidden />
      {t(status)}
    </Badge>
  )
}

/** The plan as a quiet outline tag; Scale gets a filled dot so the biggest accounts stand out in a list. */
export function PlanBadge({ plan }: { plan: Plan }) {
  const t = useTranslations("inset.plans")
  return (
    <Badge variant="outline" color="neutral">
      {plan === "scale" && <span aria-hidden className="size-1.5 rounded-full bg-foreground" />}
      {t(plan)}
    </Badge>
  )
}
