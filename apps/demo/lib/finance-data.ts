// Static demo data for Classic's Finance page (app/(dashboard)/finance): a software company's cash, spending, the
// fund its reserve sits in, and the transactions behind it all. Replace it with your own ledger or accounting API.

export type TransactionCategory = "revenue" | "payroll" | "software" | "marketing" | "office" | "travel" | "tax"
export type TransactionStatus = "cleared" | "pending" | "review"
export type Account = "operating" | "reserve" | "card"

export type Transaction = {
  id: string
  /** An ISO date. */
  date: string
  /** Who paid or got paid. */
  party: string
  /** messages → finance.memos */
  memo:
    | "subscription"
    | "invoice"
    | "salary"
    | "contractor"
    | "license"
    | "campaign"
    | "rent"
    | "flight"
    | "hotel"
    | "vat"
    | "refund"
  category: TransactionCategory
  account: Account
  /** In dollars: positive comes in, negative goes out. */
  amount: number
  status: TransactionStatus
}

/** The last day the sample data covers. */
export const financeToday = "2026-10-19"

// [date, party, memo, category, account, amount, status]
const rows: [string, string, Transaction["memo"], TransactionCategory, Account, number, TransactionStatus][] = [
  ["2026-10-19", "Northwind", "subscription", "revenue", "operating", 9580, "pending"],
  ["2026-10-19", "Cloudspring", "license", "software", "card", -1240, "pending"],
  ["2026-10-18", "Brightline", "invoice", "revenue", "operating", 4200, "cleared"],
  ["2026-10-18", "Skyward Air", "flight", "travel", "card", -684, "review"],
  ["2026-10-17", "Ledgerly", "subscription", "revenue", "operating", 2390, "cleared"],
  ["2026-10-17", "Adwave", "campaign", "marketing", "card", -3150, "cleared"],
  ["2026-10-16", "Harbor & Co", "refund", "revenue", "operating", -199, "cleared"],
  ["2026-10-16", "Pixelforge", "contractor", "payroll", "operating", -2800, "review"],
  ["2026-10-15", "Team payroll", "salary", "payroll", "operating", -48600, "cleared"],
  ["2026-10-15", "Sakura Studio", "invoice", "revenue", "operating", 1990, "cleared"],
  ["2026-10-14", "Codeshelf", "license", "software", "card", -420, "cleared"],
  ["2026-10-14", "Rio Freight", "subscription", "revenue", "operating", 7990, "cleared"],
  ["2026-10-13", "Linden Hotels", "hotel", "travel", "card", -912, "cleared"],
  ["2026-10-12", "Pinecone Health", "subscription", "revenue", "operating", 7990, "cleared"],
  ["2026-10-11", "Mailtide", "license", "software", "card", -310, "cleared"],
  ["2026-10-10", "Tax office", "vat", "tax", "operating", -6420, "cleared"],
  ["2026-10-09", "Maison Verte", "subscription", "revenue", "operating", 990, "cleared"],
  ["2026-10-08", "Adwave", "campaign", "marketing", "card", -1870, "cleared"],
  ["2026-10-07", "Nusantara Logistik", "invoice", "revenue", "operating", 3980, "cleared"],
  ["2026-10-06", "Studio Kemang", "rent", "office", "operating", -5200, "cleared"],
  ["2026-10-05", "Fieldnote", "refund", "revenue", "operating", -1990, "cleared"],
  ["2026-10-04", "Cloudspring", "license", "software", "card", -1240, "cleared"],
  ["2026-10-03", "Trattoria Cloud", "subscription", "revenue", "operating", 490, "cleared"],
  ["2026-10-02", "Reserve sweep", "invoice", "revenue", "reserve", 25000, "cleared"],
  ["2026-10-01", "Brightline", "subscription", "revenue", "operating", 3980, "cleared"],
  ["2026-09-30", "Team payroll", "salary", "payroll", "operating", -48600, "cleared"],
  ["2026-09-29", "Skyward Air", "flight", "travel", "card", -1320, "cleared"],
  ["2026-09-28", "Northwind", "subscription", "revenue", "operating", 9580, "cleared"],
  ["2026-09-26", "Pixelforge", "contractor", "payroll", "operating", -2800, "cleared"],
  ["2026-09-25", "Adwave", "campaign", "marketing", "card", -2440, "cleared"],
  ["2026-09-24", "Batik Digital", "invoice", "revenue", "operating", 490, "cleared"],
  ["2026-09-22", "Codeshelf", "license", "software", "card", -420, "cleared"],
]

export const transactions: Transaction[] = rows.map(([date, party, memo, category, account, amount, status], i) => ({
  id: `TX-${String(4812 - i).padStart(5, "0")}`,
  date,
  party,
  memo,
  category,
  account,
  amount,
  status,
}))

/** Money in and out by month this year (January is 0), in dollars, with the plan for spending. */
export const cashFlow = (
  [
    [168000, 141000, 150000],
    [171000, 146000, 150000],
    [182000, 149000, 152000],
    [179000, 152000, 152000],
    [194000, 151000, 155000],
    [201000, 158000, 155000],
    [198000, 163000, 160000],
    [214000, 161000, 160000],
    [226000, 166000, 162000],
    [238000, 171000, 165000],
  ] as [number, number, number][]
).map(([inflow, outflow, plan], month) => ({ month, inflow, outflow, plan }))

/** This quarter's budget per category, and what's spent so far, in dollars. */
export const budget = [
  { category: "payroll", planned: 152000, spent: 128300 },
  { category: "marketing", planned: 24000, spent: 21460 },
  { category: "software", planned: 9000, spent: 6870 },
  { category: "office", planned: 15600, spent: 10400 },
  { category: "travel", planned: 6000, spent: 5916 },
] as const satisfies {
  category: TransactionCategory
  planned: number
  spent: number
}[]

export const balances = {
  operating: 412800,
  reserve: 1250000,
  /** Average net burn over the last three months. */
  burn: 41200,
}
