"use client"

import { Download } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { DateRangePicker } from "@dashral/ui/components/date-range-picker"
import { toast } from "@dashral/ui/components/toast"

/** The page's period and its export, in the header. */
export function FinanceActions() {
  const t = useTranslations("finance")
  return (
    <>
      <DateRangePicker
        aria-label={t("period")}
        defaultValue={{ from: new Date(2026, 9, 1), to: new Date(2026, 9, 19) }}
        className="w-60"
      />
      <Button variant="outline" onClick={() => toast.success(t("exported"))}>
        <Download /> {t("export")}
      </Button>
    </>
  )
}
