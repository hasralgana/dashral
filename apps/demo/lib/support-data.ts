// Static demo data for Classic's Support page (app/(dashboard)/support): a help desk's tickets, its agents and how
// many tickets came in each day. Replace it with your own help desk.

export type Priority = "urgent" | "high" | "normal" | "low"
export type TicketStatus = "open" | "pending" | "solved"
export type Channel = "email" | "chat" | "phone"

export type Agent = { id: string; name: string }

export const agents: Agent[] = [
  { id: "maya", name: "Maya Putri" },
  { id: "omar", name: "Omar Farouk" },
  { id: "emma", name: "Emma Wilson" },
  { id: "kenji", name: "Kenji Tanaka" },
]

export type Ticket = {
  id: string
  subject: string
  customer: string
  company: string
  priority: Priority
  status: TicketStatus
  channel: Channel
  /** An agent id, or null while nobody has it. */
  assignee: string | null
  /** When it last changed: an ISO date and time. */
  updated: string
  /** Its first message. */
  message: string
  /** Past the response time the customer's plan promises. */
  breached?: boolean
}

// [subject, customer, company, priority, status, channel, assignee, updated, message, breached]
const rows: [string, string, string, Priority, TicketStatus, Channel, string | null, string, string, boolean?][] = [
  ["Can't export invoices to CSV", "Olivia Martin", "Northwind", "high", "open", "email", "maya", "2026-10-19T09:42", "The export button spins and nothing downloads. It worked last week.", true],
  ["Charged twice this month", "Lucas Silva", "Rio Freight", "urgent", "open", "phone", null, "2026-10-19T09:15", "Our card shows two charges of $799 on October 1st.", true],
  ["How do I add a second admin?", "Ayu Lestari", "Batik Digital", "normal", "pending", "chat", "omar", "2026-10-19T08:51", "I want my co-founder to manage billing too."],
  ["Webhook returns 401", "Arjun Mehta", "Ledgerly", "high", "open", "email", "kenji", "2026-10-19T08:20", "Since rotating our key, every webhook delivery fails with 401."],
  ["Dark mode on the dashboard", "Chloe Martin", "Maison Verte", "low", "open", "chat", "emma", "2026-10-18T17:34", "Is there a way to switch the dashboard to dark mode?"],
  ["Report shows wrong time zone", "Hana Sato", "Sakura Studio", "normal", "open", "email", "maya", "2026-10-18T15:02", "Daily totals cut off at 7 AM instead of midnight for us."],
  ["Cancel our plan", "Sofia Davis", "Fieldnote", "normal", "pending", "email", "omar", "2026-10-18T13:47", "We'd like to cancel at the end of this billing period."],
  ["SSO login loops back", "Grace Lee", "Pinecone Health", "urgent", "open", "phone", "kenji", "2026-10-18T11:10", "After signing in with our identity provider we land on the login page again.", true],
  ["Invoice needs our VAT number", "Mateo Rossi", "Trattoria Cloud", "low", "solved", "email", "emma", "2026-10-18T10:05", "Please add IT0123456789 to our invoices."],
  ["API rate limit too low", "Jackson Lee", "Brightline", "high", "pending", "email", "kenji", "2026-10-17T16:40", "We hit 429s during our nightly sync. Can the limit go up?"],
  ["Import from spreadsheet failed", "Rizky Pratama", "Nusantara Logistik", "normal", "open", "chat", null, "2026-10-17T14:22", "Row 214 has an error but the file looks fine to me."],
  ["Change the account owner", "Emma Wilson", "Harbor & Co", "normal", "solved", "email", "maya", "2026-10-17T09:58", "Our previous owner left; please move ownership to me."],
  ["Mobile app crashes on start", "Fajar Nugroho", "Sawah Tech", "high", "open", "chat", "omar", "2026-10-16T19:31", "The Android app closes right after the splash screen."],
  ["Where is the audit log?", "Budi Santoso", "Kopi Kenangan Lab", "low", "solved", "chat", "emma", "2026-10-16T12:12", "Looking for who changed our pricing settings."],
  ["Discount for nonprofits?", "Layla Hassan", "Green Steps", "low", "pending", "email", null, "2026-10-15T15:44", "We're a registered nonprofit. Do you offer a discount?"],
  ["Emails land in spam", "Omar Farouk", "Desert Bloom", "normal", "solved", "email", "maya", "2026-10-15T10:27", "Our customers say receipts go to their spam folder."],
]

export const tickets: Ticket[] = rows.map(([subject, customer, company, priority, status, channel, assignee, updated, message, breached], i) => ({
  id: `#${3482 - i}`,
  subject,
  customer,
  company,
  priority,
  status,
  channel,
  assignee,
  updated,
  message,
  breached,
}))

/** The day the sample data ends. */
export const supportToday = "2026-10-19"

/** How many weeks of daily ticket counts the sample has. */
export const volumeWeeks = 44

/** Tickets that came in each day: busier midweek, quiet on weekends, slowly growing. Seeded, so it's stable. */
export const ticketsByDay = (() => {
  let state = 11
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const days: { date: string; value: number }[] = []
  const end = Date.UTC(2026, 9, 19)
  const span = volumeWeeks * 7 - 1
  for (let i = span; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000)
    const weekday = day.getUTCDay()
    const base = weekday === 0 || weekday === 6 ? 3 : weekday === 2 || weekday === 3 ? 14 : 10
    days.push({ date: day.toISOString().slice(0, 10), value: Math.max(0, Math.round(base + (random() - 0.5) * 8 + (span - i) / 60)) })
  }
  return days
})()
