// Static demo data for the Inset template (app/inset): a subscription business's customers, invoices, activity and
// connected apps. Dashral Pro replaces data like this with a real database layer.

import { siteConfig } from "@/lib/site"

export type Plan = "starter" | "growth" | "scale"
export type CustomerStatus = "active" | "trial" | "atRisk" | "churned"

export type Customer = {
  id: string
  name: string
  email: string
  company: string
  plan: Plan
  status: CustomerStatus
  /** Monthly recurring revenue, in dollars. */
  mrr: number
  /** The day they signed up: an ISO date. */
  since: string
  country: string
}

const planPrice: Record<Plan, number> = { starter: 49, growth: 199, scale: 799 }

// [name, handle, company, plan, status, seats, since, country]
const people = [
  ["Olivia Martin", "olivia", "Northwind", "scale", "active", 2, "2024-03-12", "United States"],
  ["Budi Santoso", "budi", "Kopi Kenangan Lab", "growth", "active", 3, "2024-06-02", "Indonesia"],
  ["Hana Sato", "hana", "Sakura Studio", "growth", "atRisk", 1, "2024-08-19", "Japan"],
  ["Lucas Silva", "lucas", "Rio Freight", "scale", "active", 1, "2024-01-28", "Brazil"],
  ["Ayu Lestari", "ayu", "Batik Digital", "starter", "trial", 1, "2026-10-09", "Indonesia"],
  ["Jackson Lee", "jackson", "Brightline", "growth", "active", 2, "2025-02-14", "United States"],
  ["Chloe Martin", "chloe", "Maison Verte", "starter", "active", 2, "2025-05-03", "France"],
  ["Arjun Mehta", "arjun", "Ledgerly", "scale", "active", 2, "2023-11-21", "India"],
  ["Sofia Davis", "sofia", "Fieldnote", "growth", "churned", 1, "2024-09-30", "Canada"],
  ["Rizky Pratama", "rizky", "Nusantara Logistik", "growth", "active", 2, "2025-07-11", "Indonesia"],
  ["Emma Wilson", "emma", "Harbor & Co", "starter", "atRisk", 1, "2025-03-27", "United Kingdom"],
  ["Mateo Rossi", "mateo", "Trattoria Cloud", "starter", "active", 1, "2025-09-08", "Italy"],
  ["Grace Lee", "grace", "Pinecone Health", "scale", "active", 1, "2024-04-16", "Singapore"],
  ["Fajar Nugroho", "fajar", "Sawah Tech", "starter", "trial", 1, "2026-10-12", "Indonesia"],
  ["Noah Brown", "noah", "Atlas Robotics", "growth", "active", 3, "2024-12-05", "United States"],
  ["Siti Rahma", "siti", "Halal Market", "growth", "active", 1, "2025-08-22", "Malaysia"],
  ["Daniel Park", "daniel", "Seoul Systems", "scale", "atRisk", 1, "2024-02-09", "South Korea"],
  ["Mia Garcia", "mia", "Casa Norte", "starter", "churned", 1, "2025-01-18", "Mexico"],
  ["Oliver Wright", "oliver", "Wright Analytics", "growth", "active", 1, "2025-10-30", "Australia"],
  ["Nadia Putri", "nadia", "Lumbung Data", "starter", "active", 2, "2026-02-17", "Indonesia"],
  ["Ethan Clark", "ethan", "Clarkson Labs", "scale", "active", 1, "2023-09-04", "United States"],
  ["Dewi Anggraini", "dewi", "Rumah Desain", "starter", "trial", 1, "2026-10-14", "Indonesia"],
  ["Ava Thompson", "ava", "Thompson & Reed", "growth", "active", 2, "2025-06-25", "United Kingdom"],
  ["William Kim", "will", "Kimchi Cloud", "starter", "churned", 1, "2024-11-11", "South Korea"],
] as const

export const customers: Customer[] = people.map(([name, handle, company, plan, status, seats, since, country], i) => ({
  id: `cus_${String(i + 1).padStart(3, "0")}`,
  name,
  email: `${handle}@${company.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
  company,
  plan,
  status,
  // Trials and churned accounts bring in nothing this month.
  mrr: status === "trial" || status === "churned" ? 0 : planPrice[plan] * seats,
  since,
  country,
}))

export type InvoiceStatus = "paid" | "open" | "overdue" | "draft"

export type Invoice = {
  id: string
  customerId: string
  customer: string
  email: string
  /** ISO dates. */
  issued: string
  due: string
  amount: number
  status: InvoiceStatus
}

// [customer index, issued, amount, status]: the newest first.
const billed = [
  [0, "2026-10-15", 1598, "open"],
  [7, "2026-10-14", 1598, "paid"],
  [3, "2026-10-13", 799, "paid"],
  [16, "2026-10-12", 799, "overdue"],
  [1, "2026-10-12", 597, "paid"],
  [12, "2026-10-11", 799, "open"],
  [5, "2026-10-10", 398, "paid"],
  [14, "2026-10-09", 597, "paid"],
  [2, "2026-10-08", 199, "overdue"],
  [9, "2026-10-08", 398, "paid"],
  [20, "2026-10-07", 799, "paid"],
  [22, "2026-10-06", 398, "open"],
  [10, "2026-10-05", 49, "overdue"],
  [15, "2026-10-04", 199, "paid"],
  [18, "2026-10-03", 199, "paid"],
  [6, "2026-10-02", 98, "paid"],
  [19, "2026-10-01", 98, "draft"],
  [11, "2026-09-30", 49, "paid"],
  [0, "2026-09-15", 1598, "paid"],
  [7, "2026-09-14", 1598, "paid"],
  [16, "2026-09-12", 799, "paid"],
  [12, "2026-09-11", 799, "paid"],
  [2, "2026-09-08", 199, "paid"],
  [8, "2026-09-05", 199, "paid"],
] as const

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export const invoices: Invoice[] = billed.map(([index, issued, amount, status], i) => {
  const customer = customers[index]!
  return {
    id: `INV-${2064 - i}`,
    customerId: customer.id,
    customer: customer.name,
    email: customer.email,
    issued,
    due: addDays(issued, 14),
    amount,
    status,
  }
})

export type InsetMetricData = {
  /** messages → inset.overview.metrics */
  key: "mrr" | "activeCustomers" | "outstanding" | "churn"
  value: number
  delta: number
  /** Whether an increase is good news for this metric. */
  upIsGood: boolean
  /** How the value is written (Intl.NumberFormat options). */
  format: Intl.NumberFormatOptions
  /** The last 12 months, oldest first, for the card's sparkline. */
  trend: number[]
}

/** The metrics on Inset's overview. */
export const insetMetrics: InsetMetricData[] = [
  { key: "mrr", value: 48290, delta: 6.2, upIsGood: true, format: { style: "currency", currency: "USD", maximumFractionDigits: 0 }, trend: [31200, 32900, 33800, 35100, 36400, 37900, 39200, 40800, 42600, 44100, 45500, 48290] },
  { key: "activeCustomers", value: 1842, delta: 3.1, upIsGood: true, format: {}, trend: [1420, 1460, 1502, 1530, 1575, 1610, 1648, 1690, 1726, 1771, 1796, 1842] },
  { key: "outstanding", value: 12430, delta: -8.4, upIsGood: false, format: { style: "currency", currency: "USD", maximumFractionDigits: 0 }, trend: [16800, 15900, 17200, 16100, 15400, 14800, 15300, 14100, 13900, 13600, 13570, 12430] },
  { key: "churn", value: 0.019, delta: -0.3, upIsGood: false, format: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }, trend: [2.9, 2.8, 2.7, 2.6, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.2, 1.9] },
]

/** Monthly recurring revenue at the end of each month of 2026 (month 0 is January). */
export const mrrByMonth = insetMetrics[0]!.trend.map((revenue, month) => ({ month, revenue }))

/** The demo's "today": the activity feed is dated against it, so the page reads the same on every visit. */
export const insetToday = "2026-10-19"

export type ActivityKind = "billing" | "customers" | "integrations" | "team"

export type ActivityEvent = {
  id: string
  kind: ActivityKind
  /** messages → inset.activity.events */
  event:
    | "invoicePaid"
    | "invoiceOverdue"
    | "invoiceSent"
    | "customerJoined"
    | "customerUpgraded"
    | "customerChurned"
    | "trialStarted"
    | "integrationConnected"
    | "alertDelivered"
    | "memberInvited"
    | "memberJoined"
    | "roleChanged"
  values: Record<string, string | number>
  actor: string
  /** When it happened: an ISO date and time, in UTC. */
  at: string
}

export const activity: ActivityEvent[] = [
  { id: "a01", kind: "billing", event: "invoicePaid", values: { invoice: "INV-2063", customer: "Arjun Mehta", amount: 1598 }, actor: "Stripe", at: "2026-10-19T09:41:00Z" },
  { id: "a02", kind: "integrations", event: "alertDelivered", values: { rule: "Refunds above threshold", channel: "#revenue" }, actor: "Slack", at: "2026-10-19T09:12:00Z" },
  { id: "a03", kind: "customers", event: "trialStarted", values: { customer: "Dewi Anggraini", company: "Rumah Desain" }, actor: "Dewi Anggraini", at: "2026-10-19T08:30:00Z" },
  { id: "a04", kind: "team", event: "memberInvited", values: { name: "Rina Wijaya", role: "Billing" }, actor: "Jane Doe", at: "2026-10-19T07:55:00Z" },
  { id: "a05", kind: "billing", event: "invoiceOverdue", values: { invoice: "INV-2061", customer: "Daniel Park" }, actor: siteConfig.name, at: "2026-10-18T16:00:00Z" },
  { id: "a06", kind: "customers", event: "customerUpgraded", values: { customer: "Olivia Martin", from: "Growth", to: "Scale" }, actor: "Olivia Martin", at: "2026-10-18T14:22:00Z" },
  { id: "a07", kind: "integrations", event: "integrationConnected", values: { app: "Postgres" }, actor: "Jane Doe", at: "2026-10-18T11:05:00Z" },
  { id: "a08", kind: "billing", event: "invoiceSent", values: { invoice: "INV-2064", customer: "Olivia Martin", amount: 1598 }, actor: "Jane Doe", at: "2026-10-18T09:30:00Z" },
  { id: "a09", kind: "team", event: "memberJoined", values: { name: "Kevin Tan" }, actor: "Kevin Tan", at: "2026-10-17T17:48:00Z" },
  { id: "a10", kind: "customers", event: "customerChurned", values: { customer: "Sofia Davis", company: "Fieldnote" }, actor: "Sofia Davis", at: "2026-10-17T15:10:00Z" },
  { id: "a11", kind: "integrations", event: "alertDelivered", values: { rule: "Daily digest", channel: "Email" }, actor: "Email", at: "2026-10-17T08:00:00Z" },
  { id: "a12", kind: "customers", event: "customerJoined", values: { customer: "Fajar Nugroho", company: "Sawah Tech" }, actor: "Fajar Nugroho", at: "2026-10-16T13:37:00Z" },
  { id: "a13", kind: "team", event: "roleChanged", values: { name: "Kevin Tan", role: "Admin" }, actor: "Jane Doe", at: "2026-10-16T10:02:00Z" },
  { id: "a14", kind: "billing", event: "invoicePaid", values: { invoice: "INV-2060", customer: "Budi Santoso", amount: 597 }, actor: "Stripe", at: "2026-10-16T09:15:00Z" },
]

export type IntegrationCategory = "messaging" | "payments" | "data" | "developer"

export type Integration = {
  /** messages → inset.integrations.apps.<id> (its description) */
  id: "slack" | "email" | "push" | "stripe" | "paypal" | "postgres" | "bigquery" | "github" | "webhooks"
  name: string
  category: IntegrationCategory
  connected: boolean
}

export const integrations: Integration[] = [
  { id: "slack", name: "Slack", category: "messaging", connected: true },
  { id: "email", name: "Email", category: "messaging", connected: true },
  { id: "push", name: "Push", category: "messaging", connected: true },
  { id: "stripe", name: "Stripe", category: "payments", connected: true },
  { id: "paypal", name: "PayPal", category: "payments", connected: false },
  { id: "postgres", name: "Postgres", category: "data", connected: true },
  { id: "bigquery", name: "BigQuery", category: "data", connected: false },
  { id: "github", name: "GitHub", category: "developer", connected: false },
  { id: "webhooks", name: "Webhooks", category: "developer", connected: false },
]

/** Alert rules and where each is delivered, for the delivery map. */
export const deliveries = [
  { rule: "refunds", channel: "slack", target: "#revenue" },
  { rule: "digest", channel: "email", target: "Leadership" },
  { rule: "signups", channel: "push", target: "iPhone" },
] as const

/** How recurring revenue moved each month (month 0 is January): new, upgrades, downgrades and cancellations. */
export const mrrMovement = [
  { month: 4, new: 2140, expansion: 980, contraction: -310, churn: -1240 },
  { month: 5, new: 2460, expansion: 1120, contraction: -280, churn: -1180 },
  { month: 6, new: 2310, expansion: 1340, contraction: -420, churn: -1350 },
  { month: 7, new: 2780, expansion: 1260, contraction: -350, churn: -1090 },
  { month: 8, new: 2650, expansion: 1510, contraction: -390, churn: -1270 },
  { month: 9, new: 3120, expansion: 1640, contraction: -330, churn: -1120 },
]

export type MemberRole = "owner" | "admin" | "member" | "billing"

export type Member = {
  id: string
  name: string
  email: string
  role: MemberRole
  /** When they were last here: an ISO date and time, or null for an invitation not yet accepted. */
  lastActive: string | null
}

export const members: Member[] = [
  { id: "mem_1", name: "Jane Doe", email: "jane@northwind.dev", role: "owner", lastActive: "2026-10-19T09:40:00Z" },
  { id: "mem_2", name: "Kevin Tan", email: "kevin@northwind.dev", role: "admin", lastActive: "2026-10-19T08:12:00Z" },
  { id: "mem_3", name: "Rina Wijaya", email: "rina@northwind.dev", role: "billing", lastActive: null },
  { id: "mem_4", name: "Marco Bianchi", email: "marco@northwind.dev", role: "member", lastActive: "2026-10-18T16:30:00Z" },
  { id: "mem_5", name: "Laila Hassan", email: "laila@northwind.dev", role: "member", lastActive: "2026-10-17T11:05:00Z" },
  { id: "mem_6", name: "Tomás Ruiz", email: "tomas@northwind.dev", role: "member", lastActive: "2026-10-12T14:20:00Z" },
]

export type ApiKey = {
  id: string
  name: string
  /** The start and end of the key, which is all the list shows. */
  prefix: string
  last4: string
  /** The whole key, copied from the list (demo values). */
  secret: string
  created: string
  /** An ISO date, or null when it hasn't been used yet. */
  lastUsed: string | null
}

export const apiKeys: ApiKey[] = [
  { id: "key_1", secret: "key_live_51c7e09a4d2b8f63a1e5c07d94b28f2a", name: "Production", prefix: "key_live", last4: "8f2a", created: "2026-03-02", lastUsed: "2026-10-19" },
  { id: "key_2", secret: "key_live_9a03d6f1b7e24c58a0f3e61b27d9c41d", name: "Billing sync", prefix: "key_live", last4: "c41d", created: "2026-06-18", lastUsed: "2026-10-18" },
  { id: "key_3", secret: "key_test_2e8b4c71f0a9d36e5b1c84a7f3d207be", name: "Staging", prefix: "key_test", last4: "07be", created: "2026-08-09", lastUsed: "2026-10-02" },
  { id: "key_4", secret: "key_live_c4f1a7e93b0d52e8f6a1c3b9d07ee9a5", name: "Zapier", prefix: "key_live", last4: "e9a5", created: "2026-10-11", lastUsed: null },
]

/** The workspace's own subscription, for the Billing page. */
export const workspacePlan = {
  name: "Growth",
  price: 99,
  renews: "2026-11-01",
  usage: [
    { key: "seats", used: 6, limit: 10 },
    { key: "events", used: 812_000, limit: 1_000_000 },
    { key: "storage", used: 3.2, limit: 10 },
  ],
  card: { brand: "Visa", last4: "4242", expires: "08/28" },
} as const

export const billingHistory = [
  { id: "MD-0012", date: "2026-10-01", amount: 99, status: "paid" },
  { id: "MD-0011", date: "2026-09-01", amount: 99, status: "paid" },
  { id: "MD-0010", date: "2026-08-01", amount: 99, status: "paid" },
  { id: "MD-0009", date: "2026-07-01", amount: 49, status: "paid" },
  { id: "MD-0008", date: "2026-06-01", amount: 49, status: "paid" },
] as const
