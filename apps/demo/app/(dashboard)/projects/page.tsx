import type { Metadata } from "next"
import { CalendarClock, CircleCheck, FolderKanban, TriangleAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { MetricCard } from "@dashral/ui/components/metric-card"

import { PageHeader } from "@/components/page-header"
import { ProjectsView } from "@/components/projects/projects-view"
import { getIntlLocale } from "@/lib/i18n-server"
import { projects, projectsToday } from "@/lib/projects-data"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects")
  return { title: t("title"), description: t("description") }
}

const days = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000

export default async function ProjectsPage() {
  const t = await getTranslations("projects")
  const locale = await getIntlLocale()
  const open = projects.filter((project) => project.health !== "done")
  const metrics = [
    { label: t("metrics.active"), value: open.length, icon: FolderKanban, hint: t("metrics.activeHint", { count: projects.length - open.length }) },
    { label: t("metrics.onTrack"), value: open.filter((p) => p.health === "onTrack").length, icon: CircleCheck, hint: t("metrics.onTrackHint") },
    { label: t("metrics.atRisk"), value: open.filter((p) => p.health !== "onTrack").length, icon: TriangleAlert, hint: t("metrics.atRiskHint") },
    {
      label: t("metrics.dueSoon"),
      value: open.filter((p) => days(projectsToday, p.due) >= 0 && days(projectsToday, p.due) <= 14).length,
      icon: CalendarClock,
      hint: t("metrics.dueSoonHint"),
    },
  ]

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("metrics.label")}>
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} locale={locale} icon={<metric.icon />} countOnMount>
            <p className="text-xs text-muted-foreground">{metric.hint}</p>
          </MetricCard>
        ))}
      </section>
      <ProjectsView />
    </>
  )
}
