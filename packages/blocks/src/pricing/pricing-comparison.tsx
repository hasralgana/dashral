import { Check, Info, Minus } from "lucide-react"
import { Button } from "@dashral/ui/components/button"
import { ScrollShadow } from "@dashral/ui/components/scroll-shadow"
import { Tooltip } from "@dashral/ui/components/tooltip"
import { cn } from "@dashral/ui/lib/utils"

/** A plan's column: its name, its price a month as shown, and its button (a link, or onSelect without one). */
export type ComparePlan = { name: string; price: string; popular?: boolean; cta: string; href?: string }
/** Included (true), not (false), or what it comes with ("20"). */
export type CompareValue = boolean | string
/** A group of rows; each row has one value per plan, in the plans' order. */
export type CompareGroup = { title: string; rows: { feature: string; hint?: string; values: CompareValue[] }[] }

const samplePlans: ComparePlan[] = [
  { name: "Starter", price: "$0", cta: "Start free", href: "#" },
  { name: "Team", price: "$29", popular: true, cta: "Start trial", href: "#" },
  { name: "Business", price: "$79", cta: "Talk to sales", href: "#" },
]

type Value = CompareValue
const sampleGroups: CompareGroup[] = [
  {
    title: "Dashboards",
    rows: [
      { feature: "Dashboards", values: ["1", "Unlimited", "Unlimited"] },
      { feature: "Data sources", values: ["3", "20", "Unlimited"] },
      { feature: "History", hint: "How far back your charts can go.", values: ["7 days", "1 year", "Unlimited"] },
      { feature: "Scheduled reports", values: [false, true, true] },
    ],
  },
  {
    title: "Team",
    rows: [
      { feature: "Members", values: ["1", "Up to 25", "Unlimited"] },
      { feature: "Roles and permissions", values: [false, true, true] },
      { feature: "Single sign-on (SSO)", hint: "Sign in with Okta, Azure AD or Google Workspace.", values: [false, false, true] },
      { feature: "Audit log", values: [false, false, true] },
    ],
  },
  {
    title: "Support",
    rows: [
      { feature: "Community", values: [true, true, true] },
      { feature: "Email support", values: [false, true, true] },
      { feature: "Account manager", values: [false, false, true] },
    ],
  },
]

function Cell({ value }: { value: Value }) {
  if (value === true) return <Check className="mx-auto size-4 text-primary-text" aria-label="Included" />
  if (value === false) return <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />
  return <span className="text-sm">{value}</span>
}

/**
 * Plans compared feature by feature: a header row with each plan's price and action, groups of rows, a hint on the
 * features that need one, and the popular plan's column tinted. Scrolls sideways on phones, the feature names
 * staying in place. Every part comes from props.
 */
export function PricingComparison({
  eyebrow = "Compare plans",
  title = "Everything in each plan",
  plans = samplePlans,
  groups = sampleGroups,
  per = "/ month",
  onSelect,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  plans?: ComparePlan[]
  groups?: CompareGroup[]
  /** After each price. */
  per?: string
  onSelect?: (plan: ComparePlan) => void
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
        </div>

        <ScrollShadow orientation="horizontal" fade="end" className="mt-10">
          {/* Fixed layout: the plan columns share the width equally. */}
          <table className="w-full min-w-[40rem] table-fixed border-separate border-spacing-0 text-start">
            <caption className="sr-only">Features by plan</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky start-0 z-10 w-1/3 bg-background pb-6 text-start align-bottom text-sm font-medium text-muted-foreground">
                  Features
                </th>
                {plans.map((plan) => (
                  <th key={plan.name} scope="col" className={cn("px-2 pb-6 text-center align-bottom sm:px-4", plan.popular && "rounded-t-xl bg-primary/5 pt-4")}>
                    <span className="block text-base font-semibold">{plan.name}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      <span className="text-2xl font-semibold text-foreground">{plan.price}</span> {per}
                    </span>
                    {plan.href ? (
                      <Button size="sm" variant={plan.popular ? "solid" : "outline"} className="mt-4 h-auto min-h-8 w-full py-1.5 leading-snug text-balance whitespace-normal" asChild>
                        <a href={plan.href}>{plan.cta}</a>
                      </Button>
                    ) : (
                      <Button size="sm" variant={plan.popular ? "solid" : "outline"} className="mt-4 h-auto min-h-8 w-full py-1.5 leading-snug text-balance whitespace-normal" onClick={() => onSelect?.(plan)}>
                        {plan.cta}
                      </Button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th scope="colgroup" className="sticky start-0 z-10 bg-background pt-8 pb-3 text-start text-sm font-semibold">
                    {group.title}
                  </th>
                  {/* Empty cells, so the popular plan's tint runs unbroken through the group titles. */}
                  {plans.map((plan) => (
                    <td key={plan.name} aria-hidden className={cn(plan.popular && "bg-primary/5")} />
                  ))}
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="sticky start-0 z-10 border-t bg-background py-3 pe-4 text-start text-sm font-normal">
                      <span className="inline-flex items-center gap-1.5">
                        {row.feature}
                        {row.hint && (
                          <Tooltip content={row.hint}>
                            <button type="button" aria-label={`About ${row.feature}`} className="rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
                              <Info className="size-3.5" />
                            </button>
                          </Tooltip>
                        )}
                      </span>
                    </th>
                    {row.values.map((value, i) => (
                      <td key={i} className={cn("border-t px-4 py-3 text-center", plans[i]!.popular && "bg-primary/5 [tbody:last-of-type_tr:last-child_&]:rounded-b-xl")}>
                        <Cell value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </ScrollShadow>
      </div>
    </section>
  )
}
