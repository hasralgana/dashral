// Static demo data for Classic's Projects page (app/(dashboard)/projects): an agency's client projects, who leads
// them, where each one is and when it's due. Replace it with your own project tracker.

/** The stages every project goes through, in order (messages → projects.stages). */
export const stages = ["brief", "design", "build", "review", "launch"] as const
export type Stage = (typeof stages)[number]
export type Health = "onTrack" | "atRisk" | "offTrack" | "done"

/** messages → projects.labels */
export const labels = ["web", "mobile", "branding", "ecommerce", "seo", "content"] as const
export type Label = (typeof labels)[number]

export type Person = { id: string; name: string; role: "lead" | "designer" | "engineer" | "strategist"; email: string; projects: number }

export const people: Person[] = [
  { id: "olivia", name: "Olivia Martin", role: "lead", email: "olivia@acme.studio", projects: 4 },
  { id: "budi", name: "Budi Santoso", role: "engineer", email: "budi@acme.studio", projects: 3 },
  { id: "hana", name: "Hana Sato", role: "designer", email: "hana@acme.studio", projects: 3 },
  { id: "arjun", name: "Arjun Mehta", role: "engineer", email: "arjun@acme.studio", projects: 2 },
  { id: "layla", name: "Layla Hassan", role: "strategist", email: "layla@acme.studio", projects: 2 },
  { id: "lucas", name: "Lucas Silva", role: "designer", email: "lucas@acme.studio", projects: 2 },
]

export type Project = {
  id: string
  name: string
  client: string
  stage: Stage
  health: Health
  /** Tasks done, in percent. */
  progress: number
  owner: string
  /** An ISO date. */
  due: string
  labels: Label[]
  /** In dollars. */
  budget: number
}

/** The day the sample data is as of: due dates before it are overdue. */
export const projectsToday = "2026-10-19"

// [name, client, stage, health, progress, owner, due, labels, budget]
const rows: [string, string, Stage, Health, number, string, string, Label[], number][] = [
  ["Checkout redesign", "Northwind", "build", "onTrack", 64, "budi", "2026-11-14", ["web", "ecommerce"], 48000],
  ["Brand refresh", "Maison Verte", "review", "atRisk", 88, "hana", "2026-10-24", ["branding"], 22000],
  ["Driver app", "Rio Freight", "build", "offTrack", 41, "arjun", "2026-10-17", ["mobile"], 86000],
  ["Spring campaign site", "Sakura Studio", "design", "onTrack", 32, "lucas", "2026-12-05", ["web", "content"], 18000],
  ["Patient portal", "Pinecone Health", "build", "onTrack", 57, "olivia", "2026-12-19", ["web", "mobile"], 120000],
  ["SEO audit", "Brightline", "launch", "done", 100, "layla", "2026-10-10", ["seo"], 9500],
  ["Store migration", "Batik Digital", "brief", "onTrack", 8, "budi", "2027-01-23", ["ecommerce"], 36000],
  ["Annual report", "Ledgerly", "review", "onTrack", 92, "hana", "2026-10-31", ["content", "branding"], 14000],
  ["Booking widget", "Trattoria Cloud", "design", "atRisk", 26, "lucas", "2026-10-29", ["web"], 12000],
  ["Loyalty app", "Kopi Kenangan Lab", "build", "onTrack", 48, "arjun", "2026-12-12", ["mobile", "ecommerce"], 74000],
  ["Help center", "Fieldnote", "launch", "done", 100, "layla", "2026-10-03", ["content", "seo"], 11000],
  ["Investor deck", "Harbor & Co", "brief", "onTrack", 12, "olivia", "2026-11-07", ["branding", "content"], 6500],
  ["Fleet dashboard", "Nusantara Logistik", "design", "onTrack", 37, "olivia", "2026-11-28", ["web"], 42000],
  ["Product photos", "Maison Verte", "build", "atRisk", 55, "hana", "2026-10-22", ["ecommerce", "content"], 8000],
]

export const projects: Project[] = rows.map(([name, client, stage, health, progress, owner, due, labels, budget], i) => ({
  id: `PRJ-${String(240 + i)}`,
  name,
  client,
  stage,
  health,
  progress,
  owner,
  due,
  labels,
  budget,
}))

export const personById = (id: string) => people.find((person) => person.id === id) ?? people[0]!
