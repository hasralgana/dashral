"use client"

import { useTranslations } from "next-intl"
import { Card } from "@dashral/ui/components/card"
import { Gauge } from "@dashral/ui/components/gauge"
import { Progress } from "@dashral/ui/components/progress"

import { budget } from "@/lib/finance-data"
import { useFormats } from "@/lib/use-formats"

// Keeps a dollar amount whole inside a sentence in any direction: "$172,946 من $206,600", not "206,600$".
const isolate = (text: string) => `\u2066${text}\u2069`

/** This quarter's budget: how much of it is used, on a gauge, then each category on its own bar. */
export function BudgetCard() {
  const t = useTranslations("finance")
  const format = useFormats()
  const planned = budget.reduce((sum, line) => sum + line.planned, 0)
  const spent = budget.reduce((sum, line) => sum + line.spent, 0)
  return (
    <Card title={t("budget.title")} description={t("budget.description")} classNames={{ body: "space-y-5" }}>
      <div className="flex flex-col items-center gap-1">
        <Gauge
          value={spent / planned}
          max={1}
          label={t("budget.used")}
          formatOptions={{ style: "percent" }}
          levels={[
            { from: 0, className: "text-primary" },
            { from: 0.9, className: "text-warning" },
            { from: 1, className: "text-destructive" },
          ]}
          size={180}
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("budget.ofPlanned", { spent: isolate(format.currency(spent)), planned: isolate(format.currency(planned)) })}
        </p>
      </div>
      <ul className="space-y-3.5">
        {budget.map((line) => {
          const share = line.spent / line.planned
          return (
            <li key={line.category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{t(`categories.${line.category}`)}</span>
                <span className={share >= 0.95 ? "text-warning-text tabular-nums" : "text-muted-foreground tabular-nums"}>
                  {format.currency(line.spent)} / {format.compactCurrency(line.planned)}
                </span>
              </div>
              <Progress
                value={share * 100}
                color={share >= 0.95 ? "warning" : "primary"}
                aria-label={t("budget.lineLabel", { category: t(`categories.${line.category}`) })}
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
