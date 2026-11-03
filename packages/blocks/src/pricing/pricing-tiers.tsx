"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Badge } from "@dashral/ui/components/badge"
import { Button } from "@dashral/ui/components/button"
import { SegmentedControl } from "@dashral/ui/components/segmented-control"
import { cn } from "@dashral/ui/lib/utils"

export type Billing = "monthly" | "yearly"
/** A plan: its prices a month (yearly is the monthly price when billed yearly), its button and what it includes. */
export type TierPlan = {
  name: string
  blurb: string
  price: { monthly: number; yearly: number }
  cta: string
  /** Where the button goes; without it, onSelect hears the pick. */
  href?: string
  popular?: boolean
  features: string[]
}

const samplePlans: TierPlan[] = [
  {
    name: "Starter",
    blurb: "For one person finding their numbers.",
    price: { monthly: 0, yearly: 0 },
    cta: "Start for free",
    features: ["1 dashboard", "3 data sources", "7 days of history", "Community support"],
  },
  {
    name: "Team",
    blurb: "For teams that meet around the same charts.",
    price: { monthly: 29, yearly: 23 },
    cta: "Start a 14-day trial",
    popular: true,
    features: ["Unlimited dashboards", "20 data sources", "1 year of history", "Roles and sign-in with Google", "Email support"],
  },
  {
    name: "Business",
    blurb: "For companies with their own rules.",
    price: { monthly: 79, yearly: 63 },
    cta: "Talk to sales",
    features: ["Everything in Team", "Unlimited data sources", "Unlimited history", "SSO and an audit log", "A named account manager"],
  },
]

/**
 * Plans side by side: a monthly/yearly switch that shows the saving, the popular plan raised and marked, what each
 * includes, and its action. The prices ease to their new value when the billing changes. Stacks on phones. Every part
 * comes from props.
 */
export function PricingTiers({
  eyebrow = "Pricing",
  title = "Simple plans that grow with you",
  description = "Start free. Upgrade when your team does. Cancel any time.",
  plans = samplePlans,
  saving = "Save 20%",
  defaultBilling = "yearly",
  currency = "USD",
  locale = "en-US",
  onSelect,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  plans?: TierPlan[]
  /** The badge beside the billing switch; none hides it. */
  saving?: string
  defaultBilling?: Billing
  currency?: string
  locale?: string
  /** A plan's button without an href: the plan and the billing picked. */
  onSelect?: (plan: TierPlan, billing: Billing) => void
}) {
  const [billing, setBilling] = useState<Billing>(defaultBilling)
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n)

  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
          <div className="mt-8 flex items-center justify-center gap-3">
            <SegmentedControl
              aria-label="Billing"
              value={billing}
              onValueChange={(v) => setBilling(v as Billing)}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
            {saving && (
              <Badge variant="soft" color="success">
                {saving}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[repeat(var(--count),minmax(0,1fr))]" style={{ "--count": plans.length } as React.CSSProperties}>
          {plans.map((plan) => {
            const price = plan.price[billing]
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative grid gap-6 rounded-2xl border bg-card p-6 sm:p-8",
                  plan.popular && "border-primary shadow-lg ring-1 ring-primary lg:-mt-4 lg:pb-12"
                )}
              >
                {plan.popular && (
                  <Badge color="primary" className="absolute -top-3 left-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                    Most popular
                  </Badge>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                </div>
                <p className="flex items-baseline gap-1.5">
                  {/* Keyed by the price, so a new one fades in. */}
                  <span key={price} className="text-4xl font-semibold tracking-tight tabular-nums animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-standard) ease-enter">
                    {money(price)}
                  </span>
                  <span className="text-sm text-muted-foreground">{price ? (billing === "yearly" ? "a month, billed yearly" : "a month") : "forever"}</span>
                </p>
                {plan.href ? (
                  <Button variant={plan.popular ? "solid" : "outline"} className="w-full" asChild>
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                ) : (
                  <Button variant={plan.popular ? "solid" : "outline"} className="w-full" onClick={() => onSelect?.(plan, billing)}>
                    {plan.cta}
                  </Button>
                )}
                <ul className="grid gap-3 border-t pt-6 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary-text" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
