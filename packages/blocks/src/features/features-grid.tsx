import { BellRing, Blocks, FileSpreadsheet, Gauge, Lock, Zap } from "lucide-react"

// The brands named here are made up, so the block ships as it is. Put in the tools your product really works with.
const brands = { payments: "Fernpay", store: "Cartwell" }

export type Feature = { icon: React.ReactNode; title: string; text: React.ReactNode }

const sampleFeatures: Feature[] = [
  { icon: <Zap />, title: "Live numbers", text: "Charts update the moment your data does — no refresh, no nightly export." },
  { icon: <Blocks />, title: "Every source, one place", text: `${brands.payments}, ${brands.store}, Postgres and 40 more, connected in a couple of clicks.` },
  { icon: <BellRing />, title: "Alerts that matter", text: "Get a message when revenue dips or signups spike, not a daily wall of email." },
  { icon: <FileSpreadsheet />, title: "Exports people open", text: "CSV and real Excel files, with the columns and filters you chose." },
  { icon: <Lock />, title: "Secure by default", text: "Roles, SSO and an audit log, so the right people see the right numbers." },
  { icon: <Gauge />, title: "Fast on any device", text: "A dashboard that loads in a blink on a phone in a taxi, too." },
]

/**
 * What the product does, in six short parts: an icon, a title and one sentence each, in a grid that becomes two
 * columns, then one, on smaller screens. Every part comes from props.
 */
export function FeaturesGrid({
  eyebrow = "Features",
  title = "Everything a team needs to see the business clearly",
  description = "One place for the numbers, built so the whole team actually uses it.",
  features = sampleFeatures,
}: {
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  features?: Feature[]
}) {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-medium text-primary-text">{eyebrow}</p>}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{title}</h2>
          {description && <p className="mt-4 text-pretty text-muted-foreground">{description}</p>}
        </div>
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title} className="grid content-start gap-3">
              <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary-text [&>svg]:size-5">
                {feature.icon}
              </span>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
