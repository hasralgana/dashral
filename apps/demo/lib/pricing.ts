// A pricing page template for your own product: edit the plans and prices here, and their words in
// messages/<locale>.json → pricing. (Dashral's own plans are on the website, dashral.com/pricing.)

export type Billing = "monthly" | "yearly"

export type PlanId = "starter" | "growth" | "scale" | "enterprise"

export type Plan = {
  /** Its name, description, button and features are in messages → pricing.plans.<id>. */
  id: PlanId
  /** Per month, in dollars. Yearly is billed once a year at `yearly × 12`. null: "Contact us". */
  price: { monthly: number; yearly: number } | null
  highlighted?: boolean
}

export const plans: Plan[] = [
  { id: "starter", price: { monthly: 0, yearly: 0 } },
  { id: "growth", price: { monthly: 29, yearly: 24 }, highlighted: true },
  { id: "scale", price: { monthly: 99, yearly: 79 } },
  { id: "enterprise", price: null },
]

/** A number, a word from messages → pricing.compare.values, or whether the plan has it. */
export type ComparisonValue = boolean | number | "unlimited" | "custom" | "million2" | "days7" | "year1"

/** Each row's label is in messages → pricing.compare.rows.<key>. */
export const comparison: { key: "projects" | "events" | "history" | "roles" | "sso" | "sla"; plans: Record<PlanId, ComparisonValue> }[] = [
  { key: "projects", plans: { starter: 1, growth: 10, scale: "unlimited", enterprise: "unlimited" } },
  { key: "events", plans: { starter: 1000, growth: 100000, scale: "million2", enterprise: "custom" } },
  { key: "history", plans: { starter: "days7", growth: "year1", scale: "unlimited", enterprise: "unlimited" } },
  { key: "roles", plans: { starter: false, growth: true, scale: true, enterprise: true } },
  { key: "sso", plans: { starter: false, growth: false, scale: true, enterprise: true } },
  { key: "sla", plans: { starter: false, growth: false, scale: false, enterprise: true } },
]

/** The questions and answers are in messages → pricing.faq.items. */
export const faqs = ["change", "trial", "discounts", "payment"] as const
