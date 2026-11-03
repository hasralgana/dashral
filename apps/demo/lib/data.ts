// Static demo data. Dashral Pro replaces this with a real database layer.

export type Stat = {
  /** messages → overview.stats */
  label: "revenueMonth" | "orders" | "newCustomers" | "refundRate"
  value: number
  /** How the value is written (Intl.NumberFormat options). */
  format: Intl.NumberFormatOptions
  delta: number
  /** Whether an increase is good news for this metric. */
  upIsGood: boolean
  /** The last 12 months, oldest first, for the card's sparkline. */
  trend: number[]
}

export const stats: Stat[] = [
  {
    label: "revenueMonth",
    value: 8900,
    format: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
    delta: 8.5,
    upIsGood: true,
    trend: [4200, 4800, 4550, 5300, 5900, 5600, 6100, 7000, 7600, 7350, 8200, 8900],
  },
  { label: "orders", value: 1284, format: {}, delta: 8.1, upIsGood: true, trend: [980, 1010, 1050, 990, 1100, 1120, 1080, 1150, 1190, 1170, 1210, 1284] },
  { label: "newCustomers", value: 312, format: {}, delta: -3.2, upIsGood: true, trend: [250, 270, 265, 290, 300, 310, 305, 330, 325, 340, 322, 312] },
  {
    label: "refundRate",
    value: 0.018,
    format: { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 },
    delta: -0.4,
    upIsGood: false,
    trend: [2.6, 2.5, 2.4, 2.4, 2.3, 2.2, 2.2, 2.1, 2.0, 2.0, 1.9, 1.8],
  },
]

// month: 0 is January; day: 0 is Sunday. Their names are written in the reader's language (lib/format.ts).
export const monthlyRevenue = [
  { month: 0, revenue: 4200 },
  { month: 1, revenue: 4800 },
  { month: 2, revenue: 4550 },
  { month: 3, revenue: 5300 },
  { month: 4, revenue: 5900 },
  { month: 5, revenue: 6400 },
  { month: 6, revenue: 6100 },
  { month: 7, revenue: 7000 },
  { month: 8, revenue: 7600 },
  { month: 9, revenue: 7350 },
  { month: 10, revenue: 8200 },
  { month: 11, revenue: 8900 },
]

export const weeklySales = [
  { day: 1, online: 186, store: 80 },
  { day: 2, online: 205, store: 98 },
  { day: 3, online: 237, store: 120 },
  { day: 4, online: 173, store: 110 },
  { day: 5, online: 209, store: 130 },
  { day: 6, online: 264, store: 162 },
  { day: 0, online: 214, store: 140 },
]

export const trafficSources = [
  { source: "organic" as const, visitors: 12840 },
  { source: "direct" as const, visitors: 8210 },
  { source: "social" as const, visitors: 5320 },
  { source: "referral" as const, visitors: 3150 },
  { source: "email" as const, visitors: 1890 },
]

export type OrderStatus = "paid" | "pending" | "refunded" | "failed"

export type Order = {
  id: string
  customer: string
  email: string
  product: string
  date: string
  amount: number
  status: OrderStatus
}

const recentOrders: Order[] = [
  { id: "INV-1048", customer: "Olivia Martin", email: "olivia@example.com", product: "Pro License", date: "2026-10-07", amount: 249, status: "paid" },
  { id: "INV-1047", customer: "Jackson Lee", email: "jackson@example.com", product: "Team License", date: "2026-10-07", amount: 129, status: "pending" },
  { id: "INV-1046", customer: "Isabella Nguyen", email: "isabella@example.com", product: "Personal License", date: "2026-10-06", amount: 49, status: "paid" },
  { id: "INV-1045", customer: "William Kim", email: "will@example.com", product: "Team License", date: "2026-10-06", amount: 129, status: "refunded" },
  { id: "INV-1044", customer: "Sofia Davis", email: "sofia@example.com", product: "Personal License", date: "2026-10-05", amount: 49, status: "paid" },
  { id: "INV-1043", customer: "Budi Santoso", email: "budi@example.com", product: "Pro License", date: "2026-10-05", amount: 249, status: "failed" },
  { id: "INV-1042", customer: "Ayu Lestari", email: "ayu@example.com", product: "Personal License", date: "2026-10-04", amount: 49, status: "paid" },
  { id: "INV-1041", customer: "Liam Johnson", email: "liam@example.com", product: "Team License", date: "2026-10-04", amount: 129, status: "paid" },
  { id: "INV-1040", customer: "Emma Wilson", email: "emma@example.com", product: "Pro License", date: "2026-10-03", amount: 249, status: "pending" },
  { id: "INV-1039", customer: "Rizky Pratama", email: "rizky@example.com", product: "Personal License", date: "2026-10-03", amount: 49, status: "paid" },
  { id: "INV-1038", customer: "Noah Brown", email: "noah@example.com", product: "Team License", date: "2026-10-02", amount: 129, status: "paid" },
  { id: "INV-1037", customer: "Mia Garcia", email: "mia@example.com", product: "Personal License", date: "2026-10-01", amount: 49, status: "refunded" },
]

const customers = [
  ["Ethan Clark", "ethan"], ["Dewi Anggraini", "dewi"], ["Lucas Silva", "lucas"], ["Hana Sato", "hana"],
  ["Arjun Mehta", "arjun"], ["Chloe Martin", "chloe"], ["Fajar Nugroho", "fajar"], ["Grace Lee", "grace"],
  ["Mateo Rossi", "mateo"], ["Siti Rahma", "siti"], ["Oliver Wright", "oliver"], ["Nadia Putri", "nadia"],
  ["Daniel Park", "daniel"], ["Ava Thompson", "ava"],
] as const

const products = [
  ["Personal License", 49],
  ["Team License", 129],
  ["Pro License", 249],
] as const

const statuses: OrderStatus[] = ["paid", "paid", "paid", "pending", "paid", "refunded", "paid", "failed"]

// Deterministic older orders so sorting and pagination have something to work with.
const olderOrders: Order[] = Array.from({ length: 28 }, (_, i) => {
  const [customer, handle] = customers[i % customers.length]!
  const [product, amount] = products[(i * 7) % products.length]!
  const day = 30 - Math.floor(i / 2)
  return {
    id: `INV-${1036 - i}`,
    customer,
    email: `${handle}@example.com`,
    product,
    date: `2026-09-${String(day).padStart(2, "0")}`,
    amount,
    status: statuses[(i * 5) % statuses.length]!,
  }
})

export const orders: Order[] = [...recentOrders, ...olderOrders]

export const topProducts = [
  { name: "Pro License", sales: 412, revenue: 102588 },
  { name: "Team License", sales: 538, revenue: 69402 },
  { name: "Personal License", sales: 1260, revenue: 61740 },
]
