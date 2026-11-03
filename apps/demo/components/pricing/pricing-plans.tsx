"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

import { plans, type Billing } from "@/lib/pricing"
import { useFormats } from "@/lib/use-formats"

/** The plan cards with a Monthly / Yearly switch; prices change in place with a soft blur. */
export function PricingPlans() {
  const t = useTranslations("pricing")
  const format = useFormats()
  const [billing, setBilling] = useState<Billing>("yearly")

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <SegmentedControl
          value={billing}
          onValueChange={(value) => setBilling(value as Billing)}
          aria-label={t("billing")}
          options={[
            { value: "monthly", label: t("monthly") },
            { value: "yearly", label: t("yearly") },
          ]}
        />
        <span className="text-sm text-success-text">{t("save")}</span>
      </div>

      <section aria-label={t("plansLabel")} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, i) => (
          <Card
            key={plan.id}
            title={
              <span className="flex items-center justify-between gap-2">
                <h2 className="text-lg">{t(`plans.${plan.id}.name`)}</h2>
                {plan.highlighted && <Badge>{t("popular")}</Badge>}
              </span>
            }
            description={t(`plans.${plan.id}.description`)}
            footer={
              <Button variant={plan.highlighted ? "solid" : "outline"} className="w-full">
                {t(`plans.${plan.id}.cta`)}
              </Button>
            }
            className={cn(enterMotion, plan.highlighted && "border-primary ring-1 ring-primary")}
            classNames={{ description: "min-h-10", body: "flex flex-col" }}
            style={stagger(i, 70)}
          >
            <p className="flex items-baseline gap-1">
              {plan.price === null ? (
                <span className="font-heading text-4xl font-medium tracking-[-0.03em]">{t("custom")}</span>
              ) : (
                <>
                  {/* Keyed by the amount: a new price arrives with a soft blur. */}
                  <span
                    key={plan.price[billing]}
                    className="animate-in font-heading text-4xl font-medium tracking-[-0.03em] tabular-nums fade-in-0 blur-in-[3px] duration-(--duration-standard) ease-enter motion-reduce:animate-none"
                  >
                    {format.currency(plan.price[billing])}
                  </span>
                  <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                </>
              )}
            </p>
            <p className="mt-1 h-4 text-xs text-muted-foreground">
              {plan.price && plan.price.monthly > 0 ? (billing === "yearly" ? t("billedYearly", { amount: format.currency(plan.price.yearly * 12) }) : t("billedMonthly")) : ""}
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {(t.raw(`plans.${plan.id}.features`) as string[]).map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>
    </div>
  )
}
